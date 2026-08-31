"""
gemini_client.py — wraps Gemini API calls, prompting for structured JSON output.
Credentials loaded from environment variables (see /docs/setup_environment_credentials.md).

IMPORTANT: This key must be linked to an UNBILLED Google Cloud project
("Default Gemini Project" in AI Studio) — see /docs/tech_stack.md §2b.
"""

import os
import json

try:
    import google.generativeai as genai  
except ImportError:  # Allows local rule-based tests without optional LLM dependencies.
    genai = None

_configured = False
MODEL_NAME = "gemini-1.5-flash"


def _ensure_configured():
    global _configured
    if genai is None:
        raise RuntimeError("google-generativeai is not installed")
    if not _configured:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set. Check backend/.env.")
        genai.configure(api_key=api_key)
        _configured = True


def call_gemini_structured(prompt: str) -> dict:
    """
    Sends a prompt to Gemini and expects a JSON object back.
    """
    _ensure_configured()

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
            request_options={"timeout": 10},
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:].strip()

        return json.loads(text)
    except Exception as exc:
        # If gemini-1.5-flash is not found or fails, try gemini-2.0-flash
        try:
            fallback_model = genai.GenerativeModel("gemini-2.0-flash")
            response = fallback_model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 10},
            )
            text = response.text.strip()
            if text.startswith("```"):
                text = text.strip("`")
                if text.startswith("json"):
                    text = text[4:].strip()
            return json.loads(text)
        except Exception:
            raise exc
