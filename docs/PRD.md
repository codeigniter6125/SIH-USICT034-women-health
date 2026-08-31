# Product Requirements Document
## Agentic AI Women's Health Platform — **She Care**
### Smart India Hackathon — Updated PRD v2 *(reflects current implementation)*

---

## 1. Problem Statement

Women across India, especially in semi-urban and rural areas, face fragmented access to reproductive and general health guidance. Symptoms go untracked, lab/diagnostic reports go unread or misunderstood, follow-up care is inconsistent, and red-flag symptoms are often missed until conditions worsen. Existing health apps are largely passive trackers — they log data but don't reason over it, don't read reports, and don't act.

**She Care** closes that gap with an agentic AI system: a coordinated team of specialist AI agents that intake a woman's health information (text, voice, or image), understand her menstrual/reproductive cycle context, read and interpret her medical reports, generate personalized care plans, and escalate to real care (human doctors, helplines, referrals) when needed — with a persistent memory of her health context across every interaction. The AI companion is named **Maya** and is consistently addressed by that name across the frontend.

---

## 2. Goals & Objectives

- Give women a single, always-available entry point (text/voice/image) for health questions and tracking, accessible via the **Maya** chat companion.
- Move beyond passive logging to active reasoning: interpret cycle data, flag anomalies, read diagnostic reports.
- Reduce delay between symptom onset and appropriate care-seeking, especially for red-flag conditions.
- Produce explainable, non-diagnostic guidance that always routes toward qualified human care when stakes are high.
- Build a system architecture that is genuinely agentic (multi-agent orchestration, shared memory, autonomous action) rather than a single-prompt chatbot wrapper.
- **Explicitly not a goal:** replacing doctors, providing definitive diagnoses, or prescribing medication.

---

## 3. Target Users

| User | Need |
|---|---|
| Woman (primary user), semi-urban/rural, 15–45 | Track cycle, ask health questions, understand lab reports, know when to see a doctor |
| ASHA worker / community health volunteer | Assist users with low digital literacy, view flagged cases |
| Doctor / gynecologist (referral endpoint) | Receive structured escalation summaries instead of raw chat logs |
| Family member (optional, consented) | Support in emergencies or for minors, with explicit consent controls |

---

## 4. System Architecture

```
User Input (text / voice / image)
        │
        ▼
   Orchestrator Agent  (/api/chat)
        │
   ┌────┼────────┬─────────────┬───────────────┐
   ▼    ▼         ▼             ▼               ▼
Intake  Cycle   Report-Reader  Care-Plan     Escalation
Agent   Agent   Agent          Agent         Agent
   │    │       (OCR + VLM)        │               │
   └────┴─────────┴─────────────┴───────────────┘
                    │
     Shared Memory / Patient Context Store
        (in-memory dict → disk JSON → Firestore)
                    │
         Action Layer
    (SMS via textbee, Google Maps hospital link)
```

### Implementation Stack

| Layer | Technology |
|---|---|
| Backend framework | **FastAPI** (Python) — `uvicorn` server |
| LLM / reasoning | **Google Gemini** (`gemini-3.5-flash`, with fallback chain across `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-flash-latest`, `gemini-3.7-flash`) |
| OCR (primary) | **Google Cloud Vision API** (`DOCUMENT_TEXT_DETECTION`) |
| OCR (fallback) | **Gemini Vision** (new `google.genai` SDK → legacy `google-generativeai` SDK) |
| STT (primary) | **OpenAI Whisper** (local, `base` model) |
| STT (fallback) | **Gemini Audio** (same model fallback chain as above) |
| TTS | **Google Cloud Text-to-Speech API** |
| SMS gateway | **textbee.dev** — real Android-device SIM routing |
| Maps | **Google Maps Places API** (Nearby Search, `type=hospital`) |
| Auth | **Firebase Phone/OTP** (frontend) + **Firebase Admin SDK** (backend token verification) |
| Shared Memory | Local in-process Python dict → disk JSON (`backend/data/patient_context_store.json`) → **Firestore** (when `FIREBASE_ADMIN_CREDENTIALS` is configured) |
| Frontend | **Next.js 14** (App Router) + **React 18** + **Tailwind CSS v3** |
| Design system | Custom design system: `stitch_women_s_health_design_system` (Tailwind-extended tokens) |

---

## 4.1 Orchestrator Agent

**File:** [`backend/agents/orchestrator.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/agents/orchestrator.py)  
**API endpoint:** `POST /api/chat`

- Single entry point for all user input.
- **Always** runs the Intake Agent first (structures raw free text into a JSON flags object), then runs the Escalation Agent on every turn as a mandatory safety gate — regardless of routing intent.
- If escalation fires, returns the escalation response immediately and does **not** continue to routine routing.
- Keyword-based routing after the safety gate:
  - Report keywords (`report`, `lab result`, `hemoglobin`, `thyroid`) or presence of `ocr_text`/`file_path` → **Report-Reader Agent**
  - Care-plan keywords (`care plan`, `what should i do`, `next steps`, `self care`) → **Care-Plan Agent**
  - All other messages → **Cycle Agent** (with RAG)
- Merges results into a `reply` string if the downstream agent returns structured JSON without a `reply` key.

### ChatRequest schema
```json
{
  "message": "string",
  "user_phone": "string (E.164)",
  "location": {"lat": float, "lng": float} | null,
  "language": "English | Hindi",
  "cycle_history": {} | null,
  "ocr_text": "string | null",
  "file_path": "string | null"
}
```

---

## 4.2 Intake Agent

**File:** [`backend/agents/intake_agent.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/agents/intake_agent.py)

- Calls Gemini with a structured JSON prompt to extract: `symptoms[]`, `duration`, `severity`, `flags[]`.
- **Flag vocabulary is fixed and hardcoded** in the prompt — the LLM is instructed to use only tokens from this exact list. This makes Escalation Agent matching deterministic:

| Flag token | Description |
|---|---|
| `severe_abdominal_pain` | Severe pain in abdomen/pelvis |
| `heavy_bleeding` | Abnormally heavy menstrual or other bleeding |
| `missed_period` | One or more missed periods |
| `severe_pain_or_fainting_or_heavy_bleeding` | Combined danger signals |
| `bleeding_duration_gt_7_days` | Bleeding lasting more than 7 days |
| `suicidal_ideation` | Expressions of suicidal thoughts |
| `severe_distress` | Expressions of overwhelming psychological distress |
| `self_harm` | Expressions of self-harm intent or behavior |
| `signs_of_abuse` | Indicators of domestic/physical abuse |
| `signs_of_violence` | Indicators of violence against the user |
| `user_is_minor` | User is identified as a minor |
| `mild_cramping` | Routine mild menstrual cramping |
| `typical_pms_symptoms` | Standard PMS symptoms |
| `single_missed_period_no_other_symptoms` | Single missed period, no red-flag co-symptoms |

- **Fail-safe fallback:** if Gemini is unavailable, the agent returns `{"symptoms": [raw_message], "flags": [], "severity": "unknown"}` — ensuring the escalation check still runs rather than crashing.
- Writes structured output to Shared Memory under `symptoms` and `last_intake`.

---

## 4.3 Cycle Agent

**File:** [`backend/agents/cycle_agent.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/agents/cycle_agent.py)  
**API endpoints:** `GET /api/cycle/status`, `POST /api/cycle/log`

- Uses a **lightweight RAG pipeline** (`backend/services/cycle_rag.py`) over a JSON corpus at `backend/data/cycle_guidelines.json`.
- Corpus retrieval is keyword-overlap + phrase-bonus scoring (no vector embeddings) — offline-capable, fast.
- Retrieval sources are drawn from public guidance: WHO, UNICEF, CDC, ACOG — **educational use only**.
- After retrieval, passes context to Gemini with a constrained prompt: "answer using ONLY the retrieved guidance; do not diagnose or prescribe."
- Falls back to a safe hard-coded disclaimer reply if retrieval returns nothing or Gemini is unavailable.
- `GET /api/cycle/status` computes the current cycle phase (Menstrual / Follicular / Ovulatory / Luteal) from the user's stored `current_cycle_day` and calls the Cycle Agent for phase-relevant RAG guidance.
- `POST /api/cycle/log` updates `cycle_history` in Shared Memory and resets `current_cycle_day` to 1.
- Cycle phase logic: days 1–period_length = Menstrual; day 1–13 = Follicular; days 14–16 = Ovulatory Window; days 17+ = Luteal.

---

## 4.4 Report-Reader Agent

**File:** [`backend/agents/report_reader_agent.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/agents/report_reader_agent.py)  
**API endpoints:** `POST /api/reports/upload`, `GET /api/reports`, `POST /api/reports/extract`

### OCR pipeline
1. `POST /api/reports/upload` receives multipart file upload.
2. `vision_client.extract_text_from_image()` is called — attempts in order:
   - **Google Cloud Vision REST API** (`DOCUMENT_TEXT_DETECTION`) — primary, highest accuracy on phone-camera photos.
   - **Gemini GenAI SDK** (`google.genai`) with vision prompt — first fallback.
   - **Legacy Gemini SDK** (`google-generativeai`) — second fallback.
   - **Hard-coded demo CBC text** — last resort (prevents crash during demo without keys).
3. MIME type is auto-detected from magic bytes: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

### LLM analysis
- The extracted OCR text (truncated to 6 000 chars) is sent to Gemini with a detailed medical analysis prompt.
- Gemini returns a structured JSON object with:
  - `report_type` — e.g. "PCOS / Hormonal Profile", "Complete Blood Count (CBC)"
  - `health_summary` — warm, patient-friendly 3–5 sentence explanation
  - `main_pointers[]` — findings with `status: positive | attention | warning`
  - `solutions_and_remedies` — `dietary_cure[]`, `lifestyle_care[]`, `questions_for_doctor[]`
  - `findings[]` — structured list: `test`, `value`, `unit`, `reference_range`, `status`
- A **regex-based fallback extractor** (`_extract_values_fallback`) runs before the LLM call and its results are replaced by LLM output if available — ensures some extraction even when Gemini is unavailable.
- Every report is **saved to Shared Memory** (`report_history[]`) and **displayed on the Reports screen**.
- `needs_doctor_review: true` is always returned — no report is ever presented as a standalone diagnosis.

### Report store schema (per entry)
```json
{
  "id": "rep_<timestamp>",
  "title": "filename without extension",
  "report_type": "string",
  "category": "Lab Reports | Prescriptions | Imaging",
  "date": "MMM DD, YYYY",
  "raw_ocr": "first 1000 chars",
  "findings": [...],
  "health_summary": "string",
  "interpretation": "string",
  "main_pointers": [...],
  "solutions_and_remedies": {...},
  "needs_doctor_review": true
}
```

---

## 4.5 Care-Plan Agent

**File:** [`backend/agents/care_plan_agent.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/agents/care_plan_agent.py)

- Reads `symptoms`, `cycle_history`, and `report_history` from Shared Memory.
- Returns a non-prescriptive plan: tracking guidance, when to seek a clinician, context-aware flags (`needs_doctor_review: true` when reports are present).
- Stage classification: `"general wellness information"` — surfaced in the frontend as a disclaimer.
- Writes the plan back to Shared Memory under `care_plans[]`.

> **Note:** Care-Plan Agent is invoked automatically after every Daily Log (`POST /api/daily-log`), and is also reachable via the main chat orchestrator with care-plan keywords.

---

## 4.6 Escalation Agent

**File:** [`backend/agents/escalation_agent.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/agents/escalation_agent.py)  
**API endpoint:** `POST /api/emergency/trigger`

This is the **cross-cutting safety layer** — the Orchestrator checks it on every single turn, in parallel with intent routing. It is not a branch the user can skip.

### Rule engine
- Rules are loaded from `backend/rules/red_flag_table.json` — a plain JSON file, not LLM-inferred.
- `check_red_flags()` performs a **set intersection** of `structured_symptoms["flags"]` against each rule's `conditions[]`.
- First matching `escalation_level: "urgent"` rule wins.

### Escalation flow (per PRD §7.4 — location never blocks SMS)
1. Orchestrator passes `structured_symptoms` + optional `user_location` to `escalation_agent.run()`.
2. Nearest-hospital lookup via `maps_client.get_nearest_hospital()` is attempted **in a try/except** — failure is logged and silently ignored.
3. `textbee_client.send_sms()` fires **immediately** (not blocked by hospital lookup).
4. SMS body: plain-language alert + relevant helpline label(s) + hospital name + Google Maps link (if location available).
5. SMS send failure is also caught and logged — the API request does **not** crash.

### Vetted helpline numbers (hardcoded, never LLM-generated)

| Helpline | Number | Trigger |
|---|---|---|
| National Emergency (ERSS) | **112** | Any immediately life-threatening emergency |
| Women Helpline (WCD) | **181** | Violence, harassment, abuse, distress |
| Tele-MANAS (Mental Health) | **14416** | Suicidal ideation, mental health crisis |
| Child Helpline | **1098** | User identified as a minor |

### Direct emergency endpoint
`POST /api/emergency/trigger` — accepts `user_phone`, `symptoms` (free text), and optional `location`. Runs Intake + Escalation agents directly. Returns `escalated: true`, matched `rule_id`, `helplines`, `hospital`, `sms_result`, and user-facing `guidance[]` bullets.

---

## 4.7 Shared Memory / Patient Context Store

**File:** [`backend/services/shared_memory.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/services/shared_memory.py)

### Storage tiers (active)
| Tier | Implementation | When used |
|---|---|---|
| In-process dict (`_MEMORY`) | Python dict | Every request, O(1) reads |
| Disk JSON | `backend/data/patient_context_store.json` | Persists across server restarts |
| Firestore | `patient_context` collection, keyed by `user_id` | When `FIREBASE_ADMIN_CREDENTIALS` env var is set |

### Update semantics
- **Lists** (except `report_history`): new items are **appended** to existing list — preserves full history.
- **Dicts**: shallow-merged with `{**existing, **patch}`.
- **`report_history`**: de-duplicated by `id` or `(title, date)` composite key before prepending new entries.
- Every update writes `user_id` and `updated_at` (UTC ISO 8601).

### Fields tracked per user
`user_id`, `name`, `age`, `phone`, `email`, `language`, `emergency_contact`, `cycle_history`, `current_cycle_day`, `symptoms[]`, `daily_logs[]`, `latest_mood`, `report_history[]`, `care_plans[]`, `last_intake`, `last_cycle_interaction`, `updated_at`

---

## 4.8 Action Layer

- **SMS escalation**: `textbee_client.send_sms()` → `POST https://api.textbee.dev/api/v1/gateway/send-sms` with `x-api-key` header.
- **Hospital lookup**: `maps_client.get_nearest_hospital()` → Google Places API Nearby Search (`type=hospital`, radius 20 km), returns `name`, `address`, `lat`, `lng`, `maps_link`.
- **Doctor-visit summary**: `GET /api/doctor-summary` aggregates cycle metrics, 30-day symptom frequency counts, recent report findings, and LLM-generated doctor questions into a structured response the frontend renders as a shareable summary page.
- **Educational content**: `GET /api/education/insights` returns a daily tip (currently static, easily wired to a rotating content store) and three articles.

---

## 4.9 User Authentication

**File:** [`backend/services/auth_service.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/services/auth_service.py)

- **Production path:** Firebase Phone/OTP. The frontend completes the OTP flow, stores `idToken` in `localStorage`, and sends it as `Authorization: Bearer <token>`. The backend verifies it via Firebase Admin SDK (`auth.verify_id_token()`).
- **Demo/dev path:** `POST /api/auth/demo-token` issues an HMAC-signed demo token (keyed by `AUTH_DEMO_SECRET` env var). This avoids requiring a phone during local testing but is scoped to `"provider": "demo"`.
- **Session fallback:** if no token is present, the `current_user()` dependency returns `{"uid": "demo-user", "phone": "+919876543210"}` — prevents crashes on unauthenticated local testing.
- Login gate is enforced at the **frontend** level: `app/page.jsx` redirects to `/login` if `idToken` or `userPhone` is absent from `localStorage`.

---

## 5. Frontend Screens & Routing

**Stack:** Next.js 14 App Router, React 18, Tailwind CSS v3, Material Symbols icons.  
**Design system:** `stitch_women_s_health_design_system` — custom Tailwind token extension (colors, typography, spacing, shadows).

| Route | Screen | Backend calls |
|---|---|---|
| `/` | **Home Dashboard** — greeting (bilingual: Hindi "नमस्ते" + English), live cycle card, action cards, Maya CTA | `GET /api/cycle/status`, `GET /api/education/insights` |
| `/login` | Firebase OTP login | Firebase SDK |
| `/signup` | Account creation | Firebase SDK |
| `/chat` | **Maya AI Chat** — text + voice input, bilingual | `POST /api/chat`, `POST /api/voice/transcribe` |
| `/cycle` | **Cycle Tracker** — phase display, log period start, RAG guidance | `GET /api/cycle/status`, `POST /api/cycle/log` |
| `/log` | **Daily Check-in** — mood picker, symptom chips, notes | `POST /api/daily-log` |
| `/reports` | **Medical Reports** — upload photo/PDF, view history with findings | `POST /api/reports/upload`, `GET /api/reports` |
| `/doctor-summary` | **Doctor-Visit Summary** — patient snapshot, cycle insights, symptom log, report list | `GET /api/doctor-summary` |
| `/emergency` | **Emergency Screen** — direct escalation trigger with GPS | `POST /api/emergency/trigger` |
| `/insights` | **Educational Insights** — tip of the day, articles | `GET /api/education/insights` |
| `/profile` | **User Profile & Settings** — name, age, language, cycle length, emergency contact | `GET /api/user/profile`, `POST /api/user/profile` |

### Shared UI components
- **`TopHeader`** — app bar with title and back/menu controls.
- **`BottomNav`** — sticky mobile tab bar (Home, Cycle, Chat/Maya, Reports, Profile).

---

## 6. Core User Flows

1. **Login / account creation** — User signs in via Firebase OTP → frontend stores `idToken` + `userPhone` in `localStorage` → all subsequent API calls use `user_phone` as the Shared Memory key.

2. **Cycle logging & prediction** — User logs period start via `/cycle` → `POST /api/cycle/log` updates `cycle_history` and resets `current_cycle_day` to 1 → `GET /api/cycle/status` serves live phase info + RAG guidance.

3. **Report upload & interpretation** — User photographs a lab report on `/reports` → `POST /api/reports/upload` runs Vision OCR → Report-Reader Agent returns structured findings with `health_summary`, `main_pointers`, `solutions_and_remedies` → report saved to Shared Memory → displayed in the reports list.

4. **Daily symptom check-in** — User fills in mood + symptoms on `/log` → `POST /api/daily-log` runs Intake + Escalation + Care-Plan agents → escalation SMS fires if red-flag conditions are met → routine cases return care plan guidance.

5. **Maya AI chat** — User types or speaks on `/chat` → optional voice goes to `POST /api/voice/transcribe` → text (transcribed or typed) sent to `POST /api/chat` → Orchestrator → Intake → Escalation → specialist agent → reply rendered in chat UI.

6. **Emergency escalation** — User reports red-flag symptoms directly on `/emergency` → `POST /api/emergency/trigger` → Intake + Escalation agents → SMS sent with helplines + Google Maps hospital link → user sees `helplines[]` + `guidance[]` bullets.

7. **Doctor visit prep** — User visits `/doctor-summary` → `GET /api/doctor-summary` aggregates 30-day symptom frequency, cycle metrics, report findings, and doctor-question prompts dynamically from Shared Memory.

---

## 7. Voice (STT) Implementation

**File:** [`backend/services/whisper_client.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/services/whisper_client.py)  
**Endpoint:** `POST /api/voice/transcribe` (accepts any audio MIME, e.g. `audio/webm`)

### Transcription cascade
| Priority | Engine | Notes |
|---|---|---|
| 1 | **Whisper local** (`base` model) | Offline-capable; requires `ffmpeg` on PATH |
| 2 | **Gemini GenAI SDK** (`google.genai`) | New SDK with audio `Part.from_bytes()` |
| 3 | **Legacy Gemini SDK** (`google-generativeai`) | Fallback for SDK version mismatches |
| 4 | **Demo fallback string** | Prevents crash; returns canned "mild cramps" phrase |

- Prompt instructs transcription in **English, Hindi, or Hinglish as spoken** — bilingual support built in.

---

## 8. Escalation Safety Model

> **Critical architectural property:** The Escalation Agent is consulted on **every single turn** of the Orchestrator. It cannot be bypassed by message content or user routing intent.

### Red-flag rule table (from `backend/rules/red_flag_table.json`)

| Rule ID | Conditions (any match triggers) | Level | Helplines |
|---|---|---|---|
| `severe_pain_heavy_bleeding` | `severe_abdominal_pain` OR `heavy_bleeding` | urgent | 112, 181 |
| `missed_period_severe_symptoms` | `missed_period` OR `severe_pain_or_fainting_or_heavy_bleeding` | urgent | 112, 181 |
| `prolonged_bleeding` | `bleeding_duration_gt_7_days` | urgent | 112, 181 |
| `mental_health_crisis` | `suicidal_ideation` OR `severe_distress` OR `self_harm` | urgent | 14416 |
| `abuse_indicators` | `signs_of_abuse` OR `signs_of_violence` | urgent | 181 |
| `minor_involved` | `user_is_minor` | urgent | 1098 |
| `routine_pms` | `mild_cramping` OR `typical_pms_symptoms` OR `single_missed_period_no_other_symptoms` | routine | *(no escalation)* |

### SMS content structure
```
This is an automated alert from your women's health app.
Your recent check-in included symptoms that may need urgent attention.
Please contact:
<Helpline Label(s)>
[Nearest hospital: <Name> — <Google Maps link>]   ← additive, never blocks
If this is a life-threatening emergency, call 112 immediately.
```

### Location fallback (as implemented)
- `escalation_agent.run()` tries `get_nearest_hospital(user_location)` in a `try/except`.
- SMS fires **before** hospital lookup completes (non-blocking).
- If location is `None` or lookup fails → SMS sends without the hospital line.

---

## 9. textbee.dev (SMS Gateway) — Implementation Notes

**File:** [`backend/services/textbee_client.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/services/textbee_client.py)

- `POST https://api.textbee.dev/api/v1/gateway/send-sms`
- Auth: `x-api-key: <TEXTBEE_API_KEY>` header.
- Payload: `{"recipients": ["<E.164>"], "message": "<body>"}`.
- Free tier: 50 SMS/day, 300/month — routes through a real Android SIM (no pre-verified recipient restriction unlike Twilio trial).

> **Demo-day dependency:** the linked Android phone must be powered on, internet-connected, and have SIM signal during the presentation.

---

## 10. Google Maps (Nearest Hospital) — Implementation Notes

**File:** [`backend/services/maps_client.py`](file:///c:/sih%20hackathon/womens-health-sih/backend/services/maps_client.py)

- Calls `https://maps.googleapis.com/maps/api/place/nearbysearch/json` with `type=hospital`, `radius=20000` (20 km), sorted by distance.
- Returns `{name, address, lat, lng, maps_link}` where `maps_link = https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`.
- API key from `GOOGLE_MAPS_API_KEY` env var — never hardcoded.

---

## 11. Lab Reference Ranges (from `backend/rules/lab_reference_ranges.json`)

> **Starter table only** — must be validated against a vetted medical source before demo.

| Test | Unit | Low | High | Notes |
|---|---|---|---|---|
| Hemoglobin | g/dL | 12.0 | 15.5 | Anemia flag; high prevalence in target population |
| TSH | mIU/L | 0.4 | 4.0 | Both high and low flagged |
| Estrogen | pg/mL | — | — | Cycle-phase-dependent; flag as "needs clinical interpretation" |
| Progesterone | ng/mL | — | — | Same as Estrogen |
| LH | mIU/mL | — | — | Same as Estrogen |
| FSH | mIU/mL | — | — | Same as Estrogen |

Report-Reader Agent's Gemini prompt instructs flagging by `status: normal | high | low | attention` — the LLM also references ranges printed in the OCR text itself, so the system benefits from ranges embedded in the actual report even beyond this table.

---

## 12. Non-Functional Requirements

| Requirement | Implementation |
|---|---|
| **Privacy & consent** | DPDP Act 2023 aligned; location accessed only on escalation with consent; no report images stored on disk beyond OCR extraction |
| **Authentication security** | Firebase OTP only; HMAC-signed demo tokens for local dev; no stored passwords |
| **Language accessibility** | Hindi + English bilingual: frontend greeting in Hindi ("नमस्ते"); Whisper STT prompt supports Hindi/Hinglish; Cycle Agent prompt requests language-aware response |
| **Offline/low-bandwidth resilience** | Whisper runs locally (no network); Shared Memory reads from disk; fallback strings at every LLM/API call prevent crashes |
| **Explainability** | Every agent response includes `sources[]` (Cycle Agent) or `disclaimer` text; Report-Reader preserves extracted values + reference range from the actual report |
| **Safety-first design** | Escalation rules are hardcoded JSON thresholds, not ML-inferred; flag vocabulary is a closed enum, not free-form LLM output |
| **Graceful degradation** | Five-level fallback chain on OCR and STT; hard-coded demo text prevents blank responses during demos without full API key setup |

---

## 13. Environment Variables (all stored in `backend/.env`, never committed)

| Variable | Service |
|---|---|
| `TEXTBEE_API_KEY` | textbee.dev SMS gateway |
| `FIREBASE_API_KEY` | Firebase (frontend) |
| `FIREBASE_AUTH_DOMAIN` | Firebase (frontend) |
| `FIREBASE_PROJECT_ID` | Firebase (frontend + backend) |
| `FIREBASE_STORAGE_BUCKET` | Firebase (frontend) |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase (frontend) |
| `FIREBASE_APP_ID` | Firebase (frontend) |
| `FIREBASE_ADMIN_CREDENTIALS` | Path to `firebase-admin-key.json` for Firestore sync |
| `GOOGLE_CLOUD_VISION_API_KEY` | Cloud Vision OCR (Blaze project) |
| `GOOGLE_MAPS_API_KEY` | Places API – hospital lookup (Blaze project) |
| `GOOGLE_TTS_API_KEY` | Cloud TTS (Blaze project) |
| `GEMINI_API_KEY` | All LLM calls (must be an **unbilled** AI Studio project — separate from the Blaze project above) |
| `AUTH_DEMO_SECRET` | HMAC key for local demo tokens |

---

## 14. API Endpoint Reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Health check — returns `{status: "ok", version: "2.0"}` |
| `POST` | `/api/auth/demo-token` | Issue local demo token by `user_id` |
| `GET` | `/api/me/context` | Return full Shared Memory context for authenticated user |
| `POST` | `/api/voice/transcribe` | STT: upload audio file → returns `{text, language, engine}` |
| `POST` | `/api/reports/upload` | Multipart upload → OCR → Report-Reader Agent → save to history |
| `GET` | `/api/reports` | Return `report_history[]` for `user_phone` |
| `POST` | `/api/reports/extract` | Report-Reader Agent from existing `ocr_text` or `file_path` |
| `POST` | `/api/daily-log` | Log mood/symptoms → Intake + Escalation + Care-Plan agents |
| `GET` | `/api/cycle/status` | Return current phase, day, countdown, RAG guidance |
| `POST` | `/api/cycle/log` | Update cycle parameters and reset cycle day |
| `GET` | `/api/doctor-summary` | Generate dynamic doctor-visit summary from Shared Memory |
| `GET` | `/api/education/insights` | Return tip of the day + article list |
| `POST` | `/api/emergency/trigger` | Direct escalation: Intake + Escalation agents + SMS |
| `GET` | `/api/user/profile` | Return user profile from Shared Memory |
| `POST` | `/api/user/profile` | Update user profile fields in Shared Memory |
| `POST` | `/api/chat` | Main Orchestrator chat endpoint |

---

## 15. Success Metrics (for demo/judging)

| Metric | Target |
|---|---|
| % of red-flag test scenarios correctly escalated | **100%** in the demo test set |
| Report-Reader extraction accuracy on sample reports | All key biomarkers extracted + correctly flagged |
| Escalation SMS delivery | Real SMS delivered to judge's phone during live demo |
| Time-to-actionable-guidance (end-to-end latency) | < 5 seconds for chat; < 15 seconds for report OCR + analysis |
| Qualitative: multi-agent reasoning visibly better than single-LLM | Demo scenario: routine cycle chat interrupted mid-flow by red-flag symptom |

---

## 16. Out of Scope (v1 / Hackathon Build)

- Direct medication prescription or dosage guidance.
- Video/AR consultations.
- Full EHR integration with hospital systems (stub referral hand-off is sufficient).
- Multi-tenant clinic/hospital admin dashboards.
- Semantic vector embeddings for RAG (current implementation uses keyword overlap scoring).
- OpenCV image preprocessing (grayscale, deskew) — deferred; Vision API + Gemini Vision handle most phone-camera quality variations.

---

## 17. Decisions Locked (Updated)

| Decision | Resolution |
|---|---|
| Languages | Hindi + English (voice + text) |
| LLM provider | Google Gemini (`gemini-3.5-flash` primary, fallback chain) |
| OCR strategy | Google Cloud Vision API primary; Gemini Vision (new + legacy SDK) as fallback chain |
| STT strategy | Whisper local (base model) primary; Gemini Audio as fallback |
| SMS gateway | **textbee.dev** (not Twilio — trial-tier verified-recipient restriction was a blocker) |
| Maps | Google Maps Places API Nearby Search, `type=hospital`, 20 km radius |
| Escalation logic | Rule-based `if/else` over JSON threshold table — **not ML-inferred** |
| Location fallback | Helpline SMS always fires immediately; hospital map link is additive and never blocks |
| Auth | Firebase Phone/OTP + `localStorage` session on frontend; Firebase Admin verify on backend |
| Shared memory persistence | In-process dict → disk JSON → Firestore (three-tier, Firestore optional) |
| Agent orchestration | **Hand-rolled chained function calls** — no LangGraph/CrewAI dependency |
| Frontend | Next.js 14 App Router + React 18 + Tailwind CSS v3 |
| AI companion persona | **Maya** — named consistently across frontend UI and backend prompt personas |

---

## 18. Open Questions (Still Unresolved)

1. **SIH problem statement number/ministry mapping** — confirm so PRD language matches official evaluation criteria.
2. **textbee.dev account ownership** — which team member owns it; which Android phone is the linked SMS device for demo day.
3. **Google Cloud Blaze project ownership** — which team member owns billing for Vision / Maps / TTS APIs.
4. **Lab reference range validation** — the table in `rules/lab_reference_ranges.json` must be reviewed against a vetted clinical source (not LLM general knowledge) before demo. Hormone panels (Estrogen, Progesterone, LH, FSH) currently have no numeric bounds.
5. **Red-flag symptom table medical review** — `rules/red_flag_table.json` is a hackathon starting point. Should a medical advisor review it before the demo?
6. **Cycle RAG corpus (`data/cycle_guidelines.json`)** — confirm contents are sourced from and attributable to WHO/UNICEF/CDC/ACOG as stated in the Cycle Agent prompt, and that source URLs in `citation_list()` are accurate.
7. **ASHA worker / family member role scoping** — not yet implemented in the auth layer beyond the PRD spec. Confirm if a scoped-access view is needed for the demo.

