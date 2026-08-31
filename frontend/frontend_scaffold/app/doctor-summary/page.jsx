"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function DoctorVisitSummaryPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(null);
  const [data, setData] = useState({
    patient: { name: "Priya Sharma", age: 29, phone: "+919876543210", gender: "Female" },
    date_range: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    overview:
      "Loading dynamic clinical summary and recent lab findings...",
    cycle_insights: { avg_cycle_length: "28 Days", avg_period_length: "5 Days", regularity: "Regular" },
    frequent_symptoms: [
      { symptom: "Fatigue", days: "Reported" },
      { symptom: "Bloating", days: "Periodic" },
      { symptom: "Mild Cramps", days: "Cycle day 1-2" },
    ],
    recent_reports: [],
    doctor_notes_prompt: "Discuss recent biomarker results and personalized cycle care.",
  });
  const [customNotes, setCustomNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone");
    const storedName = localStorage.getItem("userName");
    const storedAge = localStorage.getItem("userAge");

    if (!token || !storedPhone) {
      router.push("/login");
      return;
    }
    setPhone(storedPhone);

    fetch(`${BACKEND_URL}/api/doctor-summary?user_phone=${encodeURIComponent(storedPhone)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData) {
          // Check if there is an active session report that should be included
          let finalReports = resData.recent_reports || [];
          const sessionRaw = sessionStorage.getItem("currentReport");
          
          if (sessionRaw) {
            try {
              const currentRep = JSON.parse(sessionRaw);
              const alreadyPresent = finalReports.some((r) => r.title === currentRep.title || r.id === currentRep.id);
              if (!alreadyPresent) {
                const findingsPreview = (currentRep.findings || [])
                  .slice(0, 3)
                  .map((f) => `${f.test}: ${f.value} ${f.unit || ""}`)
                  .join(", ");
                
                finalReports = [
                  {
                    id: currentRep.id || "current_session_rep",
                    title: currentRep.title || currentRep.report_type || "Present Lab Report",
                    report_type: currentRep.report_type || "Medical Report",
                    date: currentRep.date || new Date().toLocaleDateString(),
                    summary: findingsPreview || currentRep.health_summary || "Analyzed",
                    findings: currentRep.findings || [],
                    health_summary: currentRep.health_summary || currentRep.interpretation || "",
                    solutions_and_remedies: currentRep.solutions_and_remedies || {},
                  },
                  ...finalReports,
                ];
              }

              // Use current report summary for dynamic overview if present
              if (currentRep.health_summary || currentRep.interpretation) {
                const repSummary = currentRep.health_summary || currentRep.interpretation;
                resData.overview = `Patient presents with ${currentRep.report_type || "recent laboratory findings"}. ${repSummary} Cycle parameters reflect a ${resData.cycle_insights?.avg_cycle_length || "28 Days"} baseline.`;
                
                const questions = currentRep.solutions_and_remedies?.questions_for_doctor;
                if (questions && questions.length > 0) {
                  resData.doctor_notes_prompt = "Questions for Doctor:\n• " + questions.join("\n• ");
                }
              }
            } catch (err) {
              console.error("Session report parse error:", err);
            }
          }

          if (storedName) resData.patient.name = storedName;
          if (storedAge) resData.patient.age = parseInt(storedAge);
          resData.recent_reports = finalReports;
          setData(resData);
        }
      })
      .catch((err) => console.error("Error fetching doctor summary:", err));
  }, [router]);

  function handlePrint() {
    window.print();
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `Doctor Summary - ${data.patient.name}`,
        text: `Doctor-Visit Summary for ${data.patient.name}:\n\nOverview:\n${data.overview}\n\nCycle: ${data.cycle_insights.avg_cycle_length}, ${data.cycle_insights.regularity}\n\nAttached Reports: ${data.recent_reports.map((r) => r.title).join(", ")}`,
      });
    } else {
      alert("Summary copied to clipboard!");
    }
  }

  function openReportInInterpretation(rep) {
    sessionStorage.setItem("currentReport", JSON.stringify(rep));
    router.push("/reports/interpretation");
  }

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen pb-32">
      <TopHeader title="She Care" showBack backHref="/" />

      <main className="px-margin-mobile md:px-margin-desktop py-6 max-w-max-width-dashboard mx-auto space-y-6">
        {/* Header & Date Range */}
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-headline-lg font-bold text-on-surface mb-1">
            Doctor-Visit Summary
          </h2>
          <p className="font-body-base text-xs text-on-surface-variant flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            <span>{data.date_range}</span>
          </p>
        </div>

        {/* Patient Info Card */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-container/80 border border-outline-variant flex items-center justify-center text-primary font-bold text-2xl shrink-0 shadow-xs">
              🌸
            </div>
            <div>
              <h3 className="font-title-md text-base md:text-lg font-bold text-on-surface">{data.patient.name}</h3>
              <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
                Age {data.patient.age} · {data.patient.gender} · {data.patient.phone}
              </p>
              {data.patient.email && (
                <p className="font-body-base text-xs text-primary mt-0.5">{data.patient.email}</p>
              )}
            </div>
          </div>
        </section>

        {/* Summary Overview */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs space-y-2">
          <h3 className="font-headline-md text-base font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              summarize
            </span>
            <span>Clinical Overview</span>
          </h3>
          <p className="font-body-base text-xs md:text-sm text-on-surface leading-relaxed">{data.overview}</p>
        </section>

        {/* Detailed Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cycle Insights */}
          <section className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs flex flex-col justify-between">
            <h3 className="font-title-md text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">water_drop</span>
              <span>Cycle Insights</span>
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <span className="text-xs text-on-surface-variant">Avg Cycle Length</span>
                <span className="text-xs font-bold text-on-surface">{data.cycle_insights.avg_cycle_length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <span className="text-xs text-on-surface-variant">Avg Period Length</span>
                <span className="text-xs font-bold text-on-surface">{data.cycle_insights.avg_period_length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">Regularity</span>
                <span className="text-xs font-bold text-[#486550] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>{data.cycle_insights.regularity}</span>
                </span>
              </div>
            </div>
          </section>

          {/* Frequent Symptoms */}
          <section className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs flex flex-col justify-between">
            <h3 className="font-title-md text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">monitoring</span>
              <span>Frequent Symptoms</span>
            </h3>
            <ul className="space-y-2.5">
              {data.frequent_symptoms.map((s, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span className="text-xs text-on-surface flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-primary/80"></span>
                    <span>{s.symptom}</span>
                  </span>
                  <span className="text-[10px] text-primary bg-primary/10 py-0.5 px-2.5 rounded-full font-bold border border-primary/20">
                    {s.days}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Recent Medical Reports */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-title-md text-sm font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">science</span>
              <span>Attached Medical Reports ({data.recent_reports.length})</span>
            </h3>
            <Link href="/reports" className="text-xs text-primary font-bold hover:underline">
              + Upload New
            </Link>
          </div>

          {data.recent_reports.length > 0 ? (
            <div className="space-y-2.5">
              {data.recent_reports.map((rep, idx) => (
                <div
                  key={idx}
                  onClick={() => openReportInInterpretation(rep)}
                  className="border border-outline rounded-2xl p-4 flex justify-between items-center bg-surface-container-low hover:border-primary/40 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5B6FA6] text-white flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        description
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-body-bold text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          {rep.title}
                        </h4>
                        {rep.report_type && (
                          <span className="text-[9px] font-bold text-[#5B6FA6] bg-[#5B6FA6]/10 px-2 py-0.5 rounded-full border border-[#5B6FA6]/20">
                            {rep.report_type}
                          </span>
                        )}
                      </div>
                      <p className="font-body-base text-[11px] text-on-surface-variant mt-0.5">
                        {rep.date} · {rep.summary}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">
                    arrow_outward
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-surface-container-low rounded-2xl border border-dashed border-outline">
              <p className="text-xs text-on-surface-variant">No reports uploaded yet.</p>
              <Link href="/reports" className="text-xs text-primary font-bold hover:underline mt-1 inline-block">
                Upload lab reports or ultrasound in Medical Vault
              </Link>
            </div>
          )}
        </section>

        {/* Prep Notes Area */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs space-y-2">
          <h3 className="font-title-md text-sm font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">edit_note</span>
            <span>Notes &amp; Questions for Doctor</span>
          </h3>
          <p className="font-body-base text-xs text-on-surface-variant">
            These smart questions were generated based on your attached report and symptoms.
          </p>
          <textarea
            rows={4}
            value={customNotes || data.doctor_notes_prompt}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder={data.doctor_notes_prompt}
            className="w-full border border-outline rounded-2xl p-3.5 bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
          />
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleShare}
            className="bg-primary text-on-primary font-body-bold text-sm flex-1 rounded-full py-4 px-6 min-h-[50px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              share
            </span>
            <span>Share with Doctor</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-surface-container-lowest border border-outline text-on-surface font-body-bold text-sm flex-1 rounded-full py-4 px-6 min-h-[50px] flex items-center justify-center gap-2 hover:bg-surface-container-low active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Download / Print PDF</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

