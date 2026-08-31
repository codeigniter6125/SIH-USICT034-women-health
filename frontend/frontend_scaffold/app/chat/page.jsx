"use client";
// app/chat/page.jsx
// Real chat interface wired to the backend's /api/chat endpoint.
// Styled to match Stitch design system (care_chat and emergency_help_escalation).

import { useState, useEffect, useRef } from "react";
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

  const chatEndRef = useRef(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sending]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!message.trim() || sending) return;

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
    <div className="bg-surface text-on-surface font-body-base antialiased h-[100dvh] flex flex-col overflow-hidden">
      {/* Top App Bar */}
      <header className="w-full sticky top-0 z-50 bg-surface flex items-center justify-between px-margin-mobile py-3 max-w-max-width-dashboard mx-auto shrink-0 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container/60 border border-outline flex items-center justify-center text-primary font-bold text-lg">
            🌸
          </div>
          <div>
            <h1 className="font-headline-md text-xl md:text-headline-md text-primary leading-tight">
              She Care
            </h1>
            <p className="text-xs text-on-surface-variant">Maya Health Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-surface-container-low px-3 py-1 rounded-full border border-outline text-xs text-on-surface-variant font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2 inline-block"></span>
            {phone}
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="hover:opacity-80 transition-opacity active:scale-95 px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline text-xs text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-max-width-dashboard mx-auto px-margin-mobile pt-4 pb-44 flex flex-col gap-5 relative">
        {/* Geolocation Status Banner */}
        <div className="flex justify-center w-full">
          <div className="text-[11px] font-label-caps text-on-surface-variant/80 bg-surface-container-low border border-outline/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-[14px]">
              {locationStatus === "granted" ? "location_on" : locationStatus === "requesting" ? "sync" : "location_off"}
            </span>
            <span>
              {locationStatus === "requesting" && "Checking location for nearest-hospital emergency routing..."}
              {locationStatus === "granted" && "Location active — nearest hospital included if escalated"}
              {locationStatus === "denied" && "Location disabled — helplines will still send if escalated"}
              {locationStatus === "unsupported" && "Location not supported — helpline numbers active"}
            </span>
          </div>
        </div>

        {/* Date Divider */}
        <div className="flex justify-center w-full">
          <span className="text-[11px] font-label-caps text-on-surface-variant bg-surface-container-lowest border border-outline px-3 py-0.5 rounded-full opacity-80">
            TODAY
          </span>
        </div>

        {/* Empty state greeting */}
        {history.length === 0 && (
          <div className="flex gap-3 max-w-[90%] md:max-w-[75%]">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant mt-auto shadow-xs">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <div className="bg-surface-container-lowest border border-outline rounded-2xl rounded-bl-sm p-4 md:p-5 text-on-surface font-body-base shadow-[0_2px_8px_rgba(43,38,32,0.02)] space-y-2">
              <p>
                Hello! I&apos;m <strong>Maya</strong>, your bilingual women&apos;s health companion.
              </p>
              <p className="text-sm text-on-surface-variant">
                You can ask me about menstrual symptoms, cycle tracking, medical reports, or how you&apos;re feeling today.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setMessage("I have mild cramps today, what should I do?")}
                  className="text-xs bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant hover:bg-primary-container/40 transition-colors text-left"
                >
                  &ldquo;Mild cramps today&rdquo;
                </button>
                <button
                  onClick={() => setMessage("I am having severe sudden pelvic pain and heavy bleeding")}
                  className="text-xs bg-escalation-container text-escalation px-3 py-1.5 rounded-full border border-outline-variant hover:opacity-90 transition-opacity text-left font-medium"
                >
                  &ldquo;Severe pain &amp; bleeding&rdquo; (Test Escalation)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message History */}
        {history.map((msg, i) => (
          <div key={i} className="flex flex-col gap-2">
            {msg.role === "user" ? (
              /* User Message */
              <div className="flex gap-3 max-w-[85%] md:max-w-[70%] self-end flex-row-reverse">
                <div className="bg-surface-container border border-outline-variant rounded-2xl rounded-br-sm p-4 md:p-5 text-on-surface font-body-base leading-relaxed shadow-2xs whitespace-pre-wrap">
                  {msg.text}
                </div>
              </div>
            ) : (
              /* Assistant Message */
              <div className="flex gap-3 max-w-[92%] md:max-w-[75%]">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant mt-auto shadow-xs">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    spa
                  </span>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="bg-surface-container-lowest border border-outline rounded-2xl rounded-bl-sm p-4 md:p-5 text-on-surface font-body-base shadow-[0_2px_8px_rgba(43,38,32,0.02)] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  {/* Escalation Alert Card if triggered */}
                  {msg.escalation && (
                    <div className="bg-escalation-container border-[1.5px] border-escalation/30 text-on-surface rounded-2xl p-4 md:p-5 space-y-3 shadow-sm animate-pulse-once">
                      <div className="flex items-center gap-2 text-escalation">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          emergency
                        </span>
                        <h3 className="font-title-md text-title-md font-bold text-escalation">
                          Emergency Care / Escalation Alert
                        </h3>
                      </div>

                      <p className="text-xs font-label-caps text-on-surface-variant">
                        Triggered Rule: <span className="font-bold text-on-surface">{msg.escalation.rule_id}</span>
                      </p>

                      {msg.escalation.helplines && msg.escalation.helplines.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-body-bold text-on-surface">Emergency Helplines:</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.escalation.helplines.map((line, idx) => (
                              <a
                                key={idx}
                                href={`tel:${line.replace(/\D/g, "")}`}
                                className="inline-flex items-center gap-1 bg-escalation text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#a63925] transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">phone_in_talk</span>
                                {line}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.escalation.hospital && (
                        <div className="bg-surface-container-lowest/80 border border-outline rounded-xl p-3 space-y-1">
                          <p className="text-xs font-body-bold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-secondary">local_hospital</span>
                            Nearest Hospital:
                          </p>
                          <p className="text-sm font-semibold text-primary">{msg.escalation.hospital.name}</p>
                          {msg.escalation.hospital.maps_link && (
                            <a
                              href={msg.escalation.hospital.maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline mt-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                              Open in Google Maps
                            </a>
                          )}
                        </div>
                      )}

                      {msg.escalation.sms_result && (
                        <div className="text-xs text-secondary font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">sms</span>
                          Emergency alert SMS dispatched to verified phone
                        </div>
                      )}

                      {msg.escalation.sms_error && (
                        <div className="text-xs text-error font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          SMS notification status: {msg.escalation.sms_error}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sources / Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="text-xs text-on-surface-variant flex items-center gap-1 px-1">
                      <span className="material-symbols-outlined text-[14px] opacity-70">menu_book</span>
                      <span>Sources: {msg.sources.map((s) => s.title || s).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Sending indicator */}
        {sending && (
          <div className="flex gap-3 max-w-[90%] md:max-w-[70%]">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant mt-auto">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <div className="bg-surface-container-lowest border border-outline rounded-2xl rounded-bl-sm p-4 text-on-surface-variant font-body-base text-sm flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-bounce"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
              <span>Maya is thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* Floating Bottom Input Area */}
      <div className="fixed bottom-[68px] left-0 w-full px-margin-mobile py-2 bg-gradient-to-t from-surface via-surface/95 to-transparent z-40">
        <form onSubmit={sendMessage} className="max-w-max-width-dashboard mx-auto flex items-end gap-3 pb-1">
          {/* Voice Action Button */}
          <button
            type="button"
            onClick={() => setMessage((m) => m || "I need help with my menstrual cycle")}
            title="Voice prompt assistance"
            className="w-[52px] h-[52px] shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_12px_rgba(140,74,47,0.2)] hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              mic
            </span>
          </button>

          {/* Text Input Pill */}
          <div className="flex-1 flex items-center bg-surface-container-lowest border-[1.5px] border-outline rounded-3xl px-4 min-h-[52px] focus-within:border-primary focus-within:shadow-[0_0_8px_rgba(140,74,47,0.1)] transition-all bg-opacity-95 backdrop-blur-sm shadow-xs">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your symptoms or health query..."
              disabled={sending}
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 font-body-base text-on-surface placeholder:text-on-surface-variant py-3"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="text-primary ml-2 hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-low disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container border-t border-outline rounded-t-xl shrink-0">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-1.5 hover:bg-surface-variant transition-colors active:scale-90 w-16 rounded-lg"
        >
          <span className="material-symbols-outlined text-xl mb-0.5">home</span>
          <span className="font-label-caps text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setMessage("Give me cycle tracking insights for this month")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-1.5 hover:bg-surface-variant transition-colors active:scale-90 w-16 rounded-lg"
        >
          <span className="material-symbols-outlined text-xl mb-0.5">cached</span>
          <span className="font-label-caps text-[10px]">Cycle</span>
        </button>

        <button
          type="button"
          onClick={() => setMessage("I want to upload or interpret a medical lab report")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-1.5 hover:bg-surface-variant transition-colors active:scale-90 w-16 rounded-lg"
        >
          <span className="material-symbols-outlined text-xl mb-0.5">description</span>
          <span className="font-label-caps text-[10px]">Reports</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-full px-4 py-1.5 hover:opacity-90 transition-colors active:scale-90 min-w-[70px]"
        >
          <span className="material-symbols-outlined text-lg mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            chat_bubble
          </span>
          <span className="font-label-caps text-[10px]">Chat</span>
        </button>
      </nav>
    </div>
  );
}