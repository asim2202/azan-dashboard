"use client";

import type { WeatherData } from "@/types/weather";

interface WeatherWidgetProps {
  weather: WeatherData | null;
  error: string | null;
  city: string;
}

function WeatherIcon({ icon }: { icon: string }) {
  const icons: Record<string, string> = {
    sun: "\u2600\uFE0F",
    "cloud-sun": "\u26C5",
    cloud: "\u2601\uFE0F",
    fog: "\uD83C\uDF2B\uFE0F",
    drizzle: "\uD83C\uDF26\uFE0F",
    rain: "\uD83C\uDF27\uFE0F",
    snow: "\u2744\uFE0F",
    storm: "\u26C8\uFE0F",
  };
  return <span className="text-3xl">{icons[icon] || "\u2601\uFE0F"}</span>;
}

export default function WeatherWidget({ weather, error, city }: WeatherWidgetProps) {
  if (error || !weather) {
    return (
      <div className="text-right text-sm" style={{ color: "var(--text-faint)" }}>
        Weather unavailable
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 portrait:justify-center landscape:justify-end select-none">
      <div className="portrait:text-center landscape:text-right">
        <p className="text-2xl portrait:text-2xl landscape:text-3xl sm:landscape:text-4xl font-light" style={{ color: "var(--text-primary)" }}>
          {weather.temperature}&deg;C
        </p>
        <p className="text-xs landscape:text-sm" style={{ color: "var(--text-muted)" }}>
          Feels like {weather.apparentTemperature}&deg;C &middot; {weather.description}
        </p>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{city} &middot; {weather.humidity}% humidity</p>
      </div>
      <WeatherIcon icon={weather.icon} />
    </div>
  );
}
