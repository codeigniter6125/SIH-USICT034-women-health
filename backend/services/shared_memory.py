"""Shared patient context store.

Uses Firestore when FIREBASE_ADMIN_CREDENTIALS is configured; otherwise uses an
in-memory adapter for local development and isolated agent tests.
"""
from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

_MEMORY: dict[str, dict[str, Any]] = {}
_FIRESTORE = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _firestore_client():
    global _FIRESTORE
    if _FIRESTORE is not None:
        return _FIRESTORE
    credentials_path = os.getenv("FIREBASE_ADMIN_CREDENTIALS")
    if not credentials_path:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(credentials_path))
        _FIRESTORE = firestore.client()
        return _FIRESTORE
    except Exception:
        return None


def get_context(user_id: str) -> dict[str, Any]:
    client = _firestore_client()
    if client:
        doc = client.collection("patient_context").document(user_id).get()
        return doc.to_dict() or {"user_id": user_id}
    return deepcopy(_MEMORY.get(user_id, {"user_id": user_id}))


def update_context(user_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    context = get_context(user_id)
    for key, value in patch.items():
        if isinstance(value, list) and isinstance(context.get(key), list):
            context[key] = context[key] + deepcopy(value)
        elif isinstance(value, dict) and isinstance(context.get(key), dict):
            context[key] = {**context[key], **deepcopy(value)}
        else:
            context[key] = deepcopy(value)
    context["user_id"] = user_id
    context["updated_at"] = _now()
    client = _firestore_client()
    if client:
        client.collection("patient_context").document(user_id).set(context, merge=True)
    else:
        _MEMORY[user_id] = deepcopy(context)
    return context


def clear_memory_for_tests() -> None:
    _MEMORY.clear()
