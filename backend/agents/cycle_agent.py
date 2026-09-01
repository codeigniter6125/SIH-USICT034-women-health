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
            prompt = f"""You are the Cycle Agent for a women's health app. A user has asked a specific question.

USER'S QUESTION: {message}

User's cycle history (if any): {cycle_history}

Retrieved public guidance for reference:
{format_context(chunks)}

Your job: Answer the user's SPECIFIC question directly and concisely.
- Address exactly what the user asked — do NOT give generic advice unrelated to their question.
- If they describe a symptom, explain what it could mean and what they can do about it.
- If they ask about timing, give specific day ranges or patterns.
- Be warm and conversational, not clinical.
- Mention when to see a doctor if genuinely relevant.
- Do NOT diagnose or prescribe.
- Language to use: {payload.get('language', 'English')}

Return JSON with exactly these keys:
{{
  "reply": "Direct, specific answer to the user's question (2-4 sentences minimum)",
  "safety_note": "When to seek professional care, if relevant (empty string if not needed)",
  "follow_up_questions": ["relevant follow-up question 1", "question 2"],
  "sources": [list of source index numbers used, e.g. [1, 2]]
}}"""
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
