"use client";

import Link from "next/link";

export default function TopHeader({ title = "She Care", showBack = false, backHref = "/" }) {
  return (
    <header className="w-full sticky top-0 z-50 bg-surface border-b border-outline-variant/40 shrink-0">
      <div className="flex justify-between items-center px-margin-mobile py-2.5 max-w-max-width-dashboard mx-auto">
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <Link
              href={backHref}
              className="text-primary hover:bg-surface-container-high p-1.5 rounded-full transition-colors active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </Link>
          ) : (
            <Link href="/profile" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full bg-primary-container/80 border border-outline flex items-center justify-center text-primary text-base font-bold shadow-2xs group-hover:scale-105 transition-transform">
                🌸
              </div>
            </Link>
          )}
          <Link href="/">
            <h1 className="font-headline-md text-xl md:text-2xl text-primary font-bold tracking-tight">
              {title}
            </h1>
          </Link>
        </div>

        {/* Right action icons: Emergency & Profile */}
        <div className="flex items-center gap-2">
          <Link
            href="/emergency"
            title="Emergency Care & Helplines"
            className="flex items-center gap-1 bg-escalation-container text-escalation hover:bg-escalation hover:text-white px-2.5 py-1 rounded-full text-xs font-bold transition-all border border-escalation/30 shadow-2xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emergency
            </span>
            <span className="hidden sm:inline">Emergency</span>
          </Link>

          <Link
            href="/insights"
            title="Maya Wellness Insights"
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">lightbulb</span>
          </Link>

          <Link
            href="/profile"
            title="Profile & Settings"
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-xl">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
