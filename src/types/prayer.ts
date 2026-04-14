export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface PrayerTime {
  name: PrayerName;
  label: string;
  arabicLabel: string;
  azanTime: string; // HH:mm format
  iqamaTime: string | null; // HH:mm format, null for sunrise
  azanDate: Date;
  iqamaDate: Date | null;
}

export type PrayerStatus = "past" | "next" | "future";

export interface DailyPrayers {
  date: string; // YYYY-MM-DD
  prayers: PrayerTime[];
  source: "iacad" | "calculated";
  lastUpdated: string; // ISO timestamp
}
