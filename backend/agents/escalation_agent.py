"""
escalation_agent.py — safety-critical red-flag detection and real SMS escalation.
See /docs/PRD.md §4.6, §7 for this agent's role and safety model.
"""

import json
import os
from pathlib import Path

from services.textbee_client import send_sms
from services.maps_client import get_nearest_hospital

RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "red_flag_table.json"

HELPLINE_LABELS = {
    "112": "National Emergency: 112",
    "181": "Women Helpline: 181",
    "14416": "Tele-MANAS (Mental Health): 14416",
    "1098": "Child Helpline: 1098",
}


def _load_rules() -> list[dict]:
    with open(RULES_PATH) as f:
        return json.load(f)["rules"]


def check_red_flags(structured_symptoms: dict) -> dict | None:
    """
    Compares the structured symptom flags against the red-flag rule table.
    This is a plain rule lookup, NOT an LLM judgment call — see PRD §8.1 on
    why safety-critical thresholds must be auditable, not model-inferred.

    Returns the first matching "urgent" rule, or None if nothing matches.
    """
    flags = set(structured_symptoms.get("flags", []))
    for rule in _load_rules():
        if rule["escalation_level"] != "urgent":
            continue
        if flags.intersection(rule["conditions"]):
            return rule
    return None


def _build_sms_body(rule: dict, hospital: dict | None) -> str:
    helpline_lines = [HELPLINE_LABELS.get(h, h) for h in rule["helplines"]]
    lines = [
        "This is an automated alert from your women's health app.",
        "Your recent check-in included symptoms that may need urgent attention.",
        "Please contact:",
        *helpline_lines,
    ]
    if hospital:
        lines.append(f"Nearest hospital: {hospital['name']} — {hospital['maps_link']}")
    lines.append("If this is a life-threatening emergency, call 112 immediately.")
    return "\n".join(lines)


def run(structured_symptoms: dict, user_location: dict | None = None) -> dict:
    """
    Checks for red flags and, if found, fires a REAL SMS (via textbee.dev) immediately.

    Per PRD §7.4: the helpline SMS always sends immediately regardless of
    location availability. The hospital map link is additive and NEVER
    blocks or delays the message.

    Args:
        structured_symptoms: output from intake_agent.run() — must include "flags"
                              and "user_phone"
        user_location: optional dict with "lat"/"lng", or None if unavailable/not consented

    Returns:
        dict with "escalated": bool, and if True, the rule matched, helplines
        notified, hospital info (if found), and the SMS send result.
    """
    matched_rule = check_red_flags(structured_symptoms)
    if not matched_rule:
        return {"escalated": False}

    # Hospital lookup is best-effort and must never block/delay the SMS (PRD §7.4).
    hospital = None
    try:
        hospital = get_nearest_hospital(user_location) if user_location else None
    except Exception:
        hospital = None

    sms_body = _build_sms_body(matched_rule, hospital)

    sms_result = None
    sms_error = None
    try:
        sms_result = send_sms(to=structured_symptoms["user_phone"], body=sms_body)
    except Exception as e:
        # Never crash the request if SMS delivery fails (e.g. linked Android
        # device offline) — log it so the team can see it happened.
        sms_error = str(e)

    return {
        "escalated": True,
        "rule_id": matched_rule["id"],
        "helplines": matched_rule["helplines"],
        "hospital": hospital,
        "sms_result": sms_result,
        "sms_error": sms_error,
    }
