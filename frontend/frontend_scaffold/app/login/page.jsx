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

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [status, setStatus] = useState("");

  const recaptchaRef = useRef(null);

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
          },
        }
      );
    }

    return recaptchaRef.current;
  }

  async function sendOtp(e) {
    e.preventDefault();

    if (!phone.startsWith("+")) {
      setStatus("Enter phone number in E.164 format, e.g. +919876543210");
      return;
    }

    setStatus("Sending OTP...");

    try {
      const appVerifier = setupRecaptcha();

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        appVerifier
      );

      setConfirmationResult(result);
      setStatus("OTP sent. Check your phone.");
    } catch (err) {
      console.error(err);

      // Clear the failed reCAPTCHA so another attempt can create a
      // fresh verifier.
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }

      setStatus("Failed to send OTP: " + err.message);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();

    if (!confirmationResult) {
      setStatus("Please request an OTP first.");
      return;
    }

    setStatus("Verifying...");

    try {
      const result = await confirmationResult.confirm(otp);

      const token = await result.user.getIdToken();

      localStorage.setItem("idToken", token);
      localStorage.setItem("userPhone", result.user.phoneNumber);

      setStatus("Logged in. Redirecting...");

      router.push("/chat");
    } catch (err) {
      console.error(err);
      setStatus("Invalid OTP: " + err.message);
    }
  }

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "60px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>
        Login
      </h1>

      {!confirmationResult && (
        <form onSubmit={sendOtp}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
            }}
          >
            Phone number (E.164, e.g. +91XXXXXXXXXX)
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
            }}
            required
          />

          <button
            id="send-otp-button"
            type="submit"
            style={{
              padding: "8px 16px",
            }}
          >
            Send OTP
          </button>
        </form>
      )}

      {confirmationResult && (
        <form onSubmit={verifyOtp}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
            }}
          >
            Enter the OTP you received
          </label>

          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
            }}
            required
          />

          <button
            type="submit"
            style={{
              padding: "8px 16px",
            }}
          >
            Verify
          </button>
        </form>
      )}

      {status && (
        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#444",
          }}
        >
          {status}
        </p>
      )}
    </main>
  );
}