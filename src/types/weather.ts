export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "sun" },
  1: { description: "Mainly clear", icon: "sun" },
  2: { description: "Partly cloudy", icon: "cloud-sun" },
  3: { description: "Overcast", icon: "cloud" },
  45: { description: "Foggy", icon: "fog" },
  48: { description: "Rime fog", icon: "fog" },
  51: { description: "Light drizzle", icon: "drizzle" },
  53: { description: "Moderate drizzle", icon: "drizzle" },
  55: { description: "Dense drizzle", icon: "drizzle" },
  61: { description: "Slight rain", icon: "rain" },
  63: { description: "Moderate rain", icon: "rain" },
  65: { description: "Heavy rain", icon: "rain" },
  71: { description: "Slight snow", icon: "snow" },
  73: { description: "Moderate snow", icon: "snow" },
  75: { description: "Heavy snow", icon: "snow" },
  80: { description: "Slight showers", icon: "rain" },
  81: { description: "Moderate showers", icon: "rain" },
  82: { description: "Violent showers", icon: "rain" },
  95: { description: "Thunderstorm", icon: "storm" },
  96: { description: "Thunderstorm with hail", icon: "storm" },
  99: { description: "Thunderstorm with heavy hail", icon: "storm" },
};
