"use client";

import type { WidgetProps } from "@/types/widget";
import type { PrayerName } from "@/types/prayer";

const AZAN_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function IqamaCountdownWidget({ size, currentTime, prayerData }: WidgetProps) {
  if (!prayerData) return <div className="h-full flex items-center justify-center"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  // Find the next upcoming iqama
  const now = currentTime.getTime();
  const nextIqama = prayerData.prayers
    .filter((p) => AZAN_PRAYERS.includes(p.name) && p.iqamaDate)
    .find((p) => p.iqamaDate!.getTime() > now);

  if (!nextIqama || !nextIqama.iqamaDate) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No upcoming iqama</p>
      </div>
    );
  }

  const ms = nextIqama.iqamaDate.getTime() - now;
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const isUrgent = ms > 0 && ms < 5 * 60 * 1000;

  if (size === "H") {
    return (
      <div className="h-full flex flex-col items-center justify-center select-none">
        <p className="text-xs" style={{ color: "var(--accent-text)" }}>Iqama {nextIqama.label}</p>
        <p className="text-2xl font-light" style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? "var(--accent)" : "var(--text-primary)" }}>
          {mins}:{secs.toString().padStart(2, "0")}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center select-none">
      <p className="text-sm mb-1" style={{ color: "var(--accent-text)" }}>Iqama for {nextIqama.label}</p>
      <p className={`text-4xl font-light ${isUrgent ? "animate-pulse" : ""}`}
        style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? "var(--accent)" : "var(--text-primary)" }}>
        {mins}:{secs.toString().padStart(2, "0")}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
        {nextIqama.iqamaDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </p>
    </div>
  );
}
