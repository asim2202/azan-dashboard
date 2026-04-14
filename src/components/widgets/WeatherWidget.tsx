"use client";

import type { WidgetProps } from "@/types/widget";
import { WEATHER_ICONS } from "@/types/weather";

function Icon({ name }: { name: string }) {
  return <span>{WEATHER_ICONS[name] || "\u2601\uFE0F"}</span>;
}

export default function WeatherWidgetComponent({ size, weather, config }: WidgetProps) {
  if (!weather) {
    return <div className="h-full flex items-center justify-center"><p className="text-sm" style={{ color: "var(--text-faint)" }}>Weather unavailable</p></div>;
  }

  return (
    <div className="h-full flex flex-col select-none overflow-hidden">
      {/* Current conditions */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl"><Icon name={weather.icon} /></span>
        <div>
          <p className="text-2xl font-light" style={{ color: "var(--text-primary)" }}>{weather.temperature}&deg;C</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Feels {weather.apparentTemperature}&deg; &middot; {weather.description} &middot; {weather.humidity}%
          </p>
        </div>
      </div>

      {/* Hourly forecast */}
      {weather.hourly && weather.hourly.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>Hourly</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weather.hourly.slice(0, size === "S" ? 6 : 12).map((h, i) => (
              <div key={i} className="flex flex-col items-center min-w-[40px]">
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{h.time}</span>
                <span className="text-sm"><Icon name={h.icon} /></span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{h.temperature}&deg;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      {weather.daily && weather.daily.length > 0 && (
        <div className="flex-1 min-h-0">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>7-Day</p>
          <div className="space-y-0.5">
            {weather.daily.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-8" style={{ color: i === 0 ? "var(--accent-text)" : "var(--text-muted)" }}>{d.day}</span>
                <span className="text-sm"><Icon name={d.icon} /></span>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>{d.high}&deg;</span>
                <span style={{ color: "var(--text-faint)" }}>{d.low}&deg;</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
