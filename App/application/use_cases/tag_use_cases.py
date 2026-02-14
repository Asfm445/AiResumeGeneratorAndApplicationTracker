from App.domain.entities.models import Tag
from App.domain.interfaces.repositories import TagRepository
from datetime import datetime
from typing import List

class CreateTagUseCase:
    def __init__(self, tag_repo: TagRepository):
        self.tag_repo = tag_repo

    async def execute(self, name: str) -> Tag:
        tag = Tag(tag_name=name, tag_id="0")
        return await self.tag_repo.create(tag)

class ListTagsUseCase:
    def __init__(self, tag_repo: TagRepository):
        self.tag_repo = tag_repo

    async def execute(self) -> List[Tag]:
        return await self.tag_repo.get_all()
