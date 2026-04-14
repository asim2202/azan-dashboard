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
  // Find next prayer
  const azanPrayers = prayers.filter((p) => AZAN_PRAYERS.includes(p.name));
  const nextPrayer = azanPrayers.find(
    (p) => p.azanDate.getTime() > currentTime.getTime()
  );
  const nextPrayerName = nextPrayer?.name || null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-6 gap-2 sm:gap-4">
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
              {/* Prayer Name */}
              <p
                className={`text-xs sm:text-sm font-medium mb-1 ${
                  isNext ? "text-amber-400" : "text-white/60"
                }`}
              >
                {prayer.label}
              </p>
              <p className="text-[10px] sm:text-xs text-white/30 mb-2 font-arabic">
                {prayer.arabicLabel}
              </p>

              {/* Azan Time */}
              <p
                className={`text-lg sm:text-xl md:text-2xl font-medium ${
                  isNext ? "text-white" : "text-white/80"
                }`}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatTime(prayer.azanDate, timezone, format)}
              </p>

              {/* Iqama Time */}
              {prayer.iqamaTime ? (
                <p
                  className={`text-xs sm:text-sm mt-1 ${
                    isNext ? "text-amber-300/80" : "text-white/40"
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  Iqama: {prayer.iqamaDate
                    ? formatTime(prayer.iqamaDate, timezone, format)
                    : prayer.iqamaTime}
                </p>
              ) : (
                <p className="text-xs sm:text-sm mt-1 text-white/20">&mdash;</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
