"use client";

import type { WidgetProps } from "@/types/widget";
import type { PrayerTime } from "@/types/prayer";
import NextPrayerWidgetH from "./NextPrayerWidgetH";
import NextPrayerWidgetV from "./NextPrayerWidgetV";

const AZAN_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

type Phase = "azan" | "iqama";

interface PhaseState {
  phase: Phase;
  prayer: PrayerTime;
  msUntil: number;
  progress: number;
}

function getCurrentPhase(
  prayers: PrayerTime[] | undefined,
  nextPrayer: PrayerTime | null,
  now: Date
): PhaseState | null {
  if (!prayers) return null;
  const azanPrayers = prayers.filter((p) => AZAN_PRAYERS.includes(p.name));

  for (const p of azanPrayers) {
    if (p.iqamaDate && now.getTime() >= p.azanDate.getTime() && now.getTime() < p.iqamaDate.getTime()) {
      const total = p.iqamaDate.getTime() - p.azanDate.getTime();
      const elapsed = now.getTime() - p.azanDate.getTime();
      const progress = total > 0 ? elapsed / total : 0;
      return { phase: "iqama", prayer: p, msUntil: p.iqamaDate.getTime() - now.getTime(), progress };
    }
  }

  if (nextPrayer) {
    let nextAzanTime = nextPrayer.azanDate.getTime();
    if (nextAzanTime <= now.getTime()) nextAzanTime += 24 * 60 * 60 * 1000;
    const msUntil = nextAzanTime - now.getTime();

    const idx = azanPrayers.findIndex((p) => p.name === nextPrayer.name);
    let prevEndTime: number;
    if (idx > 0) {
      prevEndTime = azanPrayers[idx - 1].iqamaDate
        ? azanPrayers[idx - 1].iqamaDate!.getTime()
        : azanPrayers[idx - 1].azanDate.getTime();
    } else {
      const isha = azanPrayers.find((p) => p.name === "isha");
      if (isha) {
        const ishaEnd = isha.iqamaDate ? isha.iqamaDate.getTime() : isha.azanDate.getTime();
        prevEndTime = ishaEnd > nextAzanTime ? ishaEnd - 24 * 60 * 60 * 1000 : ishaEnd;
      } else {
        prevEndTime = now.getTime();
      }
    }

    const total = nextAzanTime - prevEndTime;
    const elapsed = now.getTime() - prevEndTime;
    const progress = total > 0 ? Math.max(0, Math.min(1, elapsed / total)) : 0;

    return { phase: "azan", prayer: nextPrayer, msUntil, progress };
  }

  return null;
}

export default function NextPrayerWidget({ size, currentTime, timezone, config, prayerData, nextPrayer }: WidgetProps) {
  const state = getCurrentPhase(prayerData?.prayers, nextPrayer, currentTime);
  if (!state) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const { phase, prayer, msUntil, progress } = state;
  const isUrgent = msUntil > 0 && msUntil < 5 * 60 * 1000;
  const isIqama = phase === "iqama";

  const fmtOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit", minute: "2-digit", timeZone: timezone,
    hour12: config.display.timeFormat === "12h",
  };
  const azanTimeStr = prayer.azanDate.toLocaleTimeString("en-US", fmtOpts);
  const iqamaTimeStr = prayer.iqamaDate?.toLocaleTimeString("en-US", fmtOpts) || "";

  const label = isIqama ? `${prayer.label} Iqama` : prayer.label;
  const subtext = isIqama ? `Iqama at ${iqamaTimeStr}` : `Azan at ${azanTimeStr}`;
  const accentColor = isIqama ? "var(--status-green)" : "var(--accent)";
  const textColor = isIqama ? "var(--status-green)" : "var(--accent-text)";
  const barColor = isIqama ? "rgba(74, 222, 128, 0.8)" : "rgba(245, 158, 11, 0.7)";

  const viewProps = {
    label, subtext, countdown: formatCountdown(msUntil),
    progress, isUrgent, isIqama, accentColor, textColor, barColor,
  };
  return size === "H" ? <NextPrayerWidgetH {...viewProps} /> : <NextPrayerWidgetV {...viewProps} />;
}
