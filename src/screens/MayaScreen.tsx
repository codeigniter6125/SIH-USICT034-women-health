import { useState, useRef, useEffect } from "react";
import type { Screen } from "../App";
import MayaAvatar from "../components/MayaAvatar";
import { SkeletonChat } from "../components/SkeletonLoader";
import { sendChatMessage, getUserPhone } from "../lib/api";

interface Props { navigate: (s: Screen) => void; }

type MsgRole = "maya" | "user";
interface Msg {
  id: string;
  role: MsgRole;
  text: string;
  time: string;
  urgent?: boolean;
  sources?: any[];
  agent?: string;
}

const QUICK_PROMPTS: Array<{ en: string; hi: string }> = [
  { en: "What's happening in my cycle?",  hi: "मेरे साइकिल में क्या हो रहा है?" },
  { en: "Help me understand my report",   hi: "रिपोर्ट समझने में मदद करें" },
  { en: "I have symptoms to describe",    hi: "मुझे लक्षण बताने हैं" },
  { en: "What to track today?",           hi: "आज क्या नोट करूँ?" },
];

const INIT: Msg[] = [
  {
    id: "init-1",
    role: "maya",
    text: "Hi, I'm Maya — your health companion on She Care.\n\nI can help you understand your cycle, explain a lab report in simple language, or listen when you want to describe symptoms.\n\nI'm not a doctor, and I won't give you diagnoses — but I'll always help you understand and know when to seek care.",
    time: "Now",
  },
];

export default function MayaScreen({ navigate }: Props) {
  const [messages, setMessages] = useState<Msg[]>(INIT);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [offline, setOffline] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [escalated, setEscalated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing || offline) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text: trimmed, time: currentTime };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await sendChatMessage({
        message: trimmed,
        phone: getUserPhone(),
        language: lang === "hi" ? "Hindi" : "English",
      });

      const isUrgent = Boolean(res.escalation?.escalated);
      const mayaMsg: Msg = {
        id: `m-${Date.now()}`,
        role: "maya",
        text: res.reply || "I've noted what you shared. Let me know if you have any questions.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        urgent: isUrgent,
        sources: res.sources,
        agent: res.agent,
      };

      setMessages((m) => [...m, mayaMsg]);

      if (isUrgent) {
        setEscalated(true);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: Msg = {
        id: `err-${Date.now()}`,
        role: "maya",
        text: "I'm having trouble connecting right now. Please check your network and try again.",
        time: "Now",
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setTyping(false);
    }
  }

  function renderText(text: string) {
    return text.split("\n").map((line, i) => {
      if (line === "") return <div key={i} className="h-1.5" />;
      const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-[#DDD8D0] px-5 py-4 flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="space-y-1.5"><div className="skeleton w-20 h-4 rounded" /><div className="skeleton w-32 h-3 rounded" /></div>
        </div>
        <div className="flex-1"><SkeletonChat /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#DDD8D0] px-5 pt-5 pb-3.5 flex items-center gap-3 flex-shrink-0 sticky top-0 z-20">
        <MayaAvatar size={44} ring pulse={typing} />
        <div className="flex-1">
          <h1 className="font-bold text-[#18110F] text-base leading-tight">Maya</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${typing ? "bg-[#C47A1A] anim-pulse-slow" : offline ? "bg-[#B91C1C]" : "bg-[#5A7A48]"}`} />
            <p className="text-xs text-[#9B9390]">{typing ? "Thinking…" : offline ? "Offline" : "Your health companion"}</p>
          </div>
        </div>
        <button
          onClick={() => setLang(l => l === "en" ? "hi" : "en")}
          className="text-xs font-bold bg-[#EDE9E2] text-[#3D3330] rounded-full px-3 py-1.5 active:scale-90 transition-transform"
        >
          {lang === "en" ? "हिन्दी" : "English"}
        </button>
        <button
          onClick={() => setOffline(o => !o)}
          title="Toggle offline demo"
          className={`text-[10px] font-bold rounded-full px-2 py-1 ${offline ? "bg-[#FEF2F2] text-[#B91C1C]" : "bg-[#F0EDE8] text-[#C4BEB8]"}`}
        >
          {offline ? "✗" : "○"}
        </button>
      </div>

      {/* Safety note */}
      <div className="bg-[#FDF3E3] border-b border-[#F5D9A8] px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C47A1A" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
        <p className="text-xs text-[#C47A1A] font-semibold">Educational guidance only · not a diagnosis · always consult your doctor</p>
      </div>

      {/* Offline banner */}
      {offline && (
        <div className="bg-[#3D3330] px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" /></svg>
          <p className="text-xs text-white font-medium">No connection. Maya can't respond until you're back online.</p>
          <button onClick={() => setOffline(false)} className="ml-auto text-xs text-white/60 underline">Retry</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2.5 anim-slide-up`}
              style={{ animationDelay: `${Math.min(idx * 40, 120)}ms` }}
            >
              {msg.role === "maya" && <MayaAvatar size={30} className="mt-0.5 flex-shrink-0" />}
              <div className={`max-w-[82%] space-y-1`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm space-y-0.5 ${
                    msg.role === "user"
                      ? "bg-[#2E6B6E] text-white rounded-tr-sm"
                      : msg.urgent
                        ? "bg-[#FEF2F2] border-2 border-[#FECACA] text-[#18110F] rounded-tl-sm"
                        : "bg-white border border-[#E8E3DB] text-[#18110F] rounded-tl-sm"
                  }`}
                >
                  {msg.urgent && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.2"><path d="M12 9v4M12 17h.01" strokeLinecap="round" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinejoin="round" /></svg>
                      <span className="text-xs font-bold text-[#B91C1C] uppercase tracking-wider">Urgent — please read</span>
                    </div>
                  )}
                  {renderText(msg.text)}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#E8E3DB] text-[11px] text-[#6E6460]">
                      <span className="font-semibold text-[#2E6B6E]">Sources: </span>
                      {msg.sources.map((s: any, sIdx: number) => (
                        <span key={sIdx} className="inline-block mr-2 bg-[#F0EDE8] px-1.5 py-0.5 rounded text-[10px]">
                          {typeof s === "object" ? s.title || s.source || JSON.stringify(s) : `[${s}]`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-[10px] ${msg.role === "user" ? "text-right text-[#9B9390]" : "text-[#9B9390]"}`}>{msg.time}</p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-2.5 anim-slide-up">
              <MayaAvatar size={30} pulse className="mt-0.5 flex-shrink-0" />
              <div className="bg-white border border-[#E8E3DB] rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#C2DEDD] bounce-dot" style={{ animationDelay: `${i * 160}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Escalation CTA */}
      {escalated && (
        <div className="mx-4 mb-2 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl px-4 py-3 flex items-center gap-3 anim-slide-up flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#B91C1C] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3"><path d="M12 9v4M12 17h.01" strokeLinecap="round" /></svg>
          </div>
          <p className="text-xs text-[#B91C1C] font-semibold flex-1">This sounds urgent. Please seek help immediately.</p>
          <button onClick={() => navigate("emergency")} className="bg-[#B91C1C] text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-90 transition-transform">
            Open SOS
          </button>
        </div>
      )}

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 flex-shrink-0">
          <p className="text-[10px] font-bold text-[#9B9390] uppercase tracking-[0.14em] mb-2">Try asking</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.en}
                onClick={() => send(lang === "hi" ? p.hi : p.en)}
                className="flex-shrink-0 text-xs font-semibold bg-white border border-[#DDD8D0] text-[#3D3330] rounded-full px-3.5 py-2 active:scale-90 transition-transform whitespace-nowrap"
              >
                {lang === "hi" ? p.hi : p.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recording state */}
      {recording && (
        <div className="bg-[#FEF2F2] border-t border-[#FECACA] px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
          <div className="relative w-3 h-3 recording-ring">
            <div className="w-3 h-3 rounded-full bg-[#B91C1C]" />
          </div>
          <span className="text-sm font-bold text-[#B91C1C] flex-1">Listening…</span>
          <button onClick={() => { setRecording(false); send(lang === "hi" ? "आज मुझे बहुत थकान लग रही है और सिरदर्द है।" : "I've been feeling quite fatigued today and have a mild headache."); }} className="text-xs font-semibold bg-white border border-[#DDD8D0] text-[#6E6460] px-3 py-1.5 rounded-full">Done</button>
          <button onClick={() => setRecording(false)} className="text-xs text-[#9B9390] font-medium">Cancel</button>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white border-t border-[#DDD8D0] px-4 py-3 flex items-end gap-2 flex-shrink-0">
        <button onClick={() => navigate("reports")} className="w-9 h-9 flex items-center justify-center text-[#9B9390] hover:text-[#2E6B6E] transition-colors flex-shrink-0" aria-label="Upload report">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
        </button>
        <div className={`flex-1 rounded-2xl px-4 py-2.5 transition-all ${input ? "bg-white border-2 border-[#2E6B6E] ring-2 ring-[#2E6B6E]/10" : "bg-[#F7F3EE] border-2 border-transparent"}`}>
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={lang === "hi" ? "माया से पूछें…" : "Ask Maya anything about your health…"}
            disabled={offline}
            className="w-full resize-none outline-none bg-transparent text-sm text-[#18110F] placeholder:text-[#C4BEB8] devanagari disabled:opacity-40"
            style={{ lineHeight: "1.55", maxHeight: "120px" }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          />
        </div>
        <button
          onClick={input.trim() ? () => send(input) : () => setRecording(r => !r)}
          disabled={offline && !input.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40 ${
            input.trim() ? "bg-[#2E6B6E] shadow-md" : recording ? "bg-[#B91C1C]" : "bg-[#EDE9E2]"
          }`}
        >
          {input.trim() ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={recording ? "white" : "#7A7470"} strokeWidth="1.8" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
