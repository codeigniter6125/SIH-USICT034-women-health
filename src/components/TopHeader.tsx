import type { Screen } from "../App";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
}

export default function TopHeader({ title, subtitle, onBack, right, transparent }: Props) {
  return (
    <div className={`flex items-center gap-3 px-5 pt-5 pb-4 ${transparent ? "" : "bg-[#F7F3EE]"} sticky top-0 z-20`}>
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-[#DDD8D0] flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18110F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-[#18110F] truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#9B9390] mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
