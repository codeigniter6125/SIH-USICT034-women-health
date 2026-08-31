"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const MOODS = [
  { id: "Calm",      icon: "sentiment_satisfied",      label: "Calm",      color: "bg-[#5B6FA6]" },
  { id: "Energetic", icon: "bolt",                     label: "Energetic", color: "bg-[#C97B5C]" },
  { id: "Tired",     icon: "bedtime",                  label: "Tired",     color: "bg-[#7B5C92]" },
  { id: "Anxious",   icon: "sentiment_dissatisfied",   label: "Anxious",   color: "bg-[#A0522D]" },
  { id: "Joyful",    icon: "sentiment_very_satisfied", label: "Joyful",    color: "bg-[#486550]" },
];

const SYMPTOMS = [
  { id: "Cramps", icon: "healing", label: "Cramps" },
  { id: "Bloating", icon: "bubble_chart", label: "Bloating" },
  { id: "Headache", icon: "hdr_auto", label: "Headache" },
  { id: "Acne", icon: "face_retouching_natural", label: "Acne" },
  { id: "Backache", icon: "accessibility_new", label: "Backache" },
  { id: "Fatigue", icon: "battery_horiz_050", label: "Fatigue" },
  { id: "Nausea", icon: "sick", label: "Nausea" },
  { id: "Mood swings", icon: "sync_alt", label: "Mood swings" },
  { id: "Breast tenderness", icon: "favorite", label: "Breast tenderness" },
];

export default function DailyLogPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(null);
  const [selectedMood, setSelectedMood] = useState("Calm");
  const [selectedSymptoms, setSelectedSymptoms] = useState(["Bloating"]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone");
    if (!token || !storedPhone) {
      router.push("/login");
      return;
    }
    setPhone(storedPhone);
  }, [router]);

  function toggleSymptom(sym) {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  }

  // Real browser Voice recording for Whisper STT with Live SpeechRecognition
  async function toggleVoiceRecording() {
    if (recording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    } else {
      let speechRecognized = false;

      // Method A: Browser Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-IN";

          let baseNote = notes;
          recognition.onresult = (event) => {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript.trim()) {
              speechRecognized = true;
              setNotes(baseNote ? `${baseNote} ${transcript}` : transcript);
            }
          };

          recognition.onerror = (event) => {
            console.warn("Speech API note:", event.error);
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

      // Method B: MediaRecorder -> Backend Whisper
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
            formData.append("file", audioBlob, "voice_note.webm");

            try {
              const res = await fetch(`${BACKEND_URL}/api/voice/transcribe`, {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data?.text) {
                setNotes((prev) => (prev ? `${prev} ${data.text}` : data.text));
              }
            } catch (err) {
              console.error("Whisper transcription error:", err);
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

  async function handleSaveCheckIn(e) {
    e.preventDefault();
    if (!phone || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/daily-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_phone: phone,
          mood: selectedMood,
          symptoms: selectedSymptoms,
          notes: notes,
        }),
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error("Save log error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface text-on-surface font-body-base antialiased min-h-screen flex flex-col pb-28">
      <TopHeader title="Daily Check-in" showBack backHref="/" />

      <main className="flex-1 max-w-max-width-dashboard mx-auto w-full px-margin-mobile pt-6 space-y-8">
        {/* Section 1: Mood */}
        <section className="space-y-3">
          <h2 className="font-title-md text-base md:text-title-md text-on-surface font-bold">
            How are you feeling today?
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 md:flex-wrap">
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex flex-col items-center justify-center gap-2 min-w-[80px] h-[104px] rounded-2xl border transition-all duration-200 shrink-0 shadow-2xs active:scale-95 ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 bg-primary-container/30"
                      : "bg-surface-container-lowest border-outline hover:border-primary/40"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center shadow-sm transition-transform ${isSelected ? "scale-110" : "group-hover:scale-105"}`}>
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {m.icon}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? "text-primary" : "text-on-surface-variant"}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Symptoms */}
        <section className="space-y-3">
          <h2 className="font-title-md text-base md:text-title-md text-on-surface font-bold">
            Any symptoms you&apos;re experiencing?
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {SYMPTOMS.map((sym) => {
              const isSelected = selectedSymptoms.includes(sym.id);
              return (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => toggleSymptom(sym.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? "bg-[#486550] border border-[#486550] text-white font-bold shadow-2xs scale-105"
                      : "bg-surface-container-lowest border border-outline text-on-surface-variant hover:border-[#486550]/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>
                    {sym.icon}
                  </span>
                  <span>{sym.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: Notes for Maya with Whisper Audio STT */}
        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block font-title-md text-sm md:text-base text-on-surface font-bold" htmlFor="notes">
              Notes for Maya
            </label>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold transition-all ${
                recording
                  ? "bg-escalation text-white animate-pulse"
                  : "bg-surface-container-low text-primary hover:bg-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                mic
              </span>
              <span>{recording ? "Listening (Whisper STT)..." : "Voice Note"}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down or speak anything else you're feeling today..."
              className="w-full bg-surface-container-lowest border border-outline rounded-2xl p-4 font-body-base text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none shadow-2xs"
            />
          </div>
        </section>

        {/* Submit Action */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveCheckIn}
            disabled={submitting}
            className="bg-primary text-on-primary font-body-bold text-sm py-3.5 px-8 rounded-full hover:opacity-90 transition-all w-full md:w-auto min-h-[48px] shadow-2xs active:scale-95 disabled:opacity-60"
          >
            {submitting ? "Saving Check-in..." : "Save Check-in"}
          </button>
        </div>

        {/* AI Agent Feedback Modal / Card */}
        {feedback && (
          <div className="bg-surface-container-lowest border border-outline rounded-3xl p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-primary font-bold text-base">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
              <span>Maya&apos;s Check-in Response</span>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{feedback.maya_feedback}</p>

            {feedback.escalation?.escalated && (
              <div className="p-3 bg-escalation-container text-escalation rounded-xl text-xs font-bold flex items-center justify-between">
                <span>⚠️ Potential red flag detected. Helpline info sent via SMS.</span>
                <Link href="/emergency" className="underline">
                  View Emergency
                </Link>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Link
                href="/cycle"
                className="text-xs bg-surface-container px-4 py-2 rounded-full font-bold text-on-surface hover:bg-surface-container-high"
              >
                View Cycle Insights
              </Link>
              <Link
                href="/chat"
                className="text-xs bg-primary text-on-primary px-4 py-2 rounded-full font-bold hover:opacity-90"
              >
                Discuss in Chat
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
