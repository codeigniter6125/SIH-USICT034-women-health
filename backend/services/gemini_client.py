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
MODEL_NAME = "gemini-3.5-flash"
FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
]


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

    for m_name in [MODEL_NAME, *FALLBACK_MODELS]:
        try:
            model = genai.GenerativeModel(m_name)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 10},
            )
            raw_text = response.text.strip()
            # Strip markdown ```json ``` markers if present
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                raw_text = "\n".join(lines[1:-1]).strip()
            return json.loads(raw_text)
        except Exception as e:
            continue

    raise RuntimeError("All Gemini models failed to respond.")
