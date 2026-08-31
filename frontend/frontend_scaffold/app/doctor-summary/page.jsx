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
    date_range: "Oct 1 - Oct 31, 2023",
    overview:
      "Recent reports show slightly low iron levels; user reports fatigue and steady mood. Cycle length has been consistent, but energy levels remain a primary focus for this period. No critical symptoms reported.",
    cycle_insights: { avg_cycle_length: "28 Days", avg_period_length: "5 Days", regularity: "Regular" },
    frequent_symptoms: [
      { symptom: "Fatigue", days: "5 Days", color: "bg-escalation-container" },
      { symptom: "Steady Mood", days: "12 Days", color: "bg-secondary-container" },
      { symptom: "Mild Cramps", days: "2 Days", color: "bg-primary-container" },
    ],
    recent_reports: [
      { title: "Complete Blood Count (CBC)", date: "Oct 15, 2023", summary: "Hemoglobin slightly low" },
    ],
    doctor_notes_prompt: "e.g., Ask about iron supplements for afternoon fatigue and next lab check...",
  });
  const [customNotes, setCustomNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone");
    if (!token || !storedPhone) {
      router.push("/login");
      return;
    }
    setPhone(storedPhone);

    fetch(`${BACKEND_URL}/api/doctor-summary?user_phone=${encodeURIComponent(storedPhone)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData) setData(resData);
      })
      .catch((err) => console.error("Error fetching doctor summary:", err));
  }, [router]);

  function handlePrint() {
    window.print();
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "Doctor-Visit Summary - She Care",
        text: `Doctor Summary for ${data.patient.name}: ${data.overview}`,
      });
    } else {
      alert("Summary copied to clipboard!");
    }
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
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>{data.date_range}</span>
          </p>
        </div>

        {/* Patient Info Card */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline p-4 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container/60 border border-outline flex items-center justify-center text-primary font-bold text-xl shrink-0">
              🌸
            </div>
            <div>
              <h3 className="font-title-md text-base font-bold text-on-surface">{data.patient.name}</h3>
              <p className="font-body-base text-xs text-on-surface-variant">
                Age {data.patient.age} · {data.patient.gender} · {data.patient.phone}
              </p>
            </div>
          </div>
        </section>

        {/* Summary Overview */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline p-5 shadow-2xs">
          <h3 className="font-headline-md text-base font-bold text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">summarize</span>
            <span>Overview</span>
          </h3>
          <p className="font-body-base text-sm text-on-surface leading-relaxed">{data.overview}</p>
        </section>

        {/* Detailed Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cycle Insights */}
          <section className="bg-surface-container-lowest rounded-2xl border border-outline p-5 shadow-2xs flex flex-col justify-between">
            <h3 className="font-title-md text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">cycle</span>
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
                <span className="text-xs font-bold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>{data.cycle_insights.regularity}</span>
                </span>
              </div>
            </div>
          </section>

          {/* Symptom Log */}
          <section className="bg-surface-container-lowest rounded-2xl border border-outline p-5 shadow-2xs flex flex-col justify-between">
            <h3 className="font-title-md text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">monitoring</span>
              <span>Frequent Symptoms</span>
            </h3>
            <ul className="space-y-2.5">
              {data.frequent_symptoms.map((s, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span className="text-xs text-on-surface flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                    <span>{s.symptom}</span>
                  </span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant bg-surface-container py-0.5 px-2 rounded-md font-bold">
                    {s.days}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Recent Medical Reports */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline p-5 shadow-2xs">
          <h3 className="font-title-md text-sm font-bold text-primary mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">description</span>
            <span>Recent Medical Reports</span>
          </h3>
          <div className="border border-outline-variant rounded-xl p-3.5 flex justify-between items-center bg-surface-container-low">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg border border-outline text-primary">
                <span className="material-symbols-outlined text-xl">science</span>
              </div>
              <div>
                <h4 className="font-body-bold text-xs font-bold text-on-surface">
                  {data.recent_reports[0]?.title || "Complete Blood Count (CBC)"}
                </h4>
                <p className="font-body-base text-[11px] text-on-surface-variant">
                  {data.recent_reports[0]?.date || "Oct 15, 2023"} · {data.recent_reports[0]?.summary || "Analyzed"}
                </p>
              </div>
            </div>
            <Link
              href="/reports/interpretation"
              className="text-primary hover:bg-surface-container-highest p-1.5 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </Link>
          </div>
        </section>

        {/* Prep Notes Area */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline p-5 shadow-2xs">
          <h3 className="font-title-md text-sm font-bold text-primary mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">edit_note</span>
            <span>Notes &amp; Questions for Doctor</span>
          </h3>
          <p className="font-body-base text-xs text-on-surface-variant mb-3">
            Use this space to jot down anything you want to discuss during your appointment.
          </p>
          <textarea
            rows={3}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder={data.doctor_notes_prompt}
            className="w-full border border-outline-variant rounded-xl p-3 bg-surface-container-low text-xs text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
          />
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleShare}
            className="bg-primary text-on-primary font-body-bold text-sm flex-1 rounded-full py-3.5 px-6 min-h-[48px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-lg">share</span>
            <span>Share with Doctor</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-transparent border border-outline text-on-surface font-body-bold text-sm flex-1 rounded-full py-3.5 px-6 min-h-[48px] flex items-center justify-center gap-2 hover:bg-surface-container-low active:scale-[0.98] transition-all"
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
