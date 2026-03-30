from abc import ABC, abstractmethod
from typing import Optional, Dict


class AiServiceInterface(ABC):
    """Interface for AI service implementations."""

    @abstractmethod
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the AI service with optional API key."""
        pass

    @abstractmethod
    async def send_message(self, message: str) -> str:
        """Send a message to the AI service and return the response.

        Args:
            message: The message to send to the AI

        Returns:
            The AI's response as a string
        """
        pass

    @abstractmethod
    async def generate_professional_summary(self, profile_data: Dict) -> str:
        """Generate a professional summary based on user profile data.

        Args:
            profile_data: Dictionary containing user profile information

        Returns:
            A professional summary string (4-5 lines max)
        """
        pass