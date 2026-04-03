from sqlalchemy.ext.asyncio import AsyncSession
from App.profile_management.infrastructure.repositories.sql_repositories import SqlAlchemyProfileRepository, SqlAlchemyTitleRepository, SqlAlchemyProjectRepository, SqlAlchemyTagRepository, SqlAlchemyExprianceRepository, SqlAlchemySkillRepository
from App.profile_management.application.use_cases.profile_use_cases import CreateOrUpdateProfileUseCase, GetProfileUseCase
from App.profile_management.application.use_cases.title_use_cases import CreateTitleUseCase, ListTitlesUseCase, UpdateTitleUseCase
from App.profile_management.application.use_cases.project_use_cases import CreateProjectUseCase, AttachTitleToProjectUseCase, AttachTagToProjectUseCase, CreateProjectDescriptionUseCase, ListProjectsUseCase
from App.profile_management.application.use_cases.tag_use_cases import CreateTagUseCase, ListTagsUseCase
from App.profile_management.application.use_cases.experience_use_cases import CreateExprianceUseCase, UpdateExprianceUseCase, ListExpriancesUseCase, GetExprianceUseCase, DeleteExprianceUseCase
from App.profile_management.application.use_cases.skill_use_cases import CreateSkillUseCase, UpdateSkillUseCase, ListSkillsUseCase, GetSkillUseCase, DeleteSkillUseCase
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ExprianceCreate(BaseModel):
    company_name: str
    employement_type: str
    role_title: str
    short_description: str
    start_date: datetime
    tech_stack: Optional[List[str]] = None
    end_date: Optional[datetime] = None

class ExprianceUpdate(BaseModel):
    company_name: str
    employement_type: str
    role_title: str
    short_description: str
    start_date: datetime
    tech_stack: Optional[List[str]] = None
    end_date: Optional[datetime] = None

class ExprianceResponse(BaseModel):
    id: int
    company_name: str
    employement_type: str
    role_title: str
    short_description: str
    start_date: datetime
    tech_stack: Optional[List[str]] = None
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True
from typing import List, Optional

class SkillCreate(BaseModel):
    skill_type: str
    skills: List[str]

class SkillUpdate(BaseModel):
    skill_type: str
    skills: List[str]

class SkillResponse(BaseModel):
    id: int
    skill_type: str
    skills: List[str]
    
    class Config:
        from_attributes = True

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

class TitleUpdate(BaseModel):
    name: Optional[str] = None
    priority: Optional[int] = None
    description: Optional[str] = None

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

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: int
    name: str
    status: str
    project_description: Optional[List[DescriptionCreate]] = None

    class Config:
        from_attributes = True

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
        expriance_repo = SqlAlchemyExprianceRepository(db)
        skill_repo = SqlAlchemySkillRepository(db)
        
        # Use Cases
        self.create_profile_uc = CreateOrUpdateProfileUseCase(profile_repo)
        self.get_profile_uc = GetProfileUseCase(profile_repo)
        self.create_title_uc = CreateTitleUseCase(title_repo)
        self.list_titles_uc = ListTitlesUseCase(title_repo)
        self.update_title_uc = UpdateTitleUseCase(title_repo)
        self.create_project_uc = CreateProjectUseCase(project_repo)
        self.create_description_uc = CreateProjectDescriptionUseCase(project_repo)
        self.attach_titles_uc = AttachTitleToProjectUseCase(project_repo)
        self.list_projects_uc = ListProjectsUseCase(project_repo)
        self.create_tag_uc = CreateTagUseCase(tag_repo)
        self.list_tags_uc = ListTagsUseCase(tag_repo)
        self.attach_tags_uc = AttachTagToProjectUseCase(project_repo, tag_repo)
        
        self.create_exp_uc = CreateExprianceUseCase(expriance_repo)
        self.update_exp_uc = UpdateExprianceUseCase(expriance_repo)
        self.list_exp_uc = ListExpriancesUseCase(expriance_repo)
        self.get_exp_uc = GetExprianceUseCase(expriance_repo)
        self.delete_exp_uc = DeleteExprianceUseCase(expriance_repo)
        
        self.create_skill_uc = CreateSkillUseCase(skill_repo)
        self.update_skill_uc = UpdateSkillUseCase(skill_repo)
        self.list_skills_uc = ListSkillsUseCase(skill_repo)
        self.get_skill_uc = GetSkillUseCase(skill_repo)
        self.delete_skill_uc = DeleteSkillUseCase(skill_repo)

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

    async def update_title(self, title_id: int, user_id: str, data: TitleUpdate):
        updated_title = await self.update_title_uc.execute(
            title_id=title_id, 
            user_id=user_id, 
            title_name=data.name, 
            priority=data.priority, 
            description=data.description
        )
        if not updated_title:
             return None
        return TitleResponse(
            id=str(updated_title.id),
            name=updated_title.title_name,
            priority=updated_title.priority
        )

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

    async def attach_titles_to_project(self, user_id: str, project_id: int, title_ids: List[int]):
        res=await self.attach_titles_uc.execute(user_id, project_id, title_ids)
        return res

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
                id=str(p.id) if p.id else None,
                name=p.name,
                status=p.status,
                project_description=[
                    DescriptionCreate(type=d.type, text=d.text) 
                    for d in p.project_description
                ] if p.project_description else None
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

    async def create_expriance(self, user_id: str, data: ExprianceCreate):
        saved = await self.create_exp_uc.execute(
            user_id=user_id,
            company_name=data.company_name,
            employement_type=data.employement_type,
            role_title=data.role_title,
            short_description=data.short_description,
            start_date=data.start_date,
            tech_stack=data.tech_stack,
            end_date=data.end_date
        )
        return ExprianceResponse(
            id=saved.id,
            company_name=saved.company_name,
            employement_type=saved.employement_type,
            role_title=saved.role_title,
            short_description=saved.short_description,
            start_date=saved.start_date,
            tech_stack=saved.tech_stack,
            end_date=saved.end_date
        )

    async def update_expriance(self, expriance_id: int, user_id: str, data: ExprianceUpdate):
        updated = await self.update_exp_uc.execute(
            expriance_id=expriance_id,
            user_id=user_id,
            company_name=data.company_name,
            employement_type=data.employement_type,
            role_title=data.role_title,
            short_description=data.short_description,
            start_date=data.start_date,
            tech_stack=data.tech_stack,
            end_date=data.end_date
        )
        if not updated:
            return None
        return ExprianceResponse(
            id=updated.id,
            company_name=updated.company_name,
            employement_type=updated.employement_type,
            role_title=updated.role_title,
            short_description=updated.short_description,
            start_date=updated.start_date,
            tech_stack=updated.tech_stack,
            end_date=updated.end_date
        )

    async def list_expriances(self, user_id: str):
        exps = await self.list_exp_uc.execute(user_id)
        return [
            ExprianceResponse(
                id=e.id,
                company_name=e.company_name,
                employement_type=e.employement_type,
                role_title=e.role_title,
                short_description=e.short_description,
                start_date=e.start_date,
                tech_stack=e.tech_stack,
                end_date=e.end_date
            ) for e in exps
        ]

    async def get_expriance(self, expriance_id: int):
        e = await self.get_exp_uc.execute(expriance_id)
        if not e:
            return None
        return ExprianceResponse(
            id=e.id,
            company_name=e.company_name,
            employement_type=e.employement_type,
            role_title=e.role_title,
            short_description=e.short_description,
            start_date=e.start_date,
            tech_stack=e.tech_stack,
            end_date=e.end_date
        )

    async def delete_expriance(self, expriance_id: int):
        success = await self.delete_exp_uc.execute(expriance_id)
        return success

    async def create_skill(self, user_id: str, data: SkillCreate):
        saved = await self.create_skill_uc.execute(
            user_id=user_id,
            skill_type=data.skill_type,
            skills=data.skills
        )
        return SkillResponse(
            id=saved.id,
            skill_type=saved.skill_type,
            skills=saved.skills
        )

    async def update_skill(self, skill_id: int, user_id: str, data: SkillUpdate):
        updated = await self.update_skill_uc.execute(
            skill_id=skill_id,
            user_id=user_id,
            skill_type=data.skill_type,
            skills=data.skills
        )
        if not updated:
            return None
        return SkillResponse(
            id=updated.id,
            skill_type=updated.skill_type,
            skills=updated.skills
        )

    async def list_skills(self, user_id: str):
        skills = await self.list_skills_uc.execute(user_id)
        return [
            SkillResponse(
                id=s.id,
                skill_type=s.skill_type,
                skills=s.skills
            ) for s in skills
        ]

    async def get_skill(self, skill_id: int):
        s = await self.get_skill_uc.execute(skill_id)
        if not s:
            return None
        return SkillResponse(
            id=s.id,
            skill_type=s.skill_type,
            skills=s.skills
        )

    async def delete_skill(self, skill_id: int):
        return await self.delete_skill_uc.execute(skill_id)
