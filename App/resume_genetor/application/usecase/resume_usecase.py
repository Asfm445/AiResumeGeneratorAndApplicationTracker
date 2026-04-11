from App.profile_management.domain.interfaces.repositories import ProfileRepository, TitleRepository, SkillRepository, ProjectRepository, ExprianceRepository
from App.profile_management.domain.entities.models import UserProfile
from App.resume_genetor.domain.interfaces.ai_service_interface import AiServiceInterface
from App.resume_genetor.domain.models.model import TitleForAi
from App.resume_genetor.domain.interfaces.embeding_service import EmbeddingService


class ResumeUseCase:
    def __init__(self, profile_repo: ProfileRepository, 
                 ai_service: AiServiceInterface, 
                 title_repo: TitleRepository, 
                 skill_repo: SkillRepository,
                 project_repo: ProjectRepository,
                 expriance_repo: ExprianceRepository,
                 embedding_service: EmbeddingService
                 ):
        self.profile_repo = profile_repo
        self.ai_service = ai_service
        self.title_repo = title_repo
        self.skill_repo = skill_repo
        self.project_repo = project_repo
        self.expriance_repo = expriance_repo
        self.embedding_service = embedding_service

    async def generate_resume(self, user_id: str) -> dict:
        # Fetch user profile and related data
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise ValueError("User profile not found")
        
        titles = await self.title_repo.get_all(user_id)
        skills = await self.skill_repo.get_all(user_id)
        
        if not titles:
            target_title = "Professional"
        else:
            titles.sort(key=lambda t: t.priority, reverse=True)
            target_title = titles[0].title_name

            emb = await self.title_repo.get_title_embading_by_title_id(titles[0].id)
            if emb is None:
                emb = await self.embedding_service.embed_text(titles[0].description)
                await self.title_repo.save_embedding(titles[0].id, emb)

        # Filter projects by embedding if title exists, else get all
        if titles:
            projects = await self.project_repo.filter_projects_by_embedding(user_id, emb, 3)
        else:
            projects = await self.project_repo.get_all(user_id)

        expriances = await self.expriance_repo.get_all(user_id)

        # Prepare data for AI sections
        ai_input_data = {
            "title": target_title,
            "headline": profile.headline,
            "bio": profile.about_text,
            "skills": [{"skill_type": s.skill_type, "skills": s.skills} for s in skills],
            "projects": [
                {
                    "name": p.name,
                    "short_description": p.short_description,
                    "project_description": [pd.text for pd in p.project_description]
                } for p in projects
            ],
            "expriances": [
                {
                    "company_name": e.company_name,
                    "role_title": e.role_title,
                    "start_date": e.start_date.strftime("%Y-%m") if e.start_date else "",
                    "end_date": e.end_date.strftime("%Y-%m") if e.end_date else "Present",
                    "short_description": e.short_description,
                    "tech_stack": e.tech_stack
                } for e in expriances
            ]
        }

        # Generate AI parts
        ai_generated_resume = await self.ai_service.generate_resume(ai_input_data)
        
        # Combine with static profile data
        full_resume = {
            "name": profile.name,
            "email": profile.email,
            "headline": profile.headline or target_title,
            "location": profile.location,
            **ai_generated_resume
        }
        
        return full_resume

    async def generate_tags(self, user_id: str) -> str:
        titles= await self.title_repo.get_all(user_id)
        titles.sort(key= lambda t: t.priority, reverse=True)
        title = TitleForAi(title_name=titles[0].title_name, description=titles[0].description)
        

        tags = await self.ai_service.generate_tags(user_id, title)

        return tags
        



        

