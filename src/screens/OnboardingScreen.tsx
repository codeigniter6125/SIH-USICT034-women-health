import { useState } from "react";
import MayaAvatar from "../components/MayaAvatar";

interface Props { onComplete: () => void; }

const SLIDES = [
  {
    title: "Understand your health",
    body: "She Care helps you track your cycle, symptoms, and mood — and explains what the patterns mean, in plain language.",
    accent: "#2E6B6E",
    bg: "#EAF3F3",
    visual: (
      <div className="relative w-full h-52 flex items-center justify-center">
        {/* Concentric rings */}
        {[64, 100, 136].map((r, i) => (
          <div key={i} className="absolute rounded-full border border-[#2E6B6E]/15" style={{ width: r, height: r }} />
        ))}
        {/* Day marker */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="font-display text-6xl font-semibold text-[#2E6B6E] leading-none">14</span>
          <span className="text-sm font-semibold text-[#2E6B6E]/60 mt-1">Ovulatory Window</span>
        </div>
        {/* Phase dots */}
        {[0, 90, 180, 270].map((deg, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: ["#C9707A", "#BE7B6D", "#2E6B6E", "#6B8B4A"][i],
              transform: `rotate(${deg}deg) translateX(68px) rotate(-${deg}deg)`,
              top: "50%",
              left: "50%",
              marginTop: -6,
              marginLeft: -6,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "Talk to Maya, anytime",
    body: "Maya is your AI health companion. Ask her about your cycle, symptoms, or upload a report for a simple explanation.",
    accent: "#B8705E",
    bg: "#F9EEE9",
    visual: (
      <div className="space-y-3 px-2">
        {/* Maya message */}
        <div className="flex items-start gap-2.5">
          <MayaAvatar size={36} />
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8E3DB] max-w-[78%]">
            <p className="text-sm text-[#18110F] leading-relaxed">
              "Hi! I'm Maya. You're in your ovulatory window — here's what that may mean for you."
            </p>
          </div>
        </div>
        {/* User */}
        <div className="flex justify-end">
          <div className="bg-[#2E6B6E] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[72%]">
            <p className="text-sm text-white leading-relaxed">What symptoms are normal during this phase?</p>
          </div>
        </div>
        {/* Typing */}
        <div className="flex items-center gap-2.5">
          <MayaAvatar size={36} />
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8E3DB] flex items-center gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#C2DEDD] bounce-dot" style={{ animationDelay: `${i * 160}ms` }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Understand any report",
    body: "Upload a lab report or test result and Maya will extract the findings and explain each one in simple, reassuring language.",
    accent: "#5A7A48",
    bg: "#EDF3E8",
    visual: (
      <div className="space-y-2 px-2">
        {[
          { test: "Hemoglobin", val: "10.8", unit: "g/dL", status: "⚠️ Attention", color: "#C47A1A", bg: "#FDF3E3" },
          { test: "WBC Count", val: "7,400", unit: "/μL", status: "✓ Normal", color: "#5A7A48", bg: "#EDF3E8" },
          { test: "Ferritin", val: "8", unit: "ng/mL", status: "↓ Low", color: "#B91C1C", bg: "#FEF2F2" },
        ].map((f, i) => (
          <div key={i} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: f.bg }}>
            <div>
              <p className="text-sm font-semibold text-[#18110F]">{f.test}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display text-xl font-semibold" style={{ color: f.color }}>{f.val}</span>
                <span className="text-xs text-[#9B9390]">{f.unit}</span>
              </div>
            </div>
            <span className="text-xs font-semibold" style={{ color: f.color }}>{f.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Your data is private",
    body: "She Care never shares your health information without your consent. Your data is encrypted and stays yours.",
    accent: "#2E6B6E",
    bg: "#EAF3F3",
    visual: (
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-[#2E6B6E] flex items-center justify-center shadow-xl">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex flex-col gap-2 w-full">
          {["End-to-end encryption", "No data sold to third parties", "Your consent, your control"].map((f) => (
            <div key={f} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-[#E8E3DB]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A7A48" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-[#3D3330] font-medium">{f}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div
      className="min-h-dvh flex flex-col transition-colors duration-500"
      style={{ background: slide.bg }}
    >
      {/* Skip */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-400"
              style={{
                width: i === step ? 24 : 6,
                background: i <= step ? slide.accent : `${slide.accent}30`,
              }}
            />
          ))}
        </div>
        <button onClick={onComplete} className="text-sm font-medium" style={{ color: `${slide.accent}80` }}>
          Skip
        </button>
      </div>

      {/* Visual */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="w-full anim-scale-in" key={step}>
          {slide.visual}
        </div>
      </div>

      {/* Text + CTA */}
      <div className="px-6 pb-10">
        <div className="anim-slide-up" key={`text-${step}`}>
          <h2 className="font-display text-[28px] font-semibold text-[#18110F] leading-snug mb-3">
            {slide.title}
          </h2>
          <p className="text-base text-[#6E6460] leading-relaxed mb-8">{slide.body}</p>
        </div>
        <button
          onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
          className="w-full font-bold text-white rounded-2xl py-4 text-[15px] active:scale-[0.98] transition-transform"
          style={{ background: slide.accent }}
        >
          {isLast ? "Get started" : "Continue"}
        </button>
      </div>
    </div>
  );
}
