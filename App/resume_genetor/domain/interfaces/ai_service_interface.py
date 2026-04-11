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
    async def generate_summary(self, profile_data: Dict) -> str:
        """Generate a professional summary."""
        pass

    @abstractmethod
    async def generate_experience(self, experience_data: List[Dict], target_title: str) -> List[Dict]:
        """Generate tailored professional experience."""
        pass

    @abstractmethod
    async def generate_projects(self, project_data: List[Dict], target_title: str) -> List[Dict]:
        """Generate tailored project entries."""
        pass

    @abstractmethod
    async def generate_skills(self, skill_data: List[Dict], target_title: str) -> Dict[str, List[str]]:
        """Generate tailored skills list."""
        pass

    @abstractmethod
    async def generate_resume(self, profile_data: Dict) -> Dict[str, Any]:
        """Generate a full resume (kept for backward compatibility or as a master call)."""
        pass

    @abstractmethod
    async def generate_tags(self, user_id: str, title: TitleForAi) -> List[str]:
        pass