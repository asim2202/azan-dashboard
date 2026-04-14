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
        <p className="text-white/40 text-lg">Loading prayer times...</p>
      </div>
    );
  }

  const msUntil = prayer.azanDate.getTime() - currentTime.getTime();
  const isUrgent = msUntil > 0 && msUntil < 15 * 60 * 1000; // < 15 min
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
        <span className="text-amber-400 text-lg landscape:text-xl">&#9774;</span>
        <h2
          className={`text-xl portrait:text-2xl portrait:sm:text-3xl portrait:lg:text-4xl landscape:text-2xl sm:landscape:text-3xl md:landscape:text-4xl font-semibold tracking-wide ${
            isUrgent ? "text-amber-400 animate-pulse" : "text-amber-300"
          }`}
        >
          {prayer.label}
        </h2>
      </div>

      {!isPassed ? (
        <p
          className={`text-3xl portrait:text-4xl portrait:sm:text-5xl portrait:lg:text-6xl landscape:text-4xl sm:landscape:text-5xl md:landscape:text-6xl font-light ${
            isUrgent ? "text-amber-400" : "text-white"
          }`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatCountdown(msUntil)}
        </p>
      ) : (
        <p className="text-xl text-amber-300/70">
          Azan at {timeStr}
        </p>
      )}

      {!isPassed && (
        <p className="text-xs portrait:text-sm text-white/40 mt-1">Azan at {timeStr}</p>
      )}
    </div>
  );
}
