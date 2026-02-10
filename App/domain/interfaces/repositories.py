from abc import ABC, abstractmethod
from typing import List, Optional
from App.domain.entities.models import UserProfile, Title, Project, Tag

class ProfileRepository(ABC):
    @abstractmethod
    async def create_or_update(self, profile: UserProfile) -> UserProfile:
        pass

    @abstractmethod
    async def get_by_user_id(self, user_id: str) -> Optional[UserProfile]:
        pass

class TitleRepository(ABC):
    @abstractmethod
    async def create(self, title: Title) -> Title:
        pass

    @abstractmethod
    async def get_all(self, user_id: str) -> List[Title]:
        pass

    @abstractmethod
    async def get_by_id(self, title_id: int) -> Optional[Title]:
        pass

class ProjectRepository(ABC):
    @abstractmethod
    async def create(self, project: Project) -> Project:
        pass

    @abstractmethod
    async def get_all(self, user_id: str) -> List[Project]:
        pass

    @abstractmethod
    async def get_by_id(self, project_id: int) -> Optional[Project]:
        pass

    @abstractmethod
    async def attach_titles(self, project_id: int, title_ids: List[int]):
        pass

    @abstractmethod
    async def attach_tags(self, project_id: int, tags: List[str]):
        pass

class TagRepository(ABC):
    @abstractmethod
    async def create(self, tag: Tag) -> Tag:
        pass
    
    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Tag]:
        pass
