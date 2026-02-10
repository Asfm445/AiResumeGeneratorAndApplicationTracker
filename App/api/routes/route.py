from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from App.infrastructure.database.database import get_db
from App.api.controllers.profile_controller import ProfileController, ProfileUpdate, ProfileResponse, TitleCreate, ProjectCreate, TagCreate, TitleResponse, ProjectResponse, TagResponse
from typing import List

router = APIRouter(
    prefix="/api/v1/profile",
    tags=["profile"]
)

def get_controller(db: AsyncSession = Depends(get_db)):
    return ProfileController(db)

def get_current_user_id(request: Request):
    # Mocking user ID extraction from JWT for now as "Authorization: Bearer <token>"
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         return "user_uuid" 
    token = auth_header.split(" ")[1]
    return "user_uuid" # Mock value

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile: ProfileUpdate, 
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    try:
        return await controller.create_or_update_profile(user_id, profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    profile = await controller.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/titles", response_model=TitleResponse)
async def create_title(
    title: TitleCreate,
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    return await controller.create_title(user_id, title)

@router.get("/titles", response_model=List[TitleResponse])
async def list_titles(
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    return await controller.list_titles(user_id)

@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    return await controller.create_project(user_id, project)

@router.post("/tags", response_model=TagResponse)
async def create_tag(
    tag: TagCreate,
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    return await controller.create_tag(tag)

@router.post("/projects/{project_id}/titles")
async def attach_titles_to_project(
    project_id: int,
    data: dict, # expecting {"titleIds": ["id1", "id2"]}
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    title_ids = data.get("titleIds", [])
    return await controller.attach_titles_to_project(project_id, title_ids)

@router.post("/projects/{project_id}/tags")
async def attach_tags_to_project(
    project_id: int,
    data: dict, # expecting {"tags": ["name1", "name2"]}
    user_id: str = Depends(get_current_user_id),
    controller: ProfileController = Depends(get_controller)
):
    tags = data.get("tags", [])
    return await controller.attach_tags_to_project(project_id, tags)
