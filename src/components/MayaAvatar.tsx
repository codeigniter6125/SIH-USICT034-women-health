interface Props {
  size?: number;
  pulse?: boolean;
  ring?: boolean;
  className?: string;
}

export default function MayaAvatar({ size = 40, pulse = false, ring = false, className = "" }: Props) {
  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Pulse ring when active */}
      {pulse && (
        <span
          className="absolute inset-0 rounded-full bg-[#2E6B6E]/25 anim-pulse-slow"
          style={{ borderRadius: "9999px" }}
        />
      )}
      {ring && (
        <span
          className="absolute -inset-0.5 rounded-full"
          style={{ border: "2px solid rgba(46,107,110,0.35)", borderRadius: "9999px" }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          <radialGradient id="mayaBg" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#3D7E81" />
            <stop offset="100%" stopColor="#1E5153" />
          </radialGradient>
        </defs>

        {/* Background circle */}
        <circle cx="28" cy="28" r="28" fill="url(#mayaBg)" />

        {/* Subtle inner ring */}
        <circle cx="28" cy="28" r="27" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />

        {/* Face */}
        <circle cx="28" cy="22" r="10.5" fill="white" fillOpacity="0.93" />

        {/* Eyes */}
        <circle cx="24.5" cy="21" r="1.8" fill="#2E6B6E" />
        <circle cx="31.5" cy="21" r="1.8" fill="#2E6B6E" />

        {/* Eye shine */}
        <circle cx="25.3" cy="20.2" r="0.6" fill="white" />
        <circle cx="32.3" cy="20.2" r="0.6" fill="white" />

        {/* Smile */}
        <path d="M24.5 25 Q28 28.5 31.5 25" stroke="#2E6B6E" strokeWidth="1.4" strokeLinecap="round" fill="none" />

        {/* Body / shoulders */}
        <path d="M12 50 Q14 38 28 36 Q42 38 44 50" fill="white" fillOpacity="0.72" />

        {/* Leaf accent — warmth marker */}
        <path d="M38 9 Q44 5 43 11 Q41 14 38 9Z" fill="white" fillOpacity="0.4" />
        <path d="M39 10 Q43 7 42 11" stroke="white" strokeOpacity="0.5" strokeWidth="0.7" />
      </svg>
    </div>
  );
}
