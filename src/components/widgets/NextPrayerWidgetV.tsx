"use client";

interface Props {
  label: string;
  subtext: string;
  countdown: string;
  progress: number;
  isUrgent: boolean;
  isIqama: boolean;
  accentColor: string;
  textColor: string;
  barColor: string;
}

function ProgressBar({ progress, color, urgent }: { progress: number; color: string; urgent: boolean }) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: "10px", background: "rgba(255,255,255,0.1)", maxWidth: "420px", margin: "0 auto" }}
    >
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgent ? "animate-pulse" : ""}`}
        style={{
          width: `${Math.min(100, progress * 100)}%`,
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </div>
  );
}

export default function NextPrayerWidgetV({
  label, subtext, countdown, progress, isUrgent, isIqama, accentColor, textColor, barColor,
}: Props) {
  return (
    <div className="text-center h-full flex flex-col justify-center select-none">
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-2xl" style={{ color: accentColor }}>{isIqama ? "\u{1F54C}" : "\u2626"}</span>
        <h2 className={`text-4xl font-semibold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: textColor }}>
          {label}
        </h2>
      </div>
      <p
        className="text-7xl font-light"
        style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? accentColor : "var(--text-primary)" }}
      >
        {countdown}
      </p>
      <div className="mt-4 px-4">
        <ProgressBar progress={progress} color={barColor} urgent={isUrgent} />
      </div>
      <p className="text-2xl font-medium mt-3" style={{ color: "var(--text-secondary)" }}>{subtext}</p>
    </div>
  );
}
