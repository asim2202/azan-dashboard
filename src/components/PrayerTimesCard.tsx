"use client";

import type { PrayerTime, PrayerName } from "@/types/prayer";

interface PrayerTimesCardProps {
  prayers: PrayerTime[];
  currentTime: Date;
  timezone: string;
  format: "12h" | "24h";
}

const AZAN_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function formatTime(date: Date, timezone: string, format: "12h" | "24h"): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: format === "12h",
  });
}

function getStatus(prayer: PrayerTime, currentTime: Date, nextPrayerName: PrayerName | null): "past" | "next" | "future" {
  if (prayer.name === nextPrayerName) return "next";
  if (currentTime.getTime() > prayer.azanDate.getTime()) return "past";
  return "future";
}

export default function PrayerTimesCard({
  prayers,
  currentTime,
  timezone,
  format,
}: PrayerTimesCardProps) {
  const azanPrayers = prayers.filter((p) => AZAN_PRAYERS.includes(p.name));
  const nextPrayer = azanPrayers.find(
    (p) => p.azanDate.getTime() > currentTime.getTime()
  );
  const nextPrayerName = nextPrayer?.name || null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Landscape: horizontal grid */}
      <div className="hidden landscape:grid grid-cols-6 gap-2 sm:gap-4">
        {prayers.map((prayer) => {
          const status = getStatus(prayer, currentTime, nextPrayerName);
          const isNext = status === "next";
          const isPast = status === "past";

          return (
            <div
              key={prayer.name}
              className={`text-center p-3 sm:p-4 rounded-xl transition-all ${isPast ? "opacity-40" : ""}`}
              style={{
                background: isNext ? "var(--accent-light)" : "var(--card-bg)",
                boxShadow: isNext ? `inset 0 0 0 1px var(--ring-accent)` : "none",
              }}
            >
              <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: isNext ? "var(--accent-text)" : "var(--text-muted)" }}>
                {prayer.label}
              </p>
              <p className="text-[10px] sm:text-xs mb-2" style={{ color: "var(--text-faint)" }}>
                {prayer.arabicLabel}
              </p>
              <p
                className="text-lg sm:text-xl md:text-2xl font-medium"
                style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {formatTime(prayer.azanDate, timezone, format)}
              </p>
              {prayer.iqamaTime ? (
                <p
                  className="text-xs sm:text-sm mt-1"
                  style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--accent-muted)" : "var(--text-muted)" }}
                >
                  Iqama: {prayer.iqamaDate ? formatTime(prayer.iqamaDate, timezone, format) : prayer.iqamaTime}
                </p>
              ) : (
                <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-faint)" }}>&mdash;</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Portrait: vertical list */}
      <div className="landscape:hidden flex flex-col gap-1 sm:gap-2 lg:gap-3">
        {prayers.map((prayer) => {
          const status = getStatus(prayer, currentTime, nextPrayerName);
          const isNext = status === "next";
          const isPast = status === "past";

          return (
            <div
              key={prayer.name}
              className={`flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl transition-all ${isPast ? "opacity-40" : ""}`}
              style={{
                background: isNext ? "var(--accent-light)" : "var(--card-bg)",
                boxShadow: isNext ? `inset 0 0 0 1px var(--ring-accent)` : "none",
              }}
            >
              <div className="min-w-[100px] sm:min-w-[140px]">
                <p className="text-sm sm:text-base lg:text-lg font-medium leading-tight" style={{ color: isNext ? "var(--accent-text)" : "var(--text-secondary)" }}>
                  {prayer.label}
                  <span className="text-xs sm:text-sm ml-2" style={{ color: "var(--text-faint)" }}>{prayer.arabicLabel}</span>
                </p>
              </div>
              <p
                className="text-xl sm:text-2xl lg:text-3xl font-medium"
                style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {formatTime(prayer.azanDate, timezone, format)}
              </p>
              <div className="min-w-[100px] sm:min-w-[140px] text-right">
                {prayer.iqamaTime ? (
                  <p
                    className="text-sm sm:text-base"
                    style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--accent-muted)" : "var(--text-muted)" }}
                  >
                    Iqama: {prayer.iqamaDate ? formatTime(prayer.iqamaDate, timezone, format) : prayer.iqamaTime}
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-faint)" }}>&mdash;</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
