from sqlalchemy.ext.asyncio import AsyncSession
from App.infrastructure.repositories.sql_repositories import SqlAlchemyProfileRepository, SqlAlchemyTitleRepository, SqlAlchemyProjectRepository, SqlAlchemyTagRepository
from App.application.use_cases.profile_use_cases import CreateOrUpdateProfileUseCase, GetProfileUseCase
from App.application.use_cases.title_use_cases import CreateTitleUseCase, ListTitlesUseCase
from App.application.use_cases.project_use_cases import CreateProjectUseCase, AttachTitleToProjectUseCase, AttachTagToProjectUseCase, CreateProjectDescriptionUseCase, ListProjectsUseCase
from App.application.use_cases.tag_use_cases import CreateTagUseCase, ListTagsUseCase
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ProfileUpdate(BaseModel):
    fullName: str
    headline: Optional[str] = None
    bio: Optional[str] = None 
    location: Optional[str] = None
    yearsOfExperience: Optional[int] = 0

class ProfileResponse(BaseModel):
    id: str
    userId: str
    fullName: str
    headline: Optional[str] = None
    updatedAt: datetime
    bio: Optional[str] = None 
    titles: Optional[List[dict]] = None

class TitleCreate(BaseModel):
    name: str 
    priority: int = 1

class TitleResponse(BaseModel):
    id: str
    name: str
    priority: int

class ProjectCreate(BaseModel):
    name: str
    shortDescription: Optional[str] = Field(None, max_length=255)
    repoUrl: Optional[str] = None
    status: str = "active"

class DescriptionCreate(BaseModel):
    type: str # overview, features, tech_stack
    text: str

class ProjectResponse(BaseModel):
    id: str
    name: str
    status: str

class TagCreate(BaseModel):
    name: str

class TagResponse(BaseModel):
    id: str
    name: str

class ProfileController:
    def __init__(self, db: AsyncSession):
        # Repositories
        profile_repo = SqlAlchemyProfileRepository(db)
        title_repo = SqlAlchemyTitleRepository(db)
        project_repo = SqlAlchemyProjectRepository(db)
        tag_repo = SqlAlchemyTagRepository(db)
        
        # Use Cases
        self.create_profile_uc = CreateOrUpdateProfileUseCase(profile_repo)
        self.get_profile_uc = GetProfileUseCase(profile_repo)
        self.create_title_uc = CreateTitleUseCase(title_repo)
        self.list_titles_uc = ListTitlesUseCase(title_repo)
        self.create_project_uc = CreateProjectUseCase(project_repo)
        self.create_description_uc = CreateProjectDescriptionUseCase(project_repo)
        self.attach_titles_uc = AttachTitleToProjectUseCase(project_repo)
        self.list_projects_uc = ListProjectsUseCase(project_repo)
        self.create_tag_uc = CreateTagUseCase(tag_repo)
        self.list_tags_uc = ListTagsUseCase(tag_repo)
        self.attach_tags_uc = AttachTagToProjectUseCase(project_repo, tag_repo)

    async def create_or_update_profile(self, user_id: str, data: ProfileUpdate):
        saved_profile = await self.create_profile_uc.execute(
            user_id=user_id,
            name=data.fullName,
            headline=data.headline,
            bio=data.bio,
            location=data.location,
            years=data.yearsOfExperience or 0
        )
        return ProfileResponse(
            id=str(saved_profile.id) if saved_profile.id else "0",
            userId=saved_profile.user_id,
            fullName=saved_profile.name,
            headline=saved_profile.headline,
            updatedAt=saved_profile.updated_at
        )

    async def get_profile(self, user_id: str):
        profile = await self.get_profile_uc.execute(user_id)
        if not profile:
            return None
        return ProfileResponse(
            id=str(profile.id),
            userId=profile.user_id,
            fullName=profile.name,
            headline=profile.headline,
            bio=profile.about_text,
            titles=[], 
            updatedAt=profile.updated_at
        )

    async def create_title(self, user_id: str, data: TitleCreate):
        saved_title = await self.create_title_uc.execute(user_id, data.name, data.priority)
        return TitleResponse(
            id=str(saved_title.id),
            name=saved_title.title_name,
            priority=saved_title.priority
        )

    async def list_titles(self, user_id: str):
        titles = await self.list_titles_uc.execute(user_id)
        return [
            TitleResponse(
                id=str(t.id),
                name=t.title_name,
                priority=t.priority
            ) for t in titles
        ]

    async def create_project(self, user_id: str, data: ProjectCreate):
        saved_project = await self.create_project_uc.execute(
            user_id=user_id,
            name=data.name,
            short_description=data.shortDescription,
            repo_url=data.repoUrl,
            status=data.status
        )
        return ProjectResponse(
            id=str(saved_project.id),
            name=saved_project.name,
            status=saved_project.status
        )

    async def attach_titles_to_project(self, project_id: int, title_ids: List[str]):
        await self.attach_titles_uc.execute(project_id, title_ids)
        return {"message": "Titles attached"}

    async def create_tag(self, data: TagCreate):
        saved_tag = await self.create_tag_uc.execute(data.name)
        return TagResponse(
            id=saved_tag.tag_id, 
            name=saved_tag.tag_name
        )

    async def attach_tags_to_project(self, project_id: int, tag_names: List[str]):
        await self.attach_tags_uc.execute(project_id, tag_names)
        return {"message": "Tags attached"}

    async def create_project_description(self, project_id: int, data: DescriptionCreate):
        await self.create_description_uc.execute(project_id, data.type, data.text)
        return {"message": "Description created"}

    async def list_projects(self, user_id: str):
        projects = await self.list_projects_uc.execute(user_id)
        return [
            ProjectResponse(
                id=str(p.id),
                name=p.name,
                status=p.status
            ) for p in projects
        ]

    async def list_tags(self):
        tags = await self.list_tags_uc.execute()
        return [
            TagResponse(
                id=t.tag_id,
                name=t.tag_name
            ) for t in tags
        ]
