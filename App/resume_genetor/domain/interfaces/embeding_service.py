from abc import ABC, abstractmethod
from typing import List


class EmbeddingService(ABC):
    
    @abstractmethod
    async def embade_text(self, text: str) -> List[float]:
        pass
        