from App.resume_genetor.application.usecase.resume_usecase import ResumeUseCase
from App.profile_management.infrastructure.repositories.sql_repositories import SqlAlchemyProfileRepository, SqlAlchemyTitleRepository, SqlAlchemySkillRepository
from App.profile_management.infrastructure.database.database import get_db
from App.resume_genetor.infrastructure.services.ai_service import AiService
import os
import jwt
from dotenv import load_dotenv
import asyncio

load_dotenv()

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGQzZWM1Mi1mM2ZhLTRkZDYtYmQ0MS02Y2MxOWY2ZWRiMzYiLCJyb2xlcyI6WyJidXllciIsInNlbGxlciJdLCJyb2xlIjoiYnV5ZXIiLCJpYXQiOjE3NzQ3MjE2ODYsImV4cCI6MTc3NDcyMjU4Nn0.dCl4YV2GiUmrUIrNYK9M_FfYfpaBnvPH87zhOVBPp58"

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
user_id: str = payload.get("sub")

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
        
        # Create use case
        resume_use_case = ResumeUseCase(profile_repo=repo, ai_service=ai_service, title_repo=title_repo, skill_repo=skill_repo)
        
        professional_summary = await resume_use_case.generate_resume(user_id)




        print("Professional Summary: +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
        print(professional_summary)
        print(type(professional_summary))
        
        # print(resume_content)
        
    except Exception as e:
        print(f"Error generating resume: {e}")
        raise
    finally:
        # Ensure database session is closed
        if db:
            await db.close()

if __name__ == "__main__":
    asyncio.run(test_generate_resume())