# Setup Guide: Environment Variables & Credentials
## Agentic AI Women's Health Platform — SIH Team

Do this **before writing any application code**, right after account creation (textbee.dev, Firebase, Google Cloud, Gemini).

---

## 1. Create a `.env` file in your backend folder

Plain text file named exactly `.env`. One line per credential, no quotes:

```
TEXTBEE_API_KEY=your_key_here

FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...

GOOGLE_CLOUD_VISION_API_KEY=...
GOOGLE_MAPS_API_KEY=...
GOOGLE_TTS_API_KEY=...

GEMINI_API_KEY=...
```

## 1a. Firebase Web Config Keys

Found via: Firebase Console → Settings (gear icon) → Project settings → General tab → scroll to "Your apps" → click your web app → copy the `firebaseConfig` object.

Add these to your `.env` file as well:

```
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

**Note:** unlike your textbee API key or Anthropic/OpenAI API key, Firebase's web config values are not meant to be kept secret — they identify your project, not authenticate as an admin. Real security comes from Firestore/Storage security rules, not from hiding this config. Still worth keeping as env vars for tidy practice and consistency with the rest of the credentials, but it's not a crisis if one leaks.

---

## 1b. Google Cloud API Key (Vision, Maps, Places, Text-to-Speech)

Found via: Google Cloud Console → APIs & Services → Credentials → Create Credentials → API key.

Enable only these four APIs (see tech-stack doc §2a — Speech-to-Text and Video Intelligence are NOT used):
- Cloud Vision API
- Maps JavaScript API
- Places API
- Cloud Text-to-Speech API

Restrict the key to only those four APIs under "API restrictions" for security.

If you created **one combined key** covering all four APIs, the same value goes into all three of these `.env` variables:

```
GOOGLE_CLOUD_VISION_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_TTS_API_KEY=your_key_here
```

(If you instead created separate keys per API for cleaner tracking, use the corresponding key value for each variable instead.)

---

## 1c. Google Gemini API Key (LLM Provider)

**Important:** Gemini must be linked to a project with **no billing account attached** — NOT the same project used for Firebase/Vision/Maps (which is on the paid Blaze plan). Linking Gemini to a billed project causes a "prepayment credits depleted" error instead of using the free tier. See tech-stack doc §2b for the full explanation.

**Resolution used:** When creating the key in Google AI Studio, select **"Default Gemini Project"** from the project dropdown — this is a project Google auto-provisions specifically for free-tier Gemini keys, kept separate from regular Cloud projects and never linked to billing. This was simpler than manually creating and managing a second Cloud project.

Found via: aistudio.google.com → sign in → in the **bottom-left icon row** (next to the notification bell, gear, and search icons, above your account email), click the **key/lock icon** → "Create API key" → select **"Default Gemini Project"** from the project dropdown → "Create key".

```
GEMINI_API_KEY=your_key_here
```

Default model for all agents: `gemini-3.6-flash` — free tier (15 RPM, 1,500 RPD, 1M token context, no payment method required), multimodal (also usable for the Report-Reader Agent's image understanding). Note: `gemini-2.5-flash` is deprecated for new users as of this setup — use `gemini-3.6-flash` instead.

Test the key before writing agent code:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello Gemini"}]}]}'
```
A response back confirms it's working. (Use single quotes around the JSON body, not escaped double quotes — avoids bash history-expansion errors from special characters like `!`.)

**Note:** The team initially considered Claude API (Anthropic), but Anthropic no longer offers a free tier — it requires a minimum $5 credit purchase. Gemini's free tier avoids this cost for the hackathon build.

---

## 1d. textbee.dev API Key (SMS Gateway for Escalation)

Switched from Twilio because Twilio's trial tier requires a paid upgrade to send SMS to unverified recipient numbers — a blocker discovered during testing. textbee.dev has a genuine permanent free tier (50 messages/day, 300/month) and sends to **any** number, no allowlist required, by using a real Android phone as the SMS gateway.

Setup:
1. Sign up at textbee.dev.
2. Install the textbee Android app (from textbee.dev/download) on any spare/team Android phone. Open it and grant SMS permissions.
3. Go to textbee.dev/dashboard → register your device / generate an API key.

```
TEXTBEE_API_KEY=your_key_here
```

Test the key before writing agent code:
```bash
curl -X POST "https://api.textbee.dev/api/v1/gateway/send-sms" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"recipients": ["+91YOUR_PHONE"], "message": "Test from textbee"}'
```
A real SMS should arrive on the recipient phone within seconds — no verification step needed first.

**Note:** the linked Android phone must stay powered on with an internet connection and a working SIM for SMS to send — worth keeping this phone charged and nearby on demo day.

---

## 2. Add `.env` to `.gitignore` — before your first commit

In the project root, create/edit `.gitignore` and add:

```
.env
```

Do this **before** `git init` / first commit so secrets never touch GitHub history, even briefly.

## 3. Load the `.env` file in Python code

```bash
pip install python-dotenv
```

At the top of your FastAPI entrypoint (`main.py`):

```python
from dotenv import load_dotenv
load_dotenv()
```

Then anywhere in the code:

```python
import os
textbee_key = os.environ.get("TEXTBEE_API_KEY")
```

The actual secret value never appears in source files.

## 4. Create a `.env.example` template — this one IS safe to commit

Same variable names, placeholder values only:

```
TEXTBEE_API_KEY=your_key_here
...
```

Commit this file to GitHub so teammates know exactly what variables they need, without ever seeing a real secret.

## 5. Share real credentials securely

- Each teammate copies `.env.example` → their own local `.env` and fills in real values, **or**
- Share real values via a password manager / private vault — never Slack, WhatsApp, email, or chat in plain text.
- If a secret (especially an Auth Token, not just an SID) is ever accidentally shared in plain text, **regenerate it** from the provider's console rather than assuming it's fine.

## 6. Cycle Agent RAG corpus

The Cycle Agent retrieves from a local corpus of public menstrual-health guidance. Install the parser dependency and fetch the current source pages from the backend directory:

```bash
pip install -r requirements.txt
python scripts/fetch_cycle_guidelines.py
```

This creates `backend/data/cycle_guidelines.json`. The corpus contains public guidance metadata and text only; never add patient data, phone numbers, uploaded reports, or private Firestore records. Refresh it before a demo and review any changes with a qualified medical advisor.

## 7. On deployment (Render/Railway/Vercel later)

Don't upload `.env` itself. Paste each variable into the hosting platform's own **Environment Variables** settings panel in its dashboard.

---

*This applies to every credential in the tech-stack doc's checklist — textbee.dev, Firebase, Google Cloud (Vision/Maps/TTS), and the LLM provider API key.*
