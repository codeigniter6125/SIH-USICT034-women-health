"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function CycleTrackingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(null);
  const [cycleData, setCycleData] = useState({
    current_day: 12,
    cycle_length: 28,
    period_length: 5,
    next_period_in_days: 16,
    phase: "Follicular Phase",
    phase_description: "Estrogen is rising. You may experience higher energy and clear focus.",
    insights: "Your mood has been steady this week. Based on your logs, you are in a calm phase. Keep hydrating.",
    rag_guidance: "",
  });
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newPeriodDate, setNewPeriodDate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone");
    if (!token || !storedPhone) {
      router.push("/login");
      return;
    }
    setPhone(storedPhone);

    fetch(`${BACKEND_URL}/api/cycle/status?user_phone=${encodeURIComponent(storedPhone)}`)
      .then((res) => res.json())
      .then((data) => {
        setCycleData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Cycle fetch error:", err);
        setLoading(false);
      });
  }, [router]);

  async function handleLogPeriod(e) {
    e.preventDefault();
    if (!phone) return;

    try {
      await fetch(`${BACKEND_URL}/api/cycle/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_phone: phone,
          period_start_date: newPeriodDate || new Date().toISOString().split("T")[0],
          cycle_length_days: cycleData.cycle_length || 28,
          period_length_days: cycleData.period_length || 5,
        }),
      });

      // Refresh
      const res = await fetch(`${BACKEND_URL}/api/cycle/status?user_phone=${encodeURIComponent(phone)}`);
      const updated = await res.json();
      setCycleData(updated);
      setShowLogModal(false);
    } catch (err) {
      console.error("Log period error:", err);
    }
  }

  // Calculate SVG stroke parameters for cycle wheel
  const totalDays = cycleData.cycle_length || 28;
  const periodDays = cycleData.period_length || 5;
  const currentDay = cycleData.current_day || 12;
  const circumference = 2 * Math.PI * 80; // ~502.65

  const periodStroke = (periodDays / totalDays) * circumference;
  const fertileStroke = (6 / totalDays) * circumference;
  const fertileOffset = -((10 / totalDays) * circumference);

  // Position of dot for current day on circle
  const angle = ((currentDay - 1) / totalDays) * 2 * Math.PI - Math.PI / 2;
  const dotX = 100 + 80 * Math.cos(angle);
  const dotY = 100 + 80 * Math.sin(angle);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-base pb-28">
      <TopHeader title="She Care" />

      <main className="flex-1 max-w-max-width-dashboard mx-auto w-full px-margin-mobile pt-6">
        {/* Cycle Wheel Section */}
        <section className="mb-8 flex flex-col items-center">
          <h2 className="font-headline-lg-mobile text-2xl md:text-headline-lg-mobile text-on-surface mb-6 text-center font-bold">
            Your Cycle
          </h2>

          <div className="relative w-[280px] h-[280px] mx-auto">
            {/* SVG Wheel */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Base Track */}
              <circle cx="100" cy="100" fill="none" r="80" stroke="#f1ede8" strokeWidth="20" />

              {/* Period Phase (Terracotta) */}
              <circle
                cx="100"
                cy="100"
                fill="none"
                r="80"
                stroke="#C97B5C"
                strokeWidth="20"
                strokeDasharray={`${periodStroke} ${circumference - periodStroke}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />

              {/* Fertile Window (Dusty Rose) */}
              <circle
                cx="100"
                cy="100"
                fill="none"
                r="80"
                stroke="#E3B8A8"
                strokeWidth="20"
                strokeDasharray={`${fertileStroke} ${circumference - fertileStroke}`}
                strokeDashoffset={fertileOffset}
                strokeLinecap="round"
              />

              {/* Current Day Indicator (Dot) */}
              <circle
                cx={dotX}
                cy={dotY}
                r="7"
                fill="#8c4a2f"
                stroke="#ffffff"
                strokeWidth="2.5"
                className="transition-all duration-500 shadow-md"
              />
            </svg>

            {/* Central Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="font-headline-lg-mobile text-3xl font-bold text-on-surface block">
                Day {cycleData.current_day}
              </span>
              <span className="font-body-base text-xs text-on-surface-variant font-semibold mt-1">
                Next period in {cycleData.next_period_in_days} days
              </span>
              <span className="text-[11px] font-bold text-primary mt-1 bg-primary-container/60 px-2 py-0.5 rounded-full">
                {cycleData.phase}
              </span>
            </div>
          </div>

          {/* Phase Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C97B5C] inline-block"></span>
              <span>Period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#E3B8A8] inline-block"></span>
              <span>Fertile Window</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#f1ede8] border border-outline inline-block"></span>
              <span>Luteal/Follicular</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8 grid grid-cols-2 gap-4">
          <Link
            href="/log"
            className="bg-surface-container-lowest border border-outline rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-2xs group active:scale-95"
          >
            <span
              className="material-symbols-outlined text-[#C97B5C] text-3xl group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              water_drop
            </span>
            <span className="font-body-bold text-sm text-on-surface">Log Symptoms</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="bg-surface-container-lowest border border-outline rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-2xs group active:scale-95"
          >
            <span className="material-symbols-outlined text-[#486550] text-3xl group-hover:scale-110 transition-transform">
              calendar_month
            </span>
            <span className="font-body-bold text-sm text-on-surface">Log Period Start</span>
          </button>
        </section>

        {/* Insights Section */}
        <section className="space-y-4 mb-8">
          <h3 className="font-title-md text-title-md text-on-surface font-bold">Cycle Agent Insights</h3>

          {/* Phase Guidance Card */}
          <div className="bg-surface-container-lowest border border-outline rounded-2xl p-5 flex items-start gap-4 shadow-2xs">
            <div className="bg-secondary-container rounded-full p-2.5 flex-shrink-0 text-secondary">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-body-bold text-sm text-on-surface font-bold">
                {cycleData.phase}: How to nurture your body
              </p>
              <p className="font-body-base text-xs text-on-surface-variant leading-relaxed">
                {cycleData.phase_description}
              </p>
            </div>
          </div>

          {/* General Cycle Mood Insight */}
          <div className="bg-surface-container-lowest border border-outline rounded-2xl p-5 flex items-start gap-4 shadow-2xs">
            <div className="bg-[#caebd0] rounded-full p-2.5 flex-shrink-0 text-[#486550]">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                mood
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-body-bold text-sm text-on-surface font-bold">Weekly Mood &amp; Symptom Summary</p>
              <p className="font-body-base text-xs text-on-surface-variant leading-relaxed">
                {cycleData.insights}
              </p>
            </div>
          </div>

          {/* Ask Maya Follow Up */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">psychology_alt</span>
              <span className="text-xs text-on-surface font-medium">Have questions about your current phase?</span>
            </div>
            <Link
              href="/chat"
              className="text-xs bg-primary text-on-primary px-3 py-1.5 rounded-full font-bold hover:opacity-90 transition-opacity"
            >
              Ask Maya
            </Link>
          </div>
        </section>
      </main>

      {/* Period Logging Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-title-md text-base font-bold text-on-surface">Log Period Start Date</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleLogPeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Start Date of Last Period
                </label>
                <input
                  type="date"
                  value={newPeriodDate}
                  onChange={(e) => setNewPeriodDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-full hover:opacity-90"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
