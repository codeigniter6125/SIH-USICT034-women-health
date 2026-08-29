"""Cycle Agent with lightweight RAG over public menstrual-health guidance."""
from __future__ import annotations

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


def run(payload: dict) -> dict:
    """Run Cycle Agent RAG.

    Expected payload keys: ``message``, optional ``cycle_history`` and ``language``.
    The LLM is optional; retrieval and citations remain available without a key.
    """
    message = (payload.get("message") or "").strip()
    user_id = payload.get("user_id") or payload.get("user_phone")
    context = get_context(user_id) if user_id else {}
    cycle_history = payload.get("cycle_history") or context.get("cycle_history", {})
    chunks = retrieve(message, top_k=4)
    response = _fallback_reply(message, chunks)

    try:
        from services.gemini_client import call_gemini_structured

        if chunks:
            prompt = f"""You are the Cycle Agent for a women's health app.
Answer the user's question using ONLY the retrieved public guidance below.
Do not diagnose, prescribe, or claim certainty. Explain what to track and when to
seek professional care. Use the requested language: {payload.get('language', 'English')}.
Return JSON with exactly these keys: reply (string), safety_note (string),
follow_up_questions (array of strings), sources (array of integers).
User question: {message}
Cycle history, if provided: {cycle_history}
Retrieved guidance:\n{format_context(chunks)}"""
            grounded = call_gemini_structured(prompt)
            if isinstance(grounded, dict) and grounded.get("reply"):
                response = grounded["reply"]
    except Exception:
        # Retrieval still works when Gemini is unavailable or not configured.
        pass

    if user_id:
        update_context(user_id, {"cycle_history": cycle_history, "last_cycle_interaction": {"message": message, "sources": citation_list(chunks)}})

    return {
        "reply": response,
        "agent": "cycle",
        "retrieval_used": bool(chunks),
        "sources": citation_list(chunks),
        "disclaimer": "Educational information only; not a diagnosis or substitute for clinical care.",
    }
