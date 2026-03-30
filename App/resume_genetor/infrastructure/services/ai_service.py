import os
import json
import google.generativeai as genai
from typing import Optional, Dict, Any
from App.resume_genetor.domain.interfaces.ai_service_interface import AiServiceInterface


class AiService(AiServiceInterface):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

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
        """Send a message to Gemini and return a dict if possible, else raw text."""
        try:
            response = self.model.generate_content(message)
            text = self._strip_code_block_and_whitespace(response.text)

            # If the model returns context + chunk + JSON, try to extract JSON substring
            candidate_text = self._extract_json(text)

            # Try strict JSON first
            for attempt in [candidate_text, text]:
                try:
                    return json.loads(attempt)
                except json.JSONDecodeError:
                    pass

            # Try json with single quote normalization to handle python-style dicts
            for attempt in [candidate_text, text]:
                normalized_text = self._normalize_keys(attempt)
                try:
                    return json.loads(normalized_text)
                except json.JSONDecodeError:
                    pass

            # Finally fallback to Python literal eval for dict-like objects
            try:
                import ast
                evaluated = ast.literal_eval(candidate_text)
                if isinstance(evaluated, dict):
                    return evaluated
            except Exception:
                pass

            try:
                import ast
                evaluated = ast.literal_eval(text)
                if isinstance(evaluated, dict):
                    return evaluated
            except Exception:
                pass

            return text
        except Exception as e:
            raise Exception(f"Failed to get response from Gemini: {str(e)}")


    async def generate_professional_summary(self, profile_data: Dict) -> Any:

        print(profile_data)
        prompt=f"""You Are Ai Assistant and help users to build their resume.
          Generate a professional summary that does not exceed 4-5 lines based on user profile data. and on a given title if exist. 
          The summary should be concise, impactful, and tailored to the user's experience and skills. 
          Since User does not directly engage just one version not A or B.
          And also there is skills so take relevent skills to the title.
          output format is python dictionary with one key "professional_summary" and the value is the summary. and the output of skills is  as given
          Use the following profile data to create the summary: {profile_data}"""
        return await self.send_message(prompt)