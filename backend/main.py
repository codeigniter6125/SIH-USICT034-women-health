"""
FastAPI entrypoint for the Agentic AI Women's Health Platform backend.
Run locally with: uvicorn main:app --reload
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, Optional

from agents.orchestrator import route_request

app = FastAPI(title="Agentic AI Women's Health Platform — Backend")

# Allow the local Next.js frontend (localhost:3000) to call this backend during development.
# Tighten this once deployed (replace "*" with your actual Vercel domain).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    return route_request(payload.model_dump())
