"""Care-Plan Agent: contextual, non-prescriptive next-step guidance."""
from __future__ import annotations

from services.shared_memory import get_context, update_context


def run(payload: dict) -> dict:
    user_id = payload.get("user_id") or payload.get("user_phone")
    if not user_id:
        return {"error": "user_id is required", "agent": "care_plan"}
    context = get_context(user_id)
    symptoms = context.get("symptoms", [])
    cycle_history = context.get("cycle_history", {})
    reports = context.get("report_history", [])
    plan = {
        "agent": "care_plan",
        "stage": "general wellness information",
        "actions": [
            "Record bleeding dates, duration, flow, pain level, and related symptoms.",
            "Review patterns over multiple cycles rather than relying on one prediction.",
            "Discuss persistent, severe, unusual, or activity-limiting symptoms with a qualified clinician.",
        ],
        "context_used": {"symptom_count": len(symptoms), "has_cycle_history": bool(cycle_history), "report_count": len(reports)},
        "needs_doctor_review": bool(reports),
        "disclaimer": "This is general wellness information, not a diagnosis or prescription.",
    }
    update_context(user_id, {"care_plans": [plan]})
    return plan
