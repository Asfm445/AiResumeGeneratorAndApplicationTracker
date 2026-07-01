import os
import time
import json
import logging
import redis
import google.generativeai as genai
from sqlalchemy import create_engine, select, update, MetaData, Table, Column, Integer, Text
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Use sync driver (psycopg v3) for worker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")
if "postgresql+asyncpg://" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg://")
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("embedding-worker")

def run_worker():
    logger.info("Initializing worker... getting Gemini API key")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY environment variable is missing")
        return
    genai.configure(api_key=api_key)
    logger.info("Gemini API configured successfully.")

    # Initialize DB connection
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    
    metadata = MetaData()
    project_embeddings = Table(
        'project_embeddings', metadata,
        Column('id', Integer, primary_key=True),
        Column('raw_text', Text),
        Column('embedding', Vector(384))
    )
    
    experiences = Table(
        'experiences', metadata,
        Column('id', Integer, primary_key=True),
        Column('short_description', Text),
        Column('description_embedding', Vector(384))
    )

    titles = Table(
        'titles', metadata,
        Column('id', Integer, primary_key=True),
        Column('description', Text),
        Column('description_embedding', Vector(384))
    )

    # Initialize Redis connection
    logger.info(f"Connecting to Redis at {REDIS_HOST}:{REDIS_PORT}...")
    try:
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        # Quick ping test
        redis_client.ping()
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return

    # Helper function to generate and update embedding for a title
    def process_title(session, title_id):
        stmt = select(titles).where(titles.c.id == title_id)
        row = session.execute(stmt).first()
        if row and row.description:
            logger.info(f"[Task Title] Processing ID {title_id}")
            result_embed = genai.embed_content(
                model="models/embedding-001",
                content=row.description,
                task_type="SEMANTIC_SIMILARITY"
            )
            embedding_vector = result_embed["embedding"][:384]
            update_stmt = update(titles).where(titles.c.id == title_id).values(description_embedding=embedding_vector)
            session.execute(update_stmt)
            session.commit()
            logger.info(f"[Task Title] Updated embedding for ID {title_id}")

    # Helper function to generate and update embedding for an experience
    def process_experience(session, exp_id):
        stmt = select(experiences).where(experiences.c.id == exp_id)
        row = session.execute(stmt).first()
        if row and row.short_description:
            logger.info(f"[Task Experience] Processing ID {exp_id}")
            result_embed = genai.embed_content(
                model="models/embedding-001",
                content=row.short_description,
                task_type="SEMANTIC_SIMILARITY"
            )
            embedding_vector = result_embed["embedding"][:384]
            update_stmt = update(experiences).where(experiences.c.id == exp_id).values(description_embedding=embedding_vector)
            session.execute(update_stmt)
            session.commit()
            logger.info(f"[Task Experience] Updated embedding for ID {exp_id}")

    # Helper function to generate and update embedding for a project
    def process_project(session, project_emb_id):
        stmt = select(project_embeddings).where(project_embeddings.c.id == project_emb_id)
        row = session.execute(stmt).first()
        if row and row.raw_text:
            logger.info(f"[Task Project] Processing ID {project_emb_id}")
            result_embed = genai.embed_content(
                model="models/gemini-embedding-001",
                content=row.raw_text,
                task_type="SEMANTIC_SIMILARITY"
            )
            embedding_vector = result_embed["embedding"][:384]
            update_stmt = update(project_embeddings).where(project_embeddings.c.id == project_emb_id).values(embedding=embedding_vector)
            session.execute(update_stmt)
            session.commit()
            logger.info(f"[Task Project] Updated embedding for ID {project_emb_id}")

    # One-time database sync check on startup
    logger.info("Performing startup database sync check for any missing embeddings...")
    try:
        with Session() as session:
            # Titles sync
            title_stmt = select(titles).where((titles.c.description_embedding == None) & (titles.c.description != None))
            for row in session.execute(title_stmt).all():
                process_title(session, row.id)

            # Experience sync
            exp_stmt = select(experiences).where(experiences.c.description_embedding == None)
            for row in session.execute(exp_stmt).all():
                process_experience(session, row.id)

            # Project embedding sync
            proj_stmt = select(project_embeddings).where(project_embeddings.c.embedding == None)
            for row in session.execute(proj_stmt).all():
                process_project(session, row.id)
    except Exception as e:
        logger.error(f"Error during startup sync: {e}")

    logger.info("Worker entering event loop, listening on Redis 'embedding_queue'...")
    while True:
        try:
            # Block until a task is available
            task_data = redis_client.blpop("embedding_queue", timeout=30)
            if not task_data:
                # Timeout triggered (no items for 30s), keep loop alive
                continue
            
            queue_name, payload_str = task_data
            logger.info(f"Popped task: {payload_str}")
            
            task = json.loads(payload_str)
            task_type = task.get("type")
            record_id = task.get("id")
            
            if not task_type or not record_id:
                logger.warning(f"Invalid task payload received: {payload_str}")
                continue
            
            with Session() as session:
                if task_type == "title":
                    process_title(session, record_id)
                elif task_type == "experience":
                    process_experience(session, record_id)
                elif task_type == "project":
                    process_project(session, record_id)
                else:
                    logger.warning(f"Unknown task type: {task_type}")
                    
        except Exception as e:
            logger.error(f"Error in worker processing loop: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_worker()
