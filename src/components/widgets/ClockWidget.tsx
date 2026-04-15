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

  if (size === "H") {
    // Horizontal (landscape): large time, date + hijri below
    return (
      <div className="text-center select-none h-full flex flex-col justify-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-6xl sm:text-7xl md:text-8xl font-light tracking-tight"
            style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{mainTime}</span>
          {period && <span className="text-xl sm:text-2xl font-light" style={{ color: "var(--text-muted)" }}>{period}</span>}
        </div>
        <p className="mt-1 text-base font-medium" style={{ color: "var(--text-secondary)" }}>{gregorian}</p>
        <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>{hijri.formatted}</p>
      </div>
    );
  }

  // Vertical (portrait): larger text for readability
  return (
    <div className="text-center select-none h-full flex flex-col justify-center">
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-8xl font-light tracking-tight"
          style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{mainTime}</span>
        {period && <span className="text-3xl font-light" style={{ color: "var(--text-muted)" }}>{period}</span>}
      </div>
      <p className="mt-1 text-lg font-medium" style={{ color: "var(--text-secondary)" }}>{gregorian}</p>
      <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>{hijri.formatted}</p>
    </div>
  );
}
