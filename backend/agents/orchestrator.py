"""
orchestrator.py — single entry point for user input, routes to specialist agents.
See /docs/PRD.md §4.1 for this agent's role.

Current build phase (per /docs/tech_stack.md §6): Orchestrator -> Intake -> Escalation
only. Cycle, Report-Reader, and Care-Plan agents are added in the next build phase.
"""

from agents import cycle_agent, intake_agent, escalation_agent


def route_request(payload: dict) -> dict:
    """
    Main entry point called by the FastAPI /api/chat endpoint.

    Args:
        payload: dict with:
            "message": str — the user's text (already transcribed if voice)
            "user_phone": str — E.164 format phone number, e.g. "+91XXXXXXXXXX"
            "location": optional dict with "lat"/"lng", or omitted/None

    Returns:
        dict with a "reply" for the user, plus "escalation" and/or "structured"
        details for logging to Shared Memory.
    """
    user_message = payload.get("message", "")
    user_phone = payload.get("user_phone")
    user_location = payload.get("location")

    if not user_message or not user_phone:
        return {"reply": "Missing required fields: message and user_phone.", "error": True}

    # Step 1: Intake Agent always structures the raw input first.
    structured = intake_agent.run(user_message, user_phone)

    # Step 2: Escalation check runs on EVERY turn, before any routine routing —
    # this is the cross-cutting safety layer described in PRD §7.
    escalation_result = escalation_agent.run(structured, user_location)

    if escalation_result["escalated"]:
        return {
            "reply": (
                "I've noticed something that may need urgent attention. "
                "I've sent you an SMS with helpline information and next steps. "
                "Please reach out to one of those numbers right away."
            ),
            "escalation": escalation_result,
            "structured": structured,
        }

    # Step 3: Routine path. Route cycle-related questions to the RAG-enabled Cycle Agent.
    cycle_result = cycle_agent.run({
        "message": user_message,
        "cycle_history": payload.get("cycle_history", {}),
        "language": payload.get("language", "English"),
    })
    return {
        "reply": cycle_result["reply"],
        "agent": cycle_result["agent"],
        "retrieval_used": cycle_result["retrieval_used"],
        "sources": cycle_result["sources"],
        "disclaimer": cycle_result["disclaimer"],
        "escalation": escalation_result,
        "structured": structured,
    }
