import { WeatherData, WMO_CODES, AirQuality } from "@/types/weather";

function classifyAqi(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: "Good", color: "#4ade80" };
  if (aqi <= 100) return { label: "Moderate", color: "#facc15" };
  if (aqi <= 150) return { label: "Unhealthy (SG)", color: "#fb923c" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#ef4444" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#a855f7" };
  return { label: "Hazardous", color: "#7f1d1d" };
}

async function fetchAirQuality(latitude: number, longitude: number, timezone: string): Promise<AirQuality | undefined> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      timezone,
      current: "us_aqi,pm2_5,pm10",
    });
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return undefined;
    const data = await res.json();
    const aqi = Math.round(data.current.us_aqi ?? 0);
    const pm25 = Math.round(data.current.pm2_5 ?? 0);
    const pm10 = Math.round(data.current.pm10 ?? 0);
    const { label, color } = classifyAqi(aqi);
    return { aqi, pm25, pm10, label, color };
  } catch {
    return undefined;
  }
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  timezone: string
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    timezone: timezone,
    current: "temperature_2m,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,apparent_temperature",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "7",
    forecast_hours: "12",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const [response, airQuality] = await Promise.all([
    fetch(url, { next: { revalidate: 1800 } }),
    fetchAirQuality(latitude, longitude, timezone),
  ]);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

  const data = await response.json();
  const current = data.current;
  let code = current.weather_code as number;
  const cloudCover = current.cloud_cover as number | undefined;

  // Override the WMO classification when cloud_cover disagrees with the
  // weather_code. Open-Meteo's weather_code is a single-bucket classification
  // that often calls 50-70% cloud cover "Overcast" (code 3) when reality is
  // closer to "Partly cloudy" (code 2). Trust cloud_cover when available.
  // (Only re-classify between the cloudiness bins; precipitation/storm/fog
  // codes always win.)
  if (typeof cloudCover === "number" && code <= 3) {
    if (cloudCover < 12) code = 0;          // Clear
    else if (cloudCover < 38) code = 1;     // Mainly clear
    else if (cloudCover < 80) code = 2;     // Partly cloudy
    else code = 3;                          // Overcast
  }

  const wmo = WMO_CODES[code] || { description: "Unknown", icon: "cloud" };

  // Parse hourly (next 12 hours)
  const hourly = (data.hourly?.time || []).slice(0, 12).map((t: string, i: number) => {
    const hCode = data.hourly.weather_code[i];
    const hWmo = WMO_CODES[hCode] || { icon: "cloud" };
    const date = new Date(t);
    return {
      time: date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true, timeZone: timezone }),
      temperature: Math.round(data.hourly.temperature_2m[i]),
      precipitationChance: data.hourly.precipitation_probability?.[i] ?? 0,
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
      precipitationChance: data.daily.precipitation_probability_max?.[i] ?? 0,
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
    precipitationChance: data.hourly?.precipitation_probability?.[0] ?? 0,
    description: wmo.description,
    icon: wmo.icon,
    hourly,
    daily,
    airQuality,
  };
}
