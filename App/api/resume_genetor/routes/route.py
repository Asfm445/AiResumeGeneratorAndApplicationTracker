from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from App.profile_management.infrastructure.database.database import get_db
from App.api.auth import get_current_user_id
from typing import Optional

from App.resume_genetor.application.usecase.resume_usecase import ResumeUseCase
from App.profile_management.infrastructure.repositories.sql_repositories import SqlAlchemyProfileRepository, SqlAlchemyTitleRepository, SqlAlchemySkillRepository, SqlAlchemyProjectRepository, SqlAlchemyExprianceRepository, SqlAlchemyResumeRepository
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
    resume_repo = SqlAlchemyResumeRepository(db)
    ai_service = AiService()
    embedding_service = GeminiEmbeddingService()

    return ResumeUseCase(
        profile_repo=profile_repo,
        title_repo=title_repo,
        skill_repo=skill_repo,
        expriance_repo=expriance_repo,
        project_repo=project_repo,
        ai_service=ai_service,
        embedding_service=embedding_service,
        resume_repo=resume_repo
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

@router.get("/recent")
async def get_recent_resumes(
    limit: int = 5,
    user_id: str = Depends(get_current_user_id),
    resume_use_case: ResumeUseCase = Depends(get_resume_use_case)
):
    try:
        resumes = await resume_use_case.resume_repo.get_recent(user_id, limit)
        return {"data": resumes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refine/{resume_id}")
async def refine_resume_endpoint(
    resume_id: int,
    data: dict, # {"comment": "..."}
    user_id: str = Depends(get_current_user_id),
    resume_use_case: ResumeUseCase = Depends(get_resume_use_case)
):
    try:
        comment = data.get("comment")
        if not comment:
            raise HTTPException(status_code=400, detail="Comment is required")
        refined = await resume_use_case.refine_resume(user_id, resume_id, comment)
        return {"data": refined}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{resume_id}")
async def update_resume_endpoint(
    resume_id: int,
    data: dict, # {"resume_data": {...}}
    user_id: str = Depends(get_current_user_id),
    resume_use_case: ResumeUseCase = Depends(get_resume_use_case)
):
    try:
        updated_data = data.get("resume_data")
        if not updated_data:
            raise HTTPException(status_code=400, detail="Resume data is required")
        updated = await resume_use_case.update_resume(user_id, resume_id, updated_data)
        return {"data": updated}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{title_id}")
async def get_resume_history(
    title_id: int,
    user_id: str = Depends(get_current_user_id),
    resume_use_case: ResumeUseCase = Depends(get_resume_use_case)
):
    try:
        resumes = await resume_use_case.resume_repo.get_all_by_title(title_id)
        # Security check: ensure resumes belong to the user
        user_resumes = [r for r in resumes if r.user_id == user_id]
        return {"data": user_resumes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{resume_id}")
async def get_resume_by_id(
    resume_id: int,
    user_id: str = Depends(get_current_user_id),
    resume_use_case: ResumeUseCase = Depends(get_resume_use_case)
):
    try:
        resume = await resume_use_case.resume_repo.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise HTTPException(status_code=404, detail="Resume not found")
        return {"data": resume}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
