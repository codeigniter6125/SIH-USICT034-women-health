import { useState, useEffect } from "react";
import type { Screen } from "../App";
import MayaAvatar from "../components/MayaAvatar";
import { getCycleState } from "../lib/api";

interface Props { navigate: (s: Screen) => void; }

/* Cycle arc SVG */
function CycleArc({ day, total = 28, phaseName = "Ovulatory" }: { day: number; total?: number; phaseName?: string }) {
  const cx = 110, cy = 110, r = 88;
  const circ = 2 * Math.PI * r;
  const gap = 12; // degrees gap between phases
  const phases = [
    { name: "Menstrual",  pct: 17.8, color: "#D17A84" },
    { name: "Follicular", pct: 28.6, color: "#C48C7A" },
    { name: "Ovulatory",  pct: 10.7, color: "#2E6B6E" },
    { name: "Luteal",     pct: 42.9, color: "#6B8B4A" },
  ];

  // Convert % to stroke lengths (leaving gap)
  let offset = 0;
  const segments = phases.map((p) => {
    const length = (circ * p.pct) / 100 - gap * 1.5;
    const dashOffset = circ - length;
    const seg = { ...p, length, dashOffset, startOffset: offset };
    offset += (circ * p.pct) / 100;
    return seg;
  });

  // Position angle for current day
  const angle = ((day / total) * 360 - 90) * (Math.PI / 180);
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy + r * Math.sin(angle);

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[220px]">
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="14" />

      {/* Phase arcs */}
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth="14"
          strokeOpacity="0.85"
          strokeDasharray={`${seg.length} ${circ - seg.length}`}
          strokeDashoffset={circ - seg.startOffset + circ * 0.25}
          strokeLinecap="round"
          transform="rotate(-90, 110, 110)"
        />
      ))}

      {/* Day marker dot */}
      <circle cx={dotX} cy={dotY} r="8" fill="white" />
      <circle cx={dotX} cy={dotY} r="4" fill="#2E6B6E" />

      {/* Centre text */}
      <text x={cx} y={cy - 14} textAnchor="middle" className="font-display" style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "42px", fontWeight: 600, fill: "white" }}>
        {day}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: "13px", fill: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.02em" }}>
        of {total} days
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" style={{ fontSize: "11px", fill: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans', sans-serif" }}>
        {phaseName}
      </text>
    </svg>
  );
}

export default function HomeScreen({ navigate }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [cycleData, setCycleData] = useState<any>(null);

  useEffect(() => {
    getCycleState()
      .then((data) => {
        if (data && data.has_data) {
          setCycleData(data);
        }
      })
      .catch((err) => console.warn("Could not load cycle data for home:", err));
  }, []);

  const cycleDay = cycleData?.cycle_day ?? 14;
  const cycleTotal = cycleData?.avg_cycle_length_days ?? 28;
  const phaseLabel = cycleData?.phase
    ? `${cycleData.phase.charAt(0).toUpperCase() + cycleData.phase.slice(1)} Phase`
    : "Ovulatory Window";

  let nextPeriodStr = "~19 Sep (est.)";
  if (cycleData?.predicted_next_period) {
    nextPeriodStr = `~${new Date(cycleData.predicted_next_period).toLocaleDateString([], { month: "short", day: "numeric" })} (est.)`;
  }

  return (
    <div className="pb-4 anim-fade-in">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <p className="devanagari text-[13px] font-medium text-[#9B9390] leading-none">नमस्ते,</p>
          <h1 className="font-display text-[26px] font-semibold text-[#18110F] leading-tight mt-0.5">Priya Sharma</h1>
          <p className="text-xs text-[#9B9390] mt-0.5">Thursday · 4 September 2026</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("checkin")}
            className="w-10 h-10 rounded-xl bg-white border border-[#DDD8D0] flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            aria-label="Daily check-in"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D3330" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => navigate("emergency")}
            className="w-10 h-10 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Emergency"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Cycle hero ── */}
      <div className="px-5 mb-5">
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(140deg, #1E5153 0%, #2E6B6E 50%, #246166 100%)",
            boxShadow: "0 12px 40px -8px rgba(30,81,83,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-4 px-5 pt-5 pb-4">
            {/* Arc */}
            <div className="flex-shrink-0" style={{ width: "140px" }}>
              <CycleArc day={cycleDay} total={cycleTotal} phaseName={cycleData?.phase || "Ovulatory"} />
            </div>
            {/* Info panel */}
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[10px] uppercase tracking-[0.14em] font-semibold mb-2">Current Phase</p>
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6ECBCF]" />
                <span className="text-white text-xs font-bold">{phaseLabel}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-white/45 text-[10px] font-medium">Next period</p>
                  <p className="text-white font-semibold text-sm">{nextPeriodStr}</p>
                </div>
                <div>
                  <p className="text-white/45 text-[10px] font-medium">Avg cycle</p>
                  <p className="text-white font-semibold text-sm">{cycleTotal} days</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 px-5 py-3">
            <p className="text-white/50 text-[11px] leading-relaxed">
              Cycle information is based on your logged history. Predictions are estimates — individual cycles vary.
            </p>
          </div>
        </div>
      </div>

      {/* ── Action grid ── */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            bg="#EAF3F3" iconBg="#C2DEDD" color="#2E6B6E"
            icon={<ChatSVG />}
            title="Talk to Maya" sub="Ask a health question"
            onClick={() => navigate("maya")}
          />
          <ActionCard
            bg="#F9EEE9" iconBg="#ECCFC7" color="#B8705E"
            icon={<CheckSVG />}
            title="Daily Check-in" sub="How are you today?"
            onClick={() => navigate("checkin")}
          />
          <ActionCard
            bg="#EDF3E8" iconBg="#C8DDB8" color="#5A7A48"
            icon={<ReportSVG />}
            title="Read a Report" sub="Upload & understand"
            onClick={() => navigate("reports")}
          />
          <ActionCard
            bg="#F0EDE8" iconBg="#DDD8D0" color="#6E6460"
            icon={<CycleSVG />}
            title="Track Cycle" sub="Log & view patterns"
            onClick={() => navigate("cycle")}
          />
        </div>
      </div>

      {/* ── Emergency strip ── */}
      <div className="px-5 mb-5">
        <button
          onClick={() => navigate("emergency")}
          className="w-full flex items-center gap-3 bg-white border border-[#DDD8D0] rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform"
          style={{ boxShadow: "inset 3px 0 0 #B91C1C" }}
        >
          <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] flex items-center justify-center flex-shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.2">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-[#B91C1C]">Emergency Support</p>
            <p className="text-xs text-[#9B9390]">Severe symptoms? Get help fast.</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* ── Wellbeing snapshot ── */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Your Week</p>
        <div className="sc-card p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <SnapStat label="Streak" value="7d" icon="🔥" color="#C47A1A" bg="#FDF3E3" />
            <SnapStat label="Check-ins" value="7/7" icon="✅" color="#5A7A48" bg="#EDF3E8" />
            <SnapStat label="Avg mood" value="Good" icon="🌟" color="#2E6B6E" bg="#EAF3F3" />
          </div>
          <div className="flex items-center gap-1.5">
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-full"
                  style={{ height: [28,32,24,36,30,20,28][i], background: i < 6 ? "#2E6B6E" : "#F0EDE8", opacity: i < 6 ? [0.5,0.65,0.45,0.9,0.7,0.4,1][i] : 1 }}
                />
                <span className="text-[9px] text-[#C4BEB8] font-medium">{d}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#9B9390] text-center mt-2">Mood log this week · Today highlighted</p>
        </div>
      </div>

      {/* ── Today's Insight ── */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em]">Today's Insight</h2>
          <button onClick={() => navigate("insights")} className="text-xs font-semibold text-[#2E6B6E]">See all →</button>
        </div>
        <div className="bg-white border border-[#DDD8D0] rounded-2xl overflow-hidden">
          <div className="relative h-32 bg-[#EAF3F3]">
            <img
              src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=256&fit=crop&auto=format"
              alt="Cycle health"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest bg-[#2E6B6E] text-white px-2.5 py-1 rounded-full">
              Cycle Health
            </span>
          </div>
          <div className="px-4 py-3.5">
            <p className="font-display text-[15px] font-medium text-[#18110F] leading-snug mb-1.5">
              "Ovulatory phase: energy often peaks — it's a natural rhythm, not a rule."
            </p>
            <p className="text-xs text-[#9B9390] leading-relaxed">Understanding your cycle helps you make informed lifestyle choices.</p>
            <button onClick={() => navigate("insights")} className="mt-2.5 text-xs font-bold text-[#2E6B6E]">Read article →</button>
          </div>
        </div>
      </div>

      {/* ── Maya nudge ── */}
      {!dismissed && (
        <div className="px-5">
          <div className="flex items-start gap-3 bg-white border border-[#DDD8D0] rounded-2xl px-4 py-3.5 anim-slide-up">
            <MayaAvatar size={34} ring />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-wider mb-1">Maya says</p>
              <p className="text-sm text-[#3D3330] leading-snug">
                "Don't forget today's check-in! Consistent logging helps me give you more personalised guidance."
              </p>
              <div className="flex items-center gap-4 mt-2.5">
                <button onClick={() => navigate("checkin")} className="text-xs font-bold text-[#2E6B6E]">Check in now →</button>
                <button onClick={() => setDismissed(true)} className="text-xs text-[#9B9390]">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SnapStat({ label, value, icon, color, bg }: { label: string; value: string; icon: string; color: string; bg: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col items-center gap-1" style={{ background: bg }}>
      <span className="text-lg">{icon}</span>
      <span className="font-display text-base font-semibold" style={{ color }}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-wide text-[#9B9390]">{label}</span>
    </div>
  );
}

function ActionCard({ bg, iconBg, color, icon, title, sub, onClick }: {
  bg: string; iconBg: string; color: string; icon: React.ReactNode; title: string; sub: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 p-4 rounded-2xl active:scale-[0.96] transition-transform text-left"
      style={{ background: bg }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-[#18110F] leading-tight">{title}</p>
        <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>
      </div>
    </button>
  );
}

const ChatSVG = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2E6B6E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
const CheckSVG = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#B8705E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M9 12l2 2 4-4" /></svg>;
const ReportSVG = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#5A7A48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
const CycleSVG = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#6E6460" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l5 3" /></svg>;
