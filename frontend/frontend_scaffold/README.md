# Frontend Login Scaffold — Real Firebase Phone/OTP

This is a minimal Next.js app with ONE working page: real phone/OTP login using
Firebase, which gets you a real ID token to replace the backend's demo-token flow.

## Setup

1. Copy this whole folder into your project as `frontend/` (or merge into an
   existing `frontend/` folder if you already have one — this only adds
   `app/login/page.jsx`, `lib/firebase.js`, `app/layout.jsx`, `app/page.jsx`).

2. In a terminal, inside this folder:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and fill in your real Firebase
   web config values (same ones from `backend/.env`, just re-prefixed with
   `NEXT_PUBLIC_`).

4. In Firebase Console → Authentication → Settings → Authorized domains,
   confirm `localhost` is listed (it is by default) — required for the
   reCAPTCHA step to work locally.

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000/login` in your browser.

7. Also start your backend in a separate terminal (`uvicorn main:app --reload`
   from `/backend`) so the "Test backend call" button has something to hit.

## What this proves

- Real Firebase phone sign-in works (OTP actually sent to your phone).
- A real ID token is retrieved (not the `demo.` token format).
- That token successfully authenticates against your FastAPI backend's
  `current_user()` dependency via `Authorization: Bearer <token>`.

Once this works, you (or a teammate) can build out the rest of the actual UI
around this login flow — this scaffold is intentionally bare-bones, just
enough to prove the auth handshake end-to-end.
