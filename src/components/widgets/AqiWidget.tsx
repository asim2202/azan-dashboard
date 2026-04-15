"use client";

import type { WidgetProps } from "@/types/widget";

function getAqiEmoji(aqi: number): string {
  if (aqi <= 50) return "🟢";
  if (aqi <= 100) return "🟡";
  if (aqi <= 150) return "🟠";
  if (aqi <= 200) return "🔴";
  if (aqi <= 300) return "🟣";
  return "🟤";
}

export default function AqiWidget({ weather }: WidgetProps) {
  if (!weather?.airQuality) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>AQI unavailable</p>
      </div>
    );
  }

  const { aqi, pm25, pm10, label, color } = weather.airQuality;

  return (
    <div className="h-full flex flex-col select-none px-4">
      <p className="text-base uppercase tracking-wider font-semibold pt-1 text-center" style={{ color: "var(--text-secondary)" }}>Air Quality</p>
      <div className="flex-1 flex items-center justify-center gap-3">
      {/* Left: AQI value */}
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">{getAqiEmoji(aqi)}</span>
        <div className="flex flex-col">
          <span className="text-5xl font-light leading-none" style={{ color, fontVariantNumeric: "tabular-nums" }}>{aqi}</span>
          <span className="text-base font-semibold" style={{ color }}>{label}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch opacity-20 mx-2 my-2" style={{ background: "var(--text-faint)" }} />

      {/* Right: PM readings stacked */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>PM2.5</span>
          <span className="text-2xl font-semibold leading-none" style={{ color: "var(--text-primary)" }}>{pm25}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>PM10</span>
          <span className="text-2xl font-semibold leading-none" style={{ color: "var(--text-primary)" }}>{pm10}</span>
        </div>
      </div>
      </div>
    </div>
  );
}
