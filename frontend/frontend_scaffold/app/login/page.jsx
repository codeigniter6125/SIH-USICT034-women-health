"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [status, setStatus] = useState("");
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  async function sendOtp(e) {
    e.preventDefault();
    setStatus("Sending OTP...");
    try {
      const result = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      setConfirmationResult(result);
      setStatus("OTP sent. Check your phone.");
    } catch (err) {
      setStatus("Failed to send OTP: " + err.message);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setStatus("Verifying...");
    try {
      const result = await confirmationResult.confirm(otp);
      const token = await result.user.getIdToken();
      localStorage.setItem("idToken", token);
      localStorage.setItem("userPhone", result.user.phoneNumber);
      setStatus("Logged in. Redirecting...");
      router.push("/chat");
    } catch (err) {
      setStatus("Invalid OTP: " + err.message);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Login</h1>

      {!confirmationResult && (
        <form onSubmit={sendOtp}>
          <label style={{ display: "block", marginBottom: 6 }}>Phone number (E.164, e.g. +91XXXXXXXXXX)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
            required
          />
          <button type="submit" style={{ padding: "8px 16px" }}>Send OTP</button>
        </form>
      )}

      {confirmationResult && (
        <form onSubmit={verifyOtp}>
          <label style={{ display: "block", marginBottom: 6 }}>Enter the OTP you received</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
            required
          />
          <button type="submit" style={{ padding: "8px 16px" }}>Verify</button>
        </form>
      )}

      <div id="recaptcha-container"></div>

      {status && <p style={{ marginTop: 16, fontSize: 13, color: "#444" }}>{status}</p>}
    </main>
  );
}
