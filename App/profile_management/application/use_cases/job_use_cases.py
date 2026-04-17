from typing import List, Optional
from App.profile_management.domain.entities.models import Job
from App.profile_management.domain.interfaces.repositories import JobRepository

class JobUseCase:
    def __init__(self, job_repo: JobRepository):
        self.job_repo = job_repo

    async def create_job(
        self,
        user_id: str,
        job_title: str,
        company_name: str,
        job_description: str,
        url: Optional[str] = None,
        location: Optional[str] = None
    ) -> Job:
        job = Job(
            user_id=user_id,
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
            url=url,
            location=location
        )
        return await self.job_repo.create(job)

    async def get_job(self, job_id: int, user_id: str) -> Optional[Job]:
        job = await self.job_repo.get_by_id(job_id)
        if job and job.user_id == user_id:
            return job
        return None

    async def get_all_jobs(self, user_id: str) -> List[Job]:
        return await self.job_repo.get_all(user_id)

    async def update_job(
        self,
        job_id: int,
        user_id: str,
        job_title: Optional[str] = None,
        company_name: Optional[str] = None,
        job_description: Optional[str] = None,
        url: Optional[str] = None,
        location: Optional[str] = None
    ) -> Optional[Job]:
        job = await self.get_job(job_id, user_id)
        if not job:
            return None
        
        if job_title:
            job.job_title = job_title
        if company_name:
            job.company_name = company_name
        if job_description:
            job.job_description = job_description
        if url:
            job.url = url
        if location:
            job.location = location
            
        return await self.job_repo.update(job)

    async def delete_job(self, job_id: int, user_id: str) -> bool:
        return await self.job_repo.delete(job_id, user_id)
