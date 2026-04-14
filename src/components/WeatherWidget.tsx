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
      <div className="text-right text-white/30 text-sm">
        Weather unavailable
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 justify-end select-none">
      <div className="text-right">
        <p className="text-3xl sm:text-4xl font-light text-white">
          {weather.temperature}&deg;C
        </p>
        <p className="text-sm text-white/50">
          Feels like {weather.apparentTemperature}&deg;C
        </p>
        <p className="text-xs text-white/40 mt-1">
          {weather.description} &middot; {weather.humidity}% humidity
        </p>
        <p className="text-xs text-white/30">{city}</p>
      </div>
      <WeatherIcon icon={weather.icon} />
    </div>
  );
}
