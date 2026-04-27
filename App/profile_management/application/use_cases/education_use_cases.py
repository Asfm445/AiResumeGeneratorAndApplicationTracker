from App.profile_management.domain.entities.models import Education
from App.profile_management.domain.interfaces.repositories import EducationRepository
from typing import List, Optional
from datetime import datetime

class EducationUseCase:
    def __init__(self, education_repo: EducationRepository):
        self.education_repo = education_repo

    async def create_education(self, user_id: str, school: str, degree: str, 
                               field_of_study: str, start_date: datetime, 
                               end_date: Optional[datetime], 
                               relevant_courses: List[str]) -> Education:
        education = Education(
            user_id=user_id,
            school=school,
            degree=degree,
            field_of_study=field_of_study,
            start_date=start_date,
            end_date=end_date,
            relevant_courses=relevant_courses
        )
        return await self.education_repo.create(education)

    async def update_education(self, education_id: int, user_id: str, 
                               school: str, degree: str, 
                               field_of_study: str, start_date: datetime, 
                               end_date: Optional[datetime], 
                               relevant_courses: List[str]) -> Optional[Education]:
        education = Education(
            id=education_id,
            user_id=user_id,
            school=school,
            degree=degree,
            field_of_study=field_of_study,
            start_date=start_date,
            end_date=end_date,
            relevant_courses=relevant_courses
        )
        return await self.education_repo.update(education)

    async def get_all_education(self, user_id: str) -> List[Education]:
        return await self.education_repo.get_all(user_id)

    async def get_education(self, education_id: int) -> Optional[Education]:
        return await self.education_repo.get_by_id(education_id)

    async def delete_education(self, education_id: int, user_id: str) -> bool:
        return await self.education_repo.delete(education_id, user_id)
