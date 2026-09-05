import type { Screen } from "../App";
import MayaAvatar from "./MayaAvatar";

interface Props { current: Screen; navigate: (s: Screen) => void; }

const NAV = [
  {
    id: "home" as Screen, label: "Home",
    icon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.8"}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "cycle" as Screen, label: "Cycle",
    icon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.8"}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l5.5 3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "reports" as Screen, label: "Reports",
    icon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.8"}>
        <rect x="4" y="3" width="16" height="18" rx="2" strokeLinecap="round" />
        <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "insights" as Screen, label: "Insights",
    icon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.8"}>
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "checkin" as Screen, label: "Check-in",
    icon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.8"}>
        <rect x="3" y="3" width="18" height="18" rx="5" strokeLinecap="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "doctor-summary" as Screen, label: "Dr. Summary",
    icon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.8"}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" />
        <path d="M14 2v6h6M12 12v4M10 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "profile" as Screen, label: "Profile",
    icon: (a: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.8"}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function SideNav({ current, navigate }: Props) {
  return (
    <div className="w-64 h-full bg-[#1E4B4D] flex flex-col py-6 px-4 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
            <path d="M22 38 Q12 30 12 22 Q12 12 22 10 Q32 12 32 22 Q32 30 22 38Z" fill="white" fillOpacity="0.85" />
            <circle cx="22" cy="22" r="4" fill="#1E4B4D" />
          </svg>
        </div>
        <span className="font-display text-xl font-semibold text-white">She Care</span>
      </div>

      {/* Maya CTA */}
      <button
        onClick={() => navigate("maya")}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-6 transition-all active:scale-[0.98] ${
          current === "maya"
            ? "bg-white"
            : "bg-white/10 hover:bg-white/15"
        }`}
      >
        <MayaAvatar size={32} pulse={current === "maya"} />
        <div className="text-left">
          <p className={`text-sm font-bold leading-tight ${current === "maya" ? "text-[#1E4B4D]" : "text-white"}`}>Talk to Maya</p>
          <p className={`text-xs leading-tight mt-0.5 ${current === "maya" ? "text-[#2E6B6E]" : "text-white/50"}`}>Your health companion</p>
        </div>
        {current !== "maya" && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6ECBCF]" />
        )}
      </button>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ id, label, icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:text-white/80 hover:bg-white/8"
              }`}
            >
              <span className={active ? "text-white" : ""}>{icon(active)}</span>
              {label}
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-white/60" />}
            </button>
          );
        })}
      </nav>

      {/* Emergency */}
      <button
        onClick={() => navigate("emergency")}
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#B91C1C]/20 border border-[#B91C1C]/30 text-[#FCA5A5] text-sm font-semibold mb-4 active:scale-[0.97] transition-all hover:bg-[#B91C1C]/30"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinejoin="round" />
        </svg>
        Emergency Support
      </button>

      {/* User */}
      <div className="flex items-center gap-3 px-3 pt-4 border-t border-white/10">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">PS</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">Priya Sharma</p>
          <p className="text-[10px] text-white/40 truncate">Day 14 · Ovulatory</p>
        </div>
      </div>
    </div>
  );
}
