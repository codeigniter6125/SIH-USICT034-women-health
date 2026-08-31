---
name: Sangini Health
colors:
  surface: '#fdf9f4'
  surface-dim: '#ddd9d5'
  surface-bright: '#fdf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ee'
  surface-container: '#f1ede8'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e6e2dd'
  on-surface: '#2B2620'
  on-surface-variant: '#6E655C'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f4f0eb'
  outline: '#D4C8BB'
  outline-variant: '#d9c2ba'
  surface-tint: '#8f4c31'
  primary: '#8c4a2f'
  on-primary: '#ffffff'
  primary-container: '#F6EAE4'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb599'
  secondary: '#486550'
  on-secondary: '#ffffff'
  secondary-container: '#caebd0'
  on-secondary-container: '#4e6b56'
  tertiary: '#755447'
  on-tertiary: '#ffffff'
  tertiary-container: '#906c5f'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb599'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#72351c'
  secondary-fixed: '#caebd0'
  secondary-fixed-dim: '#aeceb5'
  on-secondary-fixed: '#042110'
  on-secondary-fixed-variant: '#304d39'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#e8bdad'
  on-tertiary-fixed: '#2d150c'
  on-tertiary-fixed-variant: '#5e4034'
  background: '#fdf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e6e2dd'
  escalation: '#C2452E'
  escalation-container: '#FAEAE6'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-base:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 24px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width-mobile: 480px
  max-width-dashboard: 840px
---

## Brand & Style

The design system is built upon a philosophy of **human-centric care and editorial elegance**. It deliberately rejects the cold, clinical aesthetic of traditional medical software and the flashy, robotic motifs of generic AI. Instead, it positions itself as a "trusted health companion"—warm, attentive, and quietly confident.

The visual style is a blend of **Minimalism** and **Tactile/Editorial** design. It prioritizes generous whitespace, soft organic shapes, and a grounded color palette to reduce cognitive load and emotional anxiety. The "Agentic" nature of the product is expressed not through futuristic UI, but through a singular, consistent, and empathetic presence that feels like a conversation with a knowledgeable friend.

**Key Brand Attributes:**
- **Tone:** Premium, calm, and grounded.
- **Visual Language:** Soft, rounded, and breathable.
- **Voice:** Empathetic, clear, and available in both English and Hindi with equal dignity.
- **Anti-Patterns:** No blue/purple gradients, no glowing orbs, no robotic icons, and no high-saturation "emergency" reds unless in critical escalation states.

## Colors

The palette is rooted in earth tones, designed to provide a stabilizing emotional effect. 

- **Primary (Terracotta):** Used for key actions and vitality. It provides warmth without the sterile feel of medical blue.
- **Secondary (Deep Sage):** Represents restorative health and safety. Used for verified insights and positive health states.
- **Tertiary (Dusty Rose):** An intimate accent reserved for cycle-tracking and delicate hormonal indicators.
- **Neutral (Warm Off-White):** The foundation of the UI. It replaces harsh pure white to reduce eye strain and clinical coldness.
- **Escalation (Muted Red-Orange):** A functional color used strictly for urgent health flags. It is legible and serious but lacks the panic-inducing vibration of bright neon red.

**Color Application Rules:**
- Avoid gradients. Use solid fills or very soft tonal shifts.
- Ensure all text meets WCAG AA standards against the cream background, specifically for the Deep Charcoal (`#2B2620`) text.

## Typography

The typography system uses a **Humanist Serif (Fraunces)** for headings to establish an editorial, "premium wellness" feel. This is paired with a **Humanist Sans (Plus Jakarta Sans)** for body and interactive elements to ensure high legibility, particularly for bilingual support (Hindi/English).

**Language Considerations:**
- For Hindi (Devanagari) scripts, use **Noto Serif Devanagari** for headlines and **Noto Sans Devanagari** for body text.
- Increase line height by approximately 10% when rendering Devanagari to prevent clipping of vowel marks (matras).
- Maintain generous line heights (1.6x for body) to assist users who may be reading complex medical information under stress.

## Layout & Spacing

The layout philosophy emphasizes **focus and serenity**. It uses a single-column flow for mobile to minimize distraction and a constrained asymmetric grid for desktop to maintain the "companion" feel without overwhelming the user with a "data dashboard."

**Layout Model:**
- **Mobile:** 16px side margins with a 4px/8px rhythmic grid. Content should be stacked vertically.
- **Desktop/Tablet:** Content is centered with a max-width of 840px. Use a 2-column layout where the left column handles summary/status and the right column handles the conversational "Care Chat."
- **Whitespace:** Use "generosity as a feature." At least 24px-32px of vertical space should separate major sections/cards to prevent visual crowding.

## Elevation & Depth

This design system avoids heavy shadows and deep 3D effects. Depth is communicated through **Tonal Layering** and **Hairline Outlines**.

- **Canvas:** The base layer is the Warm Cream (`#FAF6F1`).
- **Surface Layer:** Interactive cards and containers use a Pure White (`#FFFFFF`) background to subtly lift them from the canvas.
- **Outlines:** Use soft, 1px/1.5px hairline borders (`#D4C8BB`) instead of shadows to define card boundaries.
- **Shadows:** If a shadow is necessary for a floating element (like a FAB), use a very diffused, low-opacity tint: `0 2px 8px rgba(43, 38, 32, 0.04)`. This feels ambient and warm rather than digital.

## Shapes

The shape language is organic and soft. Sharp corners are strictly avoided as they feel clinical or aggressive.

- **Base Radius:** 0.5rem (8px) for small interactive elements.
- **Large Radius (rounded-lg/xl):** 1rem to 1.75rem for cards and main containers to create a "friendly" silhouette.
- **Pill Shapes:** Used for buttons and status chips to reinforce a modern, approachable feel.
- **Cycle Tracker:** All cycle-related visuals should utilize circular or "ring" geometry rather than square calendar grids.

## Components

**Buttons**
- **Primary:** Terracotta fill with white text. Pill-shaped, minimum 50px height. No shadow.
- **Secondary:** Deep Sage outline or light Sage fill.
- **Voice Action:** A floating 56x56px circular button in Terracotta, prioritized for accessibility.

**Cards**
- White background, `rounded-2xl` corners, and a sand-colored hairline border.
- Internal padding should be at least 20px.

**Chat Bubbles**
- **User:** Soft Terracotta tint (`#F6EAE4`), right-aligned.
- **AI Companion:** White with a hairline border, left-aligned.
- **Style:** "Speech" bubbles should have large radii (20px) with only the bottom corner indicating direction.

**Inputs**
- Clean white background, 1.5px sand border. On focus, transition border to Terracotta with a very soft, low-opacity glow.

**Escalation Banners**
- Pale red-orange background (`#FAEAE6`) with a 2px left-accent border in solid Escalation Red (`#C2452E`). Text must be deep and high-contrast.

**Cycle Wheel**
- A custom component using concentric rings or segments. Use Terracotta (period), Sage (safe), and Dusty Rose (fertile) to indicate phases.