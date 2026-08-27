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
    try:
        with open(RULES_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("rules", [])
    except Exception as e:
        print(f"ERROR: Failed to load red flag rules from {RULES_PATH}: {e}")
        return []


def check_red_flags(structured_symptoms: dict) -> dict | None:
    """
    Compares the structured symptom flags against the red-flag rule table.
    This is a plain rule lookup, NOT an LLM judgment call.

    Returns the first matching "urgent" rule, or None if nothing matches.
    """
    flags = set(structured_symptoms.get("flags", []))
    rules = _load_rules()
    
    for rule in rules:
        if rule.get("escalation_level") != "urgent":
            continue
        if flags.intersection(rule.get("conditions", [])):
            return rule
    return None


def _build_sms_body(rule: dict, hospital: dict | None) -> str:
    helpline_lines = [HELPLINE_LABELS.get(h, h) for h in rule.get("helplines", [])]
    lines = [
        "This is an automated alert from your women's health app.",
        "Your recent check-in included symptoms that may need urgent attention.",
        "Please contact:",
        *helpline_lines,
    ]
    if hospital and hospital.get("maps_link"):
        lines.append(f"Nearest hospital: {hospital['name']}")
        lines.append(hospital["maps_link"])

    lines.append("If this is a life-threatening emergency, call 112 immediately.")
    return "\n".join(lines)


def run(structured_symptoms: dict, user_location: dict | None = None) -> dict:
    """
    Checks for red flags and, if found, fires a REAL SMS (via textbee.dev) immediately.

    Args:
        structured_symptoms: output from intake_agent.run() — must include "flags"
                              and "user_phone"
        user_location: optional dict with "lat"/"lng", or None if unavailable/not consented

    Returns:
        dict with "escalated": bool, and execution status details.
    """
    matched_rule = check_red_flags(structured_symptoms)
    if not matched_rule:
        return {"escalated": False}

    # Hospital lookup is best-effort and must never block/delay the SMS (PRD §7.4).
    hospital = None
    try:
        hospital = get_nearest_hospital(user_location) if user_location else None
    except Exception as e:
        print(f"WARNING: Hospital lookup failed safely: {e}")
        hospital = None

    sms_body = _build_sms_body(matched_rule, hospital)

    sms_result = None
    sms_error = None
    user_phone = structured_symptoms.get("user_phone")

    if user_phone:
        try:
            sms_result = send_sms(to=user_phone, body=sms_body)
        except Exception as e:
            # Never crash the request if SMS delivery fails
            sms_error = str(e)
            print(f"ERROR: Failed to send SMS to {user_phone}: {sms_error}")
    else:
        sms_error = "No user_phone key provided in structured_symptoms."
        print(f"ERROR: {sms_error}")

    return {
        "escalated": True,
        "rule_id": matched_rule.get("id"),
        "helplines": matched_rule.get("helplines", []),
        "hospital": hospital,
        "sms_result": sms_result,
        "sms_error": sms_error,
    }