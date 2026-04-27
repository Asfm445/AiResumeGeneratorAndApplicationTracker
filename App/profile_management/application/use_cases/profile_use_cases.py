from App.profile_management.domain.entities.models import UserProfile
from App.profile_management.domain.interfaces.repositories import ProfileRepository
from datetime import datetime

class CreateOrUpdateProfileUseCase:
    def __init__(self, profile_repo: ProfileRepository):
        self.profile_repo = profile_repo

    async def execute(self, user_id: str, name: str = None, headline: str = None, 
                      bio: str = None, location: str = None, years: int = None, 
                      phone: str = None, linkedin: str = None, github: str = None) -> UserProfile:
        
        # 1. Fetch existing
        existing_profile = await self.profile_repo.get_by_user_id(user_id)
        
        if existing_profile:
            # 2. Patch only provided fields
            if name is not None: existing_profile.name = name
            if headline is not None: existing_profile.headline = headline
            if bio is not None: existing_profile.about_text = bio
            if location is not None: existing_profile.location = location
            if years is not None: existing_profile.years_of_experience = years
            if phone is not None: existing_profile.phone = phone
            if linkedin is not None: existing_profile.linkedin_url = linkedin
            if github is not None: existing_profile.github_url = github
            existing_profile.updated_at = datetime.utcnow()
            profile = existing_profile
        else:
            # 3. Create new (ensure required fields for new profiles)
            profile = UserProfile(
                user_id=user_id,
                name=name or "New User",
                email="",  # Assuming email managed externally or fetched
                headline=headline,
                about_text=bio,
                location=location,
                years_of_experience=years or 0,
                phone=phone,
                linkedin_url=linkedin,
                github_url=github,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        
        return await self.profile_repo.create_or_update(profile)

class GetProfileUseCase:
    def __init__(self, profile_repo: ProfileRepository):
        self.profile_repo = profile_repo

    async def execute(self, user_id: str) -> UserProfile:
        return await self.profile_repo.get_by_user_id(user_id)
