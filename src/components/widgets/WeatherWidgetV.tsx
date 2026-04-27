"use client";

import type { WidgetProps } from "@/types/widget";
import { Icon } from "./weather-shared";

type Weather = NonNullable<WidgetProps["weather"]>;

function CurrentPanel({ weather }: { weather: Weather }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 px-2">
      <span className="text-7xl leading-none"><Icon name={weather.icon} /></span>
      <span className="text-5xl font-light leading-none" style={{ color: "var(--text-primary)" }}>{weather.temperature}&deg;</span>
      <span className="text-xl text-center font-semibold" style={{ color: "var(--text-primary)" }}>{weather.description}</span>
      <div className="flex flex-col items-center gap-1.5 mt-1 text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
        <span>Feels {weather.apparentTemperature}&deg;</span>
        <span>Humidity {weather.humidity}%</span>
        <span>Wind {weather.windSpeed} km/h</span>
        <span>Rain {weather.precipitationChance}%</span>
      </div>
    </div>
  );
}

function HourlyRow({ weather, count = 7 }: { weather: Weather; count?: number }) {
  if (!weather.hourly?.length) return null;
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <p className="text-base uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Hourly</p>
      <div className="flex-1 flex gap-1.5 min-h-0">
        {weather.hourly.slice(0, count).map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1 rounded-lg min-h-0 py-1"
            style={{ background: "var(--card-bg-hover, var(--card-bg))" }}>
            <span className="text-base font-semibold" style={{ color: "var(--text-secondary)" }}>{h.time}</span>
            <span className="text-5xl leading-none"><Icon name={h.icon} /></span>
            <span className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>{h.temperature}&deg;</span>
            {h.precipitationChance > 0 && (
              <span className="text-base font-semibold leading-none" style={{ color: "var(--status-amber)" }}>{h.precipitationChance}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyRow({ weather }: { weather: Weather }) {
  if (!weather.daily?.length) return null;
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <p className="text-base uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>7-Day</p>
      <div className="flex-1 flex gap-1.5 min-h-0">
        {weather.daily.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1 rounded-lg min-h-0 py-1"
            style={{ background: "var(--card-bg-hover, var(--card-bg))" }}>
            <span className="text-base font-bold leading-none" style={{ color: i === 0 ? "var(--accent-text)" : "var(--text-secondary)" }}>{d.day}</span>
            <span className="text-5xl leading-none"><Icon name={d.icon} /></span>
            <div className="flex items-baseline gap-0.5 leading-none">
              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{d.high}&deg;</span>
              <span className="text-base font-medium" style={{ color: "var(--text-muted)" }}>/</span>
              <span className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>{d.low}&deg;</span>
            </div>
            {d.precipitationChance > 0 && (
              <span className="text-base font-semibold leading-none" style={{ color: "var(--status-amber)" }}>{d.precipitationChance}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeatherWidgetV({ weather }: { weather: Weather }) {
  return (
    <div className="h-full flex gap-4 select-none overflow-hidden">
      <div className="shrink-0" style={{ width: "160px" }}>
        <CurrentPanel weather={weather} />
      </div>
      <div className="w-px self-stretch opacity-20" style={{ background: "var(--text-faint)" }} />
      <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0">
        <HourlyRow weather={weather} />
        <DailyRow weather={weather} />
      </div>
    </div>
  );
}
