"use client";

import type { WidgetProps } from "@/types/widget";
import PrayerTimesWidgetH from "./PrayerTimesWidgetH";
import PrayerTimesWidgetV from "./PrayerTimesWidgetV";

export default function PrayerTimesWidget({ size, currentTime, timezone, config, prayerData, nextPrayer }: WidgetProps) {
  if (!prayerData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const viewProps = {
    prayers: prayerData.prayers,
    nextName: nextPrayer?.name || null,
    now: currentTime,
    timezone,
    timeFormat: config.display.timeFormat,
  };
  return size === "H" ? <PrayerTimesWidgetH {...viewProps} /> : <PrayerTimesWidgetV {...viewProps} />;
}
