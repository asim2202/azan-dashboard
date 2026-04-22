"use client";

import type { WidgetProps } from "@/types/widget";
import WorldClockWidgetH from "./WorldClockWidgetH";
import WorldClockWidgetV from "./WorldClockWidgetV";

export default function WorldClockWidget({ size, currentTime }: WidgetProps) {
  return size === "H"
    ? <WorldClockWidgetH currentTime={currentTime} />
    : <WorldClockWidgetV currentTime={currentTime} />;
}
