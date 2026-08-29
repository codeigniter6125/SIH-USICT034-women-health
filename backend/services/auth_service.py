"""Authentication helpers for Firebase Phone/OTP sessions.

The frontend should complete Firebase Phone/OTP login and send the resulting ID
token as ``Authorization: Bearer <token>``. Local development may use a
signed demo token when Firebase Admin credentials are not configured.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any


def _secret() -> bytes:
    return os.getenv("AUTH_DEMO_SECRET", "local-development-only-change-me").encode()


def create_demo_token(user_id: str, ttl_seconds: int = 3600) -> str:
    payload = {"uid": user_id, "exp": int(time.time()) + ttl_seconds}
    raw = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(_secret(), raw.encode(), hashlib.sha256).hexdigest()
    return f"demo.{raw}.{signature}"


def verify_token(token: str) -> dict[str, Any]:
    if token.startswith("demo."):
        _, raw, signature = token.split(".", 2)
        expected = hmac.new(_secret(), raw.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("invalid demo token")
        payload = json.loads(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
        if payload.get("exp", 0) < time.time():
            raise ValueError("expired demo token")
        return {"uid": payload["uid"], "provider": "demo"}
    try:
        import firebase_admin
        from firebase_admin import auth, credentials
        if not firebase_admin._apps:
            credentials_path = os.getenv("FIREBASE_ADMIN_CREDENTIALS")
            if credentials_path:
                firebase_admin.initialize_app(credentials.Certificate(credentials_path))
            else:
                firebase_admin.initialize_app()
        decoded = auth.verify_id_token(token)
        return {"uid": decoded["uid"], "provider": "firebase", "claims": decoded}
    except Exception as exc:
        raise ValueError("Firebase token could not be verified") from exc
