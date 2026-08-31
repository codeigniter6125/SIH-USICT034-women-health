"""
orchestrator.py — single entry point for user input, routes to specialist agents.
See /docs/PRD.md §4.1 for this agent's role.

Current build phase (per /docs/tech_stack.md §6): Orchestrator -> Intake -> Escalation
only. Cycle, Report-Reader, and Care-Plan agents are added in the next build phase.
"""

from agents import care_plan_agent, cycle_agent, intake_agent, escalation_agent, report_reader_agent


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

        # Step 3: Route only after each agent's isolated tests pass.
    lowered = user_message.lower()
    if payload.get("ocr_text") or payload.get("file_path") or any(word in lowered for word in ("report", "lab result", "hemoglobin", "thyroid")):
        result = report_reader_agent.run({
            "user_id": user_phone,
            "ocr_text": payload.get("ocr_text"),
            "file_path": payload.get("file_path"),
        })
    elif any(word in lowered for word in ("care plan", "what should i do", "next steps", "self care")):
        result = care_plan_agent.run({"user_id": user_phone})
    else:
        result = cycle_agent.run({
            "user_id": user_phone,
            "message": user_message,
            "cycle_history": payload.get("cycle_history", {}),
            "language": payload.get("language", "English"),
        })

    if "reply" not in result:
        if result.get("error"):
            result["reply"] = result["error"]
        elif result.get("agent") == "care_plan" and result.get("actions"):
            result["reply"] = (
                "Here's some general guidance based on what you've shared:\n\n"
                + "\n".join(f"• {a}" for a in result["actions"])
                + f"\n\n{result.get('disclaimer', '')}"
            ).strip()
        elif result.get("agent") == "report_reader" and result.get("findings") is not None:
            findings = result["findings"]
            if findings:
                lines = [f"• {f.get('test', '?')}: {f.get('value', '?')} {f.get('unit', '')}".strip() for f in findings[:10]]
                result["reply"] = (
                    "Here's what I found in your report:\n\n" + "\n".join(lines)
                    + f"\n\n{result.get('interpretation', '')}"
                ).strip()
            else:
                result["reply"] = "I couldn't extract specific values from that report — please try a clearer photo, or share the values as text."
        else:
            result["reply"] = "Thanks — I've noted this."

    return {
        **result,
        "escalation": escalation_result,
        "structured": structured,
    }