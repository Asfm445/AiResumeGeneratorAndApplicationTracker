from App.resume_genetor.application.usecase.resume_usecase import ResumeUseCase
from App.profile_management.infrastructure.repositories.sql_repositories import (SqlAlchemyProfileRepository, 
SqlAlchemyTitleRepository, 
SqlAlchemySkillRepository, 
SqlAlchemyProjectRepository, 
SqlAlchemyExprianceRepository, 
SqlAlchemyResumeRepository,
SqlAlchemyJobRepository
)
from App.profile_management.infrastructure.database.database import get_db
from App.resume_genetor.infrastructure.services.ai_service import AiService
from App.resume_genetor.infrastructure.services.embedding_service import GeminiEmbeddingService
import os
import jwt
from dotenv import load_dotenv
import asyncio

load_dotenv()

# token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YjIxNGM3OC1hMjMyLTQxNTYtOTQ5ZC00ZGI4OTQyODY3OGMiLCJyb2xlcyI6WyJidXllciJdLCJleHAiOjE3NzY0MDk4Mjl9.poGrz-UQ2xp5VW8k6C7QA3vV078IShrLUOfTfFWUhVE"

# SECRET_KEY = os.getenv("SECRET_KEY")
# ALGORITHM = "HS256"

# payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
user_id: str = "5b214c78-a232-4156-949d-4db89428678c"


async def test_generate_resume():
    db = None
    try:
        # Get database session
        async for session in get_db():
            db = session
            # Create repository with the session
            repo = SqlAlchemyProfileRepository(db)
            title_repo = SqlAlchemyTitleRepository(db)
            skill_repo = SqlAlchemySkillRepository(db)
            ai_service = AiService()
            expriance_repo = SqlAlchemyExprianceRepository(db)
            project_repo = SqlAlchemyProjectRepository(db)
            embedding_service = GeminiEmbeddingService()
            resume_repo = SqlAlchemyResumeRepository(db)
            job_repo = SqlAlchemyJobRepository(db)
            
            # Create use case
            resume_use_case = ResumeUseCase(profile_repo=repo, 
            ai_service=ai_service, 
            title_repo=title_repo, 
            skill_repo=skill_repo, 
            expriance_repo=expriance_repo, 
            project_repo=project_repo, 
            embedding_service=embedding_service, 
            resume_repo=resume_repo, 
            job_repo=job_repo)


        
            
            resume=await resume_use_case.tailor_resume_to_jd(user_id, 1)


            # resume = await resume_use_case.generate_resume(user_id)




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

            # Once we finish using the session, the generator will handle closing it when it exits
            break
        
    except Exception as e:
        print(f"Error generating resume: {e}")
        raise
    finally:
        # Note: If break is used, the generator's context manager should have closed the session.
        # However, manual closing is still safe if the session object is still around.
        if db:
            await db.close()

if __name__ == "__main__":
    asyncio.run(test_generate_resume())