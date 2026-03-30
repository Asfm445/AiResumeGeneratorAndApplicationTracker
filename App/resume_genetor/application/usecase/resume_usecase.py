from App.profile_management.domain.interfaces.repositories import ProfileRepository, TitleRepository, SkillRepository
from App.profile_management.domain.entities.models import UserProfile
from App.resume_genetor.domain.interfaces.ai_service_interface import AiServiceInterface



class ResumeUseCase:
    def __init__(self, profile_repo: ProfileRepository, 
                 ai_service: AiServiceInterface, 
                 title_repo: TitleRepository, 
                 skill_repo: SkillRepository
                 ):
        self.profile_repo = profile_repo
        self.ai_service = ai_service
        self.title_repo = title_repo
        self.skill_repo = skill_repo

    async def generate_resume(self, user_id: str) -> str:
        # Fetch user profile and related data
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise ValueError("User profile not found")
        titles= await self.title_repo.get_all(user_id)
        skills= await self.skill_repo.get_all(user_id)

        print(skills)

        titles.sort(key= lambda t: t.priority, reverse=True)


        data={
            "name": profile.name,
            "headline": profile.headline,
            "bio": profile.about_text,
            "location": profile.location,
            "years_of_experience": profile.years_of_experience,
            "skills": [{"skill_type":skill.skill_type,"skills":skill.skills} for skill in skills]
            }

        if titles:
            data["title"]= titles[0].title_name

        professional_summary = await self.ai_service.generate_professional_summary(data)
        # professional_summary = "this is dummy summary for testing"
        return professional_summary

