# Tech-Stack Doc
## Agentic AI Women's Health Platform
**Smart India Hackathon — Team Draft v1**

This document locks the concrete technical stack so the AI coding assistant (and the team) doesn't switch frameworks mid-build. Put this file in the project root alongside the PRD and design doc.

---

## 1. Guiding Principles

- **Optimize for finishing a real, demoable build in hackathon time**, not for architectural purity.
- **Python for anything touching the agents, LLMs, OCR, or voice** — the ecosystem (Whisper, OpenCV, Vision/Twilio SDKs) is strongest there, and it keeps all "brains" of the app in one language.
- **Managed/hosted services over self-hosted infrastructure** wherever a free/generous tier exists — no team should be debugging a database server at 2am before a demo.
- Every choice below should also work offline-first/low-bandwidth where feasible, per the PRD's target users.

---

## 2. Stack Overview

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (React)**, responsive web app | Fast to build, works on any phone browser without an app-store install — important for a hackathon demo and for real low-end-device users; can be wrapped as a PWA for an installable feel |
| Backend / Agent orchestration | **Python (FastAPI)** | Async-friendly, clean fit with Whisper/OpenCV/Vision SDKs, simple to expose each agent as a function the Orchestrator calls |
| LLM provider | **Google Gemini API (`gemini-3.6-flash`)** | Free tier, no payment method required — 15 RPM / 1,500 RPD, 1M token context. Multimodal (text + image), which also covers the Report-Reader Agent's image understanding needs. Lives in the same Google Cloud project already set up for Vision/Maps/TTS. |
| Authentication | **Firebase Authentication (Phone/OTP)** | Handles OTP delivery and verification out of the box, avoids building custom OTP infra; integrates cleanly with a Next.js frontend |
| Database / Shared Memory Store | **Firebase Firestore** | Document-based, fits the per-agent structured-JSON pattern well, real-time sync is a bonus for a live demo, generous free tier |
| File storage (report photos) | **Firebase Storage** | Same ecosystem as Auth/Firestore, simple upload flow from the frontend |
| OCR | **Google Cloud Vision API** | Higher accuracy than Tesseract on real phone-camera photos of printed reports (per PRD §8.2) |
| Image preprocessing | **OpenCV (Python)** | Grayscale, deskew, threshold before OCR |
| Speech-to-text | **Whisper** (small/base model) | Per PRD §8.3; run via `openai-whisper` or a hosted Whisper API if local compute is a constraint |
| Text-to-speech | **Google Cloud Text-to-Speech** | Strong Hindi support, simple API integration, lower implementation risk than Coqui for demo timelines |
| Audio handling | **pydub** | Format conversion/trimming before Whisper |
| SMS/Call gateway | **Twilio** | Per PRD §7.2 — real escalation SMS integration |
| Maps / nearest hospital | **Google Maps Places API** | Per PRD §7.3 |
| Agent orchestration pattern | **Plain Python function chaining** (no LangGraph/CrewAI) | Per PRD §8.1 — simpler to build, debug, and explain to judges in hackathon time |
| Hosting — frontend | **Vercel** | Native Next.js support, zero-config deploys, free tier |
| Hosting — backend | **Render** or **Railway** | Simple Python/FastAPI deploys, free/cheap tier, easy env-var/secrets management |
| Version control / CI | **GitHub + CodeRabbit** | Per the original workflow — CodeRabbit reviews every PR automatically |

---

## 2a. APIs Explicitly NOT Used (Avoid Enabling These)

To prevent confusion or accidental setup later, note explicitly:

- **Google Cloud Speech-to-Text API — NOT used.** Speech-to-text is handled by **Whisper**, run locally in Python (`openai-whisper` package). No Google Cloud API or key needed for STT.
- **Google Cloud Video Intelligence API — NOT used.** Video/AR consultations are explicitly out of scope for the hackathon build (per PRD §10). Nothing in this architecture processes video.

Only enable these four Google Cloud APIs: **Cloud Vision API, Maps JavaScript API, Places API, Cloud Text-to-Speech API.**

## 2b. Two Separate Google Cloud Projects (Important)

The team uses **two separate Google Cloud projects**, not one, to keep Gemini on the genuine free tier:

| Project | Billing | Used for |
|---|---|---|
| `women-health-sih` (main) | **Blaze** (pay-as-you-go, billing linked) | Firebase (Auth, Firestore, Storage), Cloud Vision API, Maps/Places API, Text-to-Speech API |
| **"Default Gemini Project"** (Google-managed) | **No billing linked** | Gemini API only |

**Why:** Gemini's free tier requires the linked project to have **no** Cloud Billing account attached. The moment a project is upgraded to Blaze (needed for Firebase Storage/Vision/Maps), it moves to Gemini's paid tier and returns a "prepayment credits depleted" error instead of using free quota.

**Resolution used:** Rather than manually creating and managing a second Cloud project, Google AI Studio's key-creation flow offers a pre-existing, auto-created **"Default Gemini Project"** — a project Google provisions specifically for free-tier Gemini API keys, kept separate from a developer's regular Cloud projects by design and never linked to billing. The team selected this project when generating the Gemini API key instead of a manually created project, which avoided both the billing ambiguity and the project-sync delay of a newly created project not yet appearing in AI Studio's picker.

**Do not** link a billing account to the Default Gemini Project for any reason — doing so will break the free tier for this key.

---

## 3. Why Not Alternatives (Brief)

- **Claude API / OpenAI API:** Both are strong providers, but neither offers a free tier as of the team's setup — Anthropic requires a minimum $5 credit purchase and OpenAI removed free credits entirely. Gemini's free tier removes this cost entirely for a hackathon-scope build; revisit Claude/OpenAI post-hackathon if the project continues and budget allows (Claude in particular is strong for long-context reasoning and prompt caching).
- **LangGraph/CrewAI:** Real tools, but add a learning curve and abstraction overhead the team doesn't need to prove out multi-agent reasoning in a hackathon timeframe. Revisit post-hackathon if the project continues.
- **React Native / Flutter (native app):** A true native app is heavier to build and deploy under time pressure; a responsive Next.js web app (optionally PWA-wrapped) demos just as well and is dramatically faster to ship and iterate on.
- **Self-hosted Postgres/MongoDB:** Firestore removes an entire category of "did the database survive the demo" risk, and its document model maps naturally onto each agent's JSON output.
- **Tesseract (OCR):** Free and offline-capable, but noticeably less accurate on skewed/low-quality phone photos than Vision API — accuracy matters more than cost for a report-reading demo.

---

## 4. Environment / Secrets Checklist

All of the following go in environment variables (`.env`, excluded via `.gitignore`) — never hardcoded, never committed:

- `GEMINI_API_KEY` (LLM provider)
- `FIREBASE_*` config keys (Auth, Firestore, Storage)
- `GOOGLE_CLOUD_VISION_API_KEY` (or service account JSON)
- `GOOGLE_TTS_API_KEY` (or shared with Vision service account)
- `GOOGLE_MAPS_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

---

## 5. Repository Structure (Proposed)

```
/frontend           → Next.js app
/backend
  /agents
    orchestrator.py
    intake_agent.py
    cycle_agent.py
    report_reader_agent.py
    care_plan_agent.py
    escalation_agent.py
  /rules
    red_flag_table.json      # PRD §8.4 table, as data
    lab_reference_ranges.json # PRD §8.4 table, as data
  /services
    twilio_client.py
    maps_client.py
    vision_client.py
    tts_client.py
    whisper_client.py
  main.py            # FastAPI entrypoint
/docs
  PRD.md
  design_doc.md
  tech_stack.md       # this file
```

Keeping the red-flag and reference-range tables as standalone JSON files (not buried in code) makes them easy to review with a medical advisor (per PRD open question) and easy to test independently of the LLM logic.

---

## 6. Build Order (Aligns with PRD Rollout Plan)

1. Scaffold repo per structure above; `git init`, push to GitHub, install CodeRabbit.
2. Firebase project setup (Auth phone/OTP, Firestore, Storage) + Twilio + Google Cloud (Vision, Maps, TTS) accounts provisioned.
3. Orchestrator + Intake Agent + Escalation Agent wired end-to-end, with a real Twilio SMS firing off the red-flag table — this is the highest-risk, most demo-critical path, build and test it first.
4. Cycle Agent, Report-Reader Agent (OCR pipeline), Care-Plan Agent added incrementally, each reading/writing Firestore.
5. Frontend screens per the design doc, wired to the backend via REST calls to FastAPI.
6. Action Layer (reminders, PDF summary, nearest-hospital lookup) layered on top.
7. Staging test pass, then final demo rehearsal.

---

*This completes the three-document set: PRD → Design Doc → Tech-Stack Doc, per the original workflow.*
