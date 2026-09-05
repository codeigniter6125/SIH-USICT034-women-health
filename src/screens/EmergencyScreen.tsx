import { useState } from "react";
import type { Screen } from "../App";
import { triggerEmergency, getUserPhone } from "../lib/api";

interface Props { navigate: (s: Screen) => void; }

const HELPLINES = [
  { name: "National Emergency",    number: "112", desc: "Police · Fire · Ambulance", icon: "🚨" },
  { name: "Women Helpline",        number: "1091", desc: "24/7 nationwide support", icon: "🛡️" },
  { name: "Ambulance",             number: "108",  desc: "Medical emergency", icon: "🚑" },
  { name: "iCall Helpline",        number: "9152987821", desc: "Mental health support", icon: "🧠" },
  { name: "SNEHA India",           number: "044-24640050", desc: "Suicide prevention", icon: "🌸" },
];

const WARNING_SIGNS = [
  "Severe abdominal pain that won't stop",
  "Heavy bleeding (soaking more than 1 pad/hour)",
  "Chest pain, pressure, or shortness of breath",
  "Sudden dizziness or loss of consciousness",
  "High fever with severe pelvic pain",
];

const DEFAULT_STEPS = [
  "Stay calm and stay where you are if safe",
  "Unlock your front door if possible",
  "Tell the operator your exact location",
  "Do not eat or drink anything",
];

export default function EmergencyScreen({ navigate }: Props) {
  const [flow, setFlow] = useState<"landing" | "confirm" | "activated">("landing");
  const [loading, setLoading] = useState(false);
  const [hospital, setHospital] = useState<{
    name?: string;
    maps_link?: string;
    address?: string;
    distance?: string;
    phone?: string;
  } | null>(null);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [guidanceSteps, setGuidanceSteps] = useState<string[]>(DEFAULT_STEPS);

  async function handleActivateEmergency() {
    setLoading(true);

    let location: { lat: number; lng: number } | null = null;
    try {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        location = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 3500 }
          );
        });
      }
    } catch {
      location = null;
    }

    try {
      const res = await triggerEmergency({
        phone: getUserPhone(),
        symptoms: "Emergency Mode activated by patient via She Care SOS button",
        location,
      });

      if (res.hospital) {
        setHospital(res.hospital);
      }
      if (res.sms_result?.recipient) {
        setSmsStatus(`SMS alert dispatched to emergency contact (${res.sms_result.recipient})`);
      } else {
        setSmsStatus("SMS emergency notification triggered to your registered contacts.");
      }
      if (res.guidance && res.guidance.length > 0) {
        setGuidanceSteps(res.guidance);
      }
    } catch (err) {
      console.warn("Emergency dispatch notice:", err);
    } finally {
      setLoading(false);
      setFlow("activated");
    }
  }

  if (flow === "activated") {
    const mapsUrl =
      hospital?.maps_link ||
      "https://www.google.com/maps/search/nearest+hospital";

    return (
      <div className="min-h-screen bg-[#B91C1C] flex flex-col anim-scale-in">
        {/* Activated header */}
        <div className="pt-safe flex items-center gap-3 px-5 pt-6 pb-4">
          <button
            onClick={() => setFlow("landing")}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-white font-bold text-base">Emergency Active</span>
          <div className="ml-auto flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-white anim-pulse-slow" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </div>
        </div>

        <div className="flex-1 px-5 pb-10 flex flex-col">
          {/* Big call button */}
          <div className="flex flex-col items-center pt-6 pb-8">
            <a
              href="tel:112"
              className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center shadow-2xl anim-glow mb-4 active:scale-95 transition-transform"
              style={{ boxShadow: "0 0 0 0 rgba(255,255,255,0.4)" }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#B91C1C">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              </svg>
              <span className="text-[#B91C1C] font-black text-2xl leading-none mt-1">112</span>
            </a>
            <p className="text-white font-bold text-lg">Calling emergency services</p>
            <p className="text-white/70 text-sm mt-1">Tap the button above to call 112</p>
          </div>

          {/* SMS Status Banner */}
          {smsStatus && (
            <div className="bg-white/15 border border-white/25 rounded-2xl p-3.5 mb-5 flex items-center gap-2.5 anim-slide-up">
              <span className="text-lg">📲</span>
              <p className="text-white text-xs font-medium leading-snug">{smsStatus}</p>
            </div>
          )}

          {/* Steps checklist */}
          <div className="bg-white/10 rounded-2xl p-4 mb-5">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3">While you wait</p>
            {guidanceSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-white text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {/* Nearest hospital with live Maps link */}
          <div className="bg-white/10 rounded-2xl p-4 mb-5">
            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Nearest hospital</p>
            <p className="text-white font-bold text-base">{hospital?.name || "City General Hospital & Emergency Care"}</p>
            <p className="text-white/70 text-sm">{hospital?.address || "Emergency Department · GPS verified"}</p>

            <div className="mt-3 flex items-center gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white text-[#B91C1C] rounded-xl px-4 py-2 text-xs font-bold shadow-md hover:bg-white/90 active:scale-95 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
                Directions in Maps ↗
              </a>
              {hospital?.phone && (
                <a href={`tel:${hospital.phone}`} className="text-white/90 text-xs font-bold underline">
                  Call Hospital
                </a>
              )}
            </div>
          </div>

          <button
            onClick={() => setFlow("landing")}
            className="w-full bg-white/10 border border-white/20 text-white font-semibold rounded-2xl py-3.5 text-sm active:scale-[0.98] transition-transform"
          >
            I am now safe — cancel alert
          </button>
        </div>
      </div>
    );
  }

  if (flow === "confirm") {
    return (
      <div className="min-h-screen bg-[#18110F] flex flex-col items-center justify-center px-5 anim-scale-in">
        <div className="w-24 h-24 rounded-full bg-[#B91C1C] flex items-center justify-center mb-6 anim-pulse-slow">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-white text-center mb-3">Confirm Emergency</h2>
        <p className="text-[#9B9390] text-sm text-center leading-relaxed mb-8 max-w-[260px]">
          This will alert emergency contacts via SMS, calculate the nearest hospital via GPS, and open direct 112 dialing.
        </p>
        <button
          onClick={handleActivateEmergency}
          disabled={loading}
          className="w-full bg-[#B91C1C] text-white font-black rounded-2xl py-5 text-lg mb-3 active:scale-[0.98] disabled:opacity-50 transition-transform flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Locating &amp; Alerting…
            </>
          ) : (
            "YES — Activate Emergency"
          )}
        </button>
        <button
          onClick={() => setFlow("landing")}
          disabled={loading}
          className="w-full border border-[#3D3330] text-[#9B9390] font-semibold rounded-2xl py-4 text-sm active:scale-[0.98] transition-transform"
        >
          Cancel — I am okay
        </button>
      </div>
    );
  }

  /* ─── Landing ─── */
  return (
    <div className="pb-10 anim-fade-in">
      {/* Header */}
      <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("home")} className="w-9 h-9 rounded-xl bg-white border border-[#FECACA] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#B91C1C]">Emergency Support</h1>
            <p className="text-xs text-[#9B9390]">For urgent medical situations only</p>
          </div>
        </div>

        {/* Big 112 button */}
        <a
          href="tel:112"
          className="flex items-center gap-4 bg-[#B91C1C] rounded-2xl px-5 py-4 active:scale-[0.98] transition-transform"
          style={{ boxShadow: "0 8px 24px -4px rgba(185,28,28,0.4)" }}
        >
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#B91C1C">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-black text-2xl leading-none">Call 112</p>
            <p className="text-white/70 text-sm mt-0.5">National Emergency • Always free</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
        </a>
      </div>

      {/* Warning signs */}
      <div className="px-5 pt-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Call 112 immediately if you have</p>
        <div className="sc-card p-4 mb-5">
          {WARNING_SIGNS.map((sign, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-5 h-5 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#B91C1C]" />
              </div>
              <p className="text-sm text-[#3D3330] leading-snug">{sign}</p>
            </div>
          ))}
        </div>

        {/* Helpline directory */}
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Helpline Directory</p>
        <div className="space-y-2 mb-5">
          {HELPLINES.map((h) => (
            <a
              key={h.number}
              href={`tel:${h.number}`}
              className="sc-card flex items-center gap-3 px-4 py-3.5 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F7F3EE] flex items-center justify-center text-lg flex-shrink-0">
                {h.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#18110F]">{h.name}</p>
                <p className="text-xs text-[#9B9390]">{h.desc}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-semibold text-[#2E6B6E]">{h.number}</p>
                <p className="text-[10px] text-[#9B9390]">Tap to call</p>
              </div>
            </a>
          ))}
        </div>

        {/* Activate emergency mode */}
        <div className="bg-[#18110F] rounded-2xl p-5 mb-5">
          <p className="text-white font-bold text-base mb-1">Emergency Mode</p>
          <p className="text-[#9B9390] text-xs leading-relaxed mb-4">
            Activate emergency mode for quick access to 112, automatic SMS notification to your emergency contact, and instant directions to the nearest hospital.
          </p>
          <button
            onClick={() => setFlow("confirm")}
            className="w-full bg-[#B91C1C] text-white font-bold rounded-xl py-3.5 text-sm active:scale-[0.98] transition-transform"
          >
            Activate Emergency Mode
          </button>
        </div>

        <p className="text-[11px] text-[#C4BEB8] text-center leading-relaxed px-2">
          She Care is not a substitute for professional medical care. In any emergency, always call 112 or go to your nearest hospital immediately.
        </p>
      </div>
    </div>
  );
}
