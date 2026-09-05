import { useState } from "react";
import type { Screen } from "../App";
import MayaAvatar from "../components/MayaAvatar";
import { submitCheckIn } from "../lib/api";

interface Props { navigate: (s: Screen) => void; }

const MOODS = [
  { emoji: "😔", label: "Low",       val: 1, color: "#C9707A", bg: "#FBF0F1" },
  { emoji: "😕", label: "Meh",       val: 2, color: "#C48C7A", bg: "#F9EEE9" },
  { emoji: "😊", label: "Okay",      val: 3, color: "#C47A1A", bg: "#FDF3E3" },
  { emoji: "🌟", label: "Good",      val: 4, color: "#2E6B6E", bg: "#EAF3F3" },
  { emoji: "✨", label: "Wonderful", val: 5, color: "#5A7A48", bg: "#EDF3E8" },
];

const SYMPTOMS = [
  { label: "Cramps",         icon: "⚡", red: false },
  { label: "Fatigue",        icon: "😴", red: false },
  { label: "Bloating",       icon: "💫", red: false },
  { label: "Headache",       icon: "🤕", red: false },
  { label: "Mood swings",    icon: "🌊", red: false },
  { label: "Breast pain",    icon: "🩷", red: false },
  { label: "Spotting",       icon: "🔴", red: false },
  { label: "Severe cramps",  icon: "🚨", red: true  },
  { label: "Heavy bleeding", icon: "🚨", red: true  },
  { label: "Chest pain",     icon: "🚨", red: true  },
  { label: "Dizziness",      icon: "💫", red: false },
  { label: "Nausea",         icon: "🌀", red: false },
];

const MAYA_REPLIES: Record<number, string> = {
  1: "I hear you — some days feel heavy. Rest if you can. I'm here whenever you need.",
  2: "A 'meh' day is still a day. Be gentle with yourself today, Priya.",
  3: "Glad you're doing okay. Consistent check-ins are one of the best things you can do for your health.",
  4: "Wonderful! You're in your ovulatory phase — energy often peaks around now. Enjoy it.",
  5: "You're glowing! 🌟 Keep nurturing that energy. Want to know what might be behind this good feeling?",
};

export default function CheckInScreen({ navigate }: Props) {
  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [energy, setEnergy] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(7);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"mood" | "symptoms" | "biometrics" | "success">("mood");
  const [redFlag, setRedFlag] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCompleteCheckIn() {
    setSaving(true);
    try {
      await submitCheckIn({
        mood,
        symptoms: Array.from(symptoms),
        energy,
        sleep_hours: sleep,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      console.warn("Checkin save warning:", err);
    } finally {
      setSaving(false);
      setStep("success");
    }
  }

  const toggleSymptom = (label: string, isRed: boolean) => {
    const next = new Set(symptoms);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setSymptoms(next);
    const anyRed = SYMPTOMS.filter(s => s.red && next.has(s.label)).length > 0;
    setRedFlag(anyRed);
  };

  if (redFlag) {
    return (
      <div className="px-5 pt-6 pb-10 anim-scale-in">
        <div className="bg-[#FEF2F2] border-2 border-[#FECACA] rounded-3xl p-6 text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#B91C1C] flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#B91C1C] mb-2">Please seek help</h2>
          <p className="text-sm text-[#6E6460] leading-relaxed mb-5">
            You have selected a symptom that may need prompt medical attention. Please don't wait — reach out to a doctor or emergency services.
          </p>
          <button
            onClick={() => navigate("emergency")}
            className="w-full bg-[#B91C1C] text-white font-bold rounded-2xl py-4 text-base mb-3 active:scale-[0.98] transition-transform"
          >
            Open Emergency Support
          </button>
          <button
            onClick={() => { setRedFlag(false); setSymptoms(new Set()); }}
            className="text-sm text-[#9B9390] font-medium"
          >
            I am safe — continue check-in
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    const m = MOODS.find(m => m.val === mood) ?? MOODS[2];
    return (
      <div className="px-5 pt-6 pb-10 anim-scale-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#EDF3E8] flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5A7A48" strokeWidth="2.4">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#18110F]">Check-in done</h2>
          <p className="text-sm text-[#9B9390] mt-1">Thursday, 4 September 2026</p>
        </div>

        <div className="sc-card p-4 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: m.bg }}>
            {m.emoji}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9B9390] mb-1">Today's mood</p>
            <p className="font-display text-lg font-semibold text-[#18110F]">{m.label}</p>
            <p className="text-xs text-[#9B9390]">{symptoms.size} symptom{symptoms.size !== 1 ? "s" : ""} · {sleep}h sleep · Energy {energy}/5</p>
          </div>
        </div>

        <div className="sc-card p-4 mb-4 flex items-start gap-3">
          <MayaAvatar size={36} ring />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9B9390] mb-1.5">Maya says</p>
            <p className="text-sm text-[#3D3330] leading-relaxed">{MAYA_REPLIES[mood ?? 3]}</p>
            <button onClick={() => navigate("maya")} className="mt-2.5 text-xs font-bold text-[#2E6B6E]">
              Talk to Maya →
            </button>
          </div>
        </div>

        <div className="bg-[#EAF3F3] border border-[#C2DEDD] rounded-2xl px-4 py-3.5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">✨</span>
            <p className="text-sm font-bold text-[#2E6B6E]">Ovulatory phase tip</p>
          </div>
          <p className="text-xs text-[#3D3330] leading-relaxed">
            Many people feel their most energetic and sociable during the ovulatory window. Light movement and outdoor time often feel great this week.
          </p>
        </div>

        <div className="sc-card px-4 py-3.5 flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FDF3E3] flex items-center justify-center text-xl flex-shrink-0">🔥</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#18110F]">7-day streak!</p>
            <p className="text-xs text-[#9B9390]">You have checked in every day this week.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate("home")} className="flex-1 border border-[#DDD8D0] bg-white text-[#3D3330] font-bold rounded-2xl py-4 text-[15px] active:scale-[0.98] transition-transform">
            Back to Home
          </button>
          <button onClick={() => navigate("insights")} className="flex-1 bg-[#2E6B6E] text-white font-bold rounded-2xl py-4 text-[15px] active:scale-[0.98] transition-transform">
            Read Insights
          </button>
        </div>
      </div>
    );
  }

  const stepList = ["mood", "symptoms", "biometrics"] as const;
  const stepIdx = stepList.indexOf(step as (typeof stepList)[number]);

  return (
    <div className="pb-10">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-[#18110F]">Daily Check-in</h1>
          <button onClick={() => navigate("home")} className="w-8 h-8 rounded-xl bg-[#F7F3EE] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E6460" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>
        <p className="text-xs text-[#9B9390]">Thursday, 4 September · Day 14 of cycle</p>
        <div className="flex gap-1.5 mt-4">
          {stepList.map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full transition-all duration-300" style={{ background: i <= stepIdx ? "#2E6B6E" : "#DDD8D0" }} />
          ))}
        </div>
      </div>

      {step === "mood" && (
        <div className="px-5 anim-slide-up">
          <p className="font-display text-2xl font-semibold text-[#18110F] mb-1">How are you feeling today?</p>
          <p className="text-sm text-[#9B9390] mb-6">Be honest — this is just for you.</p>
          <div className="flex gap-2 mb-8">
            {MOODS.map((m) => (
              <button
                key={m.val}
                onClick={() => setMood(m.val)}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all active:scale-95"
                style={{ background: mood === m.val ? m.bg : "white", borderColor: mood === m.val ? m.color : "#DDD8D0" }}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: mood === m.val ? m.color : "#9B9390" }}>{m.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => { if (mood !== null) setStep("symptoms"); }}
            disabled={mood === null}
            className="w-full bg-[#2E6B6E] text-white font-bold rounded-2xl py-4 text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            Next
          </button>
        </div>
      )}

      {step === "symptoms" && (
        <div className="px-5 anim-slide-up">
          <p className="font-display text-2xl font-semibold text-[#18110F] mb-1">Any symptoms today?</p>
          <p className="text-sm text-[#9B9390] mb-5">Select all that apply — none is fine too.</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {SYMPTOMS.map((s) => {
              const active = symptoms.has(s.label);
              return (
                <button
                  key={s.label}
                  onClick={() => toggleSymptom(s.label, s.red)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all active:scale-95"
                  style={{
                    background: active ? (s.red ? "#FEF2F2" : "#EAF3F3") : "white",
                    borderColor: active ? (s.red ? "#FECACA" : "#C2DEDD") : "#DDD8D0",
                  }}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-[9px] font-bold text-center leading-tight" style={{ color: active ? (s.red ? "#B91C1C" : "#2E6B6E") : "#6E6460" }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mb-6">
            <label className="text-xs font-bold text-[#6E6460] uppercase tracking-wider mb-2 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything else on your mind..."
              className="w-full bg-white border border-[#DDD8D0] rounded-2xl px-4 py-3 text-sm text-[#18110F] placeholder-[#C4BEB8] resize-none focus:outline-none focus:border-[#2E6B6E]"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("mood")} className="w-12 h-12 border border-[#DDD8D0] bg-white rounded-2xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6460" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" /></svg>
            </button>
            <button onClick={() => setStep("biometrics")} className="flex-1 bg-[#2E6B6E] text-white font-bold rounded-2xl py-4 text-[15px] active:scale-[0.98] transition-transform">
              Next
            </button>
          </div>
        </div>
      )}

      {step === "biometrics" && (
        <div className="px-5 anim-slide-up">
          <p className="font-display text-2xl font-semibold text-[#18110F] mb-1">A few more details</p>
          <p className="text-sm text-[#9B9390] mb-6">Helps Maya understand your patterns.</p>

          <div className="sc-card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-[#18110F]">Energy level</p>
                <p className="text-xs text-[#9B9390]">How energetic did you feel today?</p>
              </div>
              <span className="font-display text-2xl font-semibold text-[#2E6B6E]">{energy}<span className="text-sm text-[#9B9390] font-normal">/5</span></span>
            </div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  onClick={() => setEnergy(v)}
                  className="flex-1 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all active:scale-95"
                  style={{ background: energy >= v ? "#2E6B6E" : "#F7F3EE", color: energy >= v ? "white" : "#9B9390" }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="sc-card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-[#18110F]">Sleep last night</p>
                <p className="text-xs text-[#9B9390]">Approximate hours</p>
              </div>
              <span className="font-display text-2xl font-semibold text-[#2E6B6E]">{sleep}<span className="text-sm text-[#9B9390] font-normal">h</span></span>
            </div>
            <input
              type="range" min={3} max={12} value={sleep}
              onChange={e => setSleep(Number(e.target.value))}
              className="w-full accent-[#2E6B6E]"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#C4BEB8]">3h</span>
              <span className="text-[10px] text-[#C4BEB8]">12h</span>
            </div>
          </div>

          <p className="text-[11px] text-[#9B9390] leading-relaxed text-center mb-5 px-2">
            This information is stored only on your device and helps Maya provide more personalised guidance.
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep("symptoms")} className="w-12 h-12 border border-[#DDD8D0] bg-white rounded-2xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6E6460" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" /></svg>
            </button>
            <button
              onClick={handleCompleteCheckIn}
              disabled={saving}
              className="flex-1 bg-[#2E6B6E] text-white font-bold rounded-2xl py-4 text-[15px] active:scale-[0.98] disabled:opacity-50 transition-transform flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Check-in…
                </>
              ) : (
                "Complete Check-in"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
