# Design Doc
## Agentic AI Women's Health Platform
**Smart India Hackathon — Team Draft v1**

---

## 1. Design Direction

**Premium, human, and calm** — not a clinical dashboard, not a novelty chatbot.

The product should feel like a combination of:
- A trusted health companion (warm, attentive, never clinical-cold)
- A modern, editorial wellness brand (think considered typography and generous white space, not cluttered forms)
- A quietly confident utility — the AI reasoning happens, but the interface never shows off about it

**Explicitly avoid the default AI-app look:** purple/blue gradients, glowing orbs, futuristic robot avatars, neon accents. That aesthetic reads as generic and impersonal — the opposite of what a health companion for sensitive, personal topics should feel like.

**Core feeling the whole product should communicate:** *"Someone is here for you."* Not *"here is an AI system processing your data."* Every screen, message, and interaction should reinforce presence and care over technical capability.

---

## 2. Design Keywords

Warm · Calm · Human · Trustworthy · Editorial · Quiet · Approachable · Grounded

---

## 3. Color Palette

A warm, low-saturation palette — enough color to feel alive and personal, restrained enough to feel safe and non-alarming (important given the health/emergency context).

| Role | Color | Notes |
|---|---|---|
| Primary | Terracotta / warm clay (`#C97B5C`-ish) | Used for primary actions, warmth without medical sterility |
| Secondary | Deep sage green (`#5C7A64`-ish) | Calm, natural, used for confirmations and positive states |
| Background | Warm off-white / cream (`#FAF6F1`-ish) | Never pure white — softer, less clinical |
| Text | Deep charcoal, not pure black (`#2B2620`-ish) | Softer contrast, easier for extended reading |
| Escalation/Alert | Muted red-orange (`#C2452E`-ish) | Serious and legible, but not neon-alarming; reserved *only* for genuine escalation states so it retains urgency |
| Accent | Dusty rose / blush (`#E3B8A8`-ish) | Used sparingly — cycle-tracking visuals, illustrations |

Avoid saturated purple, electric blue, or gradient-heavy treatments entirely.

---

## 4. Typography

- **Headings:** A humanist serif or high-quality humanist sans (e.g., style similar to Fraunces, Tiempos, or GT Sectra for headings) — gives the "premium editorial" feel over generic startup-sans.
- **Body:** A clean, highly legible humanist sans (e.g., style similar to Inter, General Sans, or Söhne) for both English and Hindi (Devanagari) — must render both scripts cleanly at small sizes for low-bandwidth/low-end-device users.
- **Hierarchy:** Generous line height and spacing over dense information; this is a health app used by people who may be anxious or in a hurry — clarity beats density every time.

---

## 5. Visual Motifs

- Soft, organic shapes (rounded corners, gentle curves) rather than sharp geometric tech motifs.
- Simple, warm illustrations of women in everyday life (not stock-photo clinical imagery, not cartoonish mascots) for onboarding and empty states.
- No literal "AI" iconography (no bots, no orbs, no circuit patterns). If the multi-agent system needs a visual identity at all, represent it as a single warm, consistent presence — one voice, not five visible "characters."
- Cycle-tracking visuals: a soft circular calendar motif (a "ring" or "wheel"), not a sterile grid calendar — reinforces the cyclical, human nature of the data.

---

## 6. Key Screens (Conceptual)

1. **Login / OTP screen** — Minimal, warm, one clear input at a time; Hindi/English toggle visible immediately.
2. **Home / Check-in** — A simple prompt ("How are you feeling today?") in the user's language, with quick-access entry points to log symptoms, log cycle, or upload a report. No dashboard overload.
3. **Cycle view** — The circular calendar motif; gentle color shifts to indicate predicted windows, without medicalized labels.
4. **Report upload & interpretation** — Camera/upload action front and center; results shown in plain-language cards, technical values available on tap/expand rather than upfront.
5. **Chat / conversation view** — Warm, conversational bubbles; the Orchestrator speaks as one consistent voice regardless of which specialist agent produced the content — the user should never feel like they're being handed between bots.
6. **Escalation state** — A deliberate visual shift: calmer, more spacious, high-contrast, and direct. Clear helpline number, clear next step, clear map link. This is the one moment where clarity and urgency outrank the softer aesthetic — no cutesy illustration here.
7. **Doctor-visit summary (PDF/share)** — Clean, printable, minimal branding — this leaves the app and enters a clinical context, so it should read as a credible medical document, not a marketing artifact.

---

## 7. Tone of Voice (Copy)

- Warm, plain-language, never alarmist by default.
- Available in Hindi and English, matching the user's chosen language throughout — including escalation messages.
- Never uses definitive diagnostic language ("you have X") — always frames findings and guidance as information to bring to a doctor.
- Escalation copy is the one place tone shifts to direct and clear over gentle — urgency should read unmistakably, without panic-inducing language.

---

## 8. Accessibility Considerations

- High legibility at small sizes for low-end Android devices common in the target demographic.
- Color contrast meets accessibility standards, especially for the escalation state (must be legible in bright outdoor light, a common real-world condition).
- Voice input as a first-class interaction, not an afterthought, for lower-literacy users.
- Avoid relying on color alone to convey meaning (e.g., escalation state also uses copy and layout change, not just red color).

---

*Next: tech-stack doc, per the three-document workflow.*
