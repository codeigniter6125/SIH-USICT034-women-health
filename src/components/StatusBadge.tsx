type Status = "normal" | "attention" | "warning" | "emergency";

const map: Record<Status, { bg: string; text: string; dot: string; label: string }> = {
  normal:    { bg: "#EDF3E8", text: "#5A7A48", dot: "#5A7A48",  label: "Normal" },
  attention: { bg: "#FDF3E3", text: "#C47A1A", dot: "#C47A1A",  label: "Attention" },
  warning:   { bg: "#FEF2F2", text: "#B91C1C", dot: "#B91C1C",  label: "Low" },
  emergency: { bg: "#B91C1C", text: "#FFFFFF", dot: "#FFFFFF",  label: "Urgent" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}
