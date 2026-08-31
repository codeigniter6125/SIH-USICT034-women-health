"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [phoneRaw, setPhoneRaw] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info"); // 'info' | 'error' | 'success'
  const [loading, setLoading] = useState(false);

  const recaptchaRef = useRef(null);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  function setupRecaptcha() {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(
        auth,
        "send-otp-button",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
          "expired-callback": () => {
            setStatus("reCAPTCHA expired. Please try again.");
            setStatusType("error");
            setLoading(false);
          },
        }
      );
    }
    return recaptchaRef.current;
  }

  async function handleSendOtp(e) {
    e?.preventDefault();
    if (loading) return;

    const cleanDigits = phoneRaw.replace(/\D/g, "");
    let fullPhone = phoneRaw.trim();
    if (!fullPhone.startsWith("+")) {
      if (cleanDigits.length === 10) {
        fullPhone = `+91${cleanDigits}`;
      } else {
        setStatus("Please enter a valid 10-digit mobile number, e.g. 9876543210");
        setStatusType("error");
        return;
      }
    }

    setFormattedPhone(fullPhone);
    setStatus("Sending verification code via SMS...");
    setStatusType("info");
    setLoading(true);

    try {
      const appVerifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(result);
      setStatus("OTP sent successfully. Please check your SMS.");
      setStatusType("success");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error("Firebase sendOtp error:", err);
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      setStatus("Failed to send OTP: " + err.message);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e?.preventDefault();
    if (loading) return;

    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setStatus("Please enter the complete 6-digit OTP code.");
      setStatusType("error");
      return;
    }

    if (!confirmationResult) {
      setStatus("Please request an OTP first.");
      setStatusType("error");
      return;
    }

    setStatus("Verifying code...");
    setStatusType("info");
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otpCode);
      const token = await result.user.getIdToken();

      localStorage.setItem("idToken", token);
      localStorage.setItem("userPhone", result.user.phoneNumber || formattedPhone);

      setStatus("Verified! Redirecting to She Care...");
      setStatusType("success");

      router.push("/chat");
    } catch (err) {
      console.error("Firebase verifyOtp error:", err);
      setStatus("Invalid OTP: " + err.message);
      setStatusType("error");
      setLoading(false);
    }
  }

  function handleOtpChange(index, val) {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    // Support paste of multiple digits
    if (cleaned.length > 1) {
      const updated = [...otpDigits];
      const chars = cleaned.slice(0, 6).split("");
      chars.forEach((c, i) => {
        if (index + i < 6) updated[index + i] = c;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(index + chars.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleaned[0];
    setOtpDigits(updated);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handleBackToPhone() {
    setConfirmationResult(null);
    setStatus("");
    setLoading(false);
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center font-body-base overflow-x-hidden relative selection:bg-primary-container selection:text-primary">
      {/* Ambient background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden flex justify-center items-center opacity-30">
        <div
          className="w-[800px] h-[800px] bg-surface-container-low rounded-full blur-3xl absolute top-[-20%] right-[-10%] animate-float"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="w-[600px] h-[600px] bg-primary-container rounded-full blur-3xl absolute bottom-[-10%] left-[-10%] animate-float opacity-50"
        />
      </div>

      {/* Main Content Container */}
      <main className="w-full max-w-max-width-mobile mx-auto px-margin-mobile flex flex-col justify-center min-h-[100dvh] relative z-10 py-6">
        {!confirmationResult ? (
          /* STEP 1: Phone Entry Screen */
          <div className="flex flex-col justify-center my-auto">
            {/* Centered Brand Motif */}
            <div className="flex justify-center mb-xl">
              <svg
                className="w-24 h-24 text-primary opacity-80"
                fill="none"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 90C50 90 20 75 20 45C20 28.4315 33.4315 15 50 15C66.5685 15 80 28.4315 80 45C80 75 50 90 50 90Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="M50 90C50 90 35 70 35 45C35 36.7157 41.7157 30 50 30C58.2843 30 65 36.7157 65 45C65 70 50 90 50 90Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <circle cx="50" cy="45" fill="currentColor" r="5" />
              </svg>
            </div>

            {/* Typography / Headings */}
            <div className="text-center mb-xl space-y-md">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
                Welcome to <br /> She Care
              </h1>
              <h2 className="font-headline-md text-headline-md text-primary opacity-90">
                नमस्ते, संगिनी हेल्थ में आपका स्वागत है
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[300px] mx-auto mt-sm">
                Enter your phone number to begin your journey.
              </p>
            </div>

            {/* Phone Input Form */}
            <div className="w-full max-w-[360px] mx-auto mb-xl">
              <form onSubmit={handleSendOtp} className="space-y-lg">
                <div className="relative flex items-center bg-surface-container-lowest border border-outline rounded-xl overflow-hidden transition-all duration-300 input-glow">
                  {/* Flag/Country Code Prefix */}
                  <div className="flex items-center pl-md pr-sm py-4 border-r border-surface-variant bg-surface-container-low h-full shrink-0 gap-2">
                    <svg
                      className="w-6 h-4 rounded-sm overflow-hidden"
                      viewBox="0 0 900 600"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect fill="#f93" height="200" width="900" />
                      <rect fill="#fff" height="200" width="900" y="200" />
                      <rect fill="#128807" height="200" width="900" y="400" />
                      <circle cx="450" cy="300" fill="#fff" r="80" stroke="#000080" strokeWidth="6" />
                      <circle cx="450" cy="300" fill="#000080" r="10" />
                      <g stroke="#000080" strokeWidth="4">
                        <line x1="450" x2="450" y1="220" y2="380" />
                        <line x1="370" x2="530" y1="300" y2="300" />
                        <line x1="393" x2="507" y1="243" y2="357" />
                        <line x1="393" x2="507" y1="357" y2="243" />
                      </g>
                    </svg>
                    <span className="font-body-bold text-body-bold text-on-surface">+91</span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[16px] ml-1">
                      arrow_drop_down
                    </span>
                  </div>

                  {/* Input Field */}
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phoneRaw}
                    onChange={(e) => setPhoneRaw(e.target.value)}
                    placeholder="Mobile Number"
                    required
                    className="w-full bg-transparent border-none py-4 px-md font-title-md text-title-md text-on-surface placeholder:text-surface-dim focus:ring-0 focus:outline-none"
                  />
                </div>

                {/* Primary Action Button (Invisible reCAPTCHA anchor) */}
                <button
                  id="send-otp-button"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-title-md text-title-md py-4 rounded-full min-h-[56px] transition-transform duration-200 hover:opacity-90 active:scale-[0.98] flex justify-center items-center shadow-none disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>

              {/* Status feedback */}
              {status && (
                <div
                  className={`mt-4 p-3 rounded-xl text-center text-sm font-body-base ${
                    statusType === "error"
                      ? "bg-error-container text-on-error-container"
                      : statusType === "success"
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {status}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-auto pb-6">
              <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70">
                Secure &amp; Confidential
              </p>
            </div>
          </div>
        ) : (
          /* STEP 2: OTP Verification Screen */
          <div className="flex flex-col justify-between min-h-[560px] py-4">
            {/* Top Navigation */}
            <header className="w-full flex items-center py-2">
              <button
                type="button"
                onClick={handleBackToPhone}
                aria-label="Go back"
                className="text-primary hover:opacity-80 p-2 -ml-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
                <span className="font-body-base text-sm">Change Number</span>
              </button>
            </header>

            {/* Headings */}
            <div className="flex flex-col space-y-md mt-6 mb-8">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Verify OTP
                <span className="font-headline-md text-headline-md text-on-surface-variant mt-2 block">
                  OTP सत्यापित करें
                </span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                We've sent a 6-digit code to{" "}
                <span className="font-body-bold text-body-bold text-on-surface">
                  {formattedPhone || phoneRaw}
                </span>
              </p>
            </div>

            {/* OTP Inputs */}
            <form onSubmit={handleVerifyOtp} className="flex flex-col space-y-xl flex-grow">
              <div className="flex justify-between gap-2 px-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    aria-label={`Digit ${idx + 1}`}
                    className="otp-input w-12 h-14 sm:w-14 sm:h-16 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface bg-surface-container-lowest border-[1.5px] border-outline rounded-2xl focus:border-primary focus:outline-none transition-all duration-200"
                  />
                ))}
              </div>

              {/* Status feedback */}
              {status && (
                <div
                  className={`p-3 rounded-xl text-center text-sm font-body-base ${
                    statusType === "error"
                      ? "bg-error-container text-on-error-container"
                      : statusType === "success"
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {status}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col items-center space-y-lg mt-auto pb-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-body-bold text-body-bold py-4 rounded-full min-h-[52px] hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-4 focus:ring-primary-container disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify and Continue"}
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="font-body-base text-body-base text-on-surface-variant hover:text-primary transition-colors duration-200 bg-transparent border-none p-2 focus:outline-none focus:underline rounded"
                >
                  Resend Code
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}