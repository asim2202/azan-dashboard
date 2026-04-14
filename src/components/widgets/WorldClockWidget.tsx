"use client";

import type { WidgetProps } from "@/types/widget";

const WORLD_CITIES = [
  { name: "Toronto", timezone: "America/Toronto", flag: "\uD83C\uDDE8\uD83C\uDDE6" },
  { name: "Kanpur", timezone: "Asia/Kolkata", flag: "\uD83C\uDDEE\uD83C\uDDF3" },
  { name: "Houston", timezone: "America/Chicago", flag: "\uD83C\uDDFA\uD83C\uDDF8" },
];

export default function WorldClockWidget({ currentTime, config }: WidgetProps) {
  const localTz = config.location.timezone;

  return (
    <div className="h-full flex flex-col justify-center select-none">
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>World Clock</p>
      <div className="space-y-2">
        {WORLD_CITIES.map((city) => {
          const timeStr = currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: city.timezone,
            hour12: config.display.timeFormat === "12h",
          });
          const dateStr = currentTime.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: city.timezone,
          });

          // Calculate offset from local timezone
          const localOffset = new Date().toLocaleString("en-US", { timeZone: localTz, timeZoneName: "shortOffset" });
          const cityOffset = new Date().toLocaleString("en-US", { timeZone: city.timezone, timeZoneName: "shortOffset" });
          const localMatch = localOffset.match(/GMT([+-]\d+)/);
          const cityMatch = cityOffset.match(/GMT([+-]\d+)/);
          const diff = (cityMatch ? parseInt(cityMatch[1]) : 0) - (localMatch ? parseInt(localMatch[1]) : 0);
          const diffStr = diff === 0 ? "same" : diff > 0 ? `+${diff}h` : `${diff}h`;

          return (
            <div key={city.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{city.flag}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{city.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{dateStr} &middot; {diffStr}</p>
                </div>
              </div>
              <p className="text-lg font-medium" style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
                {timeStr}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
