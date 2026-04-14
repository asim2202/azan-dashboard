import type { DailyPrayers, PrayerTime } from "@/types/prayer";
import { getIqamaOffsets } from "./iqama-schedule";

// AlAdhan API with method 16 = Dubai (IACAD) calculation parameters
// Fajr angle: 18.2°, Isha angle: 18.2°, Dhuhr +3min, Maghrib +3min, Sunset +3min
// This matches the official IACAD/Awqaf prayer times for Dubai
const ALADHAN_API = "https://api.aladhan.com/v1/timingsByCity";

const PRAYER_LABELS: Record<string, { label: string; arabic: string }> = {
  fajr: { label: "Fajr", arabic: "الفجر" },
  sunrise: { label: "Sunrise", arabic: "الشروق" },
  dhuhr: { label: "Dhuhr", arabic: "الظهر" },
  asr: { label: "Asr", arabic: "العصر" },
  maghrib: { label: "Maghrib", arabic: "المغرب" },
  isha: { label: "Isha", arabic: "العشاء" },
};

function timeStrToDate(timeStr: string, timezone: string): Date {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(
    `${dateStr}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`
  );
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: false,
  });
}

interface AlAdhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunset: string;
  Imsak: string;
  Midnight: string;
}

interface AlAdhanResponse {
  code: number;
  status: string;
  data: {
    timings: AlAdhanTimings;
    date: {
      hijri: {
        date: string;
        day: string;
        month: { number: number; en: string; ar: string };
        year: string;
      };
      gregorian: {
        date: string;
      };
    };
    meta: {
      method: { id: number; name: string };
    };
  };
}

export async function fetchDubaiPrayerTimes(
  timezone: string,
  city: string = "Dubai",
  country: string = "UAE",
  iqamaOffsets?: { fajr?: number; dhuhr?: number; asr?: number; maghrib?: number; isha?: number }
): Promise<DailyPrayers | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Format today's date for AlAdhan
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).split("/").join("-"); // DD-MM-YYYY

    const url = `${ALADHAN_API}/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=16`;

    console.log("[AlAdhan] Fetching:", url);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[AlAdhan] HTTP error:", response.status);
      return null;
    }

    const json: AlAdhanResponse = await response.json();

    if (json.code !== 200 || !json.data?.timings) {
      console.error("[AlAdhan] Invalid response:", json.status);
      return null;
    }

    const t = json.data.timings;

    // Get iqama offsets
    const month = now.getMonth() + 1;
    const defaultOffsets = getIqamaOffsets(month);
    const offsets = { ...defaultOffsets, ...iqamaOffsets };

    const prayerEntries: { key: string; time: string }[] = [
      { key: "fajr", time: t.Fajr },
      { key: "sunrise", time: t.Sunrise },
      { key: "dhuhr", time: t.Dhuhr },
      { key: "asr", time: t.Asr },
      { key: "maghrib", time: t.Maghrib },
      { key: "isha", time: t.Isha },
    ];

    const prayers: PrayerTime[] = prayerEntries.map(({ key, time }) => {
      // AlAdhan returns "HH:mm" or "HH:mm (timezone)" - strip any extra text
      const cleanTime = time.replace(/\s*\(.*\)/, "").trim();
      const azanDate = timeStrToDate(cleanTime, timezone);
      const isSunrise = key === "sunrise";
      const offset = isSunrise ? 0 : (offsets as Record<string, number>)[key] || 0;
      const iqamaDate = isSunrise ? null : addMinutes(azanDate, offset);

      return {
        name: key as PrayerTime["name"],
        label: PRAYER_LABELS[key]?.label || key,
        arabicLabel: PRAYER_LABELS[key]?.arabic || "",
        azanTime: cleanTime,
        iqamaTime: iqamaDate ? formatTime(iqamaDate, timezone) : null,
        azanDate,
        iqamaDate,
      };
    });

    const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone });

    console.log("[AlAdhan] Successfully fetched Dubai prayer times for", todayStr);

    return {
      date: todayStr,
      prayers,
      source: "iacad", // AlAdhan method 16 = Dubai/IACAD parameters
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[AlAdhan] Fetch failed:", error);
    return null;
  }
}
