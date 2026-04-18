from abc import ABC, abstractmethod
from typing import Optional, Dict, List, Any
from App.resume_genetor.domain.models.model import TitleForAi


class AiServiceInterface(ABC):
    """Interface for AI service implementations."""

    @abstractmethod
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the AI service with optional API key."""
        pass

    @abstractmethod
    async def send_message(self, message: str) -> Any:
        """Send a message to the AI service and return the response."""
        pass

    @abstractmethod
    async def generate_headline(self, profile_data: Dict) -> str:
        """Generate a tailored headline based on the profile data and target title."""
        pass

    @abstractmethod
    async def generate_summary(self, profile_data: Dict) -> str:
        """Generate a professional summary."""
        pass

    @abstractmethod
    async def generate_experience(self, experience_data: List[Dict], target_title: str, target_description: Optional[str] = None) -> List[Dict]:
        """Generate tailored professional experience."""
        pass

    @abstractmethod
    async def generate_projects(self, project_data: List[Dict], target_title: str, target_description: Optional[str] = None) -> List[Dict]:
        """Generate tailored project entries."""
        pass

    @abstractmethod
    async def generate_skills(self, skill_data: List[Dict], target_title: str, target_description: Optional[str] = None) -> Dict[str, List[str]]:
        """Generate tailored skills list."""
        pass

    @abstractmethod
    async def generate_resume(self, profile_data: Dict) -> Dict[str, Any]:
        """Generate a full resume."""
        pass

    @abstractmethod
    async def tailor_resume_to_jd(self, profile_data: Dict, job_description: str, job_title: Optional[str] = None, company_name: Optional[str] = None) -> Dict[str, Any]:
        """Tailor a resume to a specific job description."""
        pass

    @abstractmethod
    async def refine_resume(self, current_resume: Dict, comment: str) -> Dict[str, Any]:
        """Refine an existing resume based on user comments."""
        pass

    @abstractmethod
    async def evaluate_resume(self, resume_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Evaluate a resume against a job description."""
        pass

    @abstractmethod
    async def generate_tags(self, user_id: str, title: TitleForAi) -> List[str]:
        pass