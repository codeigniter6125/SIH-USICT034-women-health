"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function HomePage() {
  const router = useRouter();
  const [userPhone, setUserPhone] = useState(null);
  const [cycleStatus, setCycleStatus] = useState(null);
  const [todayThought, setTodayThought] = useState("Remember to take a moment for yourself today. Small steps lead to lasting wellness.");

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const phone = localStorage.getItem("userPhone");
    if (!token || !phone) {
      router.push("/login");
      return;
    }
    setUserPhone(phone);

    // Fetch live cycle data from backend
    fetch(`${BACKEND_URL}/api/cycle/status?user_phone=${encodeURIComponent(phone)}`)
      .then((res) => res.json())
      .then((data) => setCycleStatus(data))
      .catch((err) => console.error("Error fetching cycle status:", err));

    // Fetch educational thought of the day
    fetch(`${BACKEND_URL}/api/education/insights`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.tip_of_the_day?.content) {
          setTodayThought(data.tip_of_the_day.content);
        }
      })
      .catch((err) => console.error("Error fetching insights:", err));
  }, [router]);

  if (!userPhone) return null;

  return (
    <div className="font-body-base text-on-background min-h-screen flex flex-col relative pb-24 md:pb-12 bg-background">
      <TopHeader title="She Care" />

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-max-width-dashboard mx-auto px-margin-mobile pt-6 pb-28 md:grid md:grid-cols-12 md:gap-8">
        {/* Greeting Section */}
        <section className="mb-8 md:col-span-12 text-center md:text-left">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-display-lg md:text-display-lg text-primary mb-2">
            नमस्ते,<br className="md:hidden" /> आप आज कैसा महसूस कर रही हैं?
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-2">
            Good morning. Take a deep breath. We&apos;re here to support your wellness journey today.
          </p>
        </section>

        {/* Action Cards Grid */}
        <section className="md:col-span-8 mb-8 space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-5">
          {/* Action Card 1: Log Symptoms */}
          <Link
            href="/log"
            className="bg-surface-container-lowest border border-outline rounded-3xl p-5 shadow-2xs hover:border-[#C97B5C]/50 transition-all cursor-pointer group flex flex-col justify-between min-h-[170px]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C97B5C] shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  health_and_safety
                </span>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-[#C97B5C] transition-colors text-xl">
                arrow_outward
              </span>
            </div>
            <div>
              <h3 className="font-title-md text-base text-on-surface mb-1 font-bold">Log Symptoms</h3>
              <p className="font-body-base text-xs text-on-surface-variant">Track your daily feelings &amp; mood</p>
            </div>
          </Link>

          {/* Action Card 2: Log Cycle */}
          <Link
            href="/cycle"
            className="bg-surface-container-lowest border border-outline rounded-3xl p-5 shadow-2xs hover:border-[#486550]/50 transition-all cursor-pointer group flex flex-col justify-between min-h-[170px]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#486550] shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  water_drop
                </span>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-[#486550] transition-colors text-xl">
                arrow_outward
              </span>
            </div>
            <div>
              <h3 className="font-title-md text-base text-on-surface mb-1 font-bold">
                {cycleStatus ? `Day ${cycleStatus.current_day} — ${cycleStatus.phase}` : "Log Cycle"}
              </h3>
              <p className="font-body-base text-xs text-on-surface-variant">
                {cycleStatus ? `Next period in ${cycleStatus.next_period_in_days} days` : "Update your period & cycle details"}
              </p>
            </div>
          </Link>

          {/* Action Card 3: Upload Report — full-width horizontal */}
          <Link
            href="/reports"
            className="bg-surface-container-lowest border border-outline rounded-3xl p-5 shadow-2xs hover:border-[#5B6FA6]/50 transition-all cursor-pointer group md:col-span-2 flex items-center gap-5 min-h-[110px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#5B6FA6] shadow-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                document_scanner
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-title-md text-base text-on-surface mb-1 font-bold">Upload Medical Report</h3>
              <p className="font-body-base text-xs text-on-surface-variant max-w-sm">
                Scan CBC, Ultrasound &amp; prescriptions with <span className="text-[#5B6FA6] font-bold">Google OCR</span> for instant safe AI interpretations
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5B6FA6] bg-[#5B6FA6]/10 px-2 py-0.5 rounded-full border border-[#5B6FA6]/20">
                  <span className="material-symbols-outlined text-[12px]">science</span> Lab Reports
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C97B5C] bg-[#C97B5C]/10 px-2 py-0.5 rounded-full border border-[#C97B5C]/20">
                  <span className="material-symbols-outlined text-[12px]">prescriptions</span> Prescriptions
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#486550] bg-[#486550]/10 px-2 py-0.5 rounded-full border border-[#486550]/20">
                  <span className="material-symbols-outlined text-[12px]">radiology</span> Imaging
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-[#5B6FA6] transition-colors text-xl shrink-0">
              arrow_outward
            </span>
          </Link>
        </section>

        {/* Right Column / Secondary Content */}
        <section className="md:col-span-4 space-y-5">
          {/* Daily Insight Card */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 relative overflow-hidden shadow-2xs">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <h4 className="font-label-caps text-xs text-primary tracking-wider uppercase mb-2 font-bold">
              Thought of the Day
            </h4>
            <p className="font-body-base text-on-surface italic leading-relaxed">
              &ldquo;{todayThought}&rdquo;
            </p>
          </div>

          {/* Quick Check-in CTA */}
          <div className="bg-surface-container-low rounded-3xl p-6 border border-outline flex flex-col items-center text-center shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 shadow-xs">
              <span className="material-symbols-outlined text-primary text-3xl">psychology_alt</span>
            </div>
            <h4 className="font-title-md text-title-md text-on-surface font-bold mb-1">Need a quick chat?</h4>
            <p className="font-body-base text-xs text-on-surface-variant mb-4">
              Maya, your bilingual health companion, is ready.
            </p>
            <Link
              href="/chat"
              className="w-full bg-primary hover:opacity-90 text-on-primary rounded-full py-3 px-6 font-body-bold text-sm transition-all min-h-[48px] flex items-center justify-center gap-2 shadow-2xs active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              <span>Start Chat with Maya</span>
            </Link>
          </div>

          {/* Doctor Summary Link */}
          <div className="bg-surface-container-lowest rounded-3xl p-4 border border-outline flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">stethoscope</span>
              <div>
                <h5 className="font-body-bold text-sm text-on-surface">Doctor-Visit Summary</h5>
                <p className="text-xs text-on-surface-variant">Export 30-day symptom report</p>
              </div>
            </div>
            <Link
              href="/doctor-summary"
              className="text-xs bg-surface-container px-3 py-1.5 rounded-full font-bold text-primary hover:bg-primary-container/40 transition-colors"
            >
              View
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
