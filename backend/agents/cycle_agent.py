"""Cycle Agent with lightweight RAG over public menstrual-health guidance,
real deterministic cycle-day math, and awareness of Report-Reader findings.
"""
from __future__ import annotations

from services.cycle_math import compute_cycle_state
from services.cycle_rag import citation_list, format_context, retrieve
from services.shared_memory import get_context, update_context


def _fallback_reply(message: str, chunks: list[dict]) -> str:
    if not chunks:
        return (
            "I can help you record cycle information, but my guidance library is not "
            "available right now. Please consider speaking with a qualified clinician."
        )
    sources = " ".join(f"[{i}]" for i in range(1, len(chunks) + 1))
    return (
        "I can help you track patterns, but this is general health information and "
        "not a diagnosis. Menstrual symptoms that are severe, unusually heavy, "
        "unpredictable, or disrupting normal activities should be discussed with a "
        f"health professional. Based on the retrieved public guidance {sources}, "
        "please keep a record of bleeding dates, duration, flow, pain, and other "
        "symptoms so a clinician can review the pattern. If you have immediate or "
        "life-threatening symptoms, contact local emergency services now."
    )


def _relevant_report_flags(report_history: list[dict]) -> list[str]:
    """
    Pulls out report findings that are specifically relevant to cycle
    guidance (e.g. low hemoglobin relevant to heavy-bleeding-driven anemia,
    abnormal TSH relevant to cycle irregularity). This is the piece that was
    previously missing entirely — Report-Reader results never reached the
    Cycle Agent, so the two felt disconnected in the UI.
    """
    flags = []
    for report in report_history[-3:]:  # most recent few reports only
        for finding in report.get("findings", []):
            test = str(finding.get("test", "")).lower()
            try:
                value = float(str(finding.get("value", "")).replace("<", "").replace(">", "").strip())
            except (ValueError, TypeError):
                continue
            if "hemoglobin" in test and value < 12.0:
                flags.append(f"Low hemoglobin ({value}) noted in a recent report — relevant if periods are heavy.")
            if "tsh" in test and (value < 0.4 or value > 4.0):
                flags.append(f"Thyroid (TSH={value}) outside typical range in a recent report — thyroid issues can affect cycle regularity.")
    return flags


def run(payload: dict) -> dict:
    """Run Cycle Agent: real cycle-day math + RAG-grounded guidance + report awareness.

    Expected payload keys: ``message``, optional ``cycle_history`` (dict with
    "period_start_dates": list[str]), and ``language``.
    """
    message = (payload.get("message") or "").strip()
    user_id = payload.get("user_id") or payload.get("user_phone")
    context = get_context(user_id) if user_id else {}

    cycle_history = payload.get("cycle_history") or context.get("cycle_history", {})
    period_start_dates = cycle_history.get("period_start_dates", []) if isinstance(cycle_history, dict) else []
    cycle_state = compute_cycle_state(period_start_dates)

    report_history = context.get("report_history", [])
    report_flags = _relevant_report_flags(report_history)

    chunks = retrieve(message, top_k=4) if message else []
    response = _fallback_reply(message, chunks) if message else (
        f"You're on day {cycle_state['cycle_day']} of your cycle ({cycle_state['phase']} phase)."
        if cycle_state.get("has_data") else "Log a period start date to begin cycle tracking."
    )

    try:
        from services.gemini_client import call_gemini_structured

        if message:
            prompt = f"""You are the Cycle Agent for a women's health app.
Answer the user's question using ONLY the retrieved public guidance below,
plus the computed cycle state and any relevant recent report findings.
Do not diagnose, prescribe, or claim certainty. Explain what to track and when to
seek professional care. Use the requested language: {payload.get('language', 'English')}.
Return JSON with exactly these keys: reply (string), safety_note (string),
follow_up_questions (array of strings), sources (array of integers).
User question: {message}
Computed cycle state: {cycle_state}
Relevant recent report findings: {report_flags}
Retrieved guidance:\n{format_context(chunks) if chunks else '(none retrieved)'}"""
            grounded = call_gemini_structured(prompt)
            if isinstance(grounded, dict) and grounded.get("reply"):
                response = grounded["reply"]
    except Exception:
        # Retrieval and cycle math still work even when Gemini is unavailable.
        pass

    if user_id:
        update_context(user_id, {
            "cycle_history": cycle_history,
            "cycle_state": cycle_state,
            "last_cycle_interaction": {"message": message, "sources": citation_list(chunks)},
        })

    return {
        "reply": response,
        "agent": "cycle",
        "cycle_state": cycle_state,
        "report_flags": report_flags,
        "retrieval_used": bool(chunks),
        "sources": citation_list(chunks),
        "disclaimer": "Educational information only; not a diagnosis or substitute for clinical care.",
    }
