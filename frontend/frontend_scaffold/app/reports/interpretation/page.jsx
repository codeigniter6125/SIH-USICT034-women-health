"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../../components/TopHeader";
import BottomNav from "../../../components/BottomNav";

export default function ReportInterpretationPage() {
  const router = useRouter();
  const [report, setReport] = useState({
    title: "Medical Report",
    report_type: "Medical Lab Report",
    date: new Date().toLocaleDateString(),
    health_summary:
      "Your extracted findings are being organized. Review the biomarker breakdown and consult with your healthcare provider for personalized guidance.",
    interpretation: "",
    main_pointers: [
      {
        title: "Analysis in progress",
        description: "Checking extracted values against clinical reference baselines.",
        status: "positive",
      },
    ],
    solutions_and_remedies: {
      dietary_cure: [
        "Incorporate balanced, nutrient-dense whole foods and prioritize hydration.",
        "Include anti-inflammatory foods like leafy greens, flaxseeds, and walnuts.",
      ],
      lifestyle_care: [
        "Aim for 7-8 hours of consistent, restorative sleep nightly.",
        "Engage in 20-30 minutes of low-impact physical activity or yoga.",
      ],
      questions_for_doctor: [
        "What do these specific test values indicate for my overall hormonal and metabolic health?",
        "Are there targeted supplements or dietary changes you would recommend?",
      ],
    },
    findings: [],
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("currentReport");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setReport({
          title: parsed.title || "Medical Report",
          report_type: parsed.report_type || "Medical Lab Report",
          date: parsed.date || new Date().toLocaleDateString(),
          health_summary:
            parsed.health_summary ||
            parsed.interpretation ||
            "Extracted via Google OCR and structured by Maya Report Reader Agent.",
          interpretation: parsed.interpretation || "",
          main_pointers:
            parsed.main_pointers && parsed.main_pointers.length > 0
              ? parsed.main_pointers
              : [
                  {
                    title: "Biomarkers Extracted",
                    description: "All test parameters from your document are ready for review.",
                    status: "positive",
                  },
                ],
          solutions_and_remedies: parsed.solutions_and_remedies || {
            dietary_cure: [
              "Maintain a balanced diet rich in micronutrients and fresh vegetables.",
            ],
            lifestyle_care: [
              "Daily light exercise and circadian sleep schedule.",
            ],
            questions_for_doctor: [
              "How do these results compare with my previous baseline?",
            ],
          },
          findings: (parsed.findings || []).map((f) => ({
            test: f.test || "Test",
            value: f.value || "-",
            unit: f.unit || "",
            reference_range: f.reference_range || "Normal",
            status: f.status || "normal",
          })),
        });
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              {report.report_type || "Medical Analysis"}
            </span>
          </div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-headline-lg font-bold text-on-background">
            Your Health Report
          </h2>
          <p className="font-body-base text-sm text-on-surface-variant mt-0.5">
            Gentle, comprehensive AI breakdown and personalized care guidance.
          </p>
        </div>

        {/* Summary Header Card */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-title-md text-base md:text-lg font-bold text-on-background">
                {report.title}
              </h3>
              <p className="font-body-base text-xs text-on-surface-variant mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">calendar_today</span>
                <span>Uploaded on {report.date}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#5B6FA6] shadow-sm flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                science
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Main Findings Section */}
        {report.main_pointers && report.main_pointers.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-headline-md text-base md:text-lg font-bold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                vital_signs
              </span>
              <span>Main Findings &amp; Key Takeaways</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {report.main_pointers.map((ptr, idx) => {
                const isWarn = ptr.status === "warning" || ptr.status === "attention";
                const isAttention = ptr.status === "attention";
                const bgColor = isWarn
                  ? isAttention
                    ? "bg-[#C97B5C]"
                    : "bg-escalation"
                  : "bg-[#486550]";
                const iconName = isWarn ? "info" : "check_circle";

                return (
                  <div
                    key={idx}
                    className="bg-surface-container-lowest rounded-3xl border border-outline p-4 flex items-start gap-3.5 shadow-2xs hover:border-primary/30 transition-colors"
                  >
                    <div
                      className={`${bgColor} text-white w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {iconName}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-body-bold text-sm font-bold text-on-background">
                        {ptr.title}
                      </h4>
                      <p className="font-body-base text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {ptr.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Maya's Clinical Health Insight */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline p-5 relative overflow-hidden shadow-2xs">
          <div className="flex items-center gap-2 mb-3 text-primary font-bold">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <h3 className="font-title-md text-base text-on-background">Maya&apos;s Health Summary</h3>
          </div>
          <p className="font-body-base text-sm text-on-surface-variant leading-relaxed">
            {report.health_summary}
          </p>
        </section>

        {/* Solutions, Remedies & Natural Cure Plan */}
        {report.solutions_and_remedies && (
          <section className="space-y-4">
            <h3 className="font-headline-md text-base md:text-lg font-bold text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-[#486550] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
              <span>Solutions, Remedies &amp; Holistic Care</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dietary Care & Herbal Remedies */}
              {report.solutions_and_remedies.dietary_cure &&
                report.solutions_and_remedies.dietary_cure.length > 0 && (
                  <div className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-[#C97B5C] font-bold">
                      <div className="w-8 h-8 rounded-xl bg-[#C97B5C]/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          nutrition
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-on-surface">Dietary &amp; Herbal Remedies</h4>
                    </div>
                    <ul className="space-y-2">
                      {report.solutions_and_remedies.dietary_cure.map((item, i) => (
                        <li key={i} className="text-xs text-on-surface-variant flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C97B5C] mt-1.5 shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Lifestyle & Holistic Care */}
              {report.solutions_and_remedies.lifestyle_care &&
                report.solutions_and_remedies.lifestyle_care.length > 0 && (
                  <div className="bg-surface-container-lowest rounded-3xl border border-outline p-5 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-[#486550] font-bold">
                      <div className="w-8 h-8 rounded-xl bg-[#486550]/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                          self_improvement
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-on-surface">Lifestyle &amp; Daily Habits</h4>
                    </div>
                    <ul className="space-y-2">
                      {report.solutions_and_remedies.lifestyle_care.map((item, i) => (
                        <li key={i} className="text-xs text-on-surface-variant flex items-start gap-2 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#486550] mt-1.5 shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Questions to ask Doctor */}
            {report.solutions_and_remedies.questions_for_doctor &&
              report.solutions_and_remedies.questions_for_doctor.length > 0 && (
                <div className="bg-[#5B6FA6]/5 border border-[#5B6FA6]/20 rounded-3xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-[#5B6FA6] font-bold">
                    <div className="w-8 h-8 rounded-xl bg-[#5B6FA6]/15 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        contact_support
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-on-surface">Questions to Ask Your Doctor</h4>
                  </div>
                  <ul className="space-y-2">
                    {report.solutions_and_remedies.questions_for_doctor.map((q, i) => (
                      <li key={i} className="text-xs text-on-surface-variant flex items-start gap-2 leading-relaxed">
                        <span className="w-4 h-4 rounded-full bg-[#5B6FA6] text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="font-medium text-on-surface">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </section>
        )}

        {/* Technical Details Accordion */}
        {report.findings && report.findings.length > 0 && (
          <section className="bg-surface-container-lowest rounded-3xl border border-outline overflow-hidden shadow-2xs">
            <details className="group" open>
              <summary className="flex justify-between items-center p-4 cursor-pointer list-none hover:bg-surface-container-low transition-colors">
                <h3 className="font-body-bold text-sm font-bold text-on-background flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">science</span>
                  <span>Technical Details &amp; OCR Values ({report.findings.length} Biomarkers)</span>
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
                          f.status === "high" || f.status === "attention"
                            ? "text-[#C97B5C]"
                            : f.status === "warning"
                            ? "text-escalation"
                            : "text-on-background"
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
        )}

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
