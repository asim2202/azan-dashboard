"use client";

import type { PrayerTime } from "@/types/prayer";

interface NextPrayerBannerProps {
  prayer: PrayerTime | null;
  currentTime: Date;
  timezone: string;
  format: "12h" | "24h";
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export default function NextPrayerBanner({
  prayer,
  currentTime,
  timezone,
  format,
}: NextPrayerBannerProps) {
  if (!prayer) {
    return (
      <div className="text-center py-6">
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>Loading prayer times...</p>
      </div>
    );
  }

  const msUntil = prayer.azanDate.getTime() - currentTime.getTime();
  const isUrgent = msUntil > 0 && msUntil < 15 * 60 * 1000;
  const isPassed = msUntil <= 0;

  const timeStr = prayer.azanDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: format === "12h",
  });

  return (
    <div className="text-center py-2 portrait:py-2 landscape:py-4 sm:landscape:py-6">
      <div className="flex items-center justify-center gap-2 mb-1 landscape:mb-2">
        <span className="text-lg landscape:text-xl" style={{ color: "var(--accent)" }}>&#9774;</span>
        <h2
          className={`text-xl portrait:text-2xl portrait:sm:text-3xl portrait:lg:text-4xl landscape:text-2xl sm:landscape:text-3xl md:landscape:text-4xl font-semibold tracking-wide ${isUrgent ? "animate-pulse" : ""}`}
          style={{ color: isUrgent ? "var(--accent)" : "var(--accent-text)" }}
        >
          {prayer.label}
        </h2>
      </div>

      {!isPassed ? (
        <p
          className="text-3xl portrait:text-4xl portrait:sm:text-5xl portrait:lg:text-6xl landscape:text-4xl sm:landscape:text-5xl md:landscape:text-6xl font-light"
          style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? "var(--accent)" : "var(--text-primary)" }}
        >
          {formatCountdown(msUntil)}
        </p>
      ) : (
        <p className="text-xl" style={{ color: "var(--accent-muted)" }}>
          Azan at {timeStr}
        </p>
      )}

      {!isPassed && (
        <p className="text-xs portrait:text-sm mt-1" style={{ color: "var(--text-muted)" }}>Azan at {timeStr}</p>
      )}
    </div>
  );
}
