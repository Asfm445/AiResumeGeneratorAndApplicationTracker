from App.domain.entities.models import Project, Tag
from App.domain.interfaces.repositories import ProjectRepository, TagRepository
from datetime import datetime
from typing import List

class CreateProjectUseCase:
    def __init__(self, project_repo: ProjectRepository):
        self.project_repo = project_repo

    async def execute(self, user_id: str, name: str, short_description: str, repo_url: str, readme: str, status: str) -> Project:
        project = Project(
            user_id=user_id,
            name=name,
            short_description=short_description,
            readme_markdown=readme,
            repo_url=repo_url,
            status=status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return await self.project_repo.create(project)

class AttachTitleToProjectUseCase:
    def __init__(self, project_repo: ProjectRepository):
        self.project_repo = project_repo

    async def execute(self, project_id: int, title_ids: List[str]):
        # Parse IDs: Assuming str provided, need int if project table expects int
        int_ids = []
        for tid in title_ids:
            if isinstance(tid, str) and tid.isdigit():
                int_ids.append(int(tid))
            elif isinstance(tid, int):
                int_ids.append(tid)
        
        await self.project_repo.attach_titles(project_id, int_ids)

class AttachTagToProjectUseCase:
    def __init__(self, project_repo: ProjectRepository, tag_repo: TagRepository):
        self.project_repo = project_repo
        self.tag_repo = tag_repo

    async def execute(self, project_id: int, tag_names: List[str]):
        for name in tag_names:
            tag = await self.tag_repo.get_by_name(name)
            if not tag:
                new_tag = Tag(tag_name=name, created_at=datetime.utcnow(), updated_at=datetime.utcnow(), tag_id="0")
                await self.tag_repo.create(new_tag)
        
        # Now attach
        await self.project_repo.attach_tags(project_id, tag_names)
