from App.domain.entities.models import UserProfile
from App.domain.interfaces.repositories import ProfileRepository
from datetime import datetime

class CreateOrUpdateProfileUseCase:
    def __init__(self, profile_repo: ProfileRepository):
        self.profile_repo = profile_repo

    async def execute(self, user_id: str, name: str, headline: str, bio: str, location: str, years: int) -> UserProfile:
        profile = UserProfile(
            user_id=user_id,
            name=name,
            email="",  # Assuming email managed externally or fetched
            headline=headline,
            about_text=bio,
            location=location,
            years_of_experience=years,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return await self.profile_repo.create_or_update(profile)

class GetProfileUseCase:
    def __init__(self, profile_repo: ProfileRepository):
        self.profile_repo = profile_repo

    async def execute(self, user_id: str) -> UserProfile:
        return await self.profile_repo.get_by_user_id(user_id)
