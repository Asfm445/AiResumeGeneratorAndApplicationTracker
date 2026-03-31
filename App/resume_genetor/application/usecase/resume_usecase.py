from App.profile_management.domain.interfaces.repositories import ProfileRepository, TitleRepository, SkillRepository, ProjectRepository, ExprianceRepository
from App.profile_management.domain.entities.models import UserProfile
from App.resume_genetor.domain.interfaces.ai_service_interface import AiServiceInterface



class ResumeUseCase:
    def __init__(self, profile_repo: ProfileRepository, 
                 ai_service: AiServiceInterface, 
                 title_repo: TitleRepository, 
                 skill_repo: SkillRepository,
                 project_repo: ProjectRepository,
                 expriance_repo: ExprianceRepository
                 ):
        self.profile_repo = profile_repo
        self.ai_service = ai_service
        self.title_repo = title_repo
        self.skill_repo = skill_repo
        self.project_repo = project_repo
        self.expriance_repo = expriance_repo

    async def generate_resume(self, user_id: str) -> str:
        # Fetch user profile and related data
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise ValueError("User profile not found")
        titles= await self.title_repo.get_all(user_id)
        skills= await self.skill_repo.get_all(user_id)

        titles.sort(key= lambda t: t.priority, reverse=True)
        projects = await self.project_repo.get_project_by_title_name(user_id, titles[0].title_name)
        expriances= await self.expriance_repo.get_all(user_id)


        data={
            "name": profile.name,
            "headline": profile.headline,
            "bio": profile.about_text,
            "location": profile.location,
            "years_of_experience": profile.years_of_experience,
            "skills": [{"skill_type":skill.skill_type,"skills":skill.skills} for skill in skills],
            "projects":[{"name":project.name,"short_description":project.short_description,"repo_url":project.repo_url,"status":project.repo_url,"project_description":{project_desc.type :project_desc.text for project_desc in project.project_description}} for project in projects],
            "expriances":[{"company":exp.company_name,"position":exp.role_title,"start_date":exp.start_date ,"end_date":exp.end_date if exp.end_date else "Present","description":exp.short_description, "employement_type":exp.employement_type, "tech_stack":exp.tech_stack} for exp in expriances]
            }

        if titles:
            data["title"]= titles[0].title_name

        resume = await self.ai_service.generate_resume(data)
        return resume

