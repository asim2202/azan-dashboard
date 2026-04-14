import { WeatherData, WMO_CODES } from "@/types/weather";

export async function fetchWeather(
  latitude: number,
  longitude: number,
  timezone: string
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&timezone=${encodeURIComponent(timezone)}`;

  const response = await fetch(url, { next: { revalidate: 1800 } }); // 30 min cache
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current;
  const code = current.weather_code as number;
  const wmo = WMO_CODES[code] || { description: "Unknown", icon: "cloud" };

  return {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    weatherCode: code,
    windSpeed: Math.round(current.wind_speed_10m),
    description: wmo.description,
    icon: wmo.icon,
  };
}
