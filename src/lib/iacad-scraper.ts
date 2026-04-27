import type { DailyPrayers, PrayerTime } from "@/types/prayer";
import { getIqamaOffsets } from "./iqama-schedule";

// IACAD's own public CRM API — returns the entire month's prayer times
// for a given city. Used by https://eservices.iacad.gov.ae/prayer-time
// itself, so our values match the official Dubai prayer times exactly.
//   https://api-crm.iacad.gov.ae/api//prayertime/getprayerfromlink?month=M&year=YYYY&cityid=1
// cityid=1 = Dubai City. Response is an array of objects, one per day,
// where each entry has listDateGreg (yyyy-MM-ddT00:00:00) and the
// six prayer times as ISO datetimes (date prefix is "today" — the time
// portion is what's meaningful).
const IACAD_API = "https://api-crm.iacad.gov.ae/api//prayertime/getprayerfromlink";

// AlAdhan with method 16 = Dubai (experimental). Used as fallback when
// IACAD's own API is unreachable. Times match within 1-3 min due to slightly
// different sunrise/maghrib correction conventions.
const ALADHAN_API = "https://api.aladhan.com/v1/timings";

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

/**
 * Build a DailyPrayers object from a map of prayer name -> "HH:mm" strings.
 * Used by both the IACAD-direct path and the AlAdhan fallback path.
 */
function buildDailyPrayers(
  times: Record<string, string>,
  timezone: string,
  iqamaOffsetsOverride?: { fajr?: number; dhuhr?: number; asr?: number; maghrib?: number; isha?: number }
): DailyPrayers {
  const now = new Date();
  const month = now.getMonth() + 1;
  const defaultOffsets = getIqamaOffsets(month);
  const offsets = { ...defaultOffsets, ...iqamaOffsetsOverride };

  const order = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;

  const prayers: PrayerTime[] = order.map((key) => {
    const cleanTime = (times[key] || "").replace(/\s*\(.*\)/, "").trim();
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
  return {
    date: todayStr,
    prayers,
    source: "iacad",
    lastUpdated: new Date().toISOString(),
  };
}

/* ─────────── Official IACAD source ─────────── */

interface IacadDay {
  fajr: string;     // ISO datetime, time portion is what matters
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  listDateGreg: string; // "yyyy-MM-ddT00:00:00"
}

async function fetchIacadOfficial(timezone: string): Promise<Record<string, string> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const now = new Date();
    // Use the timezone-local date for month/year so we don't ask for the
    // wrong month at midnight UTC etc.
    const localParts = now.toLocaleDateString("en-CA", { timeZone: timezone }).split("-");
    const year = parseInt(localParts[0], 10);
    const month = parseInt(localParts[1], 10);
    const dayStr = `${year}-${String(month).padStart(2, "0")}-${localParts[2]}`;

    const url = `${IACAD_API}?month=${month}&year=${year}&cityid=1`;
    console.log("[IACAD] Fetching:", url);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error("[IACAD] HTTP error:", res.status);
      return null;
    }

    const days: IacadDay[] = await res.json();
    const today = days.find((d) => d.listDateGreg?.startsWith(dayStr));
    if (!today) {
      console.error("[IACAD] No entry for", dayStr);
      return null;
    }

    // Extract HH:mm from each ISO datetime
    const timeOf = (iso: string) => iso.split("T")[1]?.slice(0, 5) || "";
    return {
      fajr: timeOf(today.fajr),
      sunrise: timeOf(today.sunrise),
      dhuhr: timeOf(today.dhuhr),
      asr: timeOf(today.asr),
      maghrib: timeOf(today.maghrib),
      isha: timeOf(today.isha),
    };
  } catch (err) {
    console.error("[IACAD] Fetch failed:", err);
    return null;
  }
}

/* ─────────── AlAdhan fallback types ─────────── */

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
  // city/country kept for backwards-compat but no longer used for the API call
  _city: string = "Dubai",
  _country: string = "UAE",
  iqamaOffsets?: { fajr?: number; dhuhr?: number; asr?: number; maghrib?: number; isha?: number },
  latitude?: number,
  longitude?: number
): Promise<DailyPrayers | null> {
  // 1) Try IACAD's own API first — this is the official source for Dubai
  //    and matches what eservices.iacad.gov.ae shows exactly.
  const iacadTimes = await fetchIacadOfficial(timezone);
  if (iacadTimes) {
    console.log("[Prayer Times] Using IACAD official API");
    return buildDailyPrayers(iacadTimes, timezone, iqamaOffsets);
  }

  // 2) Fallback: AlAdhan with method 16 (Dubai).
  console.log("[Prayer Times] IACAD unavailable — falling back to AlAdhan");
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

    // Default to Dubai's central coordinates if caller didn't pass any.
    // For IACAD, Dubai-wide official timings are essentially identical
    // anywhere in the city (sub-second drift), so any valid Dubai lat/lon
    // gives the same result.
    const lat = latitude ?? 25.2048;
    const lon = longitude ?? 55.2708;

    const url = `${ALADHAN_API}/${dateStr}?latitude=${lat}&longitude=${lon}&method=16`;

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
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone });
    console.log("[AlAdhan] Successfully fetched Dubai prayer times for", todayStr);

    return buildDailyPrayers({
      fajr: t.Fajr,
      sunrise: t.Sunrise,
      dhuhr: t.Dhuhr,
      asr: t.Asr,
      maghrib: t.Maghrib,
      isha: t.Isha,
    }, timezone, iqamaOffsets);
  } catch (error) {
    console.error("[AlAdhan] Fetch failed:", error);
    return null;
  }
}
