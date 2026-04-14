import { WeatherData, WMO_CODES } from "@/types/weather";

export async function fetchWeather(
  latitude: number,
  longitude: number,
  timezone: string
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    timezone: timezone,
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "7",
    forecast_hours: "12",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

  const data = await response.json();
  const current = data.current;
  const code = current.weather_code as number;
  const wmo = WMO_CODES[code] || { description: "Unknown", icon: "cloud" };

  // Parse hourly (next 12 hours)
  const hourly = (data.hourly?.time || []).slice(0, 12).map((t: string, i: number) => {
    const hCode = data.hourly.weather_code[i];
    const hWmo = WMO_CODES[hCode] || { icon: "cloud" };
    const date = new Date(t);
    return {
      time: date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true, timeZone: timezone }),
      temperature: Math.round(data.hourly.temperature_2m[i]),
      weatherCode: hCode,
      icon: hWmo.icon,
    };
  });

  // Parse daily (7 days)
  const daily = (data.daily?.time || []).map((t: string, i: number) => {
    const dCode = data.daily.weather_code[i];
    const dWmo = WMO_CODES[dCode] || { description: "Unknown", icon: "cloud" };
    const date = new Date(t + "T12:00:00");
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone }),
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: timezone }),
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      weatherCode: dCode,
      icon: dWmo.icon,
      description: dWmo.description,
    };
  });

  return {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    weatherCode: code,
    windSpeed: Math.round(current.wind_speed_10m),
    description: wmo.description,
    icon: wmo.icon,
    hourly,
    daily,
  };
}
