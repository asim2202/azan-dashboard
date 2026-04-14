import type { WidgetDefinition } from "@/types/widget";
import type { WidgetConfig, WidgetSize } from "@/types/config";

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: "clock",
    name: "Digital Clock",
    description: "Current time display",
    sizes: ["S", "M", "L"],
    defaultSize: "L",
    colSpan: { S: 1, M: 2, L: 3 },
  },
  {
    id: "next-prayer",
    name: "Next Prayer Countdown",
    description: "Countdown to next prayer with name",
    sizes: ["S", "M", "L"],
    defaultSize: "M",
    colSpan: { S: 1, M: 2, L: 3 },
  },
  {
    id: "prayer-times",
    name: "Prayer Times",
    description: "All prayer and iqama times",
    sizes: ["S", "M", "L"],
    defaultSize: "L",
    colSpan: { S: 2, M: 3, L: 4 },
  },
  {
    id: "weather",
    name: "Weather",
    description: "Current weather conditions",
    sizes: ["S", "M", "L"],
    defaultSize: "S",
    colSpan: { S: 1, M: 2, L: 2 },
  },
  {
    id: "camera",
    name: "Camera Feed",
    description: "Live camera stream",
    sizes: ["S", "M", "L"],
    defaultSize: "M",
    colSpan: { S: 1, M: 2, L: 3 },
  },
  {
    id: "analog-clock",
    name: "Analog Clock",
    description: "Classic analog clock face",
    sizes: ["S", "M", "L"],
    defaultSize: "M",
    colSpan: { S: 1, M: 2, L: 2 },
  },
  {
    id: "iqama-countdown",
    name: "Iqama Countdown",
    description: "Countdown to next iqama",
    sizes: ["S", "M"],
    defaultSize: "S",
    colSpan: { S: 1, M: 2, L: 2 },
  },
  {
    id: "quran-verse",
    name: "Quran Verse",
    description: "Random verse with translation",
    sizes: ["M", "L"],
    defaultSize: "M",
    colSpan: { S: 2, M: 2, L: 3 },
  },
  {
    id: "hijri-date",
    name: "Hijri Date",
    description: "Islamic calendar date",
    sizes: ["S", "M"],
    defaultSize: "S",
    colSpan: { S: 1, M: 2, L: 2 },
  },
  {
    id: "prayer-progress",
    name: "Prayer Progress",
    description: "Visual progress between prayers",
    sizes: ["S", "M"],
    defaultSize: "M",
    colSpan: { S: 2, M: 3, L: 4 },
  },
];

export function getWidgetDef(id: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find((w) => w.id === id);
}

export function getColSpan(id: string, size: WidgetSize): number {
  const def = getWidgetDef(id);
  return def?.colSpan[size] ?? 1;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "clock", size: "L", enabled: true },
  { id: "next-prayer", size: "M", enabled: true },
  { id: "prayer-times", size: "L", enabled: true },
  { id: "prayer-progress", size: "M", enabled: true },
  { id: "weather", size: "S", enabled: true },
  { id: "camera", size: "M", enabled: true },
  { id: "hijri-date", size: "S", enabled: true },
  { id: "quran-verse", size: "M", enabled: false },
  { id: "analog-clock", size: "M", enabled: false },
  { id: "iqama-countdown", size: "S", enabled: false },
];
