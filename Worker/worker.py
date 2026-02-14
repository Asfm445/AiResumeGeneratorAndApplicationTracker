import os
import time
import logging
from sentence_transformers import SentenceTransformer
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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("embedding-worker")

def run_worker():
    logger.info("Initializing worker... loading model 'all-MiniLM-L6-v2'")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully.")

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    
    metadata = MetaData()
    project_embeddings = Table(
        'project_embeddings', metadata,
        Column('id', Integer, primary_key=True),
        Column('raw_text', Text),
        Column('embedding', Vector(384))
    )

    logger.info("Worker started. Polling for records without embeddings...")

    while True:
        try:
            with Session() as session:
                # Find records without embedding
                stmt = select(project_embeddings).where(project_embeddings.c.embedding == None)
                result = session.execute(stmt).all()
                
                if result:
                    logger.info(f"Found {len(result)} records to process.")
                    for row in result:
                        logger.info(f"Processing record ID: {row.id} (Text length: {len(row.raw_text)})")
                        
                        # Generate embedding
                        embedding_vector = model.encode(row.raw_text).tolist()
                        
                        # Update DB
                        update_stmt = update(project_embeddings).where(project_embeddings.c.id == row.id).values(embedding=embedding_vector)
                        session.execute(update_stmt)
                        session.commit()
                        logger.info(f"Successfully updated embedding for record ID: {row.id}")
                else:
                    # Silent poll
                    pass
            
            time.sleep(10)
        except Exception as e:
            logger.error(f"Error in worker loop: {e}")
            time.sleep(30)

if __name__ == "__main__":
    run_worker()
