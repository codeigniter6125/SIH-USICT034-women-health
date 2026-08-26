"""
FastAPI entrypoint for the Agentic AI Women's Health Platform backend.
Run locally with: uvicorn main:app --reload
"""

from dotenv import load_dotenv
load_dotenv()
from fastapi.responses import Response

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Agentic AI Women's Health Platform — Backend")
FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#C97B5C"/>
  <path d="M32 48C27 43 16 36 16 25a9 9 0 0 1 16-5 9 9 0 0 1 16 5c0 11-11 18-16 23Z" fill="#FAF6F1"/>
</svg>"""

@app.get("/favicon.ico", include_in_schema=False )
async def favicon():
    return Response(content=FAVICON_SVG, media_type="image/svg+xml")

# test comment for CodeRabbit
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


# Agent endpoints will be added here as each agent is built, e.g.:
# from agents.orchestrator import route_request
# @app.post("/api/chat")
# def chat(payload: dict):
#     return route_request(payload)
