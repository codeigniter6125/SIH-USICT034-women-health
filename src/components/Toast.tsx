import { useEffect } from "react";

interface Props {
  message: string;
  type?: "success" | "error" | "info";
  onDismiss: () => void;
}

const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  ),
};

const colors = {
  success: "#5A7A48",
  error:   "#B91C1C",
  info:    "#2E6B6E",
};

export default function Toast({ message, type = "info", onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 slide-up max-w-xs w-[calc(100%-40px)]"
      style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.15))" }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: colors[type] }}
      >
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          {icons[type]}
        </div>
        <p className="text-sm text-white font-medium leading-snug">{message}</p>
        <button onClick={onDismiss} className="ml-auto text-white/60 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
