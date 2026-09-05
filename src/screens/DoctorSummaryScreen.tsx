import { useState, useEffect } from "react";
import type { Screen } from "../App";
import StatusBadge from "../components/StatusBadge";
import { getDoctorSummary } from "../lib/api";

interface Props {
  navigate: (s: Screen) => void;
}

export default function DoctorSummaryScreen({ navigate }: Props) {
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["patient", "cycle", "observations"]));

  useEffect(() => {
    let mounted = true;
    getDoctorSummary()
      .then((data) => {
        if (mounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Using offline / fallback doctor summary:", err);
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (id: string) => {
    const s = new Set(expanded);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setExpanded(s);
  };

  // 1. Patient Snapshot
  const patient = summary?.patient_snapshot || summary?.patient || {};
  const patientRows = [
    { label: "Name", value: patient.name || "Priya Sharma" },
    { label: "Age", value: `${patient.age || 28} years` },
    { label: "User ID / Phone", value: patient.phone || patient.user_id || "+919876543210" },
    {
      label: "Report generated",
      value: summary?.date_range || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    },
  ];

  // 2. Cycle Overview
  const cycle = summary?.cycle_overview || {};
  const cycleInsights = summary?.cycle_insights || {};
  const cycleRows = [
    {
      label: "Current phase",
      value: cycle.phase
        ? `${cycle.phase} (Day ${cycle.cycle_day ?? 14} of ${cycle.avg_cycle_length_days ?? 28})`
        : "Follicular (Day 10 of 28)",
    },
    {
      label: "Average length",
      value: `${cycle.avg_cycle_length_days ?? cycleInsights.avg_cycle_length ?? 28} days`,
    },
    {
      label: "Cycle regularity",
      value: cycle.is_irregular ? "Irregular (drift noted)" : "Regular (within expected baseline)",
    },
    {
      label: "Next period",
      value: cycle.next_period_date
        ? `~${cycle.next_period_date} (estimated)`
        : "~19 September 2026 (estimated)",
    },
  ];

  // 3. Recent Symptoms
  const rawSymptoms = summary?.recent_symptoms || summary?.frequent_symptoms || [];
  const symptomsList = rawSymptoms.length > 0
    ? rawSymptoms.map((s: any) => {
        if (typeof s === "string") {
          return { symptom: s, phase: "Logged recent", freq: "Past 30 days", status: "normal" as const };
        }
        if (s.symptoms && Array.isArray(s.symptoms)) {
          return {
            symptom: s.symptoms.join(", ") || "General check-in",
            phase: `Energy: ${s.energy ?? 3}/5 · Sleep: ${s.sleep_hours ?? 7}h`,
            freq: s.date || "Recent check-in",
            status: (s.energy && s.energy <= 2 ? "attention" : "normal") as "attention" | "normal",
          };
        }
        return {
          symptom: s.symptom || "Fatigue",
          phase: s.phase || "Luteal phase",
          freq: s.freq || s.days || "Reported",
          status: (s.status === "attention" || s.status === "warning" ? s.status : "normal") as "attention" | "normal" | "warning",
        };
      })
    : [
        { symptom: "Mild cramping", phase: "Menstrual phase", freq: "Days 1–3", status: "normal" as const },
        { symptom: "Fatigue", phase: "Late luteal phase", freq: "Days 25–28", status: "normal" as const },
        { symptom: "Mild bloating", phase: "Luteal phase", freq: "Days 20–25", status: "normal" as const },
        { symptom: "Mood variability", phase: "Late luteal phase", freq: "Days 24–28", status: "attention" as const },
      ];

  // 4. Recent Lab Reports & Findings
  const rawReports = summary?.recent_reports || [];
  const reportsList: Array<{ test: string; value: string; ref: string; status: "normal" | "attention" | "warning" }> = [];

  if (rawReports.length > 0) {
    for (const rep of rawReports) {
      if (rep.findings && Array.isArray(rep.findings) && rep.findings.length > 0) {
        for (const f of rep.findings) {
          const valNum = parseFloat(f.value);
          let testStatus: "normal" | "attention" | "warning" = "normal";
          if (f.test?.toLowerCase().includes("hemo") && valNum < 12) testStatus = "attention";
          if (f.test?.toLowerCase().includes("ferritin") && valNum < 15) testStatus = "warning";
          if (f.test?.toLowerCase().includes("tsh") && (valNum > 4.5 || valNum < 0.4)) testStatus = "attention";
          reportsList.push({
            test: f.test || "Lab Marker",
            value: `${f.value} ${f.unit || ""}`.trim(),
            ref: f.reference_range || (f.test?.toLowerCase().includes("hemo") ? "12–15.5 g/dL" : "Standard reference"),
            status: testStatus,
          });
        }
      } else {
        reportsList.push({
          test: rep.title || rep.report_type || "Diagnostic Lab Report",
          value: rep.summary || "Analyzed",
          ref: rep.date || "Recent",
          status: "normal",
        });
      }
    }
  }

  const finalReports = reportsList.length > 0 ? reportsList : [
    { test: "Haemoglobin", value: "11.8 g/dL", ref: "12–15.5", status: "attention" as const },
    { test: "Ferritin", value: "14 ng/mL", ref: "12–150", status: "normal" as const },
    { test: "TSH", value: "2.1 mIU/L", ref: "0.4–4.0", status: "normal" as const },
    { test: "Vitamin D", value: "18 ng/mL", ref: "20–50", status: "attention" as const },
  ];

  // 5. Clinical Observations
  const observationsList: string[] = summary?.observations && summary.observations.length > 0
    ? summary.observations
    : [
        "Haemoglobin is mildly below the reference range. This may contribute to reported fatigue. Please assess for iron deficiency anaemia.",
        "Vitamin D is below the lower threshold. Supplementation may be appropriate depending on clinical context.",
        "Cycle length and period duration are within typical ranges across logged cycles.",
        "Late-luteal mood variability has been logged consistently. Assessment for PMDD may be worth considering.",
      ];

  // 6. Questions to Discuss
  const questionsList: string[] = summary?.questions_to_discuss && summary.questions_to_discuss.length > 0
    ? summary.questions_to_discuss
    : [
        "Should I start iron supplementation given my Hb level?",
        "What Vitamin D dose is appropriate for my reading?",
        "Is the late-luteal mood pattern worth further investigation?",
        "What lifestyle changes might help with fatigue in my menstrual phase?",
      ];

  const handleShare = async () => {
    const textLines = [
      "==================================",
      "NAARI CARE / SHE CARE — DOCTOR VISIT SUMMARY",
      "==================================",
      `Patient: ${patientRows[0].value}, Age: ${patientRows[1].value}, Phone: ${patientRows[2].value}`,
      `Date Generated: ${patientRows[3].value}`,
      "",
      "--- CYCLE OVERVIEW ---",
      ...cycleRows.map(r => `• ${r.label}: ${r.value}`),
      "",
      "--- RECENT SYMPTOMS (PAST 30 DAYS) ---",
      ...symptomsList.map(s => `• ${s.symptom} (${s.phase}, ${s.freq}) [${s.status.toUpperCase()}]`),
      "",
      "--- RECENT LAB FINDINGS ---",
      ...finalReports.map(r => `• ${r.test}: ${r.value} (Ref: ${r.ref}) [${r.status.toUpperCase()}]`),
      "",
      "--- OBSERVATIONS ---",
      ...observationsList.map((o, i) => `${i + 1}. ${o}`),
      "",
      "--- QUESTIONS TO DISCUSS ---",
      ...questionsList.map((q, i) => `${i + 1}. ${q}`),
      "",
      "Notice: Generated from patient self-reported data for clinical review. Not a diagnostic prescription.",
    ];

    const fullText = textLines.join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Doctor Summary — ${patientRows[0].value}`,
          text: fullText,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(fullText);
      }
    } catch {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(fullText);
        }
      } catch {
        // fallback
      }
    }

    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  return (
    <div className="pb-10 anim-fade-in">
      {/* Toast */}
      {shared && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#18110F] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl anim-slide-up flex items-center gap-2">
          <span>✓</span> Summary copied to clipboard
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1E4B4D] px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("home")}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base">Doctor Visit Summary</h1>
            <p className="text-white/50 text-xs mt-0.5">
              {loading ? "Loading clinical record..." : `Auto-generated · ${patientRows[3].value}`}
            </p>
          </div>
          <button
            onClick={handleShare}
            className="bg-white/10 border border-white/20 text-white text-xs font-bold rounded-xl px-3.5 py-2 flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" />
              <polyline points="16 6 12 2 8 6" strokeLinecap="round" />
              <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
            </svg>
            Share
          </button>
        </div>

        {/* Disclaimer pill */}
        <div className="bg-white/10 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p className="text-white/70 text-[11px] leading-relaxed">
            This summary is generated from your self-reported data. It uses educational language only and is not a diagnosis. Please share with your doctor for their professional assessment.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="px-5 pt-5 space-y-3">
        {/* 1. Patient Snapshot */}
        <div className="sc-card overflow-hidden">
          <button onClick={() => toggle("patient")} className="w-full flex items-center gap-3 px-4 py-4">
            <span className="text-lg">👤</span>
            <span className="flex-1 text-sm font-bold text-[#18110F] text-left">Patient Snapshot</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9B9390"
              strokeWidth="2.2"
              className="transition-transform flex-shrink-0"
              style={{ transform: expanded.has("patient") ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          {expanded.has("patient") && (
            <div className="border-t border-[#F7F3EE] px-4 pb-4 pt-3">
              <div className="space-y-2.5">
                {patientRows.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B9390] w-28 flex-shrink-0 pt-0.5">
                      {r.label}
                    </p>
                    <p className="text-sm text-[#18110F] font-medium flex-1">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Cycle Overview */}
        <div className="sc-card overflow-hidden">
          <button onClick={() => toggle("cycle")} className="w-full flex items-center gap-3 px-4 py-4">
            <span className="text-lg">🔄</span>
            <span className="flex-1 text-sm font-bold text-[#18110F] text-left">Cycle Overview</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9B9390"
              strokeWidth="2.2"
              className="transition-transform flex-shrink-0"
              style={{ transform: expanded.has("cycle") ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          {expanded.has("cycle") && (
            <div className="border-t border-[#F7F3EE] px-4 pb-4 pt-3">
              <div className="space-y-2.5">
                {cycleRows.map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B9390] w-28 flex-shrink-0 pt-0.5">
                      {r.label}
                    </p>
                    <p className="text-sm text-[#18110F] font-medium flex-1">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Recent Symptoms */}
        <div className="sc-card overflow-hidden">
          <button onClick={() => toggle("symptoms")} className="w-full flex items-center gap-3 px-4 py-4">
            <span className="text-lg">📝</span>
            <span className="flex-1 text-sm font-bold text-[#18110F] text-left">Recent Symptoms (Past 30 Days)</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9B9390"
              strokeWidth="2.2"
              className="transition-transform flex-shrink-0"
              style={{ transform: expanded.has("symptoms") ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          {expanded.has("symptoms") && (
            <div className="border-t border-[#F7F3EE] px-4 pb-4 pt-3">
              <div className="space-y-2">
                {symptomsList.map((item, i) => (
                  <div key={i} className="bg-[#F7F3EE] rounded-xl px-3.5 py-3 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#18110F]">{item.symptom}</p>
                      <p className="text-xs text-[#9B9390] mt-0.5">{item.phase} · {item.freq}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Recent Lab Reports */}
        <div className="sc-card overflow-hidden">
          <button onClick={() => toggle("reports")} className="w-full flex items-center gap-3 px-4 py-4">
            <span className="text-lg">🧪</span>
            <span className="flex-1 text-sm font-bold text-[#18110F] text-left">Recent Lab Reports</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9B9390"
              strokeWidth="2.2"
              className="transition-transform flex-shrink-0"
              style={{ transform: expanded.has("reports") ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          {expanded.has("reports") && (
            <div className="border-t border-[#F7F3EE] px-4 pb-4 pt-3">
              <div className="space-y-2">
                {finalReports.map((r, i) => (
                  <div key={i} className="bg-[#F7F3EE] rounded-xl px-3.5 py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#18110F]">{r.test}</p>
                      <p className="text-xs text-[#9B9390] mt-0.5">Reference: {r.ref}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-semibold text-[#18110F]">{r.value}</p>
                      <div className="mt-1">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Observations */}
        <div className="sc-card overflow-hidden">
          <button onClick={() => toggle("observations")} className="w-full flex items-center gap-3 px-4 py-4">
            <span className="text-lg">💡</span>
            <span className="flex-1 text-sm font-bold text-[#18110F] text-left">Observations</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9B9390"
              strokeWidth="2.2"
              className="transition-transform flex-shrink-0"
              style={{ transform: expanded.has("observations") ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          {expanded.has("observations") && (
            <div className="border-t border-[#F7F3EE] px-4 pb-4 pt-3">
              <div className="space-y-3">
                {observationsList.map((note, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#EAF3F3] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#2E6B6E]" />
                    </div>
                    <p className="text-sm text-[#3D3330] leading-relaxed">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Questions to Discuss */}
        <div className="sc-card overflow-hidden">
          <button onClick={() => toggle("questions")} className="w-full flex items-center gap-3 px-4 py-4">
            <span className="text-lg">❓</span>
            <span className="flex-1 text-sm font-bold text-[#18110F] text-left">Questions to Discuss</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9B9390"
              strokeWidth="2.2"
              className="transition-transform flex-shrink-0"
              style={{ transform: expanded.has("questions") ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          {expanded.has("questions") && (
            <div className="border-t border-[#F7F3EE] px-4 pb-4 pt-3">
              <div className="space-y-2">
                {questionsList.map((q, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#EAF3F3] flex items-center justify-center flex-shrink-0 text-[10px] font-black text-[#2E6B6E] mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#3D3330] leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-5 space-y-3">
        <button
          onClick={handleShare}
          className="w-full bg-[#2E6B6E] text-white font-bold rounded-2xl py-4 text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm hover:bg-[#255759]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" />
            <polyline points="16 6 12 2 8 6" strokeLinecap="round" />
            <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
          </svg>
          Share with Doctor
        </button>
        <button
          onClick={() => navigate("maya")}
          className="w-full border border-[#DDD8D0] bg-white text-[#3D3330] font-bold rounded-2xl py-4 text-[15px] active:scale-[0.98] transition-transform hover:bg-[#F7F3EE]"
        >
          Ask Maya about my results
        </button>
      </div>
    </div>
  );
}
