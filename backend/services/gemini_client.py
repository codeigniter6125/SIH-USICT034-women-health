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
MODEL_NAME = "gemini-3.6-flash"


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

    Args:
        prompt: the full prompt text, should explicitly ask the model to
                 return ONLY valid JSON (no markdown fences, no preamble).

    Returns:
        Parsed dict from the model's JSON response.

    Raises:
        RuntimeError if GEMINI_API_KEY is missing.
        json.JSONDecodeError if the model didn't return valid JSON (caller
        should catch this and handle gracefully rather than crash the agent).
    """
    _ensure_configured()

    model = genai.GenerativeModel(MODEL_NAME)
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )

    text = response.text.strip()
    # Defensive: strip markdown code fences if the model adds them anyway.
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()

    return json.loads(text)
