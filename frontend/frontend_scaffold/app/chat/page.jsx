"use client";
// app/chat/page.jsx
// Real chat interface wired to the backend's /api/chat endpoint.
// Connects: login session (phone + token) -> Orchestrator -> Intake ->
// Escalation (real textbee SMS if triggered, with nearest-hospital Maps
// link via browser geolocation) -> Cycle/Report/Care-Plan agent.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ChatPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("requesting");

  useEffect(() => {
    const storedToken = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone");
    if (!storedToken || !storedPhone) {
      router.push("/login");
      return;
    }
    setIdToken(storedToken);
    setPhone(storedPhone);
  }, [router]);

  // Request browser location once on load. Per PRD 7.4, this is purely
  // additive - the escalation SMS/helpline always sends regardless of
  // whether this succeeds, denies, or is unsupported.
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => {
        setLocationStatus("denied");
      },
      { timeout: 8000 }
    );
  }, []);

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;

    const userText = message;
    setHistory((h) => [...h, { role: "user", text: userText }]);
    setMessage("");
    setSending(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: userText,
          user_phone: phone,
          language: "English",
          ...(location ? { location } : {}),
        }),
      });
      const data = await res.json();

      const escalated = data?.escalation?.escalated === true;
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          text: data.reply || JSON.stringify(data),
          escalation: escalated ? data.escalation : null,
          sources: data.sources || null,
        },
      ]);
    } catch (err) {
      setHistory((h) => [...h, { role: "assistant", text: "Error: " + err.message }]);
    } finally {
      setSending(false);
    }
  }

  function logout() {
    localStorage.removeItem("idToken");
    localStorage.removeItem("userPhone");
    router.push("/login");
  }

  if (!phone) return null;

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: 20 }}>Chat</h1>
        <div>
          <span style={{ fontSize: 12, color: "#666", marginRight: 12 }}>{phone}</span>
          <button onClick={logout} style={{ fontSize: 12, padding: "4px 10px" }}>Log out</button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
        {locationStatus === "requesting" && "Requesting location for nearest-hospital lookup..."}
        {locationStatus === "granted" && "Location available - escalation alerts will include the nearest hospital."}
        {locationStatus === "denied" && "Location not shared - escalation alerts will still send helpline numbers, without a hospital link."}
        {locationStatus === "unsupported" && "Location not supported by this browser - helpline numbers will still send if needed."}
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, minHeight: 320, marginBottom: 16 }}>
        {history.length === 0 && (
          <p style={{ color: "#999", fontSize: 13 }}>
            Try a routine message ("mild cramps today") or a red-flag one
            ("severe pain and heavy bleeding") to see escalation trigger.
          </p>
        )}
        {history.map((msg, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 12, color: msg.role === "user" ? "#333" : "#B85042" }}>
              {msg.role === "user" ? "You" : "Assistant"}
            </strong>
            <p style={{ margin: "4px 0", fontSize: 14 }}>{msg.text}</p>
            {msg.escalation && (
              <div style={{ background: "#fdecea", border: "1px solid #f5c6cb", padding: 8, borderRadius: 6, fontSize: 12 }}>
                Escalation triggered - rule: {msg.escalation.rule_id} - helplines:{" "}
                {(msg.escalation.helplines || []).join(", ")}
                {msg.escalation.hospital && (
                  <div>
                    Nearest hospital:{" "}
                    <a href={msg.escalation.hospital.maps_link} target="_blank" rel="noopener noreferrer">
                      {msg.escalation.hospital.name}
                    </a>
                  </div>
                )}
                {msg.escalation.sms_error && (
                  <div style={{ color: "#a00" }}>SMS error: {msg.escalation.sms_error}</div>
                )}
                {msg.escalation.sms_result && <div>SMS sent</div>}
              </div>
            )}
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                Sources: {msg.sources.map((s) => s.title).join(", ")}
              </div>
            )}
          </div>
        ))}
        {sending && <p style={{ fontSize: 12, color: "#999" }}>Sending...</p>}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" disabled={sending} style={{ padding: "10px 20px" }}>
          Send
        </button>
      </form>
    </main>
  );
}