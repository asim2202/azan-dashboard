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

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const anim = ICON_ANIM[name] || "";
  return <span className={`inline-block ${anim} ${className}`}>{WEATHER_ICONS[name] || "\u2601\uFE0F"}</span>;
}

/* ── AQI Badge ── */
function AqiBadge({ weather }: { weather: NonNullable<WidgetProps["weather"]> }) {
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

/* ── Current conditions: vertical full-height panel ── */
function CurrentWeatherPanel({ weather, compact = false, hideAqi = false }: { weather: NonNullable<WidgetProps["weather"]>; compact?: boolean; hideAqi?: boolean }) {
  if (compact) {
    // H (landscape): tighter text to fit 160px panel
    return (
      <div className="h-full flex flex-col items-center justify-center gap-1 px-1">
        <span className="text-5xl leading-none"><Icon name={weather.icon} /></span>
        <span className="text-4xl font-light leading-none" style={{ color: "var(--text-primary)" }}>{weather.temperature}&deg;</span>
        <span className="text-base text-center font-semibold" style={{ color: "var(--text-primary)" }}>{weather.description}</span>
        <div className="flex flex-col items-center gap-0.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          <span>Feels {weather.apparentTemperature}&deg;</span>
          <span>Wind {weather.windSpeed} km/h</span>
          <span>Rain {weather.precipitationChance}%</span>
        </div>
        {weather.airQuality && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="block w-2 h-2 rounded-full flex-shrink-0" style={{ background: weather.airQuality.color }} />
            <span className="text-sm font-semibold" style={{ color: weather.airQuality.color }}>AQI {weather.airQuality.aqi}</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{weather.airQuality.label}</span>
          </div>
        )}
      </div>
    );
  }

  // V (portrait): larger text
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 px-2">
      <span className="text-7xl leading-none"><Icon name={weather.icon} /></span>
      <span className="text-5xl font-light leading-none" style={{ color: "var(--text-primary)" }}>{weather.temperature}&deg;</span>
      <span className="text-xl text-center font-semibold" style={{ color: "var(--text-primary)" }}>{weather.description}</span>
      <div className="flex flex-col items-center gap-1.5 mt-1 text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
        <span>Feels {weather.apparentTemperature}&deg;</span>
        <span>Wind {weather.windSpeed} km/h</span>
        <span>Rain {weather.precipitationChance}%</span>
      </div>
      {!hideAqi && <AqiBadge weather={weather} />}
    </div>
  );
}

/* ── Current conditions: inline row (for portrait/small) ── */
function CurrentWeatherRow({ weather }: { weather: NonNullable<WidgetProps["weather"]> }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-5xl leading-none"><Icon name={weather.icon} /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-light leading-none" style={{ color: "var(--text-primary)" }}>{weather.temperature}&deg;</span>
          <span className="text-base" style={{ color: "var(--text-muted)" }}>{weather.description}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>Feels {weather.apparentTemperature}&deg;</span>
          <span>&middot;</span>
          <span>Wind {weather.windSpeed} km/h</span>
          <span>&middot;</span>
          <span>Rain {weather.precipitationChance}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Hourly cards ── */
function HourlyCards({ weather, count = 7, compact = false }: { weather: NonNullable<WidgetProps["weather"]>; count?: number; compact?: boolean }) {
  if (!weather.hourly?.length) return null;
  const iconSize = compact ? "text-3xl" : "text-5xl";
  const timeSize = compact ? "text-sm" : "text-base";
  const tempSize = compact ? "text-base" : "text-lg";
  const labelSize = compact ? "text-sm" : "text-base";
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <p className={`${labelSize} uppercase tracking-wider font-semibold mb-1.5`} style={{ color: "var(--text-secondary)" }}>Hourly</p>
      <div className="flex-1 flex gap-1.5 min-h-0">
        {weather.hourly.slice(0, count).map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1 rounded-lg min-h-0 py-1"
            style={{ background: "var(--card-bg-hover, var(--card-bg))" }}>
            <span className={`${timeSize} font-semibold`} style={{ color: "var(--text-secondary)" }}>{h.time}</span>
            <span className={iconSize}><Icon name={h.icon} /></span>
            <span className={`${tempSize} font-bold`} style={{ color: "var(--text-primary)" }}>{h.temperature}&deg;</span>
            {h.precipitationChance > 0 && (
              <span className={`${labelSize} font-semibold`} style={{ color: "var(--status-amber)" }}>{h.precipitationChance}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Daily: horizontal cards ── */
function DailyCardsHorizontal({ weather, compact = false }: { weather: NonNullable<WidgetProps["weather"]>; compact?: boolean }) {
  if (!weather.daily?.length) return null;
  const iconSize = compact ? "text-3xl" : "text-5xl";
  const daySize = compact ? "text-sm" : "text-base";
  const tempSize = compact ? "text-base" : "text-lg";
  const lowSize = compact ? "text-sm" : "text-base";
  const labelSize = compact ? "text-sm" : "text-base";
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <p className={`${labelSize} uppercase tracking-wider font-semibold mb-1.5`} style={{ color: "var(--text-secondary)" }}>7-Day</p>
      <div className="flex-1 flex gap-1.5 min-h-0">
        {weather.daily.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1 rounded-lg min-h-0 py-1"
            style={{ background: "var(--card-bg-hover, var(--card-bg))" }}>
            <span className={`${daySize} font-bold`} style={{ color: i === 0 ? "var(--accent-text)" : "var(--text-secondary)" }}>{d.day}</span>
            <span className={iconSize}><Icon name={d.icon} /></span>
            <div className="flex items-baseline gap-0.5">
              <span className={`${tempSize} font-bold`} style={{ color: "var(--text-primary)" }}>{d.high}&deg;</span>
              <span className={`${lowSize} font-medium`} style={{ color: "var(--text-muted)" }}>/</span>
              <span className={`${lowSize} font-medium`} style={{ color: "var(--text-secondary)" }}>{d.low}&deg;</span>
            </div>
            {d.precipitationChance > 0 && (
              <span className={`${labelSize} font-semibold`} style={{ color: "var(--status-amber)" }}>{d.precipitationChance}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Daily: vertical rows (portrait) ── */
function DailyCardsVertical({ weather }: { weather: NonNullable<WidgetProps["weather"]> }) {
  if (!weather.daily?.length) return null;
  return (
    <div className="flex-1 min-h-0 flex flex-col mt-1.5">
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-faint)" }}>7-Day</p>
      <div className="flex-1 flex flex-col gap-0.5">
        {weather.daily.map((d, i) => (
          <div key={i} className="flex-1 flex items-center text-sm px-2.5 rounded-lg min-h-0"
            style={{ background: "var(--card-bg-hover, var(--card-bg))" }}>
            <span className="w-10 shrink-0 font-medium" style={{ color: i === 0 ? "var(--accent-text)" : "var(--text-muted)" }}>{d.day}</span>
            <span className="text-lg w-8 text-center shrink-0"><Icon name={d.icon} /></span>
            <span className="font-medium w-10 text-right shrink-0" style={{ color: "var(--text-primary)" }}>{d.high}&deg;</span>
            <span className="w-10 text-right shrink-0" style={{ color: "var(--text-faint)" }}>{d.low}&deg;</span>
            {d.precipitationChance > 0 && (
              <span className="ml-auto text-xs shrink-0" style={{ color: "var(--status-amber)" }}>{d.precipitationChance}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeatherWidgetComponent({ size, weather }: WidgetProps) {
  if (!weather) {
    return <div className="h-full flex items-center justify-center"><p className="text-base" style={{ color: "var(--text-faint)" }}>Weather unavailable</p></div>;
  }

  // H = horizontal (landscape): current left full-height, hourly + daily stacked right
  if (size === "H") {
    return (
      <div className="h-full flex gap-4 select-none overflow-hidden">
        {/* Left: current conditions panel */}
        <div className="shrink-0" style={{ width: "160px" }}>
          <CurrentWeatherPanel weather={weather} compact />
        </div>

        {/* Divider */}
        <div className="w-px self-stretch opacity-20" style={{ background: "var(--text-faint)" }} />

        {/* Right: hourly + daily stacked */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0">
          <HourlyCards weather={weather} count={8} compact />
          <DailyCardsHorizontal weather={weather} compact />
        </div>
      </div>
    );
  }

  // V = portrait: same layout as H — current left, hourly + daily stacked right
  return (
    <div className="h-full flex gap-4 select-none overflow-hidden">
      {/* Left: current conditions panel */}
      <div className="shrink-0" style={{ width: "160px" }}>
        <CurrentWeatherPanel weather={weather} hideAqi />
      </div>

      {/* Divider */}
      <div className="w-px self-stretch opacity-20" style={{ background: "var(--text-faint)" }} />

      {/* Right: hourly + daily stacked */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0">
        <HourlyCards weather={weather} />
        <DailyCardsHorizontal weather={weather} />
      </div>
    </div>
  );
}
