"use client";

import type { PrayerTime } from "@/types/prayer";

interface Props {
  prayers: PrayerTime[];
  nextName: string | null;
  now: Date;
  timezone: string;
  timeFormat: "12h" | "24h";
}

function fmtTime(date: Date, tz: string, fmt: "12h" | "24h"): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: tz, hour12: fmt === "12h",
  });
}

export default function PrayerTimesWidgetH({ prayers, nextName, now, timezone, timeFormat }: Props) {
  return (
    <div className="flex flex-col gap-2 h-full">
      {prayers.map((p) => {
        const isPast = now.getTime() > p.azanDate.getTime() && p.name !== nextName;
        const isNext = p.name === nextName;
        return (
          <div
            key={p.name}
            className={`flex-1 flex items-center justify-between px-6 rounded-xl ${isPast ? "opacity-40" : ""} ${isNext ? "prayer-glow" : ""}`}
            style={{ background: isNext ? "var(--accent-light)" : "var(--card-bg-hover, var(--card-bg))" }}
          >
            <div className="min-w-[150px]">
              <span className="text-lg font-semibold" style={{ color: isNext ? "var(--accent-text)" : "var(--text-primary)" }}>{p.label}</span>
              <span className="text-base ml-2" style={{ color: "var(--text-muted)" }}>{p.arabicLabel}</span>
            </div>
            <span className="text-3xl font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
              {fmtTime(p.azanDate, timezone, timeFormat)}
            </span>
            <span className="text-base font-medium min-w-[160px] text-right" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--accent-text)" : "var(--text-secondary)" }}>
              {p.iqamaDate ? `Iqama ${fmtTime(p.iqamaDate, timezone, timeFormat)}` : "\u2014"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
