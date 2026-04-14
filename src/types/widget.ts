import type { WidgetSize } from "./config";
import type { DailyPrayers, PrayerTime } from "./prayer";
import type { WeatherData } from "./weather";
import type { AppConfig } from "./config";

// Props passed to every widget
export interface WidgetProps {
  size: WidgetSize;
  currentTime: Date;
  timezone: string;
  config: AppConfig;
  prayerData: DailyPrayers | null;
  nextPrayer: PrayerTime | null;
  weather: WeatherData | null;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  // Column spans for each size
  colSpan: Record<WidgetSize, number>;
}
