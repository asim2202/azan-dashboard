"use client";

import type { WidgetProps } from "@/types/widget";
import type { PrayerTime, PrayerName } from "@/types/prayer";

const AZAN_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

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

  // Small: compact rows, no iqama
  if (size === "S") {
    return (
      <div className="flex flex-col gap-0.5 h-full justify-center">
        {prayers.map((p) => {
          const status = getStatus(p, currentTime, nextName);
          const isNext = status === "next";
          return (
            <div key={p.name} className={`flex justify-between px-2 py-0.5 rounded ${status === "past" ? "opacity-40" : ""}`}
              style={{ background: isNext ? "var(--accent-light)" : "transparent" }}>
              <span className="text-xs" style={{ color: isNext ? "var(--accent-text)" : "var(--text-muted)" }}>{p.label}</span>
              <span className="text-xs font-medium" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {fmtTime(p.azanDate, timezone, fmt)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Medium: rows with iqama
  if (size === "M") {
    return (
      <div className="flex flex-col gap-1 h-full justify-center">
        {prayers.map((p) => {
          const status = getStatus(p, currentTime, nextName);
          const isNext = status === "next";
          return (
            <div key={p.name} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${status === "past" ? "opacity-40" : ""}`}
              style={{ background: isNext ? "var(--accent-light)" : "transparent", boxShadow: isNext ? "inset 0 0 0 1px var(--ring-accent)" : "none" }}>
              <span className="text-sm min-w-[70px]" style={{ color: isNext ? "var(--accent-text)" : "var(--text-muted)" }}>{p.label}</span>
              <span className="text-base font-medium" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {fmtTime(p.azanDate, timezone, fmt)}
              </span>
              <span className="text-xs min-w-[90px] text-right" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--accent-muted)" : "var(--text-faint)" }}>
                {p.iqamaDate ? `Iqama: ${fmtTime(p.iqamaDate, timezone, fmt)}` : "\u2014"}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Large: full cards with arabic
  return (
    <div className="flex flex-col gap-1.5 h-full justify-center">
      {prayers.map((p) => {
        const status = getStatus(p, currentTime, nextName);
        const isNext = status === "next";
        return (
          <div key={p.name} className={`flex items-center justify-between px-4 py-2 rounded-xl ${status === "past" ? "opacity-40" : ""}`}
            style={{ background: isNext ? "var(--accent-light)" : "var(--card-bg-hover, var(--card-bg))", boxShadow: isNext ? "inset 0 0 0 1px var(--ring-accent)" : "none" }}>
            <div className="min-w-[110px]">
              <span className="text-sm font-medium" style={{ color: isNext ? "var(--accent-text)" : "var(--text-secondary)" }}>{p.label}</span>
              <span className="text-xs ml-2" style={{ color: "var(--text-faint)" }}>{p.arabicLabel}</span>
            </div>
            <span className="text-xl font-medium" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--text-primary)" : "var(--text-secondary)" }}>
              {fmtTime(p.azanDate, timezone, fmt)}
            </span>
            <span className="text-sm min-w-[110px] text-right" style={{ fontVariantNumeric: "tabular-nums", color: isNext ? "var(--accent-muted)" : "var(--text-muted)" }}>
              {p.iqamaDate ? `Iqama: ${fmtTime(p.iqamaDate, timezone, fmt)}` : "\u2014"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
