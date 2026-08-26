# Product Requirements Document
## Agentic AI Women's Health Platform
**Smart India Hackathon — Team Draft v1**

---

## 1. Problem Statement

Women across India, especially in semi-urban and rural areas, face fragmented access to reproductive and general health guidance. Symptoms go untracked, lab/diagnostic reports go unread or misunderstood, follow-up care is inconsistent, and red-flag symptoms are often missed until conditions worsen. Existing health apps are largely passive trackers — they log data but don't reason over it, don't read reports, and don't act.

This platform aims to close that gap with an **agentic AI system**: a coordinated team of specialist AI agents that intake a woman's health information (text, voice, or image), understand her menstrual/reproductive cycle context, read and interpret her medical reports, generate personalized care plans, and escalate to real care (human doctors, helplines, referrals) when needed — with a persistent memory of her health context across every interaction.

---

## 2. Goals & Objectives

- Give women a single, always-available entry point (text/voice/image) for health questions and tracking.
- Move beyond passive logging to **active reasoning**: interpret cycle data, flag anomalies, read diagnostic reports.
- Reduce delay between symptom onset and appropriate care-seeking, especially for red-flag conditions.
- Produce explainable, non-diagnostic guidance that always routes toward qualified human care when stakes are high.
- Build a system architecture that a panel can see is genuinely agentic (multi-agent orchestration, shared memory, autonomous action) rather than a single-prompt chatbot wrapper.

**Explicitly not a goal:** replacing doctors, providing definitive diagnoses, or prescribing medication.

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
User Input (text/voice/image)
        │
        ▼
   Orchestrator Agent (routes to specialist agents)
        │
   ┌────┼────────┬─────────────┬───────────────┐
   ▼    ▼         ▼             ▼               ▼
Intake  Cycle   Report-Reader  Care-Plan     Escalation
Agent   Agent   Agent (OCR+VLM) Agent        Agent
   │    │         │             │               │
   └────┴─────────┴─────────────┴───────────────┘
                    │
              Shared Memory / Patient Context Store
                    │
              Action Layer (reminders, referrals, reports)
```

### 4.1 Orchestrator Agent
- Single entry point for all user input.
- Classifies intent (symptom check-in, cycle logging, report upload, general question, emergency).
- Routes to one or more specialist agents; merges their outputs into one coherent response.
- Owns conversation state and decides when to invoke the Escalation Agent regardless of which specialist is active (safety net — see §7).

### 4.2 Intake Agent
- First-contact structured data collection: demographics, symptoms, duration/severity, relevant history.
- Normalizes free-text/voice input (including regional language) into structured fields for the Shared Memory Store.
- Runs lightweight triage classification (routine / needs-monitoring / urgent) that the Orchestrator uses to decide routing priority.

### 4.3 Cycle Agent
- Ingests menstrual cycle logs (dates, flow, symptoms, mood, pain level).
- Predicts next cycle window, ovulation window; detects irregularity patterns (e.g., missed periods, abnormal length/flow trends) against the user's own historical baseline.
- Surfaces cycle-linked symptom correlations to the Care-Plan Agent (e.g., recurring severe pain each cycle).

### 4.4 Report-Reader Agent (OCR + VLM)
- Accepts photos/PDFs of lab reports, prescriptions, ultrasound summaries.
- OCR + vision-language model extracts key values (e.g., hemoglobin, hormone panels, thyroid, ultrasound findings) and flags values outside reference ranges.
- Translates clinical terminology into plain language for the user, with the original values preserved for accuracy.
- **Does not generate a diagnosis** — outputs structured findings + "discuss with your doctor" framing for anything abnormal.

### 4.5 Care-Plan Agent
- Synthesizes Intake + Cycle + Report-Reader outputs into a personalized, non-prescriptive care plan: lifestyle guidance, symptom-monitoring checklist, suggested follow-up timeline, general nutrition/self-care pointers.
- Generates reminders (medication/supplement timing, follow-up test dates, next expected cycle) for the Action Layer.
- Explicitly cites what stage of guidance this is (general wellness info vs. "please consult a doctor").

### 4.6 Escalation Agent
- Continuously monitored trigger, not a agent invoked only on request — the Orchestrator checks its rules on every turn.
- Maintains a rule set for red-flag symptoms (e.g., heavy bleeding beyond X days, severe abdominal pain, pregnancy complications, suicidal ideation/mental health crisis, signs of abuse).
- On trigger: interrupts normal flow, surfaces appropriate emergency guidance/helpline numbers immediately, and creates a structured referral summary for a human provider or ASHA worker.
- Uses the user's location (with consent) plus the Google Maps Places API to identify the nearest hospital/clinic, and includes a Google Maps link to it directly in the escalation SMS alongside the helpline number.
- For the hackathon demo, this hand-off is a **real integration** (not mocked): an SMS/call gateway (e.g., Twilio) fires an actual SMS to the user with helpline/next-step information and, if configured, notifies a connected ASHA worker/provider number — demonstrating genuine end-to-end action rather than a simulated alert screen.
- Never delays or downplays an urgent flag to keep the conversation "smooth" — safety response takes priority over conversational continuity.

### 4.7 Shared Memory / Patient Context Store
- Persistent, structured store per user: demographics, cycle history, symptom timeline, report history, prior care plans, consent/privacy settings.
- All agents read from and write to this store so context carries across sessions (a report uploaded today informs cycle guidance next month).
- Encrypted at rest; access scoped per agent (principle of least privilege — e.g., Cycle Agent doesn't need raw report images).

### 4.8 Action Layer
- Executes outputs: push notification reminders, generates shareable PDF summaries for doctor visits, initiates referral hand-off (e.g., to ASHA worker dashboard or telemedicine partner), logs completed actions back to Shared Memory.
- On escalation, calls the Google Maps Places API to locate the nearest hospital to the user's current/last-shared location and embeds a map link in the outbound SMS.

### 4.9 User Authentication
- Users create an account (phone number + OTP login, aligned with the SMS gateway already in use) so the Shared Memory/Patient Context Store can persist securely across sessions and devices.
- Login gates access to personal health history, cycle data, and uploaded reports; anonymous/guest mode (if offered) is limited to general Q&A with no data persistence.
- Session handling supports the "family member" and "ASHA worker" consented-access roles described in §3, scoped by permission level (e.g., ASHA worker sees flagged/escalated cases only, not full report history, unless the user grants broader access).

---

## 5. Core User Flows

0. **Login / account creation** — User signs up or logs in via phone number + OTP → Orchestrator loads (or initializes) her profile from Shared Memory before any other flow begins.
1. **Cycle logging & prediction** — User logs period via chat/voice → Cycle Agent updates prediction → Care-Plan Agent offers relevant tips → Action Layer sets next-cycle reminder.
2. **Report upload & interpretation** — User photographs a lab report → Report-Reader Agent extracts + flags values → Care-Plan Agent contextualizes against cycle/symptom history → if abnormal, Escalation Agent adds a "discuss with doctor" referral summary.
3. **Symptom check-in** — User describes a symptom (text/voice) → Intake Agent structures it, runs triage → Orchestrator checks Escalation rules → routine cases go to Care-Plan Agent for guidance; urgent cases go straight to Escalation Agent, which sends an SMS with the helpline number and a Google Maps link to the nearest hospital.
4. **Doctor visit prep** — User requests a summary → Action Layer compiles a structured report from Shared Memory (cycle history, flagged report values, symptom timeline) as a shareable PDF.

---

## 6. Non-Functional Requirements

- **Privacy & consent:** Reproductive health data is highly sensitive. Explicit opt-in for data storage, family-member sharing, ASHA worker visibility, and location access (for the nearest-hospital lookup). Compliant with India's DPDP Act 2023 principles (purpose limitation, data minimization, user consent, right to erasure).
- **Authentication security:** OTP-based login only (no stored passwords); session tokens expire and require re-auth for sensitive actions like report deletion or account access changes.
- **Language accessibility:** Support Hindi and English via voice and text input for low-literacy users.
- **Offline/low-bandwidth resilience:** Core intake and reminders should degrade gracefully on low connectivity (common in rural deployment contexts).
- **Explainability:** Every AI-generated recommendation should be traceable to the input (symptom, cycle data, or report value) that produced it — no black-box claims.
- **Safety-first design:** Escalation Agent rules are hard-coded thresholds, not purely model-inferred, to keep red-flag detection auditable and reliable.

---

## 7. Escalation Safety Model (Cross-Cutting)

The Escalation Agent is **not just another branch** in the flowchart — it's a safety layer the Orchestrator consults on *every* turn, in parallel with normal routing. This should be emphasized in the hackathon demo: show a scenario where a routine cycle-logging conversation suddenly includes a red-flag symptom, and the system interrupts to escalate rather than continuing the pleasant chat flow.

### 7.1 Helpline Number List (Vetted, National)

These are government-operated, verifiable helplines to hardcode into the Escalation Agent's rule set — not model-generated numbers. Trigger the most relevant one(s) based on the category of red flag detected; default to 112 for anything ambiguous or immediately life-threatening.

| Helpline | Number | Use Case |
|---|---|---|
| National Emergency (ERSS) | **112** | Any immediate/life-threatening emergency — police, fire, ambulance, women's safety |
| Women Helpline (Ministry of WCD) | **181** | Violence, harassment, abuse, distress; connects to police/hospital/legal aid referral |
| Tele-MANAS (Mental Health, Govt. of India) | **14416** or **1800-891-4416** | Mental health crisis, suicidal ideation, severe distress — 24/7, English + regional languages |
| Child Helpline | **1098** | If the user is a minor or reporting concern for a minor |

*Note:* State-specific numbers exist too (e.g., Delhi Commission for Women, Gujarat's 181 Abhayam app) but for a national-scope hackathon demo, the four numbers above are sufficient and won't need per-state configuration.

### 7.2 Twilio (SMS/Call Gateway) Setup Checklist

- Create a Twilio trial account; verify a real phone number (trial accounts can only send to verified numbers, so pre-verify all demo phones before the presentation).
- Provision a Twilio phone number for outbound SMS (trial numbers work for a live demo).
- Store `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and the Twilio sender number as environment variables/secrets — never hardcoded in the repo.
- Escalation Agent constructs the SMS body as: red-flag summary (plain language) + relevant helpline number(s) from §7.1 + nearest-hospital Google Maps link (see §4.7) + a line encouraging the user to seek in-person care immediately.
- Log every sent escalation SMS (timestamp, trigger reason, recipient — anonymized in any demo materials) to Shared Memory for audit/follow-up tracking.
- Trial-account limitation to flag to the team early: outbound SMS/calls only reach Twilio-verified numbers unless the account is upgraded to a paid tier — decide before the demo whether judges' phones need to be pre-verified or whether a small team budget covers an upgrade.

### 7.3 Google Maps (Nearest Hospital) Setup Checklist

- Enable the **Places API** (and **Maps JavaScript API** if a map view is shown in-app, not just a link) in a Google Cloud project; enable billing (Google provides a free monthly usage credit that comfortably covers hackathon-scale demo traffic).
- Store the `GOOGLE_MAPS_API_KEY` as an environment variable/secret, restricted by API and by IP/referrer where possible — never hardcoded in the repo or exposed client-side unrestricted.
- Escalation Agent calls Places API "Nearby Search" with the user's last-known coordinates + `type=hospital`, sorted by distance; takes the top result's name, address, and a `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>` link to embed in the SMS.
- Cache the nearest-hospital lookup result briefly (e.g., per session) to avoid redundant API calls if multiple escalations fire close together.

### 7.4 Location Fallback Behavior (Resolved)

**Decision: the helpline number always goes out immediately, regardless of location availability — the hospital link is additive, never a blocker.**

Rationale: in a genuine emergency, delaying the SMS to first request location permission could cost critical time, and a user in crisis may not be able to respond to a permission prompt at all.

Flow:
1. On escalation trigger, the Orchestrator checks Shared Memory for a recent (e.g., last 24h) or app-permitted live location.
2. **If location is available:** SMS includes both the helpline number(s) and the nearest-hospital map link in one message.
3. **If location is not available:** SMS sends immediately with helpline number(s) only. A separate, non-blocking follow-up (in-app prompt, not another SMS) asks the user to share location so a hospital link can be sent as a second message if they do.
4. Location is only requested/used with prior consent (per §6 Privacy & Consent) — a user who has declined location sharing altogether simply always gets path 3, silently, with no repeated prompting during an active escalation.

---

## 8. Technical Implementation Foundations

This section captures the baseline technical knowledge and approach each agent's implementation should be built on. It's deliberately scoped simple — the goal is a working, explainable hackathon build, not a research system.

### 8.1 Agent / LLM Logic

- **Structured output:** Every agent (Intake, Cycle, Report-Reader, Care-Plan) should prompt the LLM to return structured JSON, not free text, so the Orchestrator and Shared Memory Store can reliably parse and act on it. Validate/repair malformed JSON output before writing to memory.
- **Orchestration approach:** LangGraph or CrewAI are options if the team wants formal multi-agent state management, but for a solo/small-team hackathon build, a simpler hand-rolled chain of function calls (Orchestrator → calls the relevant agent function(s) → merges results) is easier to build, debug, and explain to judges. Recommend defaulting to the simpler approach unless someone on the team already has LangGraph/CrewAI experience.
- **Rule engine, not ML, for thresholds:** Red-flag detection and value-range flagging should be a plain Python if/else engine driven by a JSON table of thresholds (see §8.4) — not a trained ML model. This keeps the safety-critical logic auditable, testable, and fast to build, and avoids the risk of an ML model missing a red flag in ways that are hard to explain to judges or trust in a health context.

### 8.2 OCR & Report Understanding (Report-Reader Agent)

- **OCR engine:** Tesseract (free, offline-capable) or Google Vision API (higher accuracy, especially on varied phone-camera photos of printed reports) — Vision API is the safer choice for demo reliability given real-world report photos are often skewed/low-quality.
- **Preprocessing (OpenCV):** grayscale conversion, deskewing, and thresholding before OCR meaningfully improves extraction accuracy on phone-camera photos of paper reports — worth the extra implementation time.
- **Extraction pipeline:** Run OCR to get raw text → feed that text into an LLM prompt asking it to extract structured values (test name, value, unit, reference range) as JSON → cross-check extracted values against the reference-range table (§8.4) to flag abnormals, rather than trusting the LLM's own judgment of "normal vs. abnormal."

### 8.3 Voice (Hindi + English)

- **Speech-to-text:** Whisper — the smaller model sizes (base/small) are usually sufficient for short health check-in utterances and run faster/cheaper than large models; test accuracy on Hindi specifically since accuracy varies more by language than English.
- **Text-to-speech:** Coqui TTS (open-source, more control) or Google TTS (simpler integration, strong Hindi support) — Google TTS is the lower-risk choice for demo reliability given limited build time.
- **Audio handling:** pydub or librosa for basic format conversion/trimming before sending audio to Whisper.

### 8.4 Domain Knowledge Reference Tables (Required Before Building Care-Plan / Escalation Logic)

These must be written down as explicit reference tables the rule engine reads from — not left to LLM judgment — since they drive safety-critical decisions.

**Menstrual cycle basics:**
- Average cycle length: ~21–35 days is typically considered normal (varies by individual); flag as irregular if outside this range or if cycle length varies significantly month to month for the same user.
- Ovulation window: typically ~14 days before the next expected period.
- "Irregular" for this app's purposes should be defined relative to the *user's own historical baseline* once enough cycles are logged, not just a fixed population range.

**Common lab values relevant to women's health** (a starter table to expand with a vetted medical reference before building the Report-Reader Agent's flagging logic):

| Test | Typical Reference Range (adult women) | Notes |
|---|---|---|
| Hemoglobin | ~12–15.5 g/dL | Low values relevant to anemia, common in this population |
| TSH (thyroid) | ~0.4–4.0 mIU/L | Both high and low flagged |
| Estrogen, Progesterone, LH, FSH | Vary significantly by cycle phase | Reference ranges must be cycle-phase-aware — flag as "needs clinical interpretation" rather than a simple high/low if phase isn't known |

*This table is a starting point only — do not ship these numbers without validating them against a proper vetted medical source (see §11 open question on reference-range data source).*

**Red-flag symptom table** (drives the Escalation Agent's rule engine — write as data, not prose, so it's easy to test and extend):

| Symptom Combination | Escalation Level |
|---|---|
| Severe abdominal/pelvic pain + heavy bleeding | Urgent — escalate |
| Missed period(s) + severe pain, fainting, or heavy bleeding | Urgent — escalate |
| Bleeding significantly beyond normal duration (e.g., >7 days) | Urgent — escalate |
| Suicidal ideation or expressions of severe distress/self-harm | Urgent — escalate (Tele-MANAS + relevant helpline) |
| Signs described consistent with abuse/violence | Urgent — escalate (181 + relevant support) |
| Mild cramping, typical PMS symptoms, single missed period with no other symptoms | Routine — Care-Plan Agent handles, no escalation |

*This table should be reviewed with a medical advisor or reliable clinical source before the demo — it is a hackathon-scope starting point, not a clinically validated protocol.*

---

## 9. Success Metrics (for demo/judging)

- % of red-flag test scenarios correctly and immediately escalated (target: 100% in demo test set).
- Report-Reader Agent extraction accuracy against a sample set of real/anonymized lab reports.
- Cycle prediction accuracy after N logged cycles.
- Time-to-actionable-guidance from user input (latency across the agent chain).
- Qualitative: judges' assessment of whether the multi-agent reasoning is visibly better than a single-LLM chatbot baseline.

---

## 10. Out of Scope (v1 / Hackathon Build)

- Direct medication prescription or dosage guidance.
- Video/AR consultations (future roadmap).
- Full EHR integration with hospital systems (stub/mock referral hand-off is sufficient for demo).
- Multi-tenant clinic/hospital admin dashboards (single ASHA-worker view is sufficient for demo).

---

## 11. Decisions Locked

- **Languages:** Hindi and English (voice + text).
- **Escalation hand-off:** Real integration via SMS/call gateway (Twilio) for the demo, not a simulated alert.
- **Escalation SMS content:** Helpline number(s) from the vetted list in §7.1 + a Google Maps link to the nearest hospital, when location is available (see §7.4 for fallback).
- **Helpline numbers:** 112 (national emergency), 181 (women helpline), 14416 (Tele-MANAS mental health), 1098 (child helpline) — see §7.1.
- **Location fallback:** Helpline SMS always sends immediately; hospital map link is additive and never blocks or delays the message (see §7.4).
- **User login:** Phone number + OTP authentication required to persist personal data; scoped access for family member / ASHA worker roles.
- **Agent orchestration:** Default to simple chained function calls rather than LangGraph/CrewAI, unless a team member already has framework experience (see §8.1).
- **Red-flag & reference-range logic:** Rule-based (if/else + JSON threshold tables), not ML — see §8.4 tables.
- **OCR:** Google Vision API preferred over Tesseract for demo reliability on phone-camera report photos (see §8.2).
- **Voice:** Whisper (STT, small/base model) + Google TTS preferred for demo reliability (see §8.3).

## 12. Open Questions for the Team

- Which specific SIH problem statement number/ministry is this mapped to, if any — worth confirming so the PRD language matches official evaluation criteria.
- Twilio trial account: confirm which team member owns it, and pre-verify all demo phone numbers before presentation day.
- Google Cloud project for Maps API: confirm which team member owns billing/the project.
- Data source for report interpretation reference ranges — need a vetted source (not just LLM general knowledge or the starter table in §8.4) for accuracy/safety.
- Should the red-flag symptom table (§8.4) be reviewed by an actual medical advisor before the demo, and if so, who can the team reach?

---

*Next: tech-stack doc, per the three-document workflow.*
