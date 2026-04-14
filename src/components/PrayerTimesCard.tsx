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
      {/* Landscape / wide: horizontal grid */}
      <div className="hidden landscape:grid grid-cols-6 gap-2 sm:gap-4">
        {prayers.map((prayer) => {
          const status = getStatus(prayer, currentTime, nextPrayerName);
          const isNext = status === "next";
          const isPast = status === "past";

          return (
            <div
              key={prayer.name}
              className={`text-center p-3 sm:p-4 rounded-xl transition-all ${
                isNext
                  ? "bg-amber-500/15 ring-1 ring-amber-500/30"
                  : "bg-white/5"
              } ${isPast ? "opacity-40" : ""}`}
            >
              <p className={`text-xs sm:text-sm font-medium mb-1 ${isNext ? "text-amber-400" : "text-white/60"}`}>
                {prayer.label}
              </p>
              <p className="text-[10px] sm:text-xs text-white/30 mb-2">
                {prayer.arabicLabel}
              </p>
              <p
                className={`text-lg sm:text-xl md:text-2xl font-medium ${isNext ? "text-white" : "text-white/80"}`}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatTime(prayer.azanDate, timezone, format)}
              </p>
              {prayer.iqamaTime ? (
                <p
                  className={`text-xs sm:text-sm mt-1 ${isNext ? "text-amber-300/80" : "text-white/40"}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  Iqama: {prayer.iqamaDate ? formatTime(prayer.iqamaDate, timezone, format) : prayer.iqamaTime}
                </p>
              ) : (
                <p className="text-xs sm:text-sm mt-1 text-white/20">&mdash;</p>
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
              className={`flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl transition-all ${
                isNext
                  ? "bg-amber-500/15 ring-1 ring-amber-500/30"
                  : "bg-white/5"
              } ${isPast ? "opacity-40" : ""}`}
            >
              {/* Left: Prayer name */}
              <div className="min-w-[100px] sm:min-w-[140px]">
                <p className={`text-sm sm:text-base lg:text-lg font-medium leading-tight ${isNext ? "text-amber-400" : "text-white/70"}`}>
                  {prayer.label}
                  <span className="text-xs sm:text-sm text-white/30 ml-2">{prayer.arabicLabel}</span>
                </p>
              </div>

              {/* Center: Azan time */}
              <p
                className={`text-xl sm:text-2xl lg:text-3xl font-medium ${isNext ? "text-white" : "text-white/80"}`}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatTime(prayer.azanDate, timezone, format)}
              </p>

              {/* Right: Iqama time */}
              <div className="min-w-[100px] sm:min-w-[140px] text-right">
                {prayer.iqamaTime ? (
                  <p
                    className={`text-sm sm:text-base ${isNext ? "text-amber-300/80" : "text-white/40"}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    Iqama: {prayer.iqamaDate ? formatTime(prayer.iqamaDate, timezone, format) : prayer.iqamaTime}
                  </p>
                ) : (
                  <p className="text-sm text-white/20">&mdash;</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
