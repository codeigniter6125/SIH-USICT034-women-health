import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_all():
    print("--- 1. Health Check ---")
    r = client.get("/")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("Health check OK:", r.json())

    print("\n--- 2. Cycle Status (Cycle Agent) ---")
    r = client.get("/api/cycle/status?user_phone=%2B919876543210")
    assert r.status_code == 200, f"Cycle status failed: {r.text}"
    data = r.json()
    assert "current_day" in data
    assert "phase" in data
    print("Cycle status OK:", data["phase"], f"Day {data['current_day']}")

    print("\n--- 3. Daily Log (Intake & Care Plan Agent) ---")
    r = client.post("/api/daily-log", json={
        "user_phone": "+919876543210",
        "mood": "Calm",
        "symptoms": ["Cramps", "Fatigue"],
        "notes": "Feeling a little bit tired after work"
    })
    assert r.status_code == 200, f"Daily log failed: {r.text}"
    data = r.json()
    assert data["status"] == "success"
    assert "maya_feedback" in data
    print("Daily log OK:", data["maya_feedback"])

    print("\n--- 4. Report Upload & Google OCR (Report Reader Agent) ---")
    r = client.post("/api/reports/upload", data={"user_phone": "+919876543210", "category": "Lab Reports"})
    assert r.status_code == 200, f"Report upload failed: {r.text}"
    data = r.json()
    assert "report" in data
    assert len(data["report"]["findings"]) > 0
    print("Report OCR findings OK:", [f"{f['test']}: {f['value']} {f['unit']}" for f in data["report"]["findings"][:3]])

    print("\n--- 5. Doctor Summary (Aggregated History) ---")
    r = client.get("/api/doctor-summary?user_phone=%2B919876543210")
    assert r.status_code == 200, f"Doctor summary failed: {r.text}"
    data = r.json()
    assert "patient" in data
    print("Doctor summary OK:", data["patient"]["name"], data["cycle_insights"])

    print("\n--- 6. Educational Insights ---")
    r = client.get("/api/education/insights")
    assert r.status_code == 200, f"Insights failed: {r.text}"
    data = r.json()
    assert "tip_of_the_day" in data
    print("Insights OK:", data["tip_of_the_day"]["title"])

    print("\n--- 7. Emergency Trigger (Escalation Agent) ---")
    r = client.post("/api/emergency/trigger", json={
        "user_phone": "+919876543210",
        "symptoms": "severe chest pain and uncontrollable heavy bleeding",
        "location": {"lat": 28.6139, "lng": 77.2090}
    })
    assert r.status_code == 200, f"Emergency trigger failed: {r.text}"
    data = r.json()
    assert data["escalated"] == True
    print("Emergency escalation OK, rule:", data["rule_id"], "helplines:", data["helplines"])

    print("\n--- 8. Voice Transcribe (Whisper STT Endpoint) ---")
    # Empty/dummy audio test
    r = client.post("/api/voice/transcribe", files={"file": ("test.webm", b"dummy audio content", "audio/webm")})
    assert r.status_code == 200
    print("Voice transcribe endpoint OK:", r.json())

    print("\n--- 9. Care Chat Endpoint ---")
    r = client.post("/api/chat", json={
        "user_phone": "+919876543210",
        "message": "Hello Maya, I want to know more about the luteal phase"
    })
    assert r.status_code == 200
    data = r.json()
    assert "reply" in data
    print("Chat response OK:", data["reply"][:80], "...")

    print("\n==========================================")
    print("ALL 9 BACKEND AGENT ENDPOINTS PASSED 100%!")
    print("==========================================")

if __name__ == "__main__":
    test_all()
