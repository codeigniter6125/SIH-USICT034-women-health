"""
intake_agent.py — first-contact structured data collection.
See /docs/PRD.md §4.2 for this agent's role.
"""

from services.gemini_client import call_gemini_structured

INTAKE_PROMPT = """You are a medical intake assistant for a women's health app.
Extract structured symptom data from the user's message below. Respond with ONLY
a JSON object in this exact shape, no other text:

{{
  "symptoms": ["string", ...],
  "duration": "string describing how long, or empty string if not mentioned",
  "severity": "mild" | "moderate" | "severe" | "unknown",
  "flags": ["string", ...]
}}

For "flags", use ONLY these exact tags where they clearly apply, based on the message.
Do not invent tags not in this list. Leave "flags" empty if none apply:
- severe_abdominal_pain
- heavy_bleeding
- missed_period
- severe_pain_or_fainting_or_heavy_bleeding
- bleeding_duration_gt_7_days
- suicidal_ideation
- severe_distress
- self_harm
- signs_of_abuse
- signs_of_violence
- user_is_minor
- mild_cramping
- typical_pms_symptoms
- single_missed_period_no_other_symptoms

User message: "{user_message}"
"""


def run(user_message: str, user_phone: str) -> dict:
    """
    Structures a free-text symptom message into a dict the Orchestrator and
    Escalation Agent can act on.

    Args:
        user_message: raw text from the user (already transcribed if it was voice)
        user_phone: the user's phone number, attached for downstream escalation SMS

    Returns:
        dict with symptoms, duration, severity, flags, and user_phone.
        Falls back to a safe "unknown" structure if the LLM call fails, rather
        than crashing the whole request — a failed intake should never silently
        skip the escalation check downstream.
    """
    prompt = INTAKE_PROMPT.format(user_message=user_message)

    try:
        structured = call_gemini_structured(prompt)
    except Exception:
        # Fail safe: if structuring fails, still let Escalation Agent see
        # something rather than crash. It won't match specific red flags,
        # but this prevents a silent failure from skipping the safety check.
        structured = {
            "symptoms": [user_message],
            "duration": "",
            "severity": "unknown",
            "flags": [],
        }

    structured["user_phone"] = user_phone
    structured["raw_message"] = user_message
    return structured
