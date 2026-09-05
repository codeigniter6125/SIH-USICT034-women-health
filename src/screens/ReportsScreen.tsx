import { useState, useRef, useEffect } from "react";
import type { Screen } from "../App";
import { SkeletonReport } from "../components/SkeletonLoader";
import StatusBadge from "../components/StatusBadge";
import { uploadReportFile, getUserReports } from "../lib/api";

interface Props { navigate: (s: Screen) => void; }
type State = "empty" | "uploading" | "processing" | "result" | "error";
type Tab = "findings" | "meaning" | "questions" | "lifestyle";

const STATUS_BG: Record<string, { bg: string; border: string }> = {
  normal:    { bg: "#EDF3E8", border: "#C8DDB8" },
  attention: { bg: "#FDF3E3", border: "#F5D9A8" },
  warning:   { bg: "#FEF2F2", border: "#FECACA" },
  critical:  { bg: "#FEF2F2", border: "#FECACA" },
};

const DEFAULT_FINDINGS = [
  { test: "Hemoglobin (Hb)", value: "10.8", unit: "g/dL", ref: "12.0–15.5", status: "attention" as const },
  { test: "RBC Count",       value: "3.9",  unit: "M/μL", ref: "4.0–5.2",   status: "attention" as const },
  { test: "WBC Count",       value: "7,400",unit: "/μL",  ref: "4,500–11,000", status: "normal" as const },
  { test: "Platelet Count",  value: "2.1L", unit: "/μL",  ref: "1.5L–4.0L", status: "normal" as const },
  { test: "Ferritin",        value: "8",    unit: "ng/mL",ref: "12–150",    status: "warning" as const },
  { test: "TSH",             value: "2.1",  unit: "mIU/L",ref: "0.4–4.0",   status: "normal" as const },
];

export default function ReportsScreen({ navigate }: Props) {
  const [state, setState] = useState<State>("empty");
  const [tab, setTab] = useState<Tab>("findings");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [activeReport, setActiveReport] = useState<any>(null);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPastReports();
  }, []);

  async function loadPastReports() {
    try {
      const reports = await getUserReports();
      if (reports && reports.length > 0) {
        setPastReports(reports);
      }
    } catch (err) {
      console.warn("Could not load past reports:", err);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setState("uploading");

    try {
      setState("processing");
      const res = await uploadReportFile(file);
      const rep = res.report || res.agent_result;
      if (rep) {
        setActiveReport(rep);
        setShowSkeleton(true);
        setState("result");
        setTimeout(() => setShowSkeleton(false), 600);
        await loadPastReports();
      } else {
        setState("error");
      }
    } catch (err) {
      console.error("Report processing error:", err);
      setState("error");
    }
  }

  function handleTriggerUpload() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function handleSelectPastReport(report: any) {
    setActiveReport(report);
    setState("result");
  }

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "findings",  label: "Values" },
    { id: "meaning",   label: "Meaning" },
    { id: "questions", label: "Ask Doctor" },
    { id: "lifestyle", label: "Self-care" },
  ];

  const currentTitle = activeReport?.title || activeReport?.report_type || "Complete Blood Count";
  const currentDate = activeReport?.date || "4 Sep 2026";
  const currentSummary = activeReport?.health_summary || activeReport?.interpretation ||
    "Biomarkers extracted and ready for clinical review. Your hemoglobin may suggest low iron stores.";
  const currentFindings = activeReport?.findings && activeReport.findings.length > 0
    ? activeReport.findings.map((f: any) => ({
        test: f.test,
        value: f.value,
        unit: f.unit || "",
        ref: f.reference_range || f.ref || "12.0-15.5",
        status: (f.status === "normal" ? "normal" : f.status === "warning" || f.status === "critical" ? "warning" : "attention") as "normal" | "attention" | "warning",
      }))
    : DEFAULT_FINDINGS;

  const currentQuestions: string[] =
    activeReport?.solutions_and_remedies?.questions_for_doctor && activeReport.solutions_and_remedies.questions_for_doctor.length > 0
      ? activeReport.solutions_and_remedies.questions_for_doctor
      : [
          "Is iron supplementation right for me based on these results?",
          "Should I test for an underlying cause of the low iron?",
          "When should I retest and what values should I aim for?",
          "Could my period symptoms be related to this result?",
          "Are there dietary changes that would help?",
        ];

  const currentDietary: string[] =
    activeReport?.solutions_and_remedies?.dietary && activeReport.solutions_and_remedies.dietary.length > 0
      ? activeReport.solutions_and_remedies.dietary
      : [
          "Spinach, lentils, kidney beans, fortified cereals. Cooking in cast-iron pans can also help.",
          "Eat citrus, amla, or tomatoes alongside iron-rich meals to significantly boost absorption.",
          "Tannins inhibit iron absorption. Avoid tea and coffee for at least 1 hour around mealtimes.",
          "Iron deficiency worsens fatigue. Aim for 7–8 hours and take short rests if needed.",
        ];

  return (
    <div className="pb-4 anim-fade-in">
      {/* Hidden file input for camera & file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#18110F]">Medical Reports</h1>
        {state === "result" && (
          <button onClick={() => setState("empty")} className="text-xs font-bold text-[#2E6B6E] bg-[#EAF3F3] px-3 py-1.5 rounded-full">+ New</button>
        )}
      </div>

      {state === "empty" && (
        <div className="px-5">
          {/* Upload zone */}
          <div
            onClick={handleTriggerUpload}
            className="border-2 border-dashed border-[#C2DEDD] bg-[#EAF3F3] rounded-3xl py-8 px-6 flex flex-col items-center text-center cursor-pointer mb-5 active:bg-[#DCF0EF] transition-colors"
          >
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E6B6E" strokeWidth="1.7" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
            </div>
            <h3 className="text-base font-bold text-[#18110F] mb-1.5">Understand your report</h3>
            <p className="text-sm text-[#6E6460] leading-relaxed mb-4 max-w-[260px]">
              Upload any lab or medical report and get a plain-language explanation of every finding.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["📷 Take photo", "🖼 Upload image", "📄 Upload PDF"].map(t => (
                <span key={t} className="text-xs bg-white text-[#2E6B6E] font-bold border border-[#C2DEDD] px-3 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
            <p className="text-[10px] text-[#9B9390] mt-4">JPG · PNG · PDF · Max 20 MB</p>
          </div>

          {pastReports.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Saved Reports</p>
              <div className="space-y-2.5">
                {pastReports.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPastReport(r)}
                    className="w-full bg-white border border-[#DDD8D0] rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EAF3F3] flex items-center justify-center flex-shrink-0">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E6B6E" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#18110F] truncate">{r.title || r.report_type || "Medical Report"}</p>
                      <p className="text-xs text-[#9B9390] mt-0.5">{r.category || "Lab Report"} · {r.date}</p>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4BEB8" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="px-5">
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-3xl p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-white border border-[#FECACA] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
            </div>
            <h3 className="font-bold text-[#18110F] mb-1.5">Couldn't read that report</h3>
            <p className="text-sm text-[#6E6460] leading-relaxed mb-5">
              We couldn't extract readable text from that image. Please try a clearer photo, or upload as a PDF.
            </p>
            <button onClick={handleTriggerUpload} className="bg-[#2E6B6E] text-white font-bold rounded-2xl px-6 py-3 text-sm w-full active:scale-[0.98] transition-transform">Try again</button>
            <button onClick={() => navigate("maya")} className="mt-2 text-sm text-[#2E6B6E] font-semibold py-2 w-full">Ask Maya for help instead</button>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="px-5">
          <div className="bg-white border border-[#DDD8D0] rounded-3xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF3F3] flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2E6B6E" strokeWidth="1.7" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
            </div>
            <p className="font-bold text-[#18110F] mb-0.5">Uploading your report</p>
            <p className="text-xs text-[#9B9390] mb-5">{uploadFileName || "document.jpg"}</p>
            <div className="h-2.5 bg-[#EDE9E2] rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[#2E6B6E] rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-[#9B9390]">Sending to secure medical vault…</p>
          </div>
        </div>
      )}

      {state === "processing" && (
        <div className="px-5">
          <div className="bg-white border border-[#DDD8D0] rounded-3xl p-6 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 rounded-full border-[3px] border-[#EAF3F3] border-t-[#2E6B6E] animate-spin" />
            </div>
            <p className="font-bold text-[#18110F] mb-1">Maya is reading your report…</p>
            <p className="text-xs text-[#9B9390]">Extracting biomarkers via Google Cloud Vision OCR</p>
          </div>
        </div>
      )}

      {state === "result" && (
        <div className="px-5">
          {showSkeleton ? <SkeletonReport /> : (
            <>
              {/* Report header */}
              <div className="bg-white border border-[#DDD8D0] rounded-3xl p-5 mb-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-[#18110F] text-base">{currentTitle}</h2>
                    <p className="text-xs text-[#9B9390] mt-0.5">Lab Report · {currentDate}</p>
                  </div>
                  <StatusBadge status="attention" />
                </div>
                <div className="bg-[#FDF3E3] border border-[#F5D9A8] rounded-2xl px-4 py-3">
                  <p className="text-[10px] font-bold text-[#C47A1A] uppercase tracking-widest mb-1.5">At a glance</p>
                  <p className="text-sm text-[#3D3330] leading-relaxed">{currentSummary}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-[#EDE9E2] rounded-2xl p-1 mb-4">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === t.id ? "bg-white text-[#18110F] shadow-sm" : "text-[#9B9390]"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "findings" && (
                <div className="space-y-2.5 mb-4">
                  {currentFindings.map((f: any, i: number) => {
                    const s = STATUS_BG[f.status] || STATUS_BG.normal;
                    return (
                      <div key={i} className="rounded-2xl border px-4 py-3.5" style={{ background: s.bg, borderColor: s.border }}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-[#18110F]">{f.test}</p>
                          <StatusBadge status={f.status} />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display text-[28px] font-semibold text-[#18110F] leading-none">{f.value}</span>
                          <span className="text-sm text-[#9B9390] font-medium">{f.unit}</span>
                        </div>
                        <p className="text-xs text-[#9B9390] mt-1">Reference: {f.ref} {f.unit}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "meaning" && (
                <div className="space-y-3 mb-4">
                  <div className="bg-white border border-[#DDD8D0] rounded-2xl px-4 py-4">
                    <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-widest mb-2">What the values suggest</p>
                    <p className="text-sm text-[#3D3330] leading-relaxed">{currentSummary}</p>
                  </div>
                  <div className="bg-white border border-[#DDD8D0] rounded-2xl px-4 py-4">
                    <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-widest mb-2">Important clinical note</p>
                    <p className="text-sm text-[#3D3330] leading-relaxed">
                      This is educational context only. Your doctor reviews your full clinical picture — symptoms, history, and physical examination — before recommending treatment.
                    </p>
                  </div>
                </div>
              )}

              {tab === "questions" && (
                <div className="mb-4">
                  <div className="bg-white border border-[#DDD8D0] rounded-2xl px-4 py-4 mb-3">
                    <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-widest mb-3">Questions to ask your doctor</p>
                    <div className="space-y-3">
                      {currentQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#EAF3F3] text-[#2E6B6E] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                          <p className="text-sm text-[#3D3330] leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => navigate("doctor-summary")} className="w-full bg-[#EAF3F3] text-[#2E6B6E] font-bold rounded-2xl py-3 text-sm active:scale-[0.98] transition-transform">
                    Prepare full Doctor Visit Summary →
                  </button>
                </div>
              )}

              {tab === "lifestyle" && (
                <div className="bg-white border border-[#DDD8D0] rounded-2xl px-4 py-4 mb-4">
                  <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-widest mb-4">Self-care &amp; lifestyle</p>
                  <div className="space-y-3">
                    {currentDietary.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-lg">🌿</span>
                        <p className="text-xs text-[#3D3330] leading-relaxed mt-0.5">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-[#F7F3EE] border border-[#DDD8D0] rounded-2xl px-4 py-3.5">
                <p className="text-xs text-[#9B9390] text-center leading-relaxed">
                  This information is for educational purposes only and is not a diagnosis. Please discuss your report with a qualified healthcare professional.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
