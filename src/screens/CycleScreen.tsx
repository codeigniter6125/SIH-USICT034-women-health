import { useState, useEffect } from "react";
import type { Screen } from "../App";
import { getCycleState, logCycleStart } from "../lib/api";

interface Props { navigate: (s: Screen) => void; }

const PHASES = [
  { key: "menstrual",  label: "Menstrual",  range: "Day 1–5",   color: "#C9707A", bg: "#FBF0F1", border: "#F2C8CC", icon: "🌙", desc: "The uterine lining sheds. Rest, warmth, and gentle movement often help.", tips: ["Stay well hydrated", "Warmth eases cramping", "Iron-rich foods replenish energy"] },
  { key: "follicular", label: "Follicular", range: "Day 6–13",  color: "#BE7B6D", bg: "#F9EEE9", border: "#ECCFC7", icon: "🌱", desc: "Estrogen rises, energy lifts, and mood often brightens.", tips: ["A good time for new starts", "Social energy peaks", "Creative and focused work flow well"] },
  { key: "ovulatory",  label: "Ovulatory",  range: "Day 14–16", color: "#2E6B6E", bg: "#EAF3F3", border: "#C2DEDD", icon: "✨", desc: "Egg is released. Peak energy, confidence, and your estimated fertile window.", tips: ["Energy and mood often at their highest", "Good for important conversations", "Estimated fertile window — discuss with doctor if relevant"] },
  { key: "luteal",     label: "Luteal",     range: "Day 17–28", color: "#6B8B4A", bg: "#EDF3E8", border: "#C8DDB8", icon: "🍂", desc: "Progesterone rises. Rest, reduce stress, and nourish your body. PMS may appear near Day 28.", tips: ["Reduce caffeine and alcohol", "Prioritise sleep", "Track any PMS symptoms carefully"] },
];

const HISTORY = [
  { label: "Aug 2026", start: "8 Aug", length: 28, period: 5 },
  { label: "Jul 2026", start: "11 Jul", length: 27, period: 5 },
  { label: "Jun 2026", start: "14 Jun", length: 29, period: 4 },
];

export default function CycleScreen({ navigate }: Props) {
  const [logged, setLogged] = useState(false);
  const [sel, setSel] = useState(2);
  const [empty, setEmpty] = useState(false);
  const [cycleData, setCycleData] = useState<any>(null);

  useEffect(() => {
    loadCycleData();
  }, []);

  async function loadCycleData() {
    try {
      const data = await getCycleState();
      if (data && data.has_data) {
        setCycleData(data);
        const idx = PHASES.findIndex((p) => p.key === data.phase);
        if (idx !== -1) setSel(idx);
        setEmpty(false);
      } else {
        setEmpty(true);
      }
    } catch (err) {
      console.warn("Error fetching cycle data:", err);
    }
  }

  async function handleLogToday(startIso?: string) {
    const targetDate = startIso || new Date().toISOString().split("T")[0];
    try {
      await logCycleStart(targetDate);
      setLogged(true);
      await loadCycleData();
    } catch (err) {
      console.warn("Could not log cycle:", err);
    }
  }

  const cycleDay = cycleData?.cycle_day ?? 14;
  const cycleTotal = cycleData?.avg_cycle_length_days ?? 28;
  const activePhase = PHASES[sel] || PHASES[2];

  let nextPeriodDays = "~14d";
  let nextPeriodDateText = "Sep 19 est.";
  if (cycleData?.predicted_next_period) {
    const diffMs = new Date(cycleData.predicted_next_period).getTime() - new Date().getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    nextPeriodDays = `~${days}d`;
    nextPeriodDateText = `${new Date(cycleData.predicted_next_period).toLocaleDateString([], { month: "short", day: "numeric" })} est.`;
  }

  if (empty) {
    return (
      <div className="px-5 pt-6 pb-8 anim-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-[#18110F]">Cycle Tracker</h1>
          <button
            onClick={() => handleLogToday("2026-08-22")}
            className="text-xs font-bold text-[#2E6B6E] bg-[#EAF3F3] px-3 py-1.5 rounded-full"
          >
            Load demo data
          </button>
        </div>
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-24 h-24 rounded-full bg-[#EAF3F3] flex items-center justify-center mb-5 shadow-inner">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2E6B6E" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l5 3" strokeLinecap="round" /></svg>
          </div>
          <h3 className="font-display text-2xl font-semibold text-[#18110F] mb-2">Start your cycle log</h3>
          <p className="text-sm text-[#6E6460] leading-relaxed max-w-[260px] mb-8">Log your period start date to begin building a personalised cycle history with She Care.</p>
          <button
            onClick={() => handleLogToday()}
            className="bg-[#2E6B6E] text-white font-bold rounded-2xl px-8 py-3.5 text-sm active:scale-95 transition-transform"
          >
            Log my first period
          </button>
        </div>
      </div>
    );
  }

  const p = PHASES[sel];

  return (
    <div className="pb-4 anim-fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#18110F]">Cycle Tracker</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("doctor-summary")} className="text-xs font-bold text-[#2E6B6E] bg-[#EAF3F3] px-3 py-1.5 rounded-full">Dr. Summary</button>
          <button onClick={() => setEmpty(true)} className="text-[10px] text-[#C4BEB8]">↺</button>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="px-5">
        <div className="bg-white border border-[#DDD8D0] rounded-3xl overflow-hidden shadow-sm">
          {/* Phase timeline bar */}
          <div className="relative">
            <div className="h-2 flex overflow-hidden">
              {PHASES.map((ph, i) => (
                <div
                  key={i}
                  className={`h-full transition-all ${sel === i ? "opacity-100" : "opacity-50"}`}
                  style={{
                    flex: [5, 8, 3, 12][i],
                    background: ph.color,
                  }}
                />
              ))}
            </div>
            {/* Cursor dot */}
            <div
              className="absolute top-0 w-4 h-4 bg-white border-2 border-[#2E6B6E] rounded-full shadow-md -translate-y-1/2 -translate-x-2"
              style={{ left: `${Math.min(100, (cycleDay / cycleTotal) * 100)}%`, top: "50%" }}
            />
          </div>

          <div className="px-5 pt-4 pb-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] text-[#9B9390] uppercase tracking-[0.14em] font-bold mb-1.5">Today · Day</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[52px] font-semibold text-[#2E6B6E] leading-none">{cycleDay}</span>
                  <span className="text-[#9B9390] text-xl font-medium">/ {cycleTotal}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 bg-[#EAF3F3] rounded-full px-3 py-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B6E]" />
                  <span className="text-xs font-bold text-[#2E6B6E]">{activePhase.label} Phase</span>
                </div>
              </div>
              <div className="bg-[#F7F3EE] rounded-2xl p-3.5 text-center">
                <p className="text-[10px] text-[#9B9390] font-medium mb-1">Next period</p>
                <p className="font-display text-xl font-semibold text-[#18110F]">{nextPeriodDays}</p>
                <p className="text-[10px] text-[#9B9390] mt-1">{nextPeriodDateText}</p>
              </div>
            </div>

            {!logged ? (
              <button
                onClick={() => handleLogToday()}
                className="w-full bg-[#2E6B6E] text-white font-bold rounded-2xl py-4 text-[15px] active:scale-[0.98] transition-transform"
              >
                Log Period Start
              </button>
            ) : (
              <div className="flex items-center gap-2.5 bg-[#EDF3E8] border border-[#C8DDB8] rounded-2xl px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A7A48" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" strokeLinecap="round" /></svg>
                <p className="text-sm font-bold text-[#5A7A48]">Period start logged for today</p>
                <button onClick={() => setLogged(false)} className="ml-auto text-xs text-[#9B9390]">Undo</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Phase selector ── */}
      <div className="px-5 mt-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Cycle Phases</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PHASES.map((ph, i) => (
            <button
              key={i}
              onClick={() => setSel(i)}
              className={`rounded-2xl py-3 px-2 text-center transition-all active:scale-95 border-2 ${sel === i ? "border-transparent" : "border-transparent"}`}
              style={{
                background: sel === i ? ph.color : ph.bg,
                borderColor: sel === i ? ph.color : ph.border,
              }}
            >
              <div className="text-lg mb-1">{ph.icon}</div>
              <p className={`text-[9px] font-bold uppercase tracking-wide leading-tight ${sel === i ? "text-white" : "text-[#6E6460]"}`}>
                {ph.label.substring(0, 6)}
              </p>
            </button>
          ))}
        </div>

        {/* Phase card detail */}
        <div className="rounded-3xl p-5 border transition-all" style={{ background: p.bg, borderColor: p.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{p.icon}</span>
              <h3 className="font-bold text-base text-[#18110F]">{p.label} Phase</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: p.color }}>{p.range}</span>
          </div>
          <p className="text-xs text-[#3D3330] leading-relaxed mb-4">{p.desc}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B9390] mb-2">Nourish &amp; Support</p>
          <div className="space-y-1.5">
            {p.tips.map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#3D3330]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cycle history ── */}
      <div className="px-5 mt-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Recent Cycles</p>
        <div className="space-y-2">
          {HISTORY.map((h, i) => (
            <div key={i} className="sc-card px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#18110F]">{h.label}</p>
                <p className="text-[10px] text-[#9B9390]">Started {h.start}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#2E6B6E]">{h.length} days</p>
                <p className="text-[10px] text-[#9B9390]">{h.period}d bleeding</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
