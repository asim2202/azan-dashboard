"use client";

import type { WidgetProps } from "@/types/widget";

const WEATHER_ICONS: Record<string, string> = {
  sun: "\u2600\uFE0F", "cloud-sun": "\u26C5", cloud: "\u2601\uFE0F",
  fog: "\uD83C\uDF2B\uFE0F", drizzle: "\uD83C\uDF26\uFE0F", rain: "\uD83C\uDF27\uFE0F",
  snow: "\u2744\uFE0F", storm: "\u26C8\uFE0F",
};

export default function WeatherWidgetComponent({ size, weather, config }: WidgetProps) {
  if (!weather) {
    return <div className="h-full flex items-center justify-center"><p className="text-sm" style={{ color: "var(--text-faint)" }}>Weather unavailable</p></div>;
  }

  const icon = WEATHER_ICONS[weather.icon] || "\u2601\uFE0F";

  if (size === "S") {
    return (
      <div className="h-full flex items-center justify-center gap-3 select-none">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-2xl font-light" style={{ color: "var(--text-primary)" }}>{weather.temperature}&deg;C</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{config.location.city}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center gap-4 select-none">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-3xl font-light" style={{ color: "var(--text-primary)" }}>{weather.temperature}&deg;C</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Feels like {weather.apparentTemperature}&deg;C &middot; {weather.description}
        </p>
        {size === "L" && (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {config.location.city} &middot; {weather.humidity}% humidity &middot; {weather.windSpeed} km/h wind
          </p>
        )}
        {size === "M" && (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>{config.location.city} &middot; {weather.humidity}% humidity</p>
        )}
      </div>
    </div>
  );
}
