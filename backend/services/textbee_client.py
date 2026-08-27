"""
textbee_client.py — sends real SMS via textbee.dev for escalation alerts.
textbee turns a real Android phone into an SMS gateway — free tier (50/day, 300/month),
no credit card, and no verified-recipient allowlist (unlike Twilio's trial tier).
Credentials loaded from environment variables (see /docs/setup_environment_credentials.md).
"""

import os
import requests

SEND_SMS_URL = "https://api.textbee.dev/api/v1/gateway/send-sms"


def send_sms(to: str, body: str) -> dict:
    """
    Sends a real SMS via textbee.dev.

    Args:
        to: recipient phone number in E.164 format, e.g. "+91XXXXXXXXXX"
        body: message text

    Returns:
        dict with the textbee response data, for logging to Shared Memory.

    Raises:
        RuntimeError if TEXTBEE_API_KEY is missing.
        requests.HTTPError on send failure (e.g. linked Android device offline) —
        the caller should catch this and log it, since the escalation flow should
        not crash even if the SMS fails to send.
    """
    api_key = os.environ.get("TEXTBEE_API_KEY")
    if not api_key:
        raise RuntimeError("TEXTBEE_API_KEY not set. Check backend/.env.")

    response = requests.post(
        SEND_SMS_URL,
        json={"recipients": [to], "message": body},
        headers={"x-api-key": api_key, "Content-Type": "application/json"},
        timeout=10,
    )
    response.raise_for_status()

    return {"provider": "textbee", "to": to, "response": response.json()}
