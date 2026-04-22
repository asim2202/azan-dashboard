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
      style={{ height: "6px", background: "rgba(255,255,255,0.1)", maxWidth: "280px", margin: "0 auto" }}
    >
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgent ? "animate-pulse" : ""}`}
        style={{
          width: `${Math.min(100, progress * 100)}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

export default function NextPrayerWidgetH({
  label, subtext, countdown, progress, isUrgent, isIqama, accentColor, textColor, barColor,
}: Props) {
  return (
    <div className="text-center h-full flex flex-col justify-center select-none">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span style={{ color: accentColor }}>{isIqama ? "\u{1F54C}" : "\u2626"}</span>
        <h2 className={`text-xl sm:text-2xl font-semibold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: textColor }}>
          {label}
        </h2>
      </div>
      <p
        className="text-4xl sm:text-5xl font-light"
        style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? accentColor : "var(--text-primary)" }}
      >
        {countdown}
      </p>
      <div className="mt-2 px-4">
        <ProgressBar progress={progress} color={barColor} urgent={isUrgent} />
      </div>
      <p className="text-base font-medium mt-1" style={{ color: "var(--text-secondary)" }}>{subtext}</p>
    </div>
  );
}
