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
- high_fever
- fainting_or_dizziness
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
    """
    prompt = INTAKE_PROMPT.format(user_message=user_message)
    structured = None

    try:
        res = call_gemini_structured(prompt)
        # Ensure returned object is actually a dictionary before using it
        if isinstance(res, dict):
            structured = res
        else:
            print(f"INTAKE WARNING: Gemini returned non-dict payload: {type(res)}")
    except Exception as e:
        print("INTAKE ERROR:", e)

    # Safe fallback if Gemini fails, raises an exception, or returns invalid types
    if not structured:
        structured = {
            "symptoms": [user_message] if user_message else [],
            "duration": "",
            "severity": "unknown",
            "flags": [],
        }

    # Ensure required fields exist even if Gemini omitted them
    structured.setdefault("symptoms", [])
    structured.setdefault("duration", "")
    structured.setdefault("severity", "unknown")
    structured.setdefault("flags", [])

    # Attach tracking fields safely
    structured["user_phone"] = user_phone
    structured["raw_message"] = user_message

    return structured