import { useState, useRef, useEffect } from "react";
import HomeScreen from "./screens/HomeScreen";
import MayaScreen from "./screens/MayaScreen";
import CycleScreen from "./screens/CycleScreen";
import CheckInScreen from "./screens/CheckInScreen";
import ReportsScreen from "./screens/ReportsScreen";
import DoctorSummaryScreen from "./screens/DoctorSummaryScreen";
import EmergencyScreen from "./screens/EmergencyScreen";
import InsightsScreen from "./screens/InsightsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import BottomNav from "./components/BottomNav";
import SideNav from "./components/SideNav";

export type Screen =
  | "login"
  | "onboarding"
  | "home"
  | "maya"
  | "cycle"
  | "checkin"
  | "reports"
  | "doctor-summary"
  | "emergency"
  | "insights"
  | "profile";

const NAV_SCREENS: Screen[] = ["home", "cycle", "maya", "reports", "profile"];
const SIDE_NAV_SCREENS: Screen[] = ["home", "cycle", "maya", "reports", "insights", "profile"];

function ScreenContent({ screen, navigate }: { screen: Screen; navigate: (s: Screen) => void }) {
  if (screen === "home")           return <HomeScreen navigate={navigate} />;
  if (screen === "maya")           return <MayaScreen navigate={navigate} />;
  if (screen === "cycle")          return <CycleScreen navigate={navigate} />;
  if (screen === "checkin")        return <CheckInScreen navigate={navigate} />;
  if (screen === "reports")        return <ReportsScreen navigate={navigate} />;
  if (screen === "doctor-summary") return <DoctorSummaryScreen navigate={navigate} />;
  if (screen === "emergency")      return <EmergencyScreen navigate={navigate} />;
  if (screen === "insights")       return <InsightsScreen navigate={navigate} />;
  if (screen === "profile")        return <ProfileScreen navigate={navigate} />;
  return null;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem("idToken") || localStorage.getItem("userPhone"));
    } catch {
      return false;
    }
  });
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const logged = Boolean(localStorage.getItem("idToken") || localStorage.getItem("userPhone"));
      if (!logged) return "login";
      const saved = sessionStorage.getItem("currentScreen") as Screen | null;
      if (saved && saved !== "login" && saved !== "onboarding") {
        return saved;
      }
      return "home";
    } catch {
      return "login";
    }
  });
  const [sawOnboarding, setSawOnboarding] = useState(() => {
    try {
      return localStorage.getItem("sawOnboarding") === "true";
    } catch {
      return false;
    }
  });
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  function navigate(s: Screen) {
    try {
      sessionStorage.setItem("currentScreen", s);
    } catch {
      // ignore
    }
    setScreen(s);
    mobileScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    desktopScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  const showMayaFab = isLoggedIn && screen !== "maya" && screen !== "login" && screen !== "onboarding" && screen !== "emergency";

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  /* ── Auth ── */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#EDE9E2]">
        <div className="w-full max-w-sm">
          <LoginScreen
            onLogin={() => {
              setIsLoggedIn(true);
              setScreen(sawOnboarding ? "home" : "onboarding");
            }}
          />
        </div>
      </div>
    );
  }

  /* ── Onboarding ── */
  if (screen === "onboarding") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#EDE9E2]">
        <div className="w-full max-w-sm">
          <OnboardingScreen
            onComplete={() => {
              try {
                localStorage.setItem("sawOnboarding", "true");
              } catch {
                // ignore
              }
              setSawOnboarding(true);
              setScreen("home");
            }}
          />
        </div>
      </div>
    );
  }

  const showBottomNav = NAV_SCREENS.includes(screen);
  const showSideNav = SIDE_NAV_SCREENS.includes(screen) || ["checkin", "doctor-summary", "insights", "emergency"].includes(screen);

  return (
    /* ── Full page shell ── */
    <div className="min-h-screen w-full bg-[#EDE9E2] flex items-start justify-center lg:items-center lg:py-8">

      {/* ───────────────── DESKTOP ───────────────── */}
      <div className="hidden lg:flex w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl" style={{ height: "820px", boxShadow: "0 32px 80px -12px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)" }}>
        {showSideNav && <SideNav current={screen} navigate={navigate} />}
        <div ref={desktopScrollRef} className="flex-1 overflow-y-auto bg-[#F7F3EE] flex flex-col">
          {!isOnline && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#3D3330] text-white text-xs font-semibold flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round" /></svg>
              Offline — AI features unavailable
            </div>
          )}
          <div className="flex-1">
            <ScreenContent screen={screen} navigate={navigate} />
          </div>
        </div>
      </div>

      {/* ───────────────── MOBILE ────────────────── */}
      <div
        className="lg:hidden w-full max-w-[428px] bg-[#F7F3EE] flex flex-col relative"
        style={{ minHeight: "100dvh" }}
      >
        {/* Safe area top spacer */}
        <div style={{ paddingTop: "env(safe-area-inset-top)" }} />

        {/* Offline banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#3D3330] text-white text-xs font-semibold anim-slide-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeLinecap="round" /></svg>
            Offline — Maya and real-time features are unavailable
          </div>
        )}

        <div
          ref={mobileScrollRef}
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: showBottomNav ? "82px" : 0 }}
        >
          <ScreenContent screen={screen} navigate={navigate} />
        </div>

        {showBottomNav && <BottomNav current={screen} navigate={navigate} />}

        {/* Maya FAB */}
        {showMayaFab && !showBottomNav && (
          <button
            onClick={() => navigate("maya")}
            className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl anim-glow z-40 active:scale-90 transition-transform"
            style={{ background: "linear-gradient(135deg, #2E6B6E 0%, #1E4B4D 100%)", boxShadow: "0 8px 24px -4px rgba(46,107,110,0.55)" }}
            aria-label="Open Maya"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

    </div>
  );
}
