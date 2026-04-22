"use client";

import type { WidgetProps } from "@/types/widget";
import { WEATHER_ICONS } from "@/types/weather";

const ICON_ANIM: Record<string, string> = {
  sun: "icon-spin",
  "cloud-sun": "icon-float",
  cloud: "icon-float",
  fog: "icon-pulse",
  drizzle: "icon-bounce",
  rain: "icon-bounce",
  snow: "icon-float",
  storm: "icon-flash",
};

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  const anim = ICON_ANIM[name] || "";
  return <span className={`inline-block ${anim} ${className}`}>{WEATHER_ICONS[name] || "\u2601\uFE0F"}</span>;
}

export function AqiBadge({ weather }: { weather: NonNullable<WidgetProps["weather"]> }) {
  if (!weather.airQuality) return null;
  const { aqi, label, color } = weather.airQuality;
  return (
    <div className="flex flex-col items-center mt-1">
      <div className="flex items-center gap-1.5">
        <span className="block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-base font-semibold" style={{ color }}>AQI {aqi}</span>
      </div>
      <span className="text-base font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
