import type { WidgetDefinition } from "@/types/widget";
import type { WidgetGridItem } from "@/types/config";

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

// Default grid layout - 6 columns
// x,y = position, w = width in cols, h = height in row units
export const DEFAULT_GRID_WIDGETS: WidgetGridItem[] = [
  { i: "clock",           x: 0, y: 0, w: 4, h: 2, enabled: true },
  { i: "next-prayer",     x: 4, y: 0, w: 2, h: 2, enabled: true },
  { i: "prayer-times",    x: 0, y: 2, w: 4, h: 3, enabled: true },
  { i: "weather",         x: 4, y: 2, w: 2, h: 1, enabled: true },
  { i: "hijri-date",      x: 4, y: 3, w: 2, h: 1, enabled: true },
  { i: "prayer-progress", x: 4, y: 4, w: 2, h: 1, enabled: true },
  { i: "camera",          x: 0, y: 5, w: 3, h: 2, enabled: false },
  { i: "quran-verse",     x: 3, y: 5, w: 3, h: 2, enabled: false },
  { i: "analog-clock",    x: 0, y: 7, w: 2, h: 2, enabled: false },
  { i: "iqama-countdown", x: 2, y: 7, w: 2, h: 1, enabled: false },
];
