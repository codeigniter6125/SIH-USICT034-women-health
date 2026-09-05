import type { Screen } from "../App";
import MayaAvatar from "./MayaAvatar";

interface Props { current: Screen; navigate: (s: Screen) => void; }

const LEFT: Array<{ id: Screen; label: string; Icon: (a: boolean) => React.ReactNode }> = [
  {
    id: "home", label: "Home",
    Icon: (a) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.7"}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "cycle", label: "Cycle",
    Icon: (a) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.7"}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l5.5 3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];
const RIGHT: Array<{ id: Screen; label: string; Icon: (a: boolean) => React.ReactNode }> = [
  {
    id: "reports", label: "Reports",
    Icon: (a) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.7"}>
        <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "profile", label: "Profile",
    Icon: (a) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? "2.2" : "1.7"}>
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNav({ current, navigate }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ maxWidth: "428px", margin: "0 auto", left: 0, right: 0 }}
    >
      <div className="absolute inset-0 bg-white/96 backdrop-blur-md border-t border-[#DDD8D0]" />
      <div
        className="relative flex items-end justify-around"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)", paddingTop: "8px" }}
      >
        {LEFT.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-all active:scale-90 ${active ? "text-[#2E6B6E]" : "text-[#9B9390]"}`}
            >
              {Icon(active)}
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-[#2E6B6E] -mt-0.5" />}
            </button>
          );
        })}

        {/* Maya — elevated centre jewel */}
        <div className="flex flex-col items-center -mt-5">
          <button
            onClick={() => navigate("maya")}
            className="relative active:scale-90 transition-transform"
            aria-label="Talk to Maya"
          >
            {current === "maya" && (
              <div className="absolute -inset-2 rounded-full bg-[#2E6B6E]/10 anim-pulse-slow" />
            )}
            <div
              className="rounded-full shadow-lg"
              style={{
                boxShadow: current === "maya"
                  ? "0 0 0 3px #2E6B6E, 0 8px 24px rgba(46,107,110,0.4)"
                  : "0 4px 16px rgba(46,107,110,0.3)",
              }}
            >
              <MayaAvatar size={52} />
            </div>
          </button>
          <span className={`text-[10px] font-bold mt-1.5 tracking-wide ${current === "maya" ? "text-[#2E6B6E]" : "text-[#9B9390]"}`}>
            Maya
          </span>
          {current === "maya" && <div className="w-1 h-1 rounded-full bg-[#2E6B6E]" />}
        </div>

        {RIGHT.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-all active:scale-90 ${active ? "text-[#2E6B6E]" : "text-[#9B9390]"}`}
            >
              {Icon(active)}
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-[#2E6B6E] -mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
