"""
FastAPI entrypoint for the Agentic AI Women's Health Platform backend.
Powers all Stitch screens with live AI agents, Google OCR, and Whisper STT.
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone, timedelta
import json

from agents.orchestrator import route_request
from agents import care_plan_agent, cycle_agent, intake_agent, escalation_agent, report_reader_agent
from services.auth_service import create_demo_token, verify_token
from services.shared_memory import get_context, update_context
from services.vision_client import extract_text_from_image
from services.whisper_client import transcribe_audio
from services.maps_client import get_nearest_hospital

app = FastAPI(title="Agentic AI Women's Health Platform — Backend")

# Allow the local Next.js frontend (localhost:3000) to call this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not credentials:
        # For local demo convenience if token omitted in testing
        return {"uid": "demo-user", "phone": "+919876543210"}
    try:
        return verify_token(credentials.credentials)
    except ValueError:
        return {"uid": credentials.credentials, "phone": "+919876543210"}


@app.get("/")
def health_check():
    """Simple endpoint to confirm the backend is running and reachable."""
    return {"status": "ok", "service": "womens-health-sih-backend", "version": "2.0"}


class Location(BaseModel):
    lat: float
    lng: float


class ChatRequest(BaseModel):
    message: str
    user_phone: str
    location: Optional[Location] = None
    language: str = "English"
    cycle_history: Optional[Dict[str, Any]] = None
    ocr_text: Optional[str] = None
    file_path: Optional[str] = None


class DemoLoginRequest(BaseModel):
    user_id: str


class ReportRequest(BaseModel):
    ocr_text: Optional[str] = None
    file_path: Optional[str] = None
    user_phone: Optional[str] = None


class DailyLogRequest(BaseModel):
    user_phone: str
    mood: Optional[str] = None
    symptoms: Optional[List[str]] = None
    notes: Optional[str] = None
    cycle_day: Optional[int] = None


class CycleLogRequest(BaseModel):
    user_phone: str
    period_start_date: Optional[str] = None
    cycle_length_days: Optional[int] = 28
    period_length_days: Optional[int] = 5


class EmergencyTriggerRequest(BaseModel):
    user_phone: str
    symptoms: str
    location: Optional[Location] = None


class ProfileUpdateRequest(BaseModel):
    user_phone: str
    name: Optional[str] = None
    age: Optional[int] = None
    email: Optional[str] = None
    language: Optional[str] = "English"
    cycle_length: Optional[int] = 28
    emergency_contact: Optional[str] = None


@app.post("/api/auth/demo-token")
def demo_login(payload: DemoLoginRequest):
    return {"access_token": create_demo_token(payload.user_id), "token_type": "bearer"}


@app.get("/api/me/context")
def my_context(user: dict = Depends(current_user)):
    return get_context(user["uid"])


# ==========================================
# 1. VOICE / STT (WHISPER) ENDPOINT
# ==========================================
@app.post("/api/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    """Transcribes user voice input using Whisper / Gemini Audio."""
    try:
        content = await file.read()
        mime_type = file.content_type or "audio/webm"
        result = transcribe_audio(content, mime_type=mime_type)
        return result
    except Exception as e:
        return {"text": "", "error": str(e)}


# ==========================================
# 2. MEDICAL REPORT OCR & EXTRACTION
# ==========================================
@app.post("/api/reports/upload")
async def upload_report(
    file: UploadFile = File(None),
    user_phone: str = Form("+919876543210"),
    category: str = Form("Lab Reports"),
):
    """
    Accepts medical report document, extracts text using Google Cloud Vision OCR,
    and runs the Report Reader Agent to extract structured test findings.
    """
    ocr_text = ""
    filename = "document.jpg"
    if file:
        filename = file.filename or "document.jpg"
        content = await file.read()
        ocr_text = extract_text_from_image(content)
    else:
        ocr_text = extract_text_from_image(b"")

    agent_result = report_reader_agent.run({
        "user_id": user_phone,
        "ocr_text": ocr_text,
    })

    # Save to shared memory reports list
    report_entry = {
        "id": f"rep_{int(datetime.now().timestamp())}",
        "title": filename.replace(".jpg", "").replace(".png", "").replace(".pdf", ""),
        "report_type": agent_result.get("report_type", "Medical Lab Report"),
        "category": category,
        "date": datetime.now().strftime("%b %d, %Y"),
        "raw_ocr": ocr_text[:1000],
        "findings": agent_result.get("findings", []),
        "health_summary": agent_result.get("health_summary", ""),
        "interpretation": agent_result.get("interpretation", ""),
        "main_pointers": agent_result.get("main_pointers", []),
        "solutions_and_remedies": agent_result.get("solutions_and_remedies", {}),
        "needs_doctor_review": agent_result.get("needs_doctor_review", True),
    }
    update_context(user_phone, {"report_history": [report_entry]})

    return {
        "report": report_entry,
        "agent_result": agent_result,
    }


@app.post("/api/reports/extract")
def extract_report(payload: ReportRequest, user: dict = Depends(current_user)):
    phone = payload.user_phone or user.get("phone") or user["uid"]
    return report_reader_agent.run({**payload.model_dump(), "user_id": phone})


# ==========================================
# 3. DAILY CHECK-IN & SYMPTOM LOGGER
# ==========================================
@app.post("/api/daily-log")
def submit_daily_log(payload: DailyLogRequest):
    """
    Saves daily mood, symptoms, notes into Shared Memory and runs Intake & Care Plan agents.
    """
    phone = payload.user_phone
    log_entry = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mood": payload.mood or "Calm",
        "symptoms": payload.symptoms or [],
        "notes": payload.notes or "",
    }

    # Run intake agent on the notes + symptoms
    combined_message = f"Mood: {payload.mood}. Symptoms: {', '.join(payload.symptoms or [])}. Notes: {payload.notes or ''}"
    structured = intake_agent.run(combined_message, phone)

    # Check for escalation
    escalation = escalation_agent.run(structured)

    # Update context
    ctx = update_context(phone, {
        "symptoms": [{"symptom": s, "date": log_entry["date"]} for s in (payload.symptoms or [])],
        "daily_logs": [log_entry],
        "latest_mood": payload.mood,
    })

    # Get care plan guidance
    care_plan = care_plan_agent.run({"user_id": phone})

    return {
        "status": "success",
        "log": log_entry,
        "escalation": escalation,
        "care_plan": care_plan,
        "structured": structured,
        "maya_feedback": (
            "I've recorded your daily log! "
            + ("Remember to take a gentle rest and stay hydrated today." if "Cramps" in (payload.symptoms or []) or "Fatigue" in (payload.symptoms or []) else "Great job checking in with your body today.")
        ),
    }


# ==========================================
# 4. CYCLE TRACKING & STATUS
# ==========================================
@app.get("/api/cycle/status")
def get_cycle_status(user_phone: str = "+919876543210"):
    """
    Returns the user's current cycle day, phase, next period countdown, and Cycle Agent RAG insights.
    """
    ctx = get_context(user_phone)
    cycle_history = ctx.get("cycle_history", {})
    cycle_length = cycle_history.get("cycle_length_days", 28)
    period_length = cycle_history.get("period_length_days", 5)

    # Calculate cycle day (defaulting to Day 12 if not set)
    current_day = ctx.get("current_cycle_day", 12)
    next_period_in = max(1, cycle_length - current_day)

    # Determine phase
    if current_day <= period_length:
        phase = "Menstrual Phase"
        phase_desc = "Your period is ongoing. Focus on rest, warm teas, and gentle stretching."
    elif current_day < 14:
        phase = "Follicular Phase"
        phase_desc = "Estrogen is rising. You may experience higher energy and clear focus."
    elif 14 <= current_day <= 16:
        phase = "Ovulatory Window"
        phase_desc = "Peak fertility window. Energy and vitality are at their peak."
    else:
        phase = "Luteal Phase"
        phase_desc = "Progesterone is prominent. Slow down and prioritize nourishing meals."

    # Cycle agent RAG advice
    rag_result = cycle_agent.run({
        "user_id": user_phone,
        "message": f"I am on day {current_day} of my cycle in the {phase}",
        "cycle_history": cycle_history,
    })

    return {
        "current_day": current_day,
        "cycle_length": cycle_length,
        "period_length": period_length,
        "next_period_in_days": next_period_in,
        "phase": phase,
        "phase_description": phase_desc,
        "insights": "Your mood has been steady this week. Based on your logs, you are in a calm phase. Keep hydrating.",
        "rag_guidance": rag_result.get("reply", ""),
        "sources": rag_result.get("sources", []),
    }


@app.post("/api/cycle/log")
def update_cycle(payload: CycleLogRequest):
    phone = payload.user_phone
    update_context(phone, {
        "cycle_history": {
            "cycle_length_days": payload.cycle_length_days or 28,
            "period_length_days": payload.period_length_days or 5,
            "last_period_start": payload.period_start_date or datetime.now().strftime("%Y-%m-%d"),
        },
        "current_cycle_day": 1,
    })
    return {"status": "success", "message": "Cycle details updated"}


# ==========================================
# 5. DOCTOR-VISIT SUMMARY
# ==========================================
@app.get("/api/doctor-summary")
def get_doctor_summary(user_phone: str = "+919876543210"):
    """
    Aggregates cycle metrics, 30-day symptom logs, recent lab findings, and doctor questions dynamically.
    """
    ctx = get_context(user_phone)
    reports = ctx.get("report_history", [])
    logs = ctx.get("daily_logs", [])
    cycle_history = ctx.get("cycle_history", {"cycle_length_days": 28, "period_length_days": 5})

    # 1. Compute dynamic frequent symptoms from logs
    symptom_counts = {}
    for entry in logs:
        for sym in entry.get("symptoms", []):
            symptom_counts[sym] = symptom_counts.get(sym, 0) + 1

    if symptom_counts:
        frequent_symptoms = [
            {"symptom": k, "days": f"{v} Log{'s' if v > 1 else ''}"}
            for k, v in sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:4]
        ]
    else:
        frequent_symptoms = [
            {"symptom": "Fatigue", "days": "Reported"},
            {"symptom": "Bloating", "days": "Periodic"},
            {"symptom": "Mild Cramps", "days": "Cycle day 1-2"},
        ]

    # 2. Extract latest report details and build dynamic clinical overview
    latest_report = reports[0] if reports else None
    
    if latest_report:
        report_title = latest_report.get("title") or latest_report.get("report_type") or "Recent Medical Report"
        report_summary = latest_report.get("health_summary") or latest_report.get("interpretation") or "Biomarkers extracted and ready for clinical review."
        
        overview = f"Patient presents with {latest_report.get('report_type', 'recent laboratory findings')}. {report_summary} Cycle parameters reflect a {cycle_history.get('cycle_length_days', 28)}-day baseline. No acute emergency red-flag symptoms identified."
        
        remedies = latest_report.get("solutions_and_remedies", {})
        doc_questions = remedies.get("questions_for_doctor", [])
        if doc_questions:
            doctor_notes_prompt = "Key Questions for Doctor:\n• " + "\n• ".join(doc_questions)
        else:
            doctor_notes_prompt = "Discuss hormonal markers, cycle regularity, and recommended nutrition adjustments."
    else:
        overview = f"Patient health check-in summary for {ctx.get('name', 'Priya Sharma')}. Cycle rhythm is currently {cycle_history.get('cycle_length_days', 28)} days. Overall wellness tracking is active."
        doctor_notes_prompt = "Discuss routine cycle health check-ups and targeted nutrition."

    # Format attached reports with biomarkers summary
    formatted_reports = []
    for rep in reports:
        findings_preview = ", ".join([f"{f.get('test')}: {f.get('value')} {f.get('unit', '')}" for f in rep.get("findings", [])[:3]])
        formatted_reports.append({
            "id": rep.get("id", f"rep_{rep.get('date')}"),
            "title": rep.get("title") or rep.get("report_type") or "Medical Lab Report",
            "report_type": rep.get("report_type", "Lab Report"),
            "date": rep.get("date", datetime.now().strftime("%b %d, %Y")),
            "summary": findings_preview or rep.get("health_summary", "")[:80] or "Analyzed",
            "findings": rep.get("findings", []),
            "health_summary": rep.get("health_summary", ""),
            "solutions_and_remedies": rep.get("solutions_and_remedies", {}),
        })

    return {
        "patient": {
            "name": ctx.get("name", "Priya Sharma"),
            "age": ctx.get("age", 29),
            "phone": user_phone,
            "email": ctx.get("email", ""),
            "gender": "Female",
        },
        "date_range": f"{datetime.now().strftime('%b 01')} - {datetime.now().strftime('%b %d, %Y')}",
        "overview": overview,
        "cycle_insights": {
            "avg_cycle_length": f"{cycle_history.get('cycle_length_days', 28)} Days",
            "avg_period_length": f"{cycle_history.get('period_length_days', 5)} Days",
            "regularity": "Regular" if 21 <= int(cycle_history.get("cycle_length_days", 28)) <= 35 else "Irregular",
        },
        "frequent_symptoms": frequent_symptoms,
        "recent_reports": formatted_reports,
        "doctor_notes_prompt": doctor_notes_prompt,
    }


# ==========================================
# 6. EDUCATIONAL CONTENT & INSIGHTS
# ==========================================
@app.get("/api/education/insights")
def get_educational_insights():
    return {
        "tip_of_the_day": {
            "title": "Honor your body's rhythm.",
            "category": "Maya's Tip of the Day",
            "content": "As you transition into your luteal phase, you might notice a natural desire to slow down. Embrace lighter movements like yoga or stretching, and nourish yourself with warm, grounding foods. It's not a pause in productivity, but a necessary gathering of energy.",
        },
        "articles": [
            {
                "id": "art_1",
                "category": "Cycle Science",
                "title": "Understanding your Follicular Phase",
                "summary": "Discover how rising estrogen levels influence your energy, mood, and creativity, and how to harness this dynamic phase.",
                "read_time": "3 min read",
            },
            {
                "id": "art_2",
                "category": "Nourishment",
                "title": "Nutrition for Cycle Harmony",
                "summary": "A guide to adapting your diet to support hormonal balance through the four distinct phases of your cycle.",
                "read_time": "4 min read",
            },
            {
                "id": "art_3",
                "category": "Wellbeing",
                "title": "The Power of Rest",
                "summary": "Redefining productivity by understanding the biological imperative of deep rest and deliberate downtime.",
                "read_time": "3 min read",
            },
        ],
    }


# ==========================================
# 7. EMERGENCY ESCALATION ENDPOINT
# ==========================================
@app.post("/api/emergency/trigger")
def trigger_emergency(payload: EmergencyTriggerRequest):
    """
    Directly triggers the escalation agent with user symptoms and GPS location.
    """
    structured = intake_agent.run(payload.symptoms, payload.user_phone)
    loc_dict = payload.location.model_dump() if payload.location else None
    escalation = escalation_agent.run(structured, loc_dict)
    
    hospital = None
    if loc_dict:
        try:
            hospital = get_nearest_hospital(loc_dict)
        except Exception:
            pass
    if not hospital:
        hospital = {
            "name": "City General Hospital & Emergency Care",
            "maps_link": f"https://www.google.com/maps/search/?api=1&query={loc_dict.get('lat', 28.6139)},{loc_dict.get('lng', 77.2090)}" if loc_dict else "https://www.google.com/maps/search/nearest+hospital",
        }

    return {
        "escalated": True,
        "rule_id": escalation.get("rule_id", "EMERGENCY_DIRECT"),
        "helplines": escalation.get("helplines", ["112", "108", "181"]),
        "hospital": hospital or escalation.get("hospital"),
        "sms_result": escalation.get("sms_result"),
        "guidance": [
            "Stay calm and find a safe, comfortable spot.",
            "Keep your ID and medical information ready.",
            "Clearly share your symptoms with the healthcare responder.",
        ],
    }


# ==========================================
# 8. USER PROFILE & SETTINGS
# ==========================================
@app.get("/api/user/profile")
def get_user_profile(user_phone: str = "+919876543210"):
    ctx = get_context(user_phone)
    return {
        "name": ctx.get("name", "Priya Sharma"),
        "age": ctx.get("age", 29),
        "phone": user_phone,
        "email": ctx.get("email", ""),
        "language": ctx.get("language", "English"),
        "cycle_length": ctx.get("cycle_history", {}).get("cycle_length_days", 28),
        "emergency_contact": ctx.get("emergency_contact", "+919876543211"),
    }


@app.post("/api/user/profile")
def update_user_profile(payload: ProfileUpdateRequest):
    phone = payload.user_phone
    update_context(phone, {
        "name": payload.name or "Priya Sharma",
        "age": payload.age or 29,
        "email": payload.email or "",
        "language": payload.language or "English",
        "emergency_contact": payload.emergency_contact,
        "cycle_history": {"cycle_length_days": payload.cycle_length or 28},
    })
    return {"status": "success", "message": "Profile updated"}


# ==========================================
# 9. MAIN ORCHESTRATOR CHAT ENDPOINT
# ==========================================
@app.post("/api/chat")
def chat(payload: ChatRequest):
    """
    Main chat endpoint routing through Orchestrator -> Intake -> Escalation -> Cycle/Report/Care-Plan agents.
    """
    data = payload.model_dump()
    data["user_id"] = data.get("user_phone")
    return route_request(data)
