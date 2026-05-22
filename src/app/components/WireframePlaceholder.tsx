interface WireframePlaceholderProps {
  className?: string;
  label?: string;
}

export function WireframePlaceholder({ className = "", label }: WireframePlaceholderProps) {
  return (
    <div className={`relative bg-[#D0D0D0] overflow-hidden ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#A0A0A0" strokeWidth="1.5" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="#A0A0A0" strokeWidth="1.5" />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white/70 text-[#555] text-xs font-mono px-2 py-1 border border-[#B0B0B0] tracking-wider uppercase">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
