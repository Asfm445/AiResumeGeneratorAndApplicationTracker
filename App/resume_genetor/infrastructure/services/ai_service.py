import os
import json
import google.generativeai as genai
from typing import Optional, Dict, Any, List
from App.resume_genetor.domain.interfaces.ai_service_interface import AiServiceInterface
from App.resume_genetor.domain.models.model import TitleForAi

class AiService(AiServiceInterface):
    def __init__(self, api_key: Optional[str] = None, temperature: float = 0.3):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        genai.configure(api_key=self.api_key)
        self.generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            response_mime_type="application/json"
        )
        self.model = genai.GenerativeModel('gemini-3.1-flash-lite-preview')

    def _strip_code_block_and_whitespace(self, text: str) -> str:
        """Strip markdown code fences, leading/trailing whitespace, and language hints."""
        text = text.strip()

        # Remove markdown code fence wrapper
        if text.startswith('```') and text.endswith('```'):
            text = text[3:-3].strip()

        # If output starts with language hint like `python` or `json`, strip it
        lower = text.lstrip().lower()
        if lower.startswith('python') or lower.startswith('json'):
            # remove first token if it's exactly 'python' or 'json'
            text = text.split('\n', 1)[1].strip() if '\n' in text else ''

        # Remove explicit prefix text that includes context before JSON
        prefix_tokens = ['professional summary:', 'professional_summary:']
        for token in prefix_tokens:
            if text.lower().startswith(token):
                text = text[len(token):].strip()
                break

        return text

    def _normalize_keys(self, text: str) -> str:
        """Ensure the text is JSON-compatible (double quotes) when possible."""
        if "'" in text and '"' not in text:
            return text.replace("'", '"')
        return text

    def _extract_json(self, text: str) -> str:
        """Extract substring that looks like JSON object from noisy text."""
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            return text[start:end+1]
        return text

    async def send_message(self, message: str) -> Any:
        """Send a message to Gemini and return a parsed dict."""
        try:
            response = self.model.generate_content(message, generation_config=self.generation_config)
            return json.loads(response.text)
        except json.JSONDecodeError as e:
            raise Exception(f"Gemini returned invalid JSON: {e}\nRaw: {response.text[:200]}")
        except Exception as e:
            raise Exception(f"Failed to get response from Gemini: {str(e)}")


    async def generate_summary(self, profile_data: Dict) -> str:
        prompt = f"""
            You are a professional AI Resume Builder. 
            Generate a high-quality **professional summary** (max 3-4 impactful lines).
            Tailored to: {profile_data.get('headline', '')} and target title: {profile_data.get('title', '')}.
            Use bio: {profile_data.get('bio', '')}.
            Don't use exaggerating words like 'passionate' or 'highly motivated'.
            
            Return JSON in this format:
            {{
              "summary": "Impactful professional summary text here."
            }}
            """
        result = await self.send_message(prompt)
        return result.get("summary", "")

    async def generate_experience(self, experience_data: List[Dict], target_title: str) -> List[Dict]:
        prompt = f"""
            Refine the following professional experiences to align with the target role: {target_title}.
            Use strong action verbs and highlight results/impact.
            Return a list of experiences where each experience matches this JSON format:
            {{
              "job_title": "Position Name",
              "company": "Company Name",
              "dates": "Month Year - Month Year (or Present)",
              "responsibilities": ["Bullet point 1", "Bullet point 2"]
            }}
            
            Return JSON in this format:
            {{
              "experiences": [...]
            }}
            
            Experience data: {experience_data}
            """
        result = await self.send_message(prompt)
        if isinstance(result, dict) and "experiences" in result:
            return result["experiences"]
        return result if isinstance(result, list) else []

    async def generate_projects(self, project_data: List[Dict], target_title: str) -> List[Dict]:
        prompt = f"""
            Refine the following projects for the target role: {target_title}.
            Highlight role, tech stack, and outcomes.
            Return a list of projects where each project matches this JSON format:
            {{
              "project_name": "Project Name",
              "role": "Your Role",
              "dates": "Start - End",
              "technologies": ["Tech 1", "Tech 2"],
              "description": ["Bullet point 1", "Bullet point 2"]
            }}
            
            Return JSON in this format:
            {{
              "projects": [...]
            }}
            
            Project data: {project_data}
            """
        result = await self.send_message(prompt)
        if isinstance(result, dict) and "projects" in result:
            return result["projects"]
        return result if isinstance(result, list) else []

    async def generate_skills(self, skill_data: List[Dict], target_title: str) -> Dict[str, List[str]]:
        prompt = f"""
            Categorize and refine these skills for a {target_title} resume: {skill_data}.
            Return a JSON dictionary where keys are skill categories and values are lists of skills.
            Example: {{"Programming Languages": ["Python", "JS"], "Tools": ["Docker"]}}
            Only use skills provided in the data.
            """
        result = await self.send_message(prompt)
        return result if isinstance(result, dict) else {}

    async def generate_resume(self, profile_data: Dict) -> Any:
        title = profile_data.get("title", "Professional")
        
        # Parallel execution for independent sections
        import asyncio
        summary_task = self.generate_summary(profile_data)
        experience_task = self.generate_experience(profile_data.get("expriances", []), title)
        projects_task = self.generate_projects(profile_data.get("projects", []), title)
        skills_task = self.generate_skills(profile_data.get("skills", []), title)
        
        summary, experiences, projects, skills = await asyncio.gather(
            summary_task, experience_task, projects_task, skills_task
        )
        
        return {
            "professional_summary": summary,
            "professional_experience": experiences,
            "projects": projects,
            "skills": skills
        }


    async def generate_tags(self, user_id: str, title: TitleForAi) -> List[str]:
        prompt = f"""
            You are a professional AI Resume Builder. 
            Your task is to generate a list of relevant tags based on the user's  title and titles description.
            Return the output as string of comma separated tags.
            
            Here is the user's title and description:
            {title.title_name}
            {title.description}
            """
        result = await self.send_message(prompt)
        return result.split(",")
            