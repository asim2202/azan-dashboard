// Dubai IACAD seasonal iqama offsets (minutes after azan)
// Based on published IACAD yearly iqama schedule
// These change seasonally - Fajr offset varies most

interface IqamaOffsets {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

// Month-based iqama offsets approximating IACAD schedule
// Months 1-12 (January = 1)
const SEASONAL_OFFSETS: Record<number, IqamaOffsets> = {
  1:  { fajr: 25, dhuhr: 30, asr: 20, maghrib: 5, isha: 20 }, // January
  2:  { fajr: 25, dhuhr: 30, asr: 20, maghrib: 5, isha: 20 }, // February
  3:  { fajr: 25, dhuhr: 25, asr: 20, maghrib: 5, isha: 20 }, // March
  4:  { fajr: 20, dhuhr: 25, asr: 20, maghrib: 5, isha: 15 }, // April
  5:  { fajr: 20, dhuhr: 25, asr: 20, maghrib: 5, isha: 15 }, // May
  6:  { fajr: 20, dhuhr: 30, asr: 25, maghrib: 5, isha: 15 }, // June
  7:  { fajr: 20, dhuhr: 30, asr: 25, maghrib: 5, isha: 15 }, // July
  8:  { fajr: 20, dhuhr: 25, asr: 25, maghrib: 5, isha: 15 }, // August
  9:  { fajr: 20, dhuhr: 25, asr: 20, maghrib: 5, isha: 15 }, // September
  10: { fajr: 25, dhuhr: 25, asr: 20, maghrib: 5, isha: 20 }, // October
  11: { fajr: 25, dhuhr: 30, asr: 20, maghrib: 5, isha: 20 }, // November
  12: { fajr: 25, dhuhr: 30, asr: 20, maghrib: 5, isha: 20 }, // December
};

export function getIqamaOffsets(month: number): IqamaOffsets {
  return SEASONAL_OFFSETS[month] || SEASONAL_OFFSETS[1];
}
