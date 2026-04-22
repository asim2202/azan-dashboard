"use client";

import type { WidgetProps } from "@/types/widget";
import { getHijriDate } from "@/lib/hijri";
import ClockWidgetH from "./ClockWidgetH";
import ClockWidgetV from "./ClockWidgetV";

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
  const hijri = getHijriDate(currentTime, timezone).formatted;

  const viewProps = { mainTime, period, gregorian, hijri };
  return size === "H" ? <ClockWidgetH {...viewProps} /> : <ClockWidgetV {...viewProps} />;
}
