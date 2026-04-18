from App.profile_management.domain.interfaces.repositories import ProfileRepository, TitleRepository, SkillRepository, ProjectRepository, ExprianceRepository, ResumeRepository, JobRepository, EvaluationRepository
from App.profile_management.domain.entities.models import UserProfile, GeneratedResume, Job, ResumeEvaluation
from App.resume_genetor.domain.interfaces.ai_service_interface import AiServiceInterface
from App.resume_genetor.domain.models.model import TitleForAi
from App.resume_genetor.domain.interfaces.embeding_service import EmbeddingService
from typing import Optional, List


class ResumeUseCase:
    def __init__(self, profile_repo: ProfileRepository, 
                 ai_service: AiServiceInterface, 
                 title_repo: TitleRepository, 
                 skill_repo: SkillRepository,
                 project_repo: ProjectRepository,
                 expriance_repo: ExprianceRepository,
                 embedding_service: EmbeddingService,
                 resume_repo: ResumeRepository,
                 job_repo: JobRepository,
                 evaluation_repo: EvaluationRepository
                 ):
        self.profile_repo = profile_repo
        self.ai_service = ai_service
        self.title_repo = title_repo
        self.skill_repo = skill_repo
        self.project_repo = project_repo
        self.expriance_repo = expriance_repo
        self.embedding_service = embedding_service
        self.resume_repo = resume_repo
        self.job_repo = job_repo
        self.evaluation_repo = evaluation_repo

    async def _get_resume_input_data(self, user_id: str, title_id: Optional[int] = None) -> dict:
        # Fetch user profile and related data
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise ValueError("User profile not found")
        
        titles = await self.title_repo.get_all(user_id)
        skills = await self.skill_repo.get_all(user_id)
        
        target_title_obj = None
        if title_id:
            # Find the specific title requested
            target_title_obj = next((t for t in titles if t.id == title_id), None)
            if not target_title_obj:
                raise ValueError(f"Title with ID {title_id} not found for this user")
        elif titles:
            # Fallback to highest priority title
            titles.sort(key=lambda t: t.priority, reverse=True)
            target_title_obj = titles[0]

        if not target_title_obj:
            target_title = "Professional"
            emb = None
        else:
            target_title = target_title_obj.title_name
            emb = await self.title_repo.get_title_embading_by_title_id(target_title_obj.id)
            if emb is None:
                emb = await self.embedding_service.embed_text(target_title_obj.description)
                await self.title_repo.save_embedding(target_title_obj.id, emb)

        # Filter projects by embedding if title exists, else get all
        if target_title_obj:
            projects = await self.project_repo.filter_projects_by_embedding(user_id, emb, 3)
        else:
            projects = await self.project_repo.get_all(user_id)

        expriances = await self.expriance_repo.get_all(user_id)

        # Prepare data for AI sections
        return {
            "profile": profile,
            "target_title_obj": target_title_obj,
            "ai_input_data": {
                "title": target_title,
                "title_description": target_title_obj.description if target_title_obj else "",
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
        }

    async def generate_resume(self, user_id: str, title_id: Optional[int] = None) -> dict:
        data = await self._get_resume_input_data(user_id, title_id)
        profile = data["profile"]
        target_title_obj = data["target_title_obj"]
        ai_input_data = data["ai_input_data"]

        # Generate AI parts
        ai_generated_resume = await self.ai_service.generate_resume(ai_input_data)
        
        # Combine with static profile data
        full_resume = {
            "name": profile.name,
            "email": profile.email,
            "location": profile.location,
            **ai_generated_resume
        }

        # Save generated resume if target_title_obj exists
        if target_title_obj:
            latest_version = await self.resume_repo.get_latest_version_by_title(target_title_obj.id)
            new_version = latest_version + 1
            
            generated_resume_entity = GeneratedResume(
                user_id=user_id,
                title_id=target_title_obj.id,
                resume_data=full_resume,
                version=new_version
            )
            saved = await self.resume_repo.save(generated_resume_entity)
            full_resume["id"] = saved.id
            full_resume["version"] = new_version
        
        return full_resume

    async def tailor_resume_to_jd(self, user_id: str, job_id: int) -> dict:

        job = await self.job_repo.get_by_id(job_id)
        job_description_embedding = await self.embedding_service.embed_text(job.job_description)

        projects = await self.project_repo.filter_projects_by_embedding(user_id, job_description_embedding, 3)

        profile= await self.profile_repo.get_by_user_id(user_id)

        skills = await self.skill_repo.get_all(user_id)

        expriances = await self.expriance_repo.get_all(user_id)

        ai_input_data = {
            "job_title": job.job_title,
            "job_description": job.job_description,
            "company_name": job.company_name,
            "user_bio": profile.about_text,
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

        ai_generated_resume = await self.ai_service.generate_resume(ai_input_data)

        full_resume = {
            "name": profile.name,
            "email": profile.email,
            "location": profile.location,
            **ai_generated_resume
        }
        
        latest_version = await self.resume_repo.get_latest_version_by_job(job.id)
        new_version = latest_version + 1
        
        generated_resume_entity = GeneratedResume(
            user_id=user_id,
            job_id=job.id,
            resume_data=full_resume,
            version=new_version
        )

        saved = await self.resume_repo.save(generated_resume_entity)
        full_resume["id"] = saved.id
        full_resume["version"] = new_version
        
        return full_resume

    async def refine_resume(self, user_id: str, resume_id: int, comment: str) -> dict:
        resume = await self.resume_repo.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise ValueError("Resume not found or unauthorized")


        ai_generated_resume = await self.ai_service.refine_resume(resume.resume_data, comment)

        full_resume = {
            "name": resume.resume_data["name"],
            "email": resume.resume_data["email"],
            "location": resume.resume_data["location"],
            **ai_generated_resume
        }
        if resume.job_id:
            latest_version = await self.resume_repo.get_latest_version_by_job(resume.job_id)
            new_version = latest_version + 1
            
            generated_resume_entity = GeneratedResume(
            user_id=user_id,
            job_id=resume.job_id,
            resume_data=full_resume,
            version=new_version
        )
        else:
            latest_version = await self.resume_repo.get_latest_version_by_title(resume.title_id)
            new_version = latest_version + 1
            generated_resume_entity = GeneratedResume(
                user_id=user_id,
                title_id=resume.title_id,
                resume_data=full_resume,
                version=new_version
            )

        saved = await self.resume_repo.save(generated_resume_entity)
        full_resume["id"] = saved.id
        full_resume["version"] = new_version
        
        return full_resume
    

        

        
        


            
            
            

        

       
        
        



        

        # data = await self._get_resume_input_data(user_id)
        # # return data
        # profile = data["profile"]
        # target_title_obj = data["target_title_obj"]
        # ai_input_data = data["ai_input_data"]
        # print("+++++++++++++++++++++profile_____________________###########################")
        # print(profile)
        # print("+++++++++++++++++++++target_title_obj_____________________###########################")
        # print(target_title_obj)
        # print("+++++++++++++++++++++ai_input_data_____________________###########################")
        # print(ai_input_data)

        # return data

    #     if job_id:
    #         job = await self.job_repo.get_by_id(job_id)
    #         if not job or job.user_id != user_id:
    #             raise ValueError("Job not found or unauthorized")
    #         job_description = job.job_description
    #         job_title = job.job_title
    #         company_name = job.company_name
    #     elif not job_description:
    #         raise ValueError("Job description or Job ID is required")
    #     else:
    #         # Create a job if it doesn't exist
    #         job = Job(
    #             user_id=user_id,
    #             job_title=job_title or "Tailored Job",
    #             company_name=company_name or "Unknown Company",
    #             job_description=job_description
    #         )
    #         job = await self.job_repo.create(job)
    #         job_id = job.id

    #     # Tailor via AI
    #     tailored_data = await self.ai_service.tailor_resume_to_jd(ai_input_data, job_description, job_title, company_name)

    #     # Combine with static profile data
    #     full_resume = {
    #         "name": profile.name,
    #         "email": profile.email,
    #         "location": profile.location,
    #         **tailored_data
    #     }

    #     # Save as new version
    #     if target_title_obj:
    #         latest_version = await self.resume_repo.get_latest_version(target_title_obj.id)
    #         new_version = latest_version + 1
            
    #         generated_resume_entity = GeneratedResume(
    #             user_id=user_id,
    #             title_id=target_title_obj.id,
    #             resume_data=full_resume,
    #             version=new_version,
    #             job_id=job_id
    #         )
    #         saved = await self.resume_repo.save(generated_resume_entity)
    #         full_resume["id"] = saved.id
    #         full_resume["version"] = new_version
    #         full_resume["job_id"] = job_id
        
    #     return full_resume

    # async def refine_resume(self, user_id: str, resume_id: int, comment: str) -> dict:
    #     # Fetch the current resume
    #     resume_entity = await self.resume_repo.get_by_id(resume_id)
    #     if not resume_entity or resume_entity.user_id != user_id:
    #         raise ValueError("Resume not found or unauthorized")

    #     # Call AI to refine
    #     refined_data = await self.ai_service.refine_resume(resume_entity.resume_data, comment)
        
    #     # Increment version and save as new
    #     latest_version = await self.resume_repo.get_latest_version(resume_entity.title_id)
    #     new_version = latest_version + 1
        
    #     new_resume_entity = GeneratedResume(
    #         user_id=user_id,
    #         title_id=resume_entity.title_id,
    #         resume_data=refined_data,
    #         version=new_version
    #     )
    #     saved_resume = await self.resume_repo.save(new_resume_entity)
        
    #     return {**refined_data, "id": saved_resume.id, "version": saved_resume.version}

    async def update_resume(self, user_id: str, resume_id: int, updated_data: dict) -> dict:
        # Fetch current to ensure ownership
        resume_entity = await self.resume_repo.get_by_id(resume_id)
        if not resume_entity or resume_entity.user_id != user_id:
            raise ValueError("Resume not found or unauthorized")

        # Save as a NEW version (preserving history)
        latest_version = await self.resume_repo.get_latest_version(resume_entity.title_id)
        new_version = latest_version + 1

        new_resume_entity = GeneratedResume(
            user_id=user_id,
            title_id=resume_entity.title_id,
            resume_data=updated_data,
            version=new_version
        )
        saved_resume = await self.resume_repo.save(new_resume_entity)

        return {**updated_data, "id": saved_resume.id, "version": saved_resume.version}

    async def delete_resume(self, user_id: str, resume_id: int) -> bool:
        return await self.resume_repo.delete(resume_id, user_id)

    async def get_resumes_by_job_id(self, user_id: str, job_id: int) -> List[GeneratedResume]:
        # Verification: check if job exists and belongs to the user
        job = await self.job_repo.get_by_id(job_id)
        if not job or job.user_id != user_id:
            raise ValueError("Job not found or unauthorized")
        
        return await self.resume_repo.get_all_by_job(job_id)

    async def generate_tags(self, user_id: str, title_id: Optional[int] = None) -> str:
        titles = await self.title_repo.get_all(user_id)
        
        target_title_obj = None
        if title_id:
            target_title_obj = next((t for t in titles if t.id == title_id), None)
        elif titles:
            titles.sort(key=lambda t: t.priority, reverse=True)
            target_title_obj = titles[0]

        if not target_title_obj:
            raise ValueError("No target title found to generate tags for")

        title = TitleForAi(title_name=target_title_obj.title_name, description=target_title_obj.description)
        tags = await self.ai_service.generate_tags(user_id, title)
        return tags

    async def evaluate_resume(self, user_id: str, resume_id: int, job_id: int) -> dict:
        resume = await self.resume_repo.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise ValueError("Resume not found or unauthorized")

        job = await self.job_repo.get_by_id(job_id)
        if not job or job.user_id != user_id:
            raise ValueError("Job not found or unauthorized")

        # Check for existing evaluation
        existing_eval = await self.evaluation_repo.get_by_resume_and_job(resume_id, job_id)
        if existing_eval:
            return {
                "id": existing_eval.id,
                "score": existing_eval.score,
                "summary": existing_eval.summary,
                "strengths": existing_eval.strengths,
                "gaps": existing_eval.gaps,
                "suggestions": existing_eval.suggestions,
                "created_at": existing_eval.created_at.isoformat()
            }

        evaluation_data = await self.ai_service.evaluate_resume(resume.resume_data, job.job_description)

        evaluation = ResumeEvaluation(
            user_id=user_id,
            resume_id=resume_id,
            job_id=job_id,
            score=evaluation_data["score"],
            summary=evaluation_data["summary"],
            strengths=evaluation_data["strengths"],
            gaps=evaluation_data["gaps"],
            suggestions=evaluation_data["suggestions"]
        )

        saved_eval = await self.evaluation_repo.save(evaluation)

        return {
            "id": saved_eval.id,
            "score": saved_eval.score,
            "summary": saved_eval.summary,
            "strengths": saved_eval.strengths,
            "gaps": saved_eval.gaps,
            "suggestions": saved_eval.suggestions,
            "created_at": saved_eval.created_at.isoformat()
        }
        



        

