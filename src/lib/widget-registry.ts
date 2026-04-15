import type { WidgetDefinition } from "@/types/widget";
import type { WidgetGridItem } from "@/types/config";

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: "clock",
    name: "Digital Clock",
    description: "Current time display",
    sizes: ["H", "V"],
    defaultSize: "H",
    colSpan: { H: 3, V: 1 },
  },
  {
    id: "next-prayer",
    name: "Next Prayer Countdown",
    description: "Countdown to next prayer with name",
    sizes: ["H", "V"],
    defaultSize: "H",
    colSpan: { H: 2, V: 1 },
  },
  {
    id: "prayer-times",
    name: "Prayer Times",
    description: "All prayer and iqama times",
    sizes: ["H", "V"],
    defaultSize: "H",
    colSpan: { H: 4, V: 1 },
  },
  {
    id: "weather",
    name: "Weather",
    description: "Current weather conditions",
    sizes: ["H", "V"],
    defaultSize: "H",
    colSpan: { H: 3, V: 1 },
  },
  {
    id: "camera",
    name: "Camera Feed",
    description: "Live camera stream",
    sizes: ["H", "V"],
    defaultSize: "H",
    colSpan: { H: 2, V: 1 },
  },
  {
    id: "world-clock",
    name: "World Clock",
    description: "Analog clocks for multiple cities",
    sizes: ["H", "V"],
    defaultSize: "H",
    colSpan: { H: 1, V: 1 },
  },
  {
    id: "islamic-content",
    name: "Islamic Content",
    description: "Rotating Quran verse and Hadith",
    sizes: ["H", "V"],
    defaultSize: "H",
    colSpan: { H: 2, V: 1 },
  },
];

export function getWidgetDef(id: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find((w) => w.id === id);
}

export const DEFAULT_GRID_WIDGETS: WidgetGridItem[] = [
  { i: "clock",           x: 0, y: 0, w: 4, h: 2, enabled: true },
  { i: "next-prayer",     x: 4, y: 0, w: 2, h: 2, enabled: true },
  { i: "prayer-times",    x: 0, y: 2, w: 4, h: 3, enabled: true },
  { i: "weather",         x: 0, y: 5, w: 4, h: 2, enabled: true },
  { i: "world-clock",     x: 4, y: 2, w: 2, h: 2, enabled: true },
  { i: "camera",          x: 4, y: 4, w: 2, h: 3, enabled: true },
  { i: "islamic-content", x: 4, y: 7, w: 2, h: 2, enabled: true },
];
