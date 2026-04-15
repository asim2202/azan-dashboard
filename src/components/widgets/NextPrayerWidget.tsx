"use client";

import type { WidgetProps } from "@/types/widget";
import type { PrayerTime } from "@/types/prayer";

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
  progress: number; // 0–1, how far through the current phase
}

function getCurrentPhase(
  prayers: PrayerTime[] | undefined,
  nextPrayer: PrayerTime | null,
  now: Date
): PhaseState | null {
  if (!prayers) return null;

  const azanPrayers = prayers.filter(p => AZAN_PRAYERS.includes(p.name));

  // Check if any prayer is in iqama phase (azan passed, iqama not yet)
  for (const p of azanPrayers) {
    if (p.iqamaDate && now.getTime() >= p.azanDate.getTime() && now.getTime() < p.iqamaDate.getTime()) {
      const total = p.iqamaDate.getTime() - p.azanDate.getTime();
      const elapsed = now.getTime() - p.azanDate.getTime();
      const progress = total > 0 ? elapsed / total : 0;
      return { phase: "iqama", prayer: p, msUntil: p.iqamaDate.getTime() - now.getTime(), progress };
    }
  }

  // Otherwise show countdown to next azan
  if (nextPrayer) {
    let nextAzanTime = nextPrayer.azanDate.getTime();

    // If the next prayer's azan is in the past, it means all today's prayers
    // have passed and this is tomorrow's first prayer — add 24 hours
    if (nextAzanTime <= now.getTime()) {
      nextAzanTime += 24 * 60 * 60 * 1000;
    }

    const msUntil = nextAzanTime - now.getTime();

    // Find the previous prayer to calculate inter-prayer progress
    const idx = azanPrayers.findIndex(p => p.name === nextPrayer.name);
    let prevEndTime: number;
    if (idx > 0) {
      // Normal case: previous prayer is the one before in today's list
      prevEndTime = azanPrayers[idx - 1].iqamaDate
        ? azanPrayers[idx - 1].iqamaDate!.getTime()
        : azanPrayers[idx - 1].azanDate.getTime();
    } else {
      // Fajr — previous is Isha (today's if waiting for tomorrow's Fajr, yesterday's otherwise)
      const isha = azanPrayers.find(p => p.name === "isha");
      if (isha) {
        const ishaEnd = isha.iqamaDate ? isha.iqamaDate.getTime() : isha.azanDate.getTime();
        // If Fajr was shifted to tomorrow, use today's Isha as-is
        // If Fajr is today (before Fajr time), use yesterday's Isha
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

/* ── Progress Bar Component ── */
function ProgressBar({ progress, color, urgent }: { progress: number; color: string; urgent: boolean }) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{
        height: "6px",
        background: "rgba(255,255,255,0.1)",
        maxWidth: "280px",
        margin: "0 auto",
      }}
    >
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgent ? "animate-pulse" : ""}`}
        style={{
          width: `${Math.min(100, progress * 100)}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  );
}

export default function NextPrayerWidget({ size, currentTime, timezone, config, prayerData, nextPrayer }: WidgetProps) {
  const state = getCurrentPhase(prayerData?.prayers, nextPrayer, currentTime);

  if (!state) {
    return <div className="h-full flex items-center justify-center"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;
  }

  const { phase, prayer, msUntil, progress } = state;
  const isUrgent = msUntil > 0 && msUntil < 5 * 60 * 1000;
  const isIqama = phase === "iqama";

  const fmtOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZone: timezone, hour12: config.display.timeFormat === "12h" };
  const azanTimeStr = prayer.azanDate.toLocaleTimeString("en-US", fmtOpts);
  const iqamaTimeStr = prayer.iqamaDate?.toLocaleTimeString("en-US", fmtOpts) || "";

  const label = isIqama ? `${prayer.label} Iqama` : prayer.label;
  const subtext = isIqama ? `Iqama at ${iqamaTimeStr}` : `Azan at ${azanTimeStr}`;
  const accentColor = isIqama ? "var(--status-green)" : "var(--accent)";
  const textColor = isIqama ? "var(--status-green)" : "var(--accent-text)";
  const barColor = isIqama ? "rgba(74, 222, 128, 0.8)" : "rgba(245, 158, 11, 0.7)";

  if (size === "H") {
    // Horizontal (landscape)
    return (
      <div className="text-center h-full flex flex-col justify-center select-none">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span style={{ color: accentColor }}>{isIqama ? "\u{1F54C}" : "\u2626"}</span>
          <h2 className={`text-xl sm:text-2xl font-semibold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: textColor }}>
            {label}
          </h2>
        </div>
        <p className={`text-4xl sm:text-5xl font-light`}
          style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? accentColor : "var(--text-primary)" }}>
          {formatCountdown(msUntil)}
        </p>
        <div className="mt-2 px-4">
          <ProgressBar progress={progress} color={barColor} urgent={isUrgent} />
        </div>
        <p className="text-base font-medium mt-1" style={{ color: "var(--text-secondary)" }}>{subtext}</p>
      </div>
    );
  }

  // Vertical (portrait): larger text for readability
  return (
    <div className="text-center h-full flex flex-col justify-center select-none">
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-xl" style={{ color: accentColor }}>{isIqama ? "\u{1F54C}" : "\u2626"}</span>
        <h2 className={`text-3xl font-semibold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: textColor }}>
          {label}
        </h2>
      </div>
      <p className="text-6xl font-light"
        style={{ fontVariantNumeric: "tabular-nums", color: isUrgent ? accentColor : "var(--text-primary)" }}>
        {formatCountdown(msUntil)}
      </p>
      <div className="mt-2 px-4">
        <ProgressBar progress={progress} color={barColor} urgent={isUrgent} />
      </div>
      <p className="text-lg font-medium mt-1" style={{ color: "var(--text-secondary)" }}>{subtext}</p>
    </div>
  );
}
