"use client";
// app/chat/page.jsx
// Real chat interface wired to backend /api/chat and Whisper STT /api/voice/transcribe.

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ChatPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("requesting");

  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

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
  }, [history]);

  async function handleSend(e) {
    if (e) e.preventDefault();
    const userText = message.trim();
    if (!userText || sending) return;

    setMessage("");
    setHistory((h) => [...h, { role: "user", text: userText }]);
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

  // Voice Recording with Live Web Speech STT + Backend Whisper Fallback
  async function toggleVoiceRecording() {
    if (recording) {
      // Stop Web Speech if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      // Stop MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    } else {
      let speechRecognized = false;

      // Method A: Try Browser Web Speech API for real-time live transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-IN"; // English (India) with Hindi loan words

          recognition.onresult = (event) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript.trim()) {
              speechRecognized = true;
              setMessage(currentTranscript);
            }
          };

          recognition.onerror = (event) => {
            console.warn("Web Speech API note:", event.error);
          };

          recognition.onend = () => {
            setRecording(false);
          };

          recognition.start();
          recognitionRef.current = recognition;
          setRecording(true);
          return;
        } catch (speechErr) {
          console.warn("Web Speech initiation note:", speechErr);
        }
      }

      // Method B: Fallback to MediaRecorder -> Backend Whisper / Gemini Audio STT
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach((track) => track.stop());

          if (!speechRecognized) {
            const formData = new FormData();
            formData.append("file", audioBlob, "user_voice.webm");

            try {
              setSending(true);
              const res = await fetch(`${BACKEND_URL}/api/voice/transcribe`, {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data?.text) {
                setMessage(data.text);
              }
            } catch (err) {
              console.error("Whisper voice STT error:", err);
            } finally {
              setSending(false);
            }
          }
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        alert("Microphone access is needed for voice input. Please allow microphone permissions in your browser.");
      }
    }
  }

  if (!phone) return null;

  return (
    <div className="bg-surface text-on-surface font-body-base antialiased h-[100dvh] flex flex-col overflow-hidden">
      <TopHeader title="She Care" />

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-max-width-dashboard mx-auto px-margin-mobile pt-3 pb-44 flex flex-col gap-4 relative">
        {/* Geolocation Status Banner */}
        <div className="flex justify-center w-full">
          <div className="text-[11px] font-label-caps text-on-surface-variant/80 bg-surface-container-low border border-outline/60 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-[14px]">
              {locationStatus === "granted" ? "location_on" : locationStatus === "requesting" ? "sync" : "location_off"}
            </span>
            <span>
              {locationStatus === "requesting" && "Checking location for nearest-hospital emergency routing..."}
              {locationStatus === "granted" && "Location active — nearest hospital included if escalated"}
              {locationStatus === "denied" && "Location disabled — helpline numbers active"}
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
              <p className="text-xs text-on-surface-variant">
                You can ask me about menstrual symptoms, cycle tracking, medical reports, or speak with your voice.
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
                <button
                  onClick={() => setMessage("Explain my Complete Blood Count report")}
                  className="text-xs bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full border border-outline-variant hover:opacity-90 transition-opacity text-left font-medium"
                >
                  &ldquo;Explain CBC report&rdquo;
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
                <div className="bg-surface-container border border-outline-variant rounded-2xl rounded-br-sm p-4 md:p-5 text-on-surface font-body-base leading-relaxed shadow-2xs whitespace-pre-wrap text-sm">
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
                  <div className="bg-surface-container-lowest border border-outline rounded-2xl rounded-bl-sm p-4 md:p-5 text-on-surface font-body-base shadow-[0_2px_8px_rgba(43,38,32,0.02)] leading-relaxed whitespace-pre-wrap text-sm">
                    {msg.text}
                  </div>

                  {/* Escalation Alert Card if triggered */}
                  {msg.escalation && (
                    <div className="bg-escalation-container border-[1.5px] border-escalation/30 text-on-surface rounded-2xl p-4 md:p-5 space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 text-escalation">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          emergency
                        </span>
                        <h3 className="font-title-md text-sm font-bold text-escalation">
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
                        <div className="bg-surface-container-lowest/90 border border-outline rounded-xl p-3 space-y-1">
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
                          Emergency alert SMS dispatched
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
            <div className="bg-surface-container-lowest border border-outline rounded-2xl rounded-bl-sm p-3.5 text-on-surface-variant font-body-base text-xs flex items-center gap-2">
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
      <div className="fixed bottom-[64px] left-0 w-full px-margin-mobile py-2 bg-gradient-to-t from-surface via-surface/95 to-transparent z-40">
        <form onSubmit={handleSend} className="max-w-max-width-dashboard mx-auto flex items-end gap-2.5 pb-1">
          {/* Voice Action Button with Whisper STT */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            title="Press to speak (Whisper STT)"
            className={`w-[48px] h-[48px] shrink-0 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
              recording
                ? "bg-escalation text-white animate-pulse ring-4 ring-escalation/30"
                : "bg-primary text-on-primary hover:opacity-90"
            }`}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              mic
            </span>
          </button>

          {/* Text Input Pill */}
          <div className="flex-1 flex items-center bg-surface-container-lowest border-[1.5px] border-outline rounded-3xl px-4 min-h-[48px] focus-within:border-primary transition-all shadow-xs">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={recording ? "Listening with Whisper..." : "Type your symptoms or health query..."}
              disabled={sending}
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 font-body-base text-xs md:text-sm text-on-surface placeholder:text-on-surface-variant py-2.5"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="text-primary ml-2 hover:opacity-80 transition-opacity p-1.5 rounded-full hover:bg-surface-container-low disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
            </button>
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}