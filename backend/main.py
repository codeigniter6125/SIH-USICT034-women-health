"""
FastAPI entrypoint for the Agentic AI Women's Health Platform backend.
Run locally with: uvicorn main:app --reload
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, Optional

from agents.orchestrator import route_request
from agents import care_plan_agent, report_reader_agent
from services.auth_service import create_demo_token, verify_token
from services.shared_memory import get_context

app = FastAPI(title="Agentic AI Women's Health Platform — Backend")

# Allow the local Next.js frontend (localhost:3000) to call this backend during development.
# Tighten this once deployed (replace "*" with your actual Vercel domain).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization bearer token required")
    try:
        return verify_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@app.get("/")
def health_check():
    """Simple endpoint to confirm the backend is running and reachable."""
    return {"status": "ok", "service": "womens-health-sih-backend"}


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


@app.post("/api/auth/demo-token")
def demo_login(payload: DemoLoginRequest):
    return {"access_token": create_demo_token(payload.user_id), "token_type": "bearer"}


@app.get("/api/me/context")
def my_context(user: dict = Depends(current_user)):
    return get_context(user["uid"])


@app.post("/api/reports/extract")
def extract_report(payload: ReportRequest, user: dict = Depends(current_user)):
    return report_reader_agent.run({**payload.model_dump(), "user_id": user["uid"]})


@app.post("/api/care-plan")
def care_plan(user: dict = Depends(current_user)):
    return care_plan_agent.run({"user_id": user["uid"]})


@app.post("/api/chat")
def chat(payload: ChatRequest):
    """
    Main chat endpoint. Routes through Orchestrator -> Intake Agent -> Escalation Agent -> Cycle Agent RAG.

    Example request body:
    {
        "message": "I've had severe cramps and heavy bleeding for 2 days",
        "user_phone": "+91XXXXXXXXXX",
        "location": {"lat": 28.6692, "lng": 77.4538}
    }
    """
    data = payload.model_dump()
    data["user_id"] = data.get("user_phone")
    return route_request(data)
