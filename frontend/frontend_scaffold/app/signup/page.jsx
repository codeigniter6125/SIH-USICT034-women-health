"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cycleLength, setCycleLength] = useState("28");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e) {
    e.preventDefault();
    if (loading) return;

    if (!name.trim()) {
      setStatus("Please enter your full name.");
      setStatusType("error");
      return;
    }

    const cleanAge = parseInt(age);
    if (!cleanAge || cleanAge < 10 || cleanAge > 100) {
      setStatus("Please enter a valid age (between 10 and 100).");
      setStatusType("error");
      return;
    }

    const cleanDigits = phone.replace(/\D/g, "");
    let fullPhone = phone.trim();
    if (!fullPhone.startsWith("+")) {
      if (cleanDigits.length === 10) {
        fullPhone = `+91${cleanDigits}`;
      } else {
        setStatus("Please enter a valid 10-digit mobile number, e.g. 9876543210");
        setStatusType("error");
        return;
      }
    }

    if (!email.trim() || !email.includes("@")) {
      setStatus("Please enter a valid email address.");
      setStatusType("error");
      return;
    }

    setLoading(true);
    setStatus("Setting up your She Care profile...");
    setStatusType("info");

    try {
      // 1. Register / Update Profile in Backend Shared Memory
      await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_phone: fullPhone,
          name: name.trim(),
          age: cleanAge,
          email: email.trim().toLowerCase(),
          cycle_length: parseInt(cycleLength) || 28,
          emergency_contact: emergencyContact.trim() || "+919876543211",
          language: "English",
        }),
      });

      // 2. Obtain / set demo auth token
      const tokenRes = await fetch(`${BACKEND_URL}/api/auth/demo-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: fullPhone }),
      });
      const tokenData = await tokenRes.json();
      const idToken = tokenData.access_token || "demo_token_" + Date.now();

      // 3. Save to localStorage
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("userPhone", fullPhone);
      localStorage.setItem("userName", name.trim());
      localStorage.setItem("userEmail", email.trim());
      localStorage.setItem("userAge", cleanAge.toString());

      setStatus("Profile created successfully! Redirecting...");
      setStatusType("success");

      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err) {
      console.error("Signup error:", err);
      const demoToken = "demo_token_" + Date.now();
      localStorage.setItem("idToken", demoToken);
      localStorage.setItem("userPhone", fullPhone);
      localStorage.setItem("userName", name.trim());
      localStorage.setItem("userEmail", email.trim());
      localStorage.setItem("userAge", cleanAge.toString());
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-center items-center relative overflow-hidden py-8 px-4">
      {/* Organic Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="w-[500px] h-[500px] bg-tertiary-fixed rounded-full blur-3xl absolute -top-20 -right-20 animate-float opacity-40" />
        <div className="w-[550px] h-[550px] bg-primary-container rounded-full blur-3xl absolute -bottom-20 -left-20 animate-float opacity-50" />
      </div>

      <main className="w-full max-w-[420px] mx-auto relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#C97B5C] text-white shadow-md mb-2">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">
            Create Your Profile
          </h1>
          <p className="font-body-base text-xs md:text-sm text-on-surface-variant max-w-xs mx-auto">
            Join She Care to get personalized hormonal cycle tracking, medical OCR and Maya AI guidance.
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-surface-container-lowest border border-outline rounded-3xl p-6 sm:p-7 shadow-sm">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full bg-surface-container-low border border-outline rounded-2xl p-3.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Age & Cycle Length Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">cake</span>
                  <span>Age</span>
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full bg-surface-container-low border border-outline rounded-2xl p-3.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">water_drop</span>
                  <span>Cycle Length</span>
                </label>
                <input
                  type="number"
                  min="20"
                  max="45"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(e.target.value)}
                  placeholder="28 days"
                  className="w-full bg-surface-container-low border border-outline rounded-2xl p-3.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">phone_iphone</span>
                <span>Mobile Phone Number</span>
              </label>
              <div className="relative flex items-center bg-surface-container-low border border-outline rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="flex items-center pl-3 pr-2 py-3.5 border-r border-outline-variant bg-surface-container text-xs font-bold text-on-surface shrink-0 gap-1.5">
                  <span>????</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="flex-1 bg-transparent px-3 py-3 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya.sharma@example.com"
                className="w-full bg-surface-container-low border border-outline rounded-2xl p-3.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Emergency Contact (Optional) */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-escalation">emergency</span>
                <span>Emergency Contact (Optional)</span>
              </label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Doctor / Family Contact Number"
                className="w-full bg-surface-container-low border border-outline rounded-2xl p-3.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Status Message */}
            {status && (
              <div
                className={`p-3 rounded-2xl text-center text-xs font-semibold ${
                  statusType === "error"
                    ? "bg-error-container text-on-error-container border border-error/30"
                    : statusType === "success"
                    ? "bg-secondary-container text-on-secondary-container border border-secondary/30"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {status}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-body-bold text-sm py-4 rounded-2xl shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span>{loading ? "Setting up Profile..." : "Complete Sign Up & Enter"}</span>
            </button>
          </form>

          {/* Footer Link to Login */}
          <div className="mt-6 pt-4 border-t border-outline-variant text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign In with OTP
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
