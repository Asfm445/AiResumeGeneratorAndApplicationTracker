from App.domain.entities.models import Skill
from App.domain.interfaces.repositories import SkillRepository
from datetime import datetime
from typing import List, Optional

class CreateSkillUseCase:
    def __init__(self, skill_repo: SkillRepository):
        self.skill_repo = skill_repo
    
    async def execute(self, user_id: str, skill_type: str, skills: List[str]) -> Skill:
        skill = Skill(
            user_id=user_id,
            skill_type=skill_type,
            skills=skills,
            created_at=datetime.utcnow()
        )
        return await self.skill_repo.create(skill)

class UpdateSkillUseCase:
    def __init__(self, skill_repo: SkillRepository):
        self.skill_repo = skill_repo
    
    async def execute(self, skill_id: int, user_id: str, skill_type: str, skills: List[str]) -> Optional[Skill]:
        skill = Skill(
            id=skill_id,
            user_id=user_id,
            skill_type=skill_type,
            skills=skills,
            created_at=datetime.utcnow()
        )
        return await self.skill_repo.update(skill)

class ListSkillsUseCase:
    def __init__(self, skill_repo: SkillRepository):
        self.skill_repo = skill_repo

    async def execute(self, user_id: str) -> List[Skill]:
        return await self.skill_repo.get_all(user_id)

class GetSkillUseCase:
    def __init__(self, skill_repo: SkillRepository):
        self.skill_repo = skill_repo

    async def execute(self, skill_id: int) -> Optional[Skill]:
        return await self.skill_repo.get_by_id(skill_id)

class DeleteSkillUseCase:
    def __init__(self, skill_repo: SkillRepository):
        self.skill_repo = skill_repo

    async def execute(self, skill_id: int) -> bool:
        return await self.skill_repo.delete(skill_id)
