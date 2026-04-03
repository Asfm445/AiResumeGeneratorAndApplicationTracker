from typing import List
from App.resume_genetor.domain.interfaces.embeding_service import EmbeddingService
from sentence_transformers import SentenceTransformer

class LocalEmbeddingService(EmbeddingService):
    def __init__(self):
        # Load the model once when the service starts up, not on every request!
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        
    async def embade_text(self, text: str) -> List[float]:
        # Encode the text and convert to a list
        embedding = self.model.encode(text)
        return embedding.tolist()