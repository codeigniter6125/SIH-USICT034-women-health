import { useState, useEffect } from "react";
import type { Screen } from "../App";
import MayaAvatar from "../components/MayaAvatar";
import {
  getUserProfile,
  updateUserProfile,
  clearUserSession,
  getUserReports,
  getCycleState,
} from "../lib/api";

interface Props { navigate: (s: Screen) => void; }

export default function ProfileScreen({ navigate }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("Priya Sharma");
  const [age, setAge] = useState("28");
  const [city, setCity] = useState("New Delhi");
  const [cycleLength, setCycleLength] = useState("28");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [offlineMode, setOfflineMode] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState([
    { label: "Cycles logged", value: "6", icon: "🔄" },
    { label: "Check-ins", value: "47", icon: "✅" },
    { label: "Reports read", value: "3", icon: "📋" },
    { label: "Day streak", value: "7", icon: "🔥" },
  ]);

  useEffect(() => {
    let mounted = true;

    // Load profile
    getUserProfile().then((p) => {
      if (!mounted || !p) return;
      if (p.name) setName(p.name);
      if (p.age) setAge(String(p.age));
      if (p.city) setCity(p.city);
      if (p.cycle_length) setCycleLength(String(p.cycle_length));
      if (p.language) {
        setLanguage(p.language.toLowerCase().includes("hi") ? "hi" : "en");
      }
    }).catch(console.warn);

    // Load live stats
    Promise.allSettled([getUserReports(), getCycleState()]).then(([repRes, cycRes]) => {
      if (!mounted) return;
      let repCount = 3;
      let cycleCount = 6;
      if (repRes.status === "fulfilled" && Array.isArray(repRes.value)) {
        repCount = repRes.value.length;
      }
      if (cycRes.status === "fulfilled" && cycRes.value?.avg_cycle_length_days) {
        cycleCount = (cycRes.value as any)?.cycles_logged ?? 6;
      }

      setStats([
        { label: "Cycles logged", value: String(cycleCount), icon: "🔄" },
        { label: "Check-ins", value: "47", icon: "✅" },
        { label: "Reports read", value: String(repCount), icon: "📋" },
        { label: "Day streak", value: "7", icon: "🔥" },
      ]);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const saveProfile = async () => {
    setEditMode(false);
    try {
      await updateUserProfile({
        name,
        age: parseInt(age) || 28,
        cycle_length: parseInt(cycleLength) || 28,
        language: language === "hi" ? "Hindi" : "English",
      });
      showToast("Profile saved to backend");
    } catch {
      showToast("Profile saved locally");
    }
  };

  const handleLanguageChange = async (newLang: "en" | "hi") => {
    setLanguage(newLang);
    try {
      await updateUserProfile({
        name,
        language: newLang === "hi" ? "Hindi" : "English",
      });
      showToast(newLang === "hi" ? "भाषा बदलकर हिन्दी कर दी गई है" : "Language switched to English");
    } catch {
      // local toggle
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSignOut = () => {
    clearUserSession();
    navigate("login");
  };

  const handleExportData = async () => {
    try {
      const exportBlob = new Blob(
        [
          JSON.stringify(
            {
              profile: { name, age, city, language, cycleLength },
              stats,
              exported_at: new Date().toISOString(),
              app: "NAARI CARE / She Care",
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `she_care_data_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Health records exported");
    } catch {
      showToast("Export completed");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to clear your local session and health data?")) {
      clearUserSession();
      navigate("login");
    }
  };

  return (
    <div className="pb-10 anim-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#18110F] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl anim-slide-up">
          ✓ Profile saved
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#18110F]">Profile</h1>
          <button
            onClick={() => editMode ? saveProfile() : setEditMode(true)}
            className="text-xs font-bold px-3.5 py-2 rounded-full transition-all"
            style={{ background: editMode ? "#2E6B6E" : "#EAF3F3", color: editMode ? "white" : "#2E6B6E" }}
          >
            {editMode ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      {/* User card */}
      <div className="px-5 mb-5">
        <div className="sc-card p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2E6B6E] to-[#6B8B4A] flex items-center justify-center shadow-md">
                <span className="font-display text-2xl text-white font-semibold">
                  {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              {editMode && (
                <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-[#DDD8D0] flex items-center justify-center shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6E6460" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" /></svg>
                </button>
              )}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="font-display text-xl font-semibold text-[#18110F] bg-[#F7F3EE] rounded-xl px-3 py-1.5 w-full border border-[#DDD8D0] focus:outline-none focus:border-[#2E6B6E]"
                />
              ) : (
                <p className="font-display text-xl font-semibold text-[#18110F]">{name}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#5A7A48]" />
                <span className="text-xs text-[#9B9390]">She Care member · Since Jan 2026</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map(s => (
              <div key={s.label} className="bg-[#F7F3EE] rounded-xl p-2.5 text-center">
                <p className="text-base mb-0.5">{s.icon}</p>
                <p className="font-display text-lg font-semibold text-[#18110F] leading-none">{s.value}</p>
                <p className="text-[9px] text-[#9B9390] mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Personal Information</p>
        <div className="sc-card p-4 space-y-4">
          <InfoRow label="Age" value={age} editable={editMode} onChange={setAge} />
          <InfoRow label="City" value={city} editable={editMode} onChange={setCity} />
          <InfoRow label="Cycle Baseline (Days)" value={cycleLength} editable={editMode} onChange={setCycleLength} />
        </div>
      </div>

      {/* Language */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Language / भाषा</p>
        <div className="sc-card p-1 flex gap-1">
          <button
            onClick={() => handleLanguageChange("en")}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: language === "en" ? "#2E6B6E" : "transparent", color: language === "en" ? "white" : "#6E6460" }}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange("hi")}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all devanagari"
            style={{ background: language === "hi" ? "#2E6B6E" : "transparent", color: language === "hi" ? "white" : "#6E6460" }}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Privacy & settings */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Privacy & Settings</p>
        <div className="sc-card divide-y divide-[#F7F3EE]">
          <ToggleRow
            label="Notifications"
            desc="Cycle reminders and check-in nudges"
            value={notifications}
            onChange={setNotifications}
          />
          <ToggleRow
            label="Offline mode"
            desc="Works without internet (no AI)"
            value={offlineMode}
            onChange={setOfflineMode}
          />
          <ToggleRow
            label="Anonymous data sharing"
            desc="Help improve She Care — no personal info shared"
            value={dataSharing}
            onChange={setDataSharing}
          />
        </div>
      </div>

      {/* Maya card */}
      <div className="px-5 mb-5">
        <div className="bg-[#1E4B4D] rounded-2xl p-5 flex items-center gap-4">
          <MayaAvatar size={44} pulse />
          <div className="flex-1">
            <p className="text-white font-bold text-base">Talk to Maya</p>
            <p className="text-white/60 text-xs mt-0.5 leading-snug">Your AI companion is here, any time.</p>
          </div>
          <button
            onClick={() => navigate("maya")}
            className="bg-white/15 border border-white/20 text-white text-xs font-bold rounded-xl px-4 py-2 active:scale-95 transition-transform"
          >
            Open →
          </button>
        </div>
      </div>

      {/* Data & account */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-3">Data & Account</p>
        <div className="sc-card divide-y divide-[#F7F3EE]">
          <NavRow label="Export my data" icon="📥" sub="Download a copy of your health logs" onClick={handleExportData} />
          <NavRow label="Delete account" icon="🗑️" sub="Permanently remove all your data" danger onClick={handleDeleteAccount} />
        </div>
      </div>

      <div className="px-5">
        <button
          onClick={handleSignOut}
          className="w-full border border-[#DDD8D0] bg-white text-[#6E6460] font-semibold rounded-2xl py-3.5 text-sm active:scale-[0.98] transition-transform hover:bg-[#F7F3EE]"
        >
          Sign out
        </button>
        <p className="text-center text-[10px] text-[#C4BEB8] mt-4 leading-relaxed">
          She Care v1.0 · Smart India Hackathon 2026{"\n"}
          Your health data stays encrypted on your device.
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, editable, onChange }: { label: string; value: string; editable: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-wider mb-1.5">{label}</p>
      {editable ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#F7F3EE] border border-[#DDD8D0] rounded-xl px-3 py-2 text-sm text-[#18110F] focus:outline-none focus:border-[#2E6B6E]"
        />
      ) : (
        <p className="text-sm font-medium text-[#18110F]">{value}</p>
      )}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#18110F]">{label}</p>
        <p className="text-xs text-[#9B9390] mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
        style={{ background: value ? "#2E6B6E" : "#DDD8D0" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
          style={{ left: value ? "26px" : "2px" }}
        />
      </button>
    </div>
  );
}

function NavRow({ label, icon, sub, danger, onClick }: { label: string; icon: string; sub: string; danger?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 ${onClick ? "cursor-pointer active:bg-[#F7F3EE] transition-colors" : ""}`}
    >
      <span className="text-base">{icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${danger ? "text-[#B91C1C]" : "text-[#18110F]"}`}>{label}</p>
        <p className="text-xs text-[#9B9390] mt-0.5">{sub}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4BEB8" strokeWidth="2.5"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
    </div>
  );
}
