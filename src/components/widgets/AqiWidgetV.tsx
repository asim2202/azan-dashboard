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

export default function AqiWidgetV({ weather }: WidgetProps) {
  if (!weather?.airQuality) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-base" style={{ color: "var(--text-muted)" }}>AQI unavailable</p>
      </div>
    );
  }

  const { aqi, pm25, pm10, label, color } = weather.airQuality;

  return (
    <div className="h-full flex flex-col select-none px-4">
      <p className="text-lg uppercase tracking-wider font-semibold pt-1 text-center" style={{ color: "var(--text-secondary)" }}>Air Quality</p>
      <div className="flex-1 flex items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getAqiEmoji(aqi)}</span>
          <div className="flex flex-col">
            <span className="text-6xl font-light leading-none" style={{ color, fontVariantNumeric: "tabular-nums" }}>{aqi}</span>
            <span className="text-lg font-semibold" style={{ color }}>{label}</span>
          </div>
        </div>
        <div className="w-px self-stretch opacity-20 mx-3 my-3" style={{ background: "var(--text-faint)" }} />
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium" style={{ color: "var(--text-muted)" }}>PM2.5</span>
            <span className="text-3xl font-semibold leading-none" style={{ color: "var(--text-primary)" }}>{pm25}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium" style={{ color: "var(--text-muted)" }}>PM10</span>
            <span className="text-3xl font-semibold leading-none" style={{ color: "var(--text-primary)" }}>{pm10}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
