import { useState, useEffect } from "react";
import type { Screen } from "../App";
import { getEducationalInsights, getCycleState } from "../lib/api";

interface Props { navigate: (s: Screen) => void; }

const CATEGORIES = [
  { label: "All",          key: "all"       },
  { label: "Cycle",        key: "cycle"     },
  { label: "Nutrition",    key: "nutrition" },
  { label: "Mental Health",key: "mental"    },
  { label: "Hormones",     key: "hormones"  },
  { label: "Sleep",        key: "sleep"     },
];

const ARTICLES = [
  {
    id: 1,
    cat: "cycle",
    catLabel: "Cycle Health",
    title: "What your cycle phases tell you about your energy",
    summary: "Each phase of the menstrual cycle has distinct hormonal patterns that can influence how you feel physically and emotionally.",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=280&fit=crop&auto=format",
    tag: "Educational",
    featured: true,
  },
  {
    id: 2,
    cat: "nutrition",
    catLabel: "Nutrition",
    title: "Iron-rich foods that support your cycle",
    summary: "During menstruation, iron levels can dip. These foods may help maintain healthy levels naturally.",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop&auto=format",
    tag: "Nutrition",
    featured: false,
  },
  {
    id: 3,
    cat: "mental",
    catLabel: "Mental Health",
    title: "Understanding premenstrual mood shifts",
    summary: "Hormonal changes in the luteal phase can affect serotonin and GABA — here's what research suggests.",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop&auto=format",
    tag: "Mental Health",
    featured: false,
  },
  {
    id: 4,
    cat: "hormones",
    catLabel: "Hormones",
    title: "Estrogen, progesterone and you",
    summary: "A plain-language explanation of how these two hormones orchestrate your cycle and what imbalance may look like.",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=400&h=200&fit=crop&auto=format",
    tag: "Science",
    featured: false,
  },
  {
    id: 5,
    cat: "sleep",
    catLabel: "Sleep",
    title: "Why you sleep worse before your period",
    summary: "Progesterone's impact on body temperature and sleep architecture — and evidence-based ways to rest better.",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop&auto=format",
    tag: "Sleep",
    featured: false,
  },
  {
    id: 6,
    cat: "cycle",
    catLabel: "Cycle Health",
    title: "When to track, when to talk to a doctor",
    summary: "Patterns worth noting in a period diary — and the signs that warrant a conversation with a gynaecologist.",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=200&fit=crop&auto=format",
    tag: "Guidance",
    featured: false,
  },
];

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  "Cycle Health":   { bg: "#EAF3F3", text: "#2E6B6E" },
  "Nutrition":      { bg: "#EDF3E8", text: "#5A7A48" },
  "Mental Health":  { bg: "#F9EEE9", text: "#B8705E" },
  "Hormones":       { bg: "#FDF3E3", text: "#C47A1A" },
  "Sleep":          { bg: "#F0EDE8", text: "#6E6460" },
  "Science":        { bg: "#EAF3F3", text: "#2E6B6E" },
  "Guidance":       { bg: "#EDF3E8", text: "#5A7A48" },
  "Educational":    { bg: "#F7F3EE", text: "#3D3330" },
};

export default function InsightsScreen({ navigate }: Props) {
  const [cat, setCat] = useState("all");
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [tipOfTheDay, setTipOfTheDay] = useState<any>(null);
  const [cycleInfo, setCycleInfo] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    getEducationalInsights().then((data) => {
      if (mounted && data?.tip_of_the_day) {
        setTipOfTheDay(data.tip_of_the_day);
      }
    }).catch(console.warn);

    getCycleState().then((c) => {
      if (mounted && c?.has_data) {
        setCycleInfo(c);
      }
    }).catch(console.warn);

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = cat === "all" ? ARTICLES : ARTICLES.filter(a => a.cat === cat);
  const featured = filtered.find(a => a.featured) ?? filtered[0];
  const rest = filtered.filter(a => a !== featured);

  const toggleSave = (id: number) => {
    const s = new Set(saved);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSaved(s);
  };

  return (
    <div className="pb-6 anim-fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18110F]">Health Insights</h1>
          <p className="text-xs text-[#9B9390] mt-0.5">Educational articles · Not medical advice</p>
        </div>
        <button className="w-9 h-9 rounded-xl bg-white border border-[#DDD8D0] flex items-center justify-center shadow-sm">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3D3330" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all active:scale-95"
            style={{
              background: cat === c.key ? "#2E6B6E" : "white",
              color: cat === c.key ? "white" : "#6E6460",
              borderColor: cat === c.key ? "#2E6B6E" : "#DDD8D0",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Featured article */}
      {featured && (
        <div className="px-5 mb-5">
          <div
            className="sc-card overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
            onClick={() => {}}
          >
            <div className="relative h-44">
              <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#2E6B6E] text-white px-2.5 py-1 rounded-full">
                  Featured
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ background: CAT_COLORS[featured.catLabel]?.bg, color: CAT_COLORS[featured.catLabel]?.text }}
                >
                  {featured.catLabel}
                </span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleSave(featured.id); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={saved.has(featured.id) ? "#2E6B6E" : "none"} stroke="#2E6B6E" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="font-display text-[17px] font-semibold text-[#18110F] leading-snug mb-2">
                {featured.title}
              </p>
              <p className="text-xs text-[#9B9390] leading-relaxed mb-3">{featured.summary}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9B9390" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l3 2" strokeLinecap="round" /></svg>
                  <span className="text-xs text-[#9B9390]">{featured.readTime} read</span>
                </div>
                <span className="text-xs font-bold text-[#2E6B6E]">Read article →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article list */}
      {rest.length > 0 && (
        <div className="px-5">
          <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">More articles</p>
          <div className="space-y-3">
            {rest.map(a => {
              const c = CAT_COLORS[a.catLabel] ?? { bg: "#EAF3F3", text: "#2E6B6E" };
              return (
                <div
                  key={a.id}
                  className="sc-card flex items-center gap-3 p-3 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
                      style={{ background: c.bg, color: c.text }}
                    >
                      {a.catLabel}
                    </span>
                    <p className="text-sm font-semibold text-[#18110F] leading-snug line-clamp-2 mb-1.5">{a.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9B9390" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l3 2" strokeLinecap="round" /></svg>
                        <span className="text-[10px] text-[#9B9390]">{a.readTime}</span>
                      </div>
                      <button onClick={() => toggleSave(a.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={saved.has(a.id) ? "#2E6B6E" : "none"} stroke="#9B9390" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tip of the day from backend if available */}
      {tipOfTheDay && (
        <div className="px-5 mt-5">
          <div className="bg-[#FDF3E3] border border-[#F0D5AA] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">✨</span>
              <p className="text-xs font-bold text-[#C47A1A] uppercase tracking-wider">{tipOfTheDay.category || "Maya's Tip of the Day"}</p>
            </div>
            <h3 className="font-display text-base font-semibold text-[#18110F] mb-1">{tipOfTheDay.title}</h3>
            <p className="text-xs text-[#6E6460] leading-relaxed">{tipOfTheDay.content}</p>
          </div>
        </div>
      )}

      {/* Maya reading suggestion */}
      <div className="px-5 mt-5">
        <div className="bg-[#EAF3F3] border border-[#C2DEDD] rounded-2xl px-4 py-3.5 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#2E6B6E] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#2E6B6E] mb-1">Maya suggests</p>
            <p className="text-sm text-[#3D3330] leading-snug">
              {cycleInfo
                ? `Based on your Day ${cycleInfo.cycle_day} ${cycleInfo.phase} phase, reading about cycle energy patterns and nutrition may be especially relevant today.`
                : "Based on your cycle profile, the article on cycle energy patterns and iron-rich foods may be especially relevant right now."}
            </p>
            <button onClick={() => navigate("maya")} className="mt-2 text-xs font-bold text-[#2E6B6E] hover:underline">
              Ask Maya about it →
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-[#C4BEB8] text-center leading-relaxed px-6 mt-5">
        All articles are educational and based on published research. They are not a substitute for personalised medical advice. Consult a qualified healthcare provider for your specific needs.
      </p>
    </div>
  );
}
