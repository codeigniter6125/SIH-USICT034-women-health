# Tech Stack Document — v2
## She Care · Agentic AI Women's Health Platform
**Smart India Hackathon — Updated to reflect actual implementation**

---

## 1. Guiding Principles

- **Finish a real, demoable build in hackathon time** — not architectural purity.
- **Python for everything touching agents, LLMs, OCR, and voice** — ecosystem depth with Whisper, Vision SDKs, Gemini, and textbee's REST API.
- **Managed/hosted services over self-hosted** wherever a free/generous tier exists — no debugging database servers at 2am before a demo.
- **Cascading fallback at every AI call** — every LLM, OCR, and STT call has at least two fallbacks and a hard-coded safe response. Zero API keys configured = still a demoable app.
- **Offline-first where possible** — Whisper runs locally; Shared Memory reads from disk; rule engine is pure Python with JSON files.

---

## 2. Full Stack Overview

| Layer | Technology | Version / Notes |
|---|---|---|
| **Backend framework** | **FastAPI** | Python 3.10+; `uvicorn[standard]` server; CORS open for local dev |
| **LLM / reasoning** | **Google Gemini** | Primary: `gemini-3.5-flash`; fallback chain: `gemini-3.5-flash-lite` → `gemini-3.6-flash` → `gemini-flash-latest` → `gemini-3.7-flash` |
| **OCR (primary)** | **Google Cloud Vision API** | `DOCUMENT_TEXT_DETECTION`; REST via `requests`; env var: `GOOGLE_CLOUD_VISION_API_KEY` |
| **OCR (fallback 1)** | **Gemini Vision — new SDK** | `google.genai` (`google-genai` package); `Part.from_bytes()` multimodal |
| **OCR (fallback 2)** | **Gemini Vision — legacy SDK** | `google-generativeai` package; inline `{"mime_type": ..., "data": ...}` |
| **OCR (fallback 3)** | **Hard-coded demo CBC text** | Prevents crash / blank demo when no API key is configured |
| **Speech-to-text (primary)** | **OpenAI Whisper — local** | `openai-whisper` package; `base` model; writes temp `.webm` file; requires `ffmpeg` on PATH |
| **Speech-to-text (fallback 1)** | **Gemini Audio — new SDK** | Same `google.genai` client; audio `Part.from_bytes()` with `mime_type` auto-detect |
| **Speech-to-text (fallback 2)** | **Gemini Audio — legacy SDK** | `google-generativeai`; same model fallback chain |
| **Speech-to-text (fallback 3)** | **Hard-coded demo phrase** | Returns "I am experiencing mild cramps today and feeling a bit tired." |
| **Text-to-speech** | **Google Cloud Text-to-Speech** | `google-cloud-texttospeech` package; strong Hindi support |
| **Audio handling** | **pydub** | Format conversion / trimming before Whisper |
| **Image preprocessing** | `opencv-python-headless` | Listed in `requirements.txt`; not yet wired to the OCR pipeline — deferred to post-hackathon |
| **SMS gateway** | **textbee.dev** | `POST https://api.textbee.dev/api/v1/gateway/send-sms`; `x-api-key` header; env var: `TEXTBEE_API_KEY` |
| **Maps / hospital lookup** | **Google Maps Places API** | Nearby Search; `type=hospital`; radius 20 km; returns `name`, `address`, `lat`, `lng`, `maps_link` |
| **Authentication (frontend)** | **Firebase Phone/OTP** | `firebase` JS SDK v10; OTP → `idToken` stored in `localStorage` |
| **Authentication (backend)** | **Firebase Admin SDK** | `firebase-admin` Python package; `auth.verify_id_token()`; HMAC-signed demo tokens for local dev |
| **Shared Memory (tier 1)** | **In-process Python dict** | `_MEMORY: dict[str, dict]`; O(1) reads; lost on server restart |
| **Shared Memory (tier 2)** | **Disk JSON** | `backend/data/patient_context_store.json`; survives server restarts; saved on every `update_context()` call |
| **Shared Memory (tier 3)** | **Google Firestore** | `firebase-admin` Firestore client; active when `FIREBASE_ADMIN_CREDENTIALS` env var points to a valid service account JSON |
| **Cycle RAG retriever** | **Custom keyword-overlap scorer** | `backend/services/cycle_rag.py`; token overlap + phrase bonus; no vector embeddings or external retriever needed |
| **Cycle RAG corpus** | **JSON file** | `backend/data/cycle_guidelines.json`; sourced from WHO, UNICEF, CDC, ACOG; refreshed via ingestion script |
| **Agent orchestration** | **Hand-rolled Python function calls** | No LangGraph / CrewAI; Orchestrator calls agents sequentially; structured JSON output from each |
| **Frontend framework** | **Next.js 14** | App Router; `next@^14.2.35` |
| **Frontend language** | **React 18 + JSX** | `react@18.3.1`, `react-dom@18.3.1` |
| **Styling** | **Tailwind CSS v3** | `tailwindcss@^3.4.19`; custom design-system tokens (see §6) |
| **Icons** | **Material Symbols (Google Fonts)** | Loaded via CDN in `layout.jsx`; `FILL` variation settings used |
| **Hosting — frontend** | **Vercel** *(planned)* | Native Next.js support; zero-config; free tier |
| **Hosting — backend** | **Render / Railway** *(planned)* | Simple FastAPI deploy; env-var secrets management |
| **Version control** | **GitHub** | Main repo; `.gitignore` excludes `.env`, `firebase-admin-key.json`, `venv/`, `__pycache__/` |

---

## 3. Two Separate Google Cloud Projects (Critical)

The team uses **two separate Google Cloud projects** to keep Gemini on the genuine free tier:

| Project | Billing | APIs enabled |
|---|---|---|
| `women-health-sih` (main) | **Blaze** (billing linked) | Firebase Auth, Firestore, Storage · Cloud Vision API · Maps/Places API · Cloud TTS |
| **"Default Gemini Project"** (Google-managed) | **No billing linked** | Gemini API only |

**Why separate?** The moment a project is upgraded to Blaze (required for Vision/Maps/Firebase Storage), it exits Gemini's free tier. Google AI Studio's key-creation flow provides a pre-existing "Default Gemini Project" that is never linked to billing by design — use this when generating the `GEMINI_API_KEY`.

> **Do not** link a billing account to the Default Gemini Project. Doing so breaks the free tier for all Gemini calls.

---

## 4. APIs Explicitly NOT Used

| API | Why not |
|---|---|
| **Google Cloud Speech-to-Text API** | STT is handled by Whisper locally, with Gemini Audio as fallback. No Cloud STT key needed. |
| **Google Cloud Video Intelligence API** | Video/AR consultations are out of scope for v1 (PRD §16). |
| **Twilio** | Trial tier only sends SMS to pre-verified recipient numbers — a blocker for live demo to judge's phone. Replaced by textbee.dev. |
| **LangGraph / CrewAI** | Adds learning curve and abstraction overhead without benefit for hackathon-scope multi-agent demonstration. |
| **OpenCV preprocessing (active)** | `opencv-python-headless` is installed but the deskew/threshold pipeline is not yet wired to the OCR call. Vision API + Gemini Vision handle most phone-camera photo quality variations sufficiently for demo. |

---

## 5. Python Dependencies (`backend/requirements.txt`)

```
fastapi
uvicorn[standard]
python-dotenv
pydantic
python-multipart

# Agent / LLM
google-generativeai          # legacy Gemini SDK (fallback)
# google-genai               # new Gemini SDK (import: from google import genai)

# OCR & image preprocessing
google-cloud-vision
opencv-python-headless

# Voice
openai-whisper
pydub
google-cloud-texttospeech

# SMS / escalation
requests
beautifulsoup4               # used in ingestion scripts

# Firebase
firebase-admin
```

> **Note on Gemini SDKs:** Both SDKs coexist in the repo. `vision_client.py` and `whisper_client.py` try the new `google.genai` SDK first (imported as `from google import genai`), then fall back to the legacy `google.generativeai` SDK. Install both: `pip install google-genai google-generativeai`.

---

## 6. Frontend Dependencies (`package.json`)

```json
{
  "dependencies": {
    "firebase": "^10.12.4",
    "next": "^14.2.35",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "autoprefixer": "^10.5.4",
    "postcss": "^8.5.26",
    "tailwindcss": "^3.4.19"
  }
}
```

### Design System
Custom Tailwind extension from `stitch_women_s_health_design_system/` applied via `tailwind.config.js`:
- **Color tokens:** `primary`, `on-primary`, `background`, `surface-container-*`, `outline`, `outline-variant`, `on-surface`, `on-surface-variant`
- **Typography tokens:** `font-headline-lg-mobile`, `font-display-lg`, `font-body-base`, `font-body-bold`, `font-title-md`, `font-label-caps`
- **Shadow tokens:** `shadow-2xs`, `shadow-xs`
- **Spacing:** `max-width-dashboard`, `margin-mobile`

---

## 7. Repository Structure (Actual)

```
womens-health-sih/
├── backend/
│   ├── .env                         ← secrets (gitignored)
│   ├── .env.example                 ← template (committed)
│   ├── firebase-admin-key.json      ← service account (gitignored)
│   ├── main.py                      ← FastAPI app, all 15 endpoints
│   ├── requirements.txt
│   ├── test_all_agents.py           ← quick smoke-test runner
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py          ← routes /api/chat
│   │   ├── intake_agent.py          ← Gemini structured JSON extraction
│   │   ├── cycle_agent.py           ← RAG over cycle guidelines corpus
│   │   ├── report_reader_agent.py   ← OCR → Gemini → structured findings
│   │   ├── care_plan_agent.py       ← non-prescriptive guidance synthesis
│   │   └── escalation_agent.py     ← rule engine + textbee SMS + Maps
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py          ← Firebase token verify + demo tokens
│   │   ├── cycle_rag.py             ← keyword-overlap retriever
│   │   ├── gemini_client.py         ← call_gemini_structured() + fallback chain
│   │   ├── maps_client.py           ← get_nearest_hospital() via Places API
│   │   ├── shared_memory.py         ← dict → disk JSON → Firestore
│   │   ├── textbee_client.py        ← send_sms() via textbee.dev
│   │   ├── tts_client.py            ← Google Cloud TTS wrapper
│   │   ├── vision_client.py         ← extract_text_from_image() + fallbacks
│   │   └── whisper_client.py        ← transcribe_audio() + fallbacks
│   ├── rules/
│   │   ├── red_flag_table.json      ← escalation rule engine data
│   │   └── lab_reference_ranges.json← biomarker thresholds
│   ├── data/
│   │   ├── cycle_guidelines.json    ← RAG corpus (WHO/UNICEF/CDC/ACOG)
│   │   └── patient_context_store.json← disk-tier Shared Memory
│   ├── scripts/
│   │   └── fetch_cycle_guidelines.py← corpus ingestion script
│   └── tests/
│       └── (unit tests)
├── frontend/
│   └── frontend_scaffold/           ← Next.js 14 App Router project
│       ├── app/
│       │   ├── layout.jsx
│       │   ├── page.jsx             ← Home Dashboard
│       │   ├── login/               ← Firebase OTP login
│       │   ├── signup/
│       │   ├── chat/                ← Maya AI Chat (text + voice)
│       │   ├── cycle/               ← Cycle Tracker + phase display
│       │   ├── log/                 ← Daily Check-in (mood + symptoms)
│       │   ├── reports/             ← Upload + view medical reports
│       │   ├── doctor-summary/      ← Doctor-visit prep summary
│       │   ├── emergency/           ← Direct escalation trigger
│       │   ├── insights/            ← Educational content
│       │   └── profile/             ← User settings
│       ├── components/
│       │   ├── TopHeader.jsx
│       │   └── BottomNav.jsx
│       ├── lib/
│       ├── tailwind.config.js       ← design-system token extension
│       ├── package.json
│       └── .env.local               ← frontend secrets (gitignored)
├── docs/
│   ├── PRD.md                       ← original PRD draft
│   ├── tech_stack.md                ← original tech stack draft
│   ├── design_doc.md
│   ├── cycle_agent_rag.md
│   └── setup_environment_credentials.md
├── stitch_women_s_health_design_system/  ← design token source
└── README.md
```

---

## 8. Environment Variables

### Backend (`backend/.env`)

| Variable | Service | Project |
|---|---|---|
| `GEMINI_API_KEY` | All LLM calls (text, vision, audio) | Default Gemini Project (no billing) |
| `GOOGLE_CLOUD_VISION_API_KEY` | Cloud Vision OCR | Blaze project |
| `GOOGLE_MAPS_API_KEY` | Places API — hospital lookup | Blaze project |
| `GOOGLE_TTS_API_KEY` | Cloud Text-to-Speech | Blaze project |
| `TEXTBEE_API_KEY` | textbee.dev SMS gateway | textbee.dev account |
| `FIREBASE_API_KEY` | Firebase (frontend config) | Blaze project |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth | Blaze project |
| `FIREBASE_PROJECT_ID` | Firebase | Blaze project |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage | Blaze project |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging | Blaze project |
| `FIREBASE_APP_ID` | Firebase App | Blaze project |
| `FIREBASE_ADMIN_CREDENTIALS` | Path to `firebase-admin-key.json` for Firestore backend sync | Blaze project |
| `AUTH_DEMO_SECRET` | HMAC key for local demo tokens | Local only |

### Frontend (`frontend/frontend_scaffold/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | FastAPI base URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase frontend config (API key, auth domain, project ID, etc.) |

---

## 9. Service Call Architecture

```
 User (browser)
    │  text / audio / image
    ▼
Next.js Frontend (port 3000)
    │  REST  /api/*
    ▼
FastAPI Backend (port 8000)
    │
    ├─► Gemini API (LLM text)         → gemini_client.py
    │       └─ call_gemini_structured()
    │           Model fallback chain: 3.5-flash → 3.5-flash-lite → 3.6-flash → flash-latest → 3.7-flash
    │
    ├─► Google Cloud Vision API       → vision_client.py
    │       └─ DOCUMENT_TEXT_DETECTION
    │           Fallback: Gemini new SDK → Gemini legacy SDK → demo string
    │
    ├─► Whisper (local, base model)   → whisper_client.py
    │       └─ Writes temp .webm → transcribes → deletes
    │           Fallback: Gemini Audio new SDK → Gemini Audio legacy SDK → demo string
    │
    ├─► Google Maps Places API        → maps_client.py
    │       └─ Nearby Search type=hospital radius=20km
    │
    ├─► textbee.dev SMS API           → textbee_client.py
    │       └─ POST /api/v1/gateway/send-sms (fires via Android SIM)
    │
    ├─► Firebase Admin SDK            → auth_service.py + shared_memory.py
    │       └─ verify_id_token() + Firestore read/write
    │
    └─► Disk JSON + in-process dict   → shared_memory.py
            └─ Always available, no network required
```

---

## 10. Gemini Model Fallback Chain (Applies to All LLM Calls)

All LLM-dependent functions (`gemini_client.py`, `vision_client.py`, `whisper_client.py`) iterate through this ordered list and return the first successful response:

```
1. gemini-3.5-flash          ← primary
2. gemini-3.5-flash-lite
3. gemini-3.6-flash
4. gemini-flash-latest
5. gemini-3.7-flash
6. [hard-coded safe fallback] ← never raises an unhandled exception
```

This ensures the app remains functional if a specific model version is deprecated, rate-limited, or unavailable during the demo.

---

## 11. OCR Strategy (Implemented Priority Order)

```
1. Google Cloud Vision API (DOCUMENT_TEXT_DETECTION)
   ✓ Highest accuracy on phone-camera photos
   ✓ Handles skew/noise better than local engines
   Requires: GOOGLE_CLOUD_VISION_API_KEY

2. Gemini Vision — new SDK (google.genai)
   Prompt: "Extract ALL text, lab tests, values, units, and reference ranges verbatim."
   Requires: GEMINI_API_KEY

3. Gemini Vision — legacy SDK (google-generativeai)
   Same prompt; fallback for SDK version mismatches
   Requires: GEMINI_API_KEY

4. Hard-coded demo CBC text
   "COMPLETE BLOOD COUNT (CBC)\nHemoglobin (Hb): 12.5 g/dL ..."
   Always succeeds — keeps demo working with zero API keys
```

> **OpenCV preprocessing** (`grayscale → deskew → threshold`) is installed but not yet wired inline. Queued for post-hackathon polish pass.

---

## 12. STT Strategy (Implemented Priority Order)

```
1. Whisper local (base model)
   ✓ Fully offline after first model download (~75 MB)
   ✓ No API cost
   Requires: ffmpeg on PATH + openai-whisper installed

2. Gemini Audio — new SDK (google.genai, Part.from_bytes)
   Prompt: "Transcribe accurately in English, Hindi, or Hinglish."
   Requires: GEMINI_API_KEY

3. Gemini Audio — legacy SDK (google-generativeai)
   Same prompt and model chain
   Requires: GEMINI_API_KEY

4. Hard-coded demo phrase
   "I am experiencing mild cramps today and feeling a bit tired."
   Always succeeds — keeps demo working with zero API keys
```

---

## 13. Shared Memory Architecture

```
update_context(user_id, patch)
        │
        ├─ Merge into in-process _MEMORY dict (immediate, synchronous)
        ├─ Write full context to patient_context_store.json (immediate)
        └─ If Firestore client available: set(context, merge=True) (async, best-effort)

get_context(user_id)
        ├─ Try Firestore first (most up-to-date across instances)
        ├─ Fall back to in-process _MEMORY dict
        └─ If not in dict: reload from disk JSON → return
```

**Merge semantics:**
- `report_history[]` → de-duplicated by `id` or `(title, date)`, new entries prepended
- Other lists → new items **appended** (preserves full symptom/log timeline)
- Dicts → shallow merge `{**existing, **patch}`
- Scalars → overwrite

---

## 14. Cycle RAG Pipeline

```
Query (user message)
    │
    ▼
cycle_rag.retrieve(query, top_k=4)
    │  Keyword tokenization + synonym expansion
    │  Score = token_overlap + phrase_bonus (2.0 per matched health phrase)
    │  Sorted descending; top 4 chunks returned
    ▼
format_context(chunks)
    │  "[1] Title (URL)\nChunk text\n\n[2] ..."
    ▼
Gemini prompt (constrained)
    "Answer using ONLY the retrieved guidance below.
     Do not diagnose or prescribe. Language: {English|Hindi}.
     Return JSON: {reply, safety_note, follow_up_questions, sources}"
    ▼
citation_list(chunks)  →  [{title, url}, ...]  (included in API response)
```

**Corpus ingestion:**
```bash
# From backend/
python scripts/fetch_cycle_guidelines.py
# Outputs: data/cycle_guidelines.json
# Sources: WHO, UNICEF, CDC, ACOG public guidance pages
```

---

## 15. Why Not Alternatives

| Alternative | Reason not chosen |
|---|---|
| **Claude / OpenAI API** | No free tier as of team setup — Anthropic requires minimum $5 credit; OpenAI removed free credits. Gemini free tier removes cost for hackathon scope. |
| **LangGraph / CrewAI** | Adds framework learning curve and abstraction overhead. Simple chained function calls are easier to build, debug, and explain to judges. |
| **React Native / Flutter** | Native apps are heavier to build under time pressure. Responsive Next.js web app (optionally PWA-wrapped) demos just as well. |
