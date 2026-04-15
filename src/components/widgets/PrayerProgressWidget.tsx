"use client";

import type { WidgetProps } from "@/types/widget";
import type { PrayerName } from "@/types/prayer";

const AZAN_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function PrayerProgressWidget({ size, currentTime, prayerData }: WidgetProps) {
  if (!prayerData) return <div className="h-full flex items-center justify-center"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  const now = currentTime.getTime();
  const prayers = prayerData.prayers.filter((p) => AZAN_PRAYERS.includes(p.name));

  // Find current and next prayer
  let currentPrayerIdx = -1;
  for (let i = prayers.length - 1; i >= 0; i--) {
    if (now >= prayers[i].azanDate.getTime()) {
      currentPrayerIdx = i;
      break;
    }
  }

  const currentP = currentPrayerIdx >= 0 ? prayers[currentPrayerIdx] : null;
  const nextP = currentPrayerIdx < prayers.length - 1 ? prayers[currentPrayerIdx + 1] : null;

  let progress = 0;
  if (currentP && nextP) {
    const total = nextP.azanDate.getTime() - currentP.azanDate.getTime();
    const elapsed = now - currentP.azanDate.getTime();
    progress = Math.min(1, Math.max(0, elapsed / total));
  }

  if (size === "H") {
    return (
      <div className="h-full flex flex-col justify-center px-2 select-none">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: "var(--text-muted)" }}>{currentP?.label || "..."}</span>
          <span style={{ color: "var(--accent-text)" }}>{nextP?.label || "..."}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--card-bg-hover, rgba(255,255,255,0.1))" }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%`, background: "var(--accent)" }} />
        </div>
      </div>
    );
  }

  // Medium: bar with all prayer markers
  return (
    <div className="h-full flex flex-col justify-center px-2 select-none">
      <div className="flex justify-between text-xs mb-2">
        <span style={{ color: "var(--text-muted)" }}>{currentP?.label || "..."}</span>
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {Math.round(progress * 100)}%
        </span>
        <span style={{ color: "var(--accent-text)" }}>{nextP?.label || "..."}</span>
      </div>
      <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--card-bg-hover, rgba(255,255,255,0.1))" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%`, background: "var(--accent)" }} />
      </div>
      {/* Prayer markers */}
      <div className="relative w-full mt-2 flex justify-between">
        {prayers.map((p, i) => {
          const isPast = now > p.azanDate.getTime();
          const isCurrent = i === currentPrayerIdx;
          return (
            <div key={p.name} className="text-center">
              <div className="w-2 h-2 rounded-full mx-auto mb-0.5" style={{
                background: isCurrent ? "var(--accent)" : isPast ? "var(--text-faint)" : "var(--text-muted)",
              }} />
              <span className="text-[10px]" style={{ color: isCurrent ? "var(--accent-text)" : "var(--text-faint)" }}>
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
