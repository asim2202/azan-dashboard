export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  description: string;
  icon: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export interface HourlyForecast {
  time: string; // HH:mm
  temperature: number;
  weatherCode: number;
  icon: string;
}

export interface DailyForecast {
  day: string; // Mon, Tue, etc.
  date: string; // Apr 14
  high: number;
  low: number;
  weatherCode: number;
  icon: string;
  description: string;
}

export const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear", icon: "sun" },
  1: { description: "Mainly clear", icon: "sun" },
  2: { description: "Partly cloudy", icon: "cloud-sun" },
  3: { description: "Overcast", icon: "cloud" },
  45: { description: "Foggy", icon: "fog" },
  48: { description: "Rime fog", icon: "fog" },
  51: { description: "Light drizzle", icon: "drizzle" },
  53: { description: "Drizzle", icon: "drizzle" },
  55: { description: "Dense drizzle", icon: "drizzle" },
  61: { description: "Light rain", icon: "rain" },
  63: { description: "Rain", icon: "rain" },
  65: { description: "Heavy rain", icon: "rain" },
  71: { description: "Light snow", icon: "snow" },
  73: { description: "Snow", icon: "snow" },
  75: { description: "Heavy snow", icon: "snow" },
  80: { description: "Showers", icon: "rain" },
  81: { description: "Mod. showers", icon: "rain" },
  82: { description: "Heavy showers", icon: "rain" },
  95: { description: "Thunderstorm", icon: "storm" },
  96: { description: "T-storm + hail", icon: "storm" },
  99: { description: "Severe storm", icon: "storm" },
};

export const WEATHER_ICONS: Record<string, string> = {
  sun: "\u2600\uFE0F",
  "cloud-sun": "\u26C5",
  cloud: "\u2601\uFE0F",
  fog: "\uD83C\uDF2B\uFE0F",
  drizzle: "\uD83C\uDF26\uFE0F",
  rain: "\uD83C\uDF27\uFE0F",
  snow: "\u2744\uFE0F",
  storm: "\u26C8\uFE0F",
};
