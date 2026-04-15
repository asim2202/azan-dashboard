"use client";

import type { WidgetProps } from "@/types/widget";
import type { PrayerTime, PrayerName } from "@/types/prayer";

function fmtTime(date: Date, tz: string, fmt: "12h" | "24h"): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz, hour12: fmt === "12h" });
}

function getStatus(p: PrayerTime, now: Date, nextName: PrayerName | null): "past" | "next" | "future" {
  if (p.name === nextName) return "next";
  if (now.getTime() > p.azanDate.getTime()) return "past";
  return "future";
}

export default function PrayerTimesWidget({ size, currentTime, timezone, config, prayerData, nextPrayer }: WidgetProps) {
  if (!prayerData) return <div className="h-full flex items-center justify-center"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  const prayers = prayerData.prayers;
  const fmt = config.display.timeFormat;
  const nextName = nextPrayer?.name || null;

  if (size === "H") {
    // Horizontal (landscape): full card rows with arabic labels
    return (
      <div className="flex flex-col gap-2 h-full">
        {prayers.map((p) => {
          const status = getStatus(p, currentTime, nextName);
          const isNext = status === "next";
          return (
            <div key={p.name} className={`flex-1 flex items-center justify-between px-6 rounded-xl ${status === "past" ? "opacity-40" : ""} ${isNext ? "prayer-glow" : ""}`}
              style={{ background: isNext ? "var(--accent-light)" : "var(--card-bg-hover, var(--card-bg))" }}>
              <div className="min-w-[150px]">
                <span className="text-lg font-semibold" style={{ color: isNext ? "var(--accent-text)" : "var(--text-primary)" }}>{p.label}</span>
                <span className="text-base ml-2" style={{ color: "var(--text-muted)" }}>{p.arabicLabel}</span>
              </div>
              <span className="text-3xl font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                {fmtTime(p.azanDate, timezone, fmt)}
              </span>
              <span className="text-base font-medium min-w-[160px] text-right" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--accent-text)" : "var(--text-secondary)" }}>
                {p.iqamaDate ? `Iqama ${fmtTime(p.iqamaDate, timezone, fmt)}` : "\u2014"}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical (portrait): larger text for readability
  return (
    <div className="flex flex-col gap-2 h-full">
      {prayers.map((p) => {
        const status = getStatus(p, currentTime, nextName);
        const isNext = status === "next";
        return (
          <div key={p.name} className={`flex-1 flex items-center justify-between px-5 rounded-xl ${status === "past" ? "opacity-40" : ""} ${isNext ? "prayer-glow" : ""}`}
            style={{ background: isNext ? "var(--accent-light)" : "var(--card-bg-hover, var(--card-bg))" }}>
            <div className="min-w-[200px]">
              <span className="text-2xl font-semibold" style={{ color: isNext ? "var(--accent-text)" : "var(--text-primary)" }}>{p.label}</span>
              <span className="text-2xl ml-2 font-arabic" style={{ color: "var(--text-muted)" }}>{p.arabicLabel}</span>
            </div>
            <span className="text-4xl font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
              {fmtTime(p.azanDate, timezone, fmt)}
            </span>
            <span className="text-xl font-semibold min-w-[190px] text-right" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--accent-text)" : "var(--text-secondary)" }}>
              {p.iqamaDate ? `Iqama ${fmtTime(p.iqamaDate, timezone, fmt)}` : "\u2014"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
