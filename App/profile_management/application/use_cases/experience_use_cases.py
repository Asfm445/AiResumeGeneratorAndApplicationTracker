from App.profile_management.domain.entities.models import Expriance
from App.profile_management.domain.interfaces.repositories import ExprianceRepository
from datetime import datetime
from typing import List, Optional

class CreateExprianceUseCase:
    def __init__(self, expriance_repo: ExprianceRepository):
        self.expriance_repo = expriance_repo
    
    async def execute(self, user_id: str, company_name: str, employement_type: str, 
                      role_title: str, short_description: str, start_date: datetime, 
                      tech_stack: Optional[List[str]] = None, end_date: Optional[datetime] = None) -> Expriance:
        if start_date and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        if end_date and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)

        expriance = Expriance(
            user_id=user_id,
            company_name=company_name,
            employement_type=employement_type,
            role_title=role_title,
            short_description=short_description,
            start_date=start_date,
            tech_stack=tech_stack or [],
            end_date=end_date,
            created_at=datetime.utcnow()
        )
        return await self.expriance_repo.create(expriance)

class UpdateExprianceUseCase:
    def __init__(self, expriance_repo: ExprianceRepository):
        self.expriance_repo = expriance_repo
    
    async def execute(self, expriance_id: int, user_id: str, company_name: str, employement_type: str, 
                      role_title: str, short_description: str, start_date: datetime, 
                      tech_stack: Optional[List[str]] = None, end_date: Optional[datetime] = None) -> Optional[Expriance]:
        if start_date and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        if end_date and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)

        expriance = Expriance(
            id=expriance_id,
            user_id=user_id,
            company_name=company_name,
            employement_type=employement_type,
            role_title=role_title,
            short_description=short_description,
            start_date=start_date,
            tech_stack=tech_stack or [],
            end_date=end_date,
            created_at=datetime.utcnow() # Unused on update but required by model
        )
        return await self.expriance_repo.update(expriance)

class ListExpriancesUseCase:
    def __init__(self, expriance_repo: ExprianceRepository):
        self.expriance_repo = expriance_repo

    async def execute(self, user_id: str) -> List[Expriance]:
        return await self.expriance_repo.get_all(user_id)

class GetExprianceUseCase:
    def __init__(self, expriance_repo: ExprianceRepository):
        self.expriance_repo = expriance_repo

    async def execute(self, expriance_id: int) -> Optional[Expriance]:
        return await self.expriance_repo.get_by_id(expriance_id)

class DeleteExprianceUseCase:
    def __init__(self, expriance_repo: ExprianceRepository):
        self.expriance_repo = expriance_repo

    async def execute(self, expriance_id: int) -> bool:
        return await self.expriance_repo.delete(expriance_id)
