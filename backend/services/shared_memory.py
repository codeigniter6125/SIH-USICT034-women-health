"""Shared patient context store with persistent disk backup and optional Firestore sync."""
from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
STORE_FILE = DATA_DIR / "patient_context_store.json"

_MEMORY: dict[str, dict[str, Any]] = {}
_FIRESTORE = None


def _load_store_from_disk():
    global _MEMORY
    if STORE_FILE.exists():
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                _MEMORY = json.load(f)
        except Exception:
            _MEMORY = {}


def _save_store_to_disk():
    try:
        with open(STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(_MEMORY, f, indent=2, ensure_ascii=False)
    except Exception as err:
        print(f"Error saving to disk store: {err}")


_load_store_from_disk()


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
            cert_path = Path(credentials_path)
            if not cert_path.is_absolute():
                cert_path = Path(__file__).resolve().parent.parent / credentials_path
            if cert_path.exists():
                firebase_admin.initialize_app(credentials.Certificate(str(cert_path)))
            else:
                return None
        _FIRESTORE = firestore.client()
        return _FIRESTORE
    except Exception:
        return None


def get_context(user_id: str) -> dict[str, Any]:
    client = _firestore_client()
    if client:
        try:
            doc = client.collection("patient_context").document(user_id).get()
            if doc.exists:
                return doc.to_dict() or {"user_id": user_id}
        except Exception:
            pass
    if user_id not in _MEMORY:
        _load_store_from_disk()
    return deepcopy(_MEMORY.get(user_id, {"user_id": user_id}))


def update_context(user_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    context = get_context(user_id)
    for key, value in patch.items():
        if key == "report_history" and isinstance(value, list):
            existing_reports = context.get("report_history", [])
            merged_reports = deepcopy(value)
            for old_rep in existing_reports:
                if not any(
                    r.get("id") == old_rep.get("id") or 
                    (r.get("title") == old_rep.get("title") and r.get("date") == old_rep.get("date"))
                    for r in merged_reports
                ):
                    merged_reports.append(deepcopy(old_rep))
            context["report_history"] = merged_reports
        elif isinstance(value, list) and isinstance(context.get(key), list):
            context[key] = context[key] + deepcopy(value)
        elif isinstance(value, dict) and isinstance(context.get(key), dict):
            context[key] = {**context[key], **deepcopy(value)}
        else:
            context[key] = deepcopy(value)

    context["user_id"] = user_id
    context["updated_at"] = _now()

    _MEMORY[user_id] = deepcopy(context)
    _save_store_to_disk()

    client = _firestore_client()
    if client:
        try:
            client.collection("patient_context").document(user_id).set(context, merge=True)
        except Exception:
            pass

    return context


def clear_memory_for_tests() -> None:
    _MEMORY.clear()
    _save_store_to_disk()

