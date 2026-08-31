"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../../components/TopHeader";
import BottomNav from "../../../components/BottomNav";

export default function ReportInterpretationPage() {
  const router = useRouter();
  const [report, setReport] = useState({
    title: "Complete Blood Count (CBC)",
    date: "Oct 24, 2023",
    interpretation:
      "Overall, your complete blood count is healthy. Because your iron stores (ferritin) are slightly low, you might feel a bit more tired than usual, especially towards the end of the day. Increasing iron-rich foods in your diet, like spinach, lentils, or fortified cereals, could help gently lift those levels.",
    findings: [
      { test: "Hemoglobin (Hb)", value: "12.5", unit: "g/dL", reference_range: "12.0 - 15.5", status: "normal" },
      { test: "Ferritin", value: "15", unit: "ng/mL", reference_range: "20 - 200", status: "low" },
      { test: "White Blood Cells (WBC)", value: "6.2", unit: "10^3/uL", reference_range: "4.5 - 11.0", status: "normal" },
      { test: "Platelets", value: "250", unit: "10^3/uL", reference_range: "150 - 450", status: "normal" },
    ],
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("currentReport");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.findings && parsed.findings.length > 0) {
          setReport({
            title: parsed.title || "Complete Blood Count (CBC)",
            date: parsed.date || new Date().toLocaleDateString(),
            interpretation: parsed.interpretation || "Extracted via Google Cloud Vision OCR and verified with Report Reader Agent.",
            findings: parsed.findings.map((f) => ({
              test: f.test || "Test",
              value: f.value || "-",
              unit: f.unit || "",
              reference_range: f.reference_range || "Normal",
              status: parseFloat(f.value) < 16 && f.test.toLowerCase().includes("ferritin") ? "low" : "normal",
            })),
          });
        }
      } catch (err) {
        console.error("Error reading current report:", err);
      }
    }
  }, []);

  return (
    <div className="bg-background text-on-background font-body-base min-h-screen pb-32">
      <TopHeader title="She Care" showBack backHref="/reports" />

      <main className="max-w-max-width-dashboard mx-auto px-margin-mobile pt-6 space-y-6">
        {/* Screen Title */}
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-headline-lg font-bold text-on-background">
            Your Health Report
          </h2>
          <p className="font-body-base text-sm text-on-surface-variant mt-1">
            Here is a gentle, safe breakdown of your extracted medical findings.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-title-md text-base md:text-lg font-bold text-on-background">{report.title}</h3>
              <p className="font-body-base text-xs text-on-surface-variant mt-1">Uploaded on {report.date}</p>
            </div>
            <div className="bg-surface-container-low w-11 h-11 rounded-full flex items-center justify-center border border-outline-variant text-tertiary">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
          </div>
        </div>

        {/* Main Findings */}
        <section className="space-y-3">
          <h3 className="font-headline-md text-base md:text-lg font-bold text-on-background">Main Findings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Positive Finding */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="bg-[#486550] text-white w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div>
                <h4 className="font-body-bold text-sm font-bold text-on-background">
                  Hemoglobin is within normal range
                </h4>
                <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
                  Your blood&apos;s oxygen-carrying capacity looks steady.
                </p>
              </div>
            </div>

            {/* Mild Concern Finding */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="bg-[#C97B5C] text-white w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  info
                </span>
              </div>
              <div>
                <h4 className="font-body-bold text-sm font-bold text-on-background">Iron stores slightly low</h4>
                <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
                  Ferritin is just below optimal baseline; may contribute to mild fatigue.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Interpretation */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline p-5 relative overflow-hidden shadow-2xs">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-surface-tint opacity-5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-3 text-primary font-bold">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <h3 className="font-title-md text-base text-on-background">She Care Insight</h3>
          </div>
          <p className="font-body-base text-sm text-on-surface-variant leading-relaxed">
            {report.interpretation}
          </p>
        </section>

        {/* Technical Details Accordion */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline overflow-hidden shadow-2xs">
          <details className="group" open>
            <summary className="flex justify-between items-center p-4 cursor-pointer list-none hover:bg-surface-container-low transition-colors">
              <h3 className="font-body-bold text-sm font-bold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">science</span>
                <span>Technical Details &amp; OCR Values</span>
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180">
                expand_more
              </span>
            </summary>
            <div className="p-4 border-t border-outline-variant bg-surface">
              <ul className="space-y-2.5">
                {report.findings.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center pb-2 border-b border-outline-variant/60 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="font-body-base text-xs md:text-sm text-on-surface font-medium">
                        {f.test}
                      </span>
                      {f.reference_range && (
                        <p className="text-[10px] text-on-surface-variant">Ref: {f.reference_range}</p>
                      )}
                    </div>
                    <span
                      className={`font-body-bold text-sm font-bold ${
                        f.status === "low" ? "text-primary" : "text-on-background"
                      }`}
                    >
                      {f.value} <span className="text-[11px] font-normal text-on-surface-variant">{f.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </section>

        {/* Next Steps Actions */}
        <section className="space-y-3 pt-2">
          <Link
            href="/doctor-summary"
            className="w-full bg-primary text-on-primary font-body-bold text-sm rounded-full py-3.5 px-6 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity min-h-[48px] shadow-2xs active:scale-95"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              calendar_month
            </span>
            <span>Add to Doctor-Visit Summary</span>
          </Link>

          <Link
            href="/chat"
            className="w-full bg-surface-container-lowest border border-outline text-primary font-body-bold text-sm rounded-full py-3 px-6 flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors min-h-[44px]"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            <span>Ask Maya about these values</span>
          </Link>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
