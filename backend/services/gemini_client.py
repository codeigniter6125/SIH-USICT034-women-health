"""
gemini_client.py — wraps Gemini API calls using the new google-genai SDK.
Credentials loaded from environment variables (see /docs/setup_environment_credentials.md).

Migrated from deprecated google-generativeai to google-genai (google.genai).
"""

import os
import json

try:
    from google import genai
    from google.genai import types
    _SDK_AVAILABLE = True
except ImportError:
    genai = None
    types = None
    _SDK_AVAILABLE = False

_client = None

# Valid model names confirmed via client.models.list()
MODEL_NAME = "gemini-3.5-flash"
FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest",
]


def _get_client():
    global _client
    if not _SDK_AVAILABLE:
        raise RuntimeError("google-genai is not installed. Run: pip install google-genai")
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set. Check backend/.env.")
        _client = genai.Client(api_key=api_key)
    return _client


def call_gemini_structured(prompt: str) -> dict:
    """
    Sends a prompt to Gemini and expects a JSON object back.
    Tries primary model then falls back to alternatives.
    """
    client = _get_client()

    for m_name in [MODEL_NAME, *FALLBACK_MODELS]:
        try:
            response = client.models.generate_content(
                model=m_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4,
                ),
            )
            raw_text = response.text.strip()
            # Strip markdown ```json ``` markers if present
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                raw_text = "\n".join(lines[1:-1]).strip()
            return json.loads(raw_text)
        except Exception:
            continue

    raise RuntimeError("All Gemini models failed to respond.")


def call_gemini_text(prompt: str) -> str:
    """
    Sends a prompt to Gemini and returns a plain text response.
    Used when free-form text (not JSON) is needed.
    """
    client = _get_client()

    for m_name in [MODEL_NAME, *FALLBACK_MODELS]:
        try:
            response = client.models.generate_content(
                model=m_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4,
                ),
            )
            return response.text.strip()
        except Exception:
            continue

    raise RuntimeError("All Gemini models failed to respond.")
