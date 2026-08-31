"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: "Priya Sharma",
    age: 29,
    phone: "+919876543210",
    email: "priya.sharma@example.com",
    language: "English",
    cycle_length: 28,
    emergency_contact: "+919876543211",
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone");
    if (!token || !storedPhone) {
      router.push("/login");
      return;
    }

    fetch(`${BACKEND_URL}/api/user/profile?user_phone=${encodeURIComponent(storedPhone)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch((err) => console.error("Profile fetch error:", err));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("idToken");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    router.push("/login");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_phone: profile.phone,
          name: profile.name,
          age: parseInt(profile.age) || 29,
          email: profile.email || "",
          language: profile.language,
          cycle_length: parseInt(profile.cycle_length) || 28,
          emergency_contact: profile.emergency_contact,
        }),
      });
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen pb-32 flex flex-col items-center">
      <TopHeader title="Profile & Settings" showBack backHref="/" />

      <main className="w-full max-w-max-width-mobile md:max-w-max-width-dashboard px-margin-mobile mt-4 flex flex-col gap-6">
        {/* User Profile Header */}
        <section className="flex flex-col items-center justify-center pt-2 pb-4">
          <div className="relative w-20 h-20 rounded-full bg-primary-container/80 border-2 border-outline-variant flex items-center justify-center text-primary text-3xl font-bold mb-2 shadow-2xs">
            🌸
          </div>
          <h2 className="font-headline-md text-xl font-bold text-on-surface">{profile.name}</h2>
          <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
            Age {profile.age} • Female • {profile.phone}
          </p>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="mt-2 text-xs bg-surface-container-low text-primary px-3 py-1 rounded-full border border-outline font-bold hover:bg-primary-container/30 transition-colors"
          >
            {editing ? "Cancel Edit" : "Edit Profile"}
          </button>
        </section>

        {/* Profile Edit Form */}
        {editing && (
          <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest rounded-2xl border border-outline p-4 space-y-3 shadow-sm">
            <h3 className="font-title-md text-xs font-bold text-primary uppercase">Edit Details</h3>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1 font-semibold">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-surface-container-low border border-outline rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1 font-semibold">Age</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1 font-semibold">Language</label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                  <option value="Hinglish">Hinglish</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full bg-surface-container-low border border-outline rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1 font-semibold">Emergency Contact</label>
              <input
                type="tel"
                value={profile.emergency_contact}
                onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                className="w-full bg-surface-container-low border border-outline rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-on-primary font-bold text-xs py-2.5 rounded-full hover:opacity-90 mt-2"
            >
              Save Changes
            </button>
          </form>
        )}

        {/* Account Section */}
        <section>
          <h3 className="font-title-md text-xs font-bold text-primary mb-2 px-1 uppercase tracking-wider">Account</h3>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline p-2 shadow-2xs flex flex-col gap-1">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
                <div>
                  <span className="font-body-bold text-xs text-on-surface block font-bold">Personal Details</span>
                  <span className="text-[11px] text-on-surface-variant">{profile.name}, Age {profile.age}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
            </div>

            <div className="w-full h-[1px] bg-outline-variant opacity-40 ml-12"></div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">contact_mail</span>
                </div>
                <div>
                  <span className="font-body-bold text-xs text-on-surface block font-bold">Contact Number</span>
                  <span className="text-[11px] text-on-surface-variant">{profile.phone}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
            </div>

            <div className="w-full h-[1px] bg-outline-variant opacity-40 ml-12"></div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">language</span>
                </div>
                <div>
                  <span className="font-body-bold text-xs text-on-surface block font-bold">Language Preferences</span>
                  <span className="text-[11px] text-on-surface-variant">{profile.language}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
            </div>
          </div>
        </section>

        {/* Health & Care Section */}
        <section>
          <h3 className="font-title-md text-xs font-bold text-primary mb-2 px-1 uppercase tracking-wider">Health &amp; Care</h3>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline p-2 shadow-2xs flex flex-col gap-1">
            <Link
              href="/cycle"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">cached</span>
                </div>
                <div>
                  <span className="font-body-bold text-xs text-on-surface block font-bold">Cycle Tracking Preferences</span>
                  <span className="text-[11px] text-on-surface-variant">Default 28-day cycle</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
            </Link>

            <div className="w-full h-[1px] bg-outline-variant opacity-40 ml-12"></div>

            <Link
              href="/emergency"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">medical_services</span>
                </div>
                <div>
                  <span className="font-body-bold text-xs text-on-surface block font-bold">Emergency Contacts</span>
                  <span className="text-[11px] text-on-surface-variant">{profile.emergency_contact}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
            </Link>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="mb-4">
          <h3 className="font-title-md text-xs font-bold text-primary mb-2 px-1 uppercase tracking-wider">Data &amp; Privacy</h3>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline p-2 shadow-2xs flex flex-col gap-1">
            <Link
              href="/doctor-summary"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">download</span>
                </div>
                <span className="font-body-bold text-xs text-on-surface font-bold">Download Health Summary</span>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
            </Link>

            <div className="w-full h-[1px] bg-outline-variant opacity-40 ml-12"></div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-escalation-container transition-colors group mt-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-tertiary group-hover:text-escalation">
                  <span className="material-symbols-outlined text-lg">logout</span>
                </div>
                <span className="font-body-bold text-xs text-tertiary group-hover:text-escalation font-bold">
                  Log Out
                </span>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
