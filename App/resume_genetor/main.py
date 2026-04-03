from App.resume_genetor.application.usecase.resume_usecase import ResumeUseCase
from App.profile_management.infrastructure.repositories.sql_repositories import SqlAlchemyProfileRepository, SqlAlchemyTitleRepository, SqlAlchemySkillRepository, SqlAlchemyProjectRepository, SqlAlchemyExprianceRepository
from App.profile_management.infrastructure.database.database import get_db
from App.resume_genetor.infrastructure.services.ai_service import AiService
from App.resume_genetor.infrastructure.services.embedding_service import LocalEmbeddingService
import os
import jwt
from dotenv import load_dotenv
import asyncio

load_dotenv()

# token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGQzZWM1Mi1mM2ZhLTRkZDYtYmQ0MS02Y2MxOWY2ZWRiMzYiLCJyb2xlcyI6WyJidXllciIsInNlbGxlciJdLCJyb2xlIjoiYnV5ZXIiLCJpYXQiOjE3NzQ5NTU0MjEsImV4cCI6MTc3NDk1NjMyMX0.8VJyDEMBa3onQwQvi9zNgzQd9SnRtwDVvvFBX3m7JTM"

# SECRET_KEY = os.getenv("SECRET_KEY")
# ALGORITHM = "HS256"

# payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
user_id: str = "64d3ec52-f3fa-4dd6-bd41-6cc19f6edb36"


async def test_generate_resume():
    db = None
    try:
        # Get database session
        db = await get_db()
        
        # Create repository with the session
        repo = SqlAlchemyProfileRepository(db)
        title_repo = SqlAlchemyTitleRepository(db)
        skill_repo = SqlAlchemySkillRepository(db)
        ai_service = AiService()
        expriance_repo = SqlAlchemyExprianceRepository(db)
        project_repo = SqlAlchemyProjectRepository(db)
        embedding_service = LocalEmbeddingService()
        
        # Create use case
        resume_use_case = ResumeUseCase(profile_repo=repo, ai_service=ai_service, title_repo=title_repo, skill_repo=skill_repo, expriance_repo=expriance_repo, project_repo=project_repo, embedding_service=embedding_service)


      
        
        
        resume = await resume_use_case.generate_resume(user_id)




        print("Professional Summary: +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        print(resume["professional_summary"])
        print("Professional Experience: +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        print(resume["professional_experience"])
        print("Projects: +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        print(resume["projects"])
        print("Skills: +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        print(resume["skills"])
        print(type(resume))
        
        # print(resume_content)

        # tags = await resume_use_case.generate_tags(user_id)
        # print(tags)
        
    except Exception as e:
        print(f"Error generating resume: {e}")
        raise
    finally:
        # Ensure database session is closed
        if db:
            await db.close()

if __name__ == "__main__":
    asyncio.run(test_generate_resume())