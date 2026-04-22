"use client";

import type { WidgetProps } from "@/types/widget";
import WeatherWidgetH from "./WeatherWidgetH";
import WeatherWidgetV from "./WeatherWidgetV";

export default function WeatherWidget({ size, weather }: WidgetProps) {
  if (!weather) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-base" style={{ color: "var(--text-faint)" }}>Weather unavailable</p>
      </div>
    );
  }
  return size === "H" ? <WeatherWidgetH weather={weather} /> : <WeatherWidgetV weather={weather} />;
}
