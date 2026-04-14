import {
  PrayerTimes,
  CalculationMethod,
  Coordinates,
  SunnahTimes,
  Madhab,
} from "adhan";
import type { PrayerTime, DailyPrayers } from "@/types/prayer";
import { getIqamaOffsets } from "./iqama-schedule";

const PRAYER_LABELS: Record<string, { label: string; arabic: string }> = {
  fajr: { label: "Fajr", arabic: "الفجر" },
  sunrise: { label: "Sunrise", arabic: "الشروق" },
  dhuhr: { label: "Dhuhr", arabic: "الظهر" },
  asr: { label: "Asr", arabic: "العصر" },
  maghrib: { label: "Maghrib", arabic: "المغرب" },
  isha: { label: "Isha", arabic: "العشاء" },
};

function formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: false,
  });
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date,
  timezone: string,
  madhab: string = "Shafi",
  iqamaOffsetOverrides?: { fajr?: number; dhuhr?: number; asr?: number; maghrib?: number; isha?: number }
): DailyPrayers {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.Dubai();
  params.madhab = madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;

  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const month = date.getMonth() + 1;
  const defaultOffsets = getIqamaOffsets(month);
  const offsets = { ...defaultOffsets, ...iqamaOffsetOverrides };

  const prayers: PrayerTime[] = [
    {
      name: "fajr",
      label: PRAYER_LABELS.fajr.label,
      arabicLabel: PRAYER_LABELS.fajr.arabic,
      azanTime: formatTime(prayerTimes.fajr, timezone),
      iqamaTime: formatTime(addMinutes(prayerTimes.fajr, offsets.fajr), timezone),
      azanDate: prayerTimes.fajr,
      iqamaDate: addMinutes(prayerTimes.fajr, offsets.fajr),
    },
    {
      name: "sunrise",
      label: PRAYER_LABELS.sunrise.label,
      arabicLabel: PRAYER_LABELS.sunrise.arabic,
      azanTime: formatTime(prayerTimes.sunrise, timezone),
      iqamaTime: null,
      azanDate: prayerTimes.sunrise,
      iqamaDate: null,
    },
    {
      name: "dhuhr",
      label: PRAYER_LABELS.dhuhr.label,
      arabicLabel: PRAYER_LABELS.dhuhr.arabic,
      azanTime: formatTime(prayerTimes.dhuhr, timezone),
      iqamaTime: formatTime(addMinutes(prayerTimes.dhuhr, offsets.dhuhr), timezone),
      azanDate: prayerTimes.dhuhr,
      iqamaDate: addMinutes(prayerTimes.dhuhr, offsets.dhuhr),
    },
    {
      name: "asr",
      label: PRAYER_LABELS.asr.label,
      arabicLabel: PRAYER_LABELS.asr.arabic,
      azanTime: formatTime(prayerTimes.asr, timezone),
      iqamaTime: formatTime(addMinutes(prayerTimes.asr, offsets.asr), timezone),
      azanDate: prayerTimes.asr,
      iqamaDate: addMinutes(prayerTimes.asr, offsets.asr),
    },
    {
      name: "maghrib",
      label: PRAYER_LABELS.maghrib.label,
      arabicLabel: PRAYER_LABELS.maghrib.arabic,
      azanTime: formatTime(prayerTimes.maghrib, timezone),
      iqamaTime: formatTime(addMinutes(prayerTimes.maghrib, offsets.maghrib), timezone),
      azanDate: prayerTimes.maghrib,
      iqamaDate: addMinutes(prayerTimes.maghrib, offsets.maghrib),
    },
    {
      name: "isha",
      label: PRAYER_LABELS.isha.label,
      arabicLabel: PRAYER_LABELS.isha.arabic,
      azanTime: formatTime(prayerTimes.isha, timezone),
      iqamaTime: formatTime(addMinutes(prayerTimes.isha, offsets.isha), timezone),
      azanDate: prayerTimes.isha,
      iqamaDate: addMinutes(prayerTimes.isha, offsets.isha),
    },
  ];

  const dateStr = date.toLocaleDateString("en-CA", { timeZone: timezone });

  return {
    date: dateStr,
    prayers,
    source: "calculated",
    lastUpdated: new Date().toISOString(),
  };
}
