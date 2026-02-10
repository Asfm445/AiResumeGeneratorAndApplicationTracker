from App.domain.entities.models import Title
from App.domain.interfaces.repositories import TitleRepository
from datetime import datetime
from typing import List

class CreateTitleUseCase:
    def __init__(self, title_repo: TitleRepository):
        self.title_repo = title_repo
    
    async def execute(self, user_id: str, name: str, priority: int) -> Title:
        title = Title(
            title_name=name,
            user_id=user_id,
            priority=priority,
            created_at=datetime.utcnow()
        )
        return await self.title_repo.create(title)

class ListTitlesUseCase:
    def __init__(self, title_repo: TitleRepository):
        self.title_repo = title_repo

    async def execute(self, user_id: str) -> List[Title]:
        return await self.title_repo.get_all(user_id)
