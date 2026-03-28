from abc import ABC, abstractmethod
from typing import List, Optional
from App.profile_management.domain.entities.models import UserProfile, Title, Project, Tag, ProjectEmbedding, Expriance, Skill

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

    @abstractmethod
    async def save_embedding(self, embedding: ProjectEmbedding) -> ProjectEmbedding:
        pass

    @abstractmethod
    async def get_embeddings(self, project_id: int) -> List[ProjectEmbedding]:
        pass

class TagRepository(ABC):
    @abstractmethod
    async def create(self, tag: Tag) -> Tag:
        pass
    
    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Tag]:
        pass

    @abstractmethod
    async def get_all(self) -> List[Tag]:
        pass

class ExprianceRepository(ABC):
    @abstractmethod
    async def create(self, expriance: 'Expriance') -> 'Expriance':
        pass

    @abstractmethod
    async def update(self, expriance: 'Expriance') -> 'Expriance':
        pass

    @abstractmethod
    async def get_all(self, user_id: str) -> List['Expriance']:
        pass

    @abstractmethod
    async def get_by_id(self, expriance_id: int) -> Optional['Expriance']:
        pass
    
    @abstractmethod
    async def delete(self, expriance_id: int) -> bool:
        pass

class SkillRepository(ABC):
    @abstractmethod
    async def create(self, skill: 'Skill') -> 'Skill':
        pass

    @abstractmethod
    async def update(self, skill: 'Skill') -> 'Skill':
        pass

    @abstractmethod
    async def get_all(self, user_id: str) -> List['Skill']:
        pass

    @abstractmethod
    async def get_by_id(self, skill_id: int) -> Optional['Skill']:
        pass
    
    @abstractmethod
    async def delete(self, skill_id: int) -> bool:
        pass
