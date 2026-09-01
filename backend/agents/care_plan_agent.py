"""Care-Plan Agent: contextual, non-prescriptive next-step guidance.

Previously returned 3 hardcoded generic bullets for every user.
Now calls Gemini with the user's actual symptoms, severity, and history
to generate a specific, personalised response.
"""
from __future__ import annotations

from services.shared_memory import get_context, update_context


_CARE_PLAN_PROMPT = """You are a compassionate women's health assistant.
A user has reported the following health details:

Symptoms: {symptoms}
Severity: {severity}
Duration: {duration}
Cycle history available: {has_cycle_history}
Number of past lab reports: {report_count}
Additional flags: {flags}

Your task: Provide a personalised, actionable care plan for THIS specific situation.
Do NOT give generic advice like "record your symptoms" unless it is genuinely relevant.
Instead, respond directly to the symptoms and severity listed above.

Rules:
- Be warm, clear, and non-alarming unless severity warrants it.
- Do NOT diagnose or prescribe medication.
- If severity is severe or flags indicate urgency, strongly recommend seeing a doctor.
- Give 3-5 concrete, relevant steps the user can take RIGHT NOW.
- Mention when to seek professional care.
- Use plain language, no jargon.
- Do NOT repeat the same generic bullets every time.

Return ONLY a JSON object with exactly these keys:
{{
  "reply": "A warm, conversational summary paragraph addressing the user directly",
  "actions": ["step 1", "step 2", "step 3", ...],
  "seek_doctor": true or false,
  "urgency": "low" | "moderate" | "high",
  "disclaimer": "This is general wellness information, not a diagnosis or prescription."
}}
"""


def run(payload: dict) -> dict:
    user_id = payload.get("user_id") or payload.get("user_phone")
    if not user_id:
        return {"error": "user_id is required", "agent": "care_plan"}

    context = get_context(user_id)
    last_intake = context.get("last_intake", {})
    symptoms = last_intake.get("symptoms") or context.get("symptoms", [])
    severity = last_intake.get("severity", "unknown")
    duration = last_intake.get("duration", "not mentioned")
    flags = last_intake.get("flags", [])
    cycle_history = context.get("cycle_history", {})
    reports = context.get("report_history", [])

    # Flatten symptom list
    if isinstance(symptoms, list) and symptoms and isinstance(symptoms[0], dict):
        # Stored as list of intake dicts — extract the symptom strings
        all_syms = []
        for entry in symptoms:
            all_syms.extend(entry.get("symptoms", []))
        symptoms_str = ", ".join(all_syms) if all_syms else "not specified"
    elif isinstance(symptoms, list):
        symptoms_str = ", ".join(str(s) for s in symptoms) if symptoms else "not specified"
    else:
        symptoms_str = str(symptoms)

    prompt = _CARE_PLAN_PROMPT.format(
        symptoms=symptoms_str,
        severity=severity,
        duration=duration,
        has_cycle_history=bool(cycle_history),
        report_count=len(reports),
        flags=", ".join(flags) if flags else "none",
    )

    plan = None

    try:
        from services.gemini_client import call_gemini_structured
        result = call_gemini_structured(prompt)
        if isinstance(result, dict) and result.get("actions"):
            plan = {
                "agent": "care_plan",
                "stage": result.get("urgency", "general"),
                "reply": result.get("reply", ""),
                "actions": result["actions"],
                "seek_doctor": result.get("seek_doctor", False),
                "urgency": result.get("urgency", "low"),
                "context_used": {
                    "symptoms": symptoms_str,
                    "severity": severity,
                    "symptom_count": len(symptoms) if isinstance(symptoms, list) else 1,
                    "has_cycle_history": bool(cycle_history),
                    "report_count": len(reports),
                },
                "disclaimer": result.get(
                    "disclaimer",
                    "This is general wellness information, not a diagnosis or prescription.",
                ),
            }
    except Exception:
        pass

    # Fallback: rule-based responses if Gemini fails
    if plan is None:
        actions = _rule_based_plan(symptoms_str, severity, flags)
        plan = {
            "agent": "care_plan",
            "stage": "general wellness information",
            "actions": actions,
            "seek_doctor": severity in ("severe", "moderate"),
            "urgency": "high" if severity == "severe" else "low",
            "context_used": {
                "symptoms": symptoms_str,
                "severity": severity,
                "symptom_count": len(symptoms) if isinstance(symptoms, list) else 1,
                "has_cycle_history": bool(cycle_history),
                "report_count": len(reports),
            },
            "disclaimer": "This is general wellness information, not a diagnosis or prescription.",
        }

    update_context(user_id, {"care_plans": [plan]})
    return plan


def _rule_based_plan(symptoms_str: str, severity: str, flags: list) -> list[str]:
    """Symptom-aware fallback when Gemini is unavailable."""
    lowered = symptoms_str.lower()
    actions = []

    if severity == "severe" or any(f in flags for f in ("severe_abdominal_pain", "severe_pain_or_fainting_or_heavy_bleeding")):
        actions.append("Your symptoms sound serious — please visit a doctor or clinic today, or call emergency services if the pain is unbearable.")

    if "heavy_bleeding" in flags or "heavy" in lowered or "bleed" in lowered:
        actions.append("Track how many pads/tampons you are using per hour. If soaking more than one pad per hour for 2+ hours, go to a hospital immediately.")

    if "cramp" in lowered or "pain" in lowered:
        actions.append("Apply a heat pad or hot water bottle to your lower abdomen for 15–20 minutes to ease cramping.")
        actions.append("Over-the-counter pain relief like ibuprofen (if not contraindicated) can help with menstrual cramps — take with food.")

    if "missed_period" in flags or "missed" in lowered:
        actions.append("A missed period can have many causes. Consider taking a pregnancy test if applicable, and see a doctor if it continues for more than 2 months.")

    if "mood" in lowered or "anxiety" in lowered or "anxious" in lowered:
        actions.append("Mood changes around your cycle are common. Light exercise, adequate sleep, and reducing caffeine can help ease PMS-related mood swings.")

    if "nausea" in lowered or "vomit" in lowered:
        actions.append("Sip ginger tea or plain water slowly. Eat small, bland meals. If vomiting persists, consult a doctor.")

    if not actions:
        actions = [
            "Rest and stay hydrated. Monitor how your symptoms change over the next 24 hours.",
            "Keep a note of your symptoms, their timing, and severity to share with a doctor if needed.",
            "If symptoms worsen, last longer than expected, or feel unusual for you, consult a qualified clinician.",
        ]

    return actions
