from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from App.profile_management.infrastructure.database.database import get_db
from App.api.auth import get_current_user_id
from typing import Optional

from App.resume_genetor.application.usecase.resume_usecase import ResumeUseCase
from App.profile_management.infrastructure.repositories.sql_repositories import SqlAlchemyProfileRepository, SqlAlchemyTitleRepository, SqlAlchemySkillRepository, SqlAlchemyProjectRepository, SqlAlchemyExprianceRepository
from App.resume_genetor.infrastructure.services.ai_service import AiService
from App.resume_genetor.infrastructure.services.embedding_service import GeminiEmbeddingService

router = APIRouter(
    prefix="/api/v1/resume",
    tags=["Resume"]
)

def get_resume_use_case(db: AsyncSession = Depends(get_db)):
    profile_repo = SqlAlchemyProfileRepository(db)
    title_repo = SqlAlchemyTitleRepository(db)
    skill_repo = SqlAlchemySkillRepository(db)
    expriance_repo = SqlAlchemyExprianceRepository(db)
    project_repo = SqlAlchemyProjectRepository(db)
    ai_service = AiService()
    embedding_service = GeminiEmbeddingService()
    
    return ResumeUseCase(
        profile_repo=profile_repo,
        title_repo=title_repo,
        skill_repo=skill_repo,
        expriance_repo=expriance_repo,
        project_repo=project_repo,
        ai_service=ai_service,
        embedding_service=embedding_service
    )

@router.get("/generate")
async def generate_resume_endpoint(
    title_id: Optional[int] = None,
    user_id: str = Depends(get_current_user_id),
    resume_use_case: ResumeUseCase = Depends(get_resume_use_case)
):
    try:
        resume = await resume_use_case.generate_resume(user_id, title_id)
        return {"data": resume}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
