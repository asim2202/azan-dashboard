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
    <div className="text-center py-4 sm:py-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-amber-400 text-xl">&#9774;</span>
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide ${
            isUrgent ? "text-amber-400 animate-pulse" : "text-amber-300"
          }`}
        >
          {prayer.label}
        </h2>
      </div>

      {!isPassed ? (
        <p
          className={`text-4xl sm:text-5xl md:text-6xl font-light ${
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
        <p className="text-sm text-white/40 mt-1">Azan at {timeStr}</p>
      )}
    </div>
  );
}
