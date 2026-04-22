"use client";

import type { WidgetProps } from "@/types/widget";
import PrayerProgressWidgetH from "./PrayerProgressWidgetH";
import PrayerProgressWidgetV from "./PrayerProgressWidgetV";

export default function PrayerProgressWidget(props: WidgetProps) {
  return props.size === "H" ? <PrayerProgressWidgetH {...props} /> : <PrayerProgressWidgetV {...props} />;
}
