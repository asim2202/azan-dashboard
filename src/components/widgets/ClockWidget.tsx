"use client";

import type { WidgetProps } from "@/types/widget";
import { getHijriDate } from "@/lib/hijri";

export default function ClockWidget({ size, currentTime, timezone, config }: WidgetProps) {
  const fmt = config.display.timeFormat;
  const showSec = config.display.showSeconds;

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: fmt === "12h",
  };
  if (showSec) options.second = "2-digit";

  const timeStr = currentTime.toLocaleTimeString("en-US", options);
  const parts = timeStr.split(" ");
  const mainTime = parts[0];
  const period = parts[1] || "";

  const gregorian = currentTime.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: timezone,
  });
  const hijri = getHijriDate(currentTime, timezone);

  const clockSize = size === "S" ? "text-4xl" : size === "M" ? "text-5xl sm:text-6xl" : "text-6xl sm:text-7xl md:text-8xl";
  const periodSize = size === "S" ? "text-lg" : "text-xl sm:text-2xl";

  return (
    <div className="text-center select-none h-full flex flex-col justify-center">
      <div className="flex items-baseline justify-center gap-2">
        <span
          className={`${clockSize} font-light tracking-tight`}
          style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}
        >
          {mainTime}
        </span>
        {period && (
          <span className={`${periodSize} font-light`} style={{ color: "var(--text-muted)" }}>
            {period}
          </span>
        )}
      </div>
      {size !== "S" && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{gregorian}</p>
      )}
      {size === "L" && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{hijri.formatted}</p>
      )}
    </div>
  );
}
