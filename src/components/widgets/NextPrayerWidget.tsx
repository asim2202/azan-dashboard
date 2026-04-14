"use client";

import type { WidgetProps } from "@/types/widget";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export default function NextPrayerWidget({ size, currentTime, timezone, config, nextPrayer }: WidgetProps) {
  if (!nextPrayer) {
    return <div className="h-full flex items-center justify-center"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;
  }

  const msUntil = nextPrayer.azanDate.getTime() - currentTime.getTime();
  const isUrgent = msUntil > 0 && msUntil < 15 * 60 * 1000;
  const isPassed = msUntil <= 0;

  const timeStr = nextPrayer.azanDate.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: timezone, hour12: config.display.timeFormat === "12h",
  });

  const countdownSize = size === "S" ? "text-3xl" : size === "M" ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl";
  const nameSize = size === "S" ? "text-lg" : "text-xl sm:text-2xl";

  return (
    <div className="text-center h-full flex flex-col justify-center select-none">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span style={{ color: "var(--accent)" }}>&#9774;</span>
        <h2 className={`${nameSize} font-semibold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: isUrgent ? "var(--accent)" : "var(--accent-text)" }}>
          {nextPrayer.label}
        </h2>
      </div>
      {!isPassed ? (
        <p className={`${countdownSize} font-light`} style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? "var(--accent)" : "var(--text-primary)" }}>
          {formatCountdown(msUntil)}
        </p>
      ) : (
        <p className="text-lg" style={{ color: "var(--accent-muted)" }}>Azan at {timeStr}</p>
      )}
      {!isPassed && size !== "S" && (
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Azan at {timeStr}</p>
      )}
    </div>
  );
}
