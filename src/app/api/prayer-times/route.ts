import { NextRequest } from "next/server";
import { getConfig } from "@/lib/config";
import { calculatePrayerTimes } from "@/lib/prayer-calculator";
import { fetchDubaiPrayerTimes } from "@/lib/iacad-scraper";
import type { DailyPrayers } from "@/types/prayer";

// In-memory cache
let cache: { date: string; data: DailyPrayers } | null = null;

export async function GET(request: NextRequest) {
  const config = getConfig();
  const { latitude, longitude, timezone, city } = config.location;

  const today = new Date().toLocaleDateString("en-CA", { timeZone: timezone });

  // Return cached if same day
  if (cache && cache.date === today) {
    return Response.json(cache.data);
  }

  let result: DailyPrayers | null = null;

  // Try AlAdhan API with Dubai/IACAD method first
  if (config.dataSources.iacadEnabled) {
    try {
      result = await fetchDubaiPrayerTimes(timezone, city, "UAE", config.iqamaOffsets);
      if (result) {
        console.log("[Prayer Times] Using AlAdhan Dubai method (IACAD parameters)");
      }
    } catch (error) {
      console.error("[Prayer Times] AlAdhan fetch failed:", error);
    }
  }

  // Fallback to local adhan.js calculation
  if (!result) {
    console.log("[Prayer Times] Using local adhan.js calculation");
    const now = new Date();
    result = calculatePrayerTimes(
      latitude,
      longitude,
      now,
      timezone,
      config.madhab,
      config.iqamaOffsets
    );
  }

  // Cache the result
  cache = { date: today, data: result };

  return Response.json(result);
}
