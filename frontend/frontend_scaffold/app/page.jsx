"use client";
// app/login/page.jsx
// Real Firebase Phone/OTP login — replaces the backend's demo-token flow.
// Flow: enter phone -> Firebase sends OTP via SMS -> enter OTP -> get a real
// signed ID token -> store it -> use it as "Authorization: Bearer <token>"
// on every call to the FastAPI backend.

import { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../lib/firebase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [status, setStatus] = useState("");
  const [idToken, setIdToken] = useState(null);
  const recaptchaRef = useRef(null);

  // Set up the invisible reCAPTCHA ONCE when the page mounts — not on every
  // submit. Recreating it per-click races against its internal async render
  // and crashes ("Cannot read properties of null (reading 'style')") when
  // the old instance is torn down mid-render.
  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return () => {
      // Clean up only when the component actually unmounts.
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
      // Phone must be in E.164 format, e.g. +91XXXXXXXXXX
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
      // This is the real Firebase ID token — not the backend's demo token format.
      const token = await result.user.getIdToken();
      setIdToken(token);
      setStatus("Logged in as " + result.user.phoneNumber);
    } catch (err) {
      setStatus("Invalid OTP: " + err.message);
    }
  }

  async function callBackend() {
    setStatus("Calling backend /api/me/context ...");
    try {
      const res = await fetch(`${BACKEND_URL}/api/me/context`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      setStatus("Backend responded: " + JSON.stringify(data));
    } catch (err) {
      setStatus("Backend call failed: " + err.message);
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

      {confirmationResult && !idToken && (
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

      {idToken && (
        <div>
          <p style={{ wordBreak: "break-all", fontSize: 11, color: "#666" }}>
            ID token (first 40 chars): {idToken.slice(0, 40)}...
          </p>
          <button onClick={callBackend} style={{ padding: "8px 16px" }}>
            Test backend call with this token
          </button>
        </div>
      )}

      {/* Required invisible container for Firebase's reCAPTCHA */}
      <div id="recaptcha-container"></div>

      {status && <p style={{ marginTop: 16, fontSize: 13, color: "#444" }}>{status}</p>}
    </main>
  );
}
