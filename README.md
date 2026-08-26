# Agentic AI Women's Health Platform
### Smart India Hackathon — Team Project

A multi-agent AI system for women's reproductive and general health support: symptom intake, cycle tracking, lab report interpretation, personalized care plans, and real emergency escalation (SMS + nearest-hospital lookup).

## Documentation

Read these in order before touching code:

- [`docs/PRD.md`](docs/PRD.md) — product requirements, architecture, agent responsibilities, locked decisions
- [`docs/design_doc.md`](docs/design_doc.md) — visual direction, colors, typography, key screens
- [`docs/tech_stack.md`](docs/tech_stack.md) — concrete tech choices and why
- [`docs/setup_environment_credentials.md`](docs/setup_environment_credentials.md) — how to get every API key/credential this project needs

## Project Structure

```
/frontend           → Next.js app (not yet scaffolded — see frontend/README.md)
/backend
  /agents            → Orchestrator + 5 specialist agents (placeholders — see PRD §4)
  /rules             → red_flag_table.json, lab_reference_ranges.json (PRD §8.4)
  /services          → API client wrappers (Twilio, Maps, Vision, TTS, Whisper, Gemini)
  main.py            → FastAPI entrypoint
  requirements.txt
  .env.example       → copy to .env and fill in real credentials
/docs                → the three core docs + setup guide
```

## Quickstart (Local Development)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # then fill in real values — see docs/setup_environment_credentials.md
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Visit `http://localhost:8000/` to confirm it's alive.

### Frontend

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app   # first time only
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Build Order

Per `docs/tech_stack.md` §6 — build in this order, not all at once:

1. Orchestrator + Intake Agent + Escalation Agent, wired end-to-end with a **real** Twilio SMS firing off `red_flag_table.json`. This is the highest-risk, most demo-critical path — prove it first.
2. Cycle Agent, Report-Reader Agent (OCR pipeline), Care-Plan Agent — added incrementally, each reading/writing Firestore.
3. Frontend screens per the design doc, wired to the backend via REST calls.
4. Action Layer (reminders, PDF summary, nearest-hospital lookup).
5. Staging test pass, then demo rehearsal.

## Credentials Checklist

- [x] Twilio (SMS gateway)
- [x] Firebase (Auth, Firestore, Storage) — Blaze plan
- [x] Google Cloud (Vision, Maps/Places, Text-to-Speech) — same Blaze project
- [x] Gemini API — **separate, unbilled "Default Gemini Project"** (see `docs/tech_stack.md` §2b for why)

## Contributing

Install [CodeRabbit](https://github.com/apps/coderabbitai) on this repo so every PR gets automated review before merge. Test on staging before production/demo.
