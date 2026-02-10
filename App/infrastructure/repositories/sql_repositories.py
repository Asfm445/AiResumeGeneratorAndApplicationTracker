from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from App.domain.entities.models import UserProfile, Title, Project, Tag
from App.domain.interfaces.repositories import ProfileRepository, TitleRepository, ProjectRepository, TagRepository
from App.infrastructure.database.schema import UserProfile as DBUserProfile, Title as DBTitle, Project as DBProject, Tag as DBTag, TitleProject, TagProject
from datetime import datetime

class SqlAlchemyProfileRepository(ProfileRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_or_update(self, profile: UserProfile) -> UserProfile:
        stmt = select(DBUserProfile).filter_by(user_id=profile.user_id)
        result = await self.session.execute(stmt)
        db_profile = result.scalars().first()
        
        if db_profile:
            db_profile.name = profile.name
            db_profile.email = profile.email
            db_profile.headline = profile.headline
            db_profile.about_text = profile.about_text
            db_profile.location = profile.location
            db_profile.years_of_experience = profile.years_of_experience
            db_profile.updated_at = datetime.utcnow()
        else:
            db_profile = DBUserProfile(
                user_id=profile.user_id,
                name=profile.name,
                email=profile.email,
                headline=profile.headline,
                about_text=profile.about_text,
                location=profile.location,
                years_of_experience=profile.years_of_experience,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.session.add(db_profile)
        
        await self.session.commit()
        await self.session.refresh(db_profile)
        return self._to_domain(db_profile)

    async def get_by_user_id(self, user_id: str) -> Optional[UserProfile]:
        stmt = select(DBUserProfile).filter_by(user_id=user_id)
        result = await self.session.execute(stmt)
        db_profile = result.scalars().first()
        
        if db_profile:
            return self._to_domain(db_profile)
        return None

    def _to_domain(self, db_profile: DBUserProfile) -> UserProfile:
        return UserProfile(
            id=db_profile.id,
            user_id=db_profile.user_id,
            name=db_profile.name,
            email=db_profile.email,
            headline=db_profile.headline,
            about_text=db_profile.about_text,
            location=db_profile.location,
            years_of_experience=db_profile.years_of_experience,
            profile_picture=db_profile.profile_picture,
            created_at=db_profile.created_at,
            updated_at=db_profile.updated_at
        )

class SqlAlchemyTitleRepository(TitleRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, title: Title) -> Title:
        db_title = DBTitle(
            user_id=title.user_id,
            title_name=title.title_name,
            priority=title.priority,
            created_at=datetime.utcnow()
        )
        self.session.add(db_title)
        await self.session.commit()
        await self.session.refresh(db_title)
        return self._to_domain(db_title)

    async def get_all(self, user_id: str) -> List[Title]:
        stmt = select(DBTitle).filter_by(user_id=user_id)
        result = await self.session.execute(stmt)
        db_titles = result.scalars().all()
        return [self._to_domain(t) for t in db_titles]

    async def get_by_id(self, title_id: int) -> Optional[Title]:
        stmt = select(DBTitle).filter_by(id=title_id)
        result = await self.session.execute(stmt)
        db_title = result.scalars().first()
        
        if db_title:
             return self._to_domain(db_title)
        return None

    def _to_domain(self, db_title: DBTitle) -> Title:
        return Title(
            id=db_title.id,
            user_id=db_title.user_id,
            title_name=db_title.title_name,
            description=db_title.description,
            priority=db_title.priority,
            created_at=db_title.created_at
        )

class SqlAlchemyProjectRepository(ProjectRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, project: Project) -> Project:
        db_project = DBProject(
            user_id=project.user_id,
            name=project.name,
            short_description=project.short_description,
            readme_markdown=project.readme_markdown,
            repo_url=project.repo_url,
            status=project.status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.session.add(db_project)
        await self.session.commit()
        await self.session.refresh(db_project)
        return self._to_domain(db_project)

    async def get_all(self, user_id: str) -> List[Project]:
        stmt = select(DBProject).filter_by(user_id=user_id)
        result = await self.session.execute(stmt)
        db_projects = result.scalars().all()
        return [self._to_domain(p) for p in db_projects]
    
    async def get_by_id(self, project_id: int) -> Optional[Project]:
        stmt = select(DBProject).filter_by(id=project_id)
        result = await self.session.execute(stmt)
        db_project = result.scalars().first()
        
        if db_project:
            return self._to_domain(db_project)
        return None

    async def attach_titles(self, project_id: int, title_ids: List[int]):
        for t_id in title_ids:
            # Check if association already exists
            stmt = select(TitleProject).filter_by(title_id=t_id, project_id=project_id)
            result = await self.session.execute(stmt)
            exists = result.scalars().first()
            
            if not exists:
                assoc = TitleProject(title_id=t_id, project_id=project_id)
                self.session.add(assoc)
        await self.session.commit()

    async def attach_tags(self, project_id: int, tags: List[str]):
        # Implementation for attaching tags (assuming tags already exist or we create them)
        # Note: tags here implies tag names or IDs? 
        # The interface contract needs to be careful. UseCase passed names.
        # But this repo method is called 'attach_tags'.
        # Since logic was moved to UseCase to find/create tags, and pass tag names? 
        # Wait, UseCase loops and creates Tags, but then calls `attach_tags` with names?
        # That logic in UseCase was:
        # tag = await self.tag_repo.get_by_name(name) ... create if missing ...
        # await self.project_repo.attach_tags(project_id, tag_names)
        
        # So here we need to map names to IDs again? Or UseCase should pass IDs?
        # To be cleaner, let's assume UseCase resolved tags and we just need to link them.
        # But the interface says `tags: List[str]`.
        
        # Proper implementation:
        for tag_name in tags:
            # Get Tag ID
            stmt = select(DBTag).filter_by(tag_name=tag_name)
            result = await self.session.execute(stmt)
            db_tag = result.scalars().first()
            
            if db_tag:
                 # Check linkage
                 stmt_link = select(TagProject).filter_by(tag_id=db_tag.id, project_id=project_id)
                 result_link = await self.session.execute(stmt_link)
                 exists = result_link.scalars().first()
                 
                 if not exists:
                     link = TagProject(tag_id=db_tag.id, project_id=project_id)
                     self.session.add(link)
        
        await self.session.commit()

    def _to_domain(self, db_project: DBProject) -> Project:
        return Project(
            id=db_project.id,
            user_id=db_project.user_id,
            name=db_project.name,
            short_description=db_project.short_description,
            readme_markdown=db_project.readme_markdown,
            repo_url=db_project.repo_url,
            status=db_project.status,
            created_at=db_project.created_at,
            updated_at=db_project.updated_at
        )

class SqlAlchemyTagRepository(TagRepository):
     def __init__(self, session: AsyncSession):
        self.session = session
     
     async def create(self, tag: Tag) -> Tag:
         # Check exists first to be safe, though unique constraint handles it
         existing = await self.get_by_name(tag.tag_name)
         if existing:
             return existing

         db_tag = DBTag(tag_name=tag.tag_name)
         self.session.add(db_tag)
         await self.session.commit()
         await self.session.refresh(db_tag)
         return self._to_domain(db_tag)

     async def get_by_name(self, name: str) -> Optional[Tag]:
         stmt = select(DBTag).filter_by(tag_name=name)
         result = await self.session.execute(stmt)
         db_tag = result.scalars().first()
         
         if db_tag:
             return self._to_domain(db_tag)
         return None

     def _to_domain(self, db_tag: DBTag) -> Tag:
         return Tag(
             tag_id=str(db_tag.id), 
             tag_name=db_tag.tag_name,
             created_at=datetime.utcnow(), 
             updated_at=datetime.utcnow()
         )
