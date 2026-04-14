import { getConfig } from "@/lib/config";
import { fetchWeather } from "@/lib/weather";
import type { WeatherData } from "@/types/weather";

let weatherCache: { data: WeatherData; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  const config = getConfig();

  if (!config.dataSources.weatherEnabled) {
    return Response.json({ error: "Weather disabled" }, { status: 404 });
  }

  // Return cached if fresh
  if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_TTL) {
    return Response.json(weatherCache.data);
  }

  try {
    const { latitude, longitude, timezone } = config.location;
    const data = await fetchWeather(latitude, longitude, timezone);
    weatherCache = { data, timestamp: Date.now() };
    return Response.json(data);
  } catch (error) {
    console.error("[Weather] Fetch failed:", error);
    // Return stale cache if available
    if (weatherCache) {
      return Response.json(weatherCache.data);
    }
    return Response.json({ error: "Weather unavailable" }, { status: 503 });
  }
}
