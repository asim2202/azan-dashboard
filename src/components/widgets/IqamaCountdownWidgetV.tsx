"use client";

import type { WidgetProps } from "@/types/widget";
import type { PrayerName } from "@/types/prayer";

const AZAN_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function IqamaCountdownWidgetV({ currentTime, prayerData }: WidgetProps) {
  if (!prayerData) return <div className="h-full flex items-center justify-center"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  const now = currentTime.getTime();
  const nextIqama = prayerData.prayers
    .filter((p) => AZAN_PRAYERS.includes(p.name) && p.iqamaDate)
    .find((p) => p.iqamaDate!.getTime() > now);

  if (!nextIqama || !nextIqama.iqamaDate) {
    return <div className="h-full flex items-center justify-center"><p className="text-base" style={{ color: "var(--text-muted)" }}>No upcoming iqama</p></div>;
  }

  const ms = nextIqama.iqamaDate.getTime() - now;
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const isUrgent = ms > 0 && ms < 5 * 60 * 1000;

  return (
    <div className="h-full flex flex-col items-center justify-center select-none">
      <p className="text-lg mb-2" style={{ color: "var(--accent-text)" }}>Iqama for {nextIqama.label}</p>
      <p className={`text-6xl font-light ${isUrgent ? "animate-pulse" : ""}`}
        style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? "var(--accent)" : "var(--text-primary)" }}>
        {mins}:{secs.toString().padStart(2, "0")}
      </p>
      <p className="text-base mt-2" style={{ color: "var(--text-faint)" }}>
        {nextIqama.iqamaDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </p>
    </div>
  );
}
