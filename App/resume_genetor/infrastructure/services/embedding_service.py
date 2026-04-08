import os
from typing import List
import google.generativeai as genai
from App.resume_genetor.domain.interfaces.embeding_service import EmbeddingService

class GeminiEmbeddingService(EmbeddingService):
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        genai.configure(api_key=self.api_key)
        
    async def embed_text(self, text: str) -> List[float]:
        # Use models/text-embedding-004 for the latest version
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
            task_type="retrieval_document" # Use retrieval_query for searches
        )
        # Return the 384 dimensional slice as required by your Vector(384) pgvector schema
        return result["embedding"][:384]
