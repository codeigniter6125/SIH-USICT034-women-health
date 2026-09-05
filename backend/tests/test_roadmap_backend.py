"""
test_roadmap_backend.py — Tests for Roadmap Parts 0 & 1 additions:
- cycle_math.py (deterministic math, irregularity detection, phase assignment)
- POST /api/checkin
- GET /api/cycle
- GET /api/doctor-summary (both roadmap and backward-compatible fields)
- POST /api/chat rate-limiting (HTTP 429)
- cycle_agent.py report flags integration (low hemoglobin, abnormal TSH)
"""
from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

# Ensure backend directory is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from services.cycle_math import compute_cycle_state
from services.rate_limit import check_rate_limit, reset_rate_limit
from services.shared_memory import clear_memory_for_tests, get_context, update_context
from agents.cycle_agent import _relevant_report_flags, run as run_cycle_agent

client = TestClient(app)


def test_cycle_math():
    print("Testing cycle_math.py...")
    # 1. Empty dates
    res_empty = compute_cycle_state([])
    assert res_empty["has_data"] is False
    assert "Log your first period" in res_empty["message"]

    # 2. Single logged date (Day 14 scenario)
    today = date(2026, 9, 5)
    start_date = (today - timedelta(days=13)).isoformat()  # Day 14
    res_single = compute_cycle_state([start_date], today=today)
    assert res_single["has_data"] is True
    assert res_single["cycle_day"] == 14
    assert res_single["phase"] == "ovulatory"
    assert res_single["avg_cycle_length_days"] == 28
    assert res_single["is_irregular"] is False
    assert "predicted_next_period" in res_single
    assert "fertile_window" in res_single

    # 3. Menstrual phase (Day 2)
    start_date_m = (today - timedelta(days=1)).isoformat()
    res_m = compute_cycle_state([start_date_m], today=today)
    assert res_m["cycle_day"] == 2
    assert res_m["phase"] == "menstrual"

    # 4. Irregular history detection
    dates_irregular = ["2026-06-01", "2026-06-15", "2026-07-25"]  # 14-day gap (outside 21-45 range)
    res_irreg = compute_cycle_state(dates_irregular, today=date(2026, 8, 1))
    assert res_irreg["is_irregular"] is True

    print("  -> cycle_math.py passed all assertions.")


def test_cycle_agent_report_flags():
    print("Testing cycle_agent report flags integration...")
    # Mock report history with low Hb and abnormal TSH
    mock_reports = [
        {
            "id": "rep_1",
            "findings": [
                {"test": "Hemoglobin", "value": "9.8", "unit": "g/dL"},
                {"test": "TSH", "value": "5.4", "unit": "uIU/mL"},
                {"test": "Platelets", "value": "250", "unit": "10^3/uL"},
            ],
        }
    ]
    flags = _relevant_report_flags(mock_reports)
    assert len(flags) == 2
    assert any("hemoglobin" in f.lower() and "9.8" in f for f in flags)
    assert any("thyroid" in f.lower() or "tsh" in f.lower() for f in flags)
    print("  -> cycle_agent report flags passed.")


def test_api_checkin():
    print("Testing POST /api/checkin...")
    test_uid = "test-user-checkin-001"
    res = client.post(
        "/api/checkin",
        headers={"Authorization": f"Bearer {test_uid}"},
        json={
            "mood": 4,
            "symptoms": ["Bloating", "Headache"],
            "energy": 4,
            "sleep_hours": 7.5,
            "notes": "Feeling good today after a walk.",
        },
    )
    assert res.status_code == 200, f"Checkin failed: {res.text}"
    data = res.json()
    assert data["status"] == "saved"
    assert data["checkin_history_count"] >= 1

    # Verify context persistence
    ctx = get_context(test_uid)
    assert len(ctx.get("checkin_history", [])) >= 1
    last_checkin = ctx["checkin_history"][-1]
    assert last_checkin["mood"] == 4
    assert "Bloating" in last_checkin["symptoms"]
    assert last_checkin["energy"] == 4
    assert last_checkin["sleep_hours"] == 7.5
    print("  -> POST /api/checkin passed.")


def test_api_cycle():
    print("Testing GET /api/cycle...")
    test_uid = "test-user-cycle-002"
    today = date.today()
    start_date = (today - timedelta(days=9)).isoformat()  # Day 10 -> Follicular
    update_context(test_uid, {
        "cycle_history": {
            "period_start_dates": [start_date],
        }
    })

    res = client.get(
        "/api/cycle",
        headers={"Authorization": f"Bearer {test_uid}"},
    )
    assert res.status_code == 200, f"GET /api/cycle failed: {res.text}"
    data = res.json()
    assert data["has_data"] is True
    assert data["cycle_day"] == 10
    assert data["phase"] == "follicular"
    assert data["avg_cycle_length_days"] == 28
    print("  -> GET /api/cycle passed.")


def test_api_doctor_summary():
    print("Testing GET /api/doctor-summary...")
    test_uid = "test-user-doc-003"
    today = date.today()
    start_date = (today - timedelta(days=13)).isoformat()
    update_context(test_uid, {
        "name": "Ananya Roy",
        "age": 27,
        "cycle_history": {
            "period_start_dates": [start_date],
            "cycle_length_days": 28,
            "period_length_days": 5,
        },
        "checkin_history": [
            {"mood": 3, "symptoms": ["Mild Cramps"], "energy": 3, "sleep_hours": 8}
        ],
        "report_history": [
            {
                "id": "rep_test_doc",
                "title": "Complete Blood Count",
                "date": "Sep 01, 2026",
                "findings": [{"test": "Hemoglobin", "value": "11.2", "unit": "g/dL"}],
                "health_summary": "Mild iron deficiency anemia indicated.",
            }
        ],
    })

    res = client.get(
        "/api/doctor-summary",
        headers={"Authorization": f"Bearer {test_uid}"},
    )
    assert res.status_code == 200, f"Doctor summary failed: {res.text}"
    data = res.json()

    # Verify Roadmap Part 1.3 spec fields
    assert "patient_snapshot" in data
    assert data["patient_snapshot"]["user_id"] == test_uid
    assert "cycle_overview" in data
    assert data["cycle_overview"]["has_data"] is True
    assert data["cycle_overview"]["cycle_day"] == 14
    assert "recent_symptoms" in data
    assert len(data["recent_symptoms"]) >= 1
    assert "recent_reports" in data
    assert len(data["recent_reports"]) >= 1
    assert "questions_to_discuss" in data

    # Verify backward-compatible fields
    assert "patient" in data
    assert data["patient"]["name"] == "Ananya Roy"
    assert "cycle_insights" in data
    assert "overview" in data
    print("  -> GET /api/doctor-summary passed.")


def test_rate_limiting():
    print("Testing rate limiting on POST /api/chat...")
    import time
    from services.rate_limit import _last_request

    reset_rate_limit()
    test_phone = "+919999988888"

    # Unit test for rate limiter logic
    assert check_rate_limit("test-rapid-user") is True
    assert check_rate_limit("test-rapid-user") is False  # immediate burst rejected

    # Simulate an active request from test_phone just 0.5s ago
    _last_request[test_phone] = time.time()

    # Immediate request from same user must trigger HTTP 429
    res2 = client.post(
        "/api/chat",
        json={
            "user_phone": test_phone,
            "message": "Hello Maya again",
        },
    )
    assert res2.status_code == 429, f"Expected 429, got {res2.status_code}: {res2.text}"
    assert "Too many requests" in res2.json()["detail"]

    # Different user can still make a request without 429
    reset_rate_limit("+917777766666")
    res_diff_user = client.post(
        "/api/chat",
        json={
            "user_phone": "+917777766666",
            "message": "Hello from a different user",
        },
    )
    assert res_diff_user.status_code == 200

    # Reset allows first user again
    reset_rate_limit(test_phone)
    res3 = client.post(
        "/api/chat",
        json={
            "user_phone": test_phone,
            "message": "Hello Maya after rate limit reset",
        },
    )
    assert res3.status_code == 200
    print("  -> Rate limiting passed (HTTP 429 correctly returned on rapid burst).")


def run_all():
    print("==========================================")
    print("RUNNING ROADMAP PARTS 0 & 1 VERIFICATION")
    print("==========================================")
    test_cycle_math()
    test_cycle_agent_report_flags()
    test_api_checkin()
    test_api_cycle()
    test_api_doctor_summary()
    test_rate_limiting()
    print("==========================================")
    print("ALL ROADMAP TESTS PASSED 100%!")
    print("==========================================")


if __name__ == "__main__":
    run_all()
