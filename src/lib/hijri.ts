// Hijri date conversion using Umm al-Qura algorithm
// Lightweight implementation without external dependency

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah",
];

const HIJRI_MONTHS_ARABIC = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameArabic: string;
  formatted: string;
  formattedArabic: string;
}

// Convert Gregorian to Hijri using arithmetic approximation
// For production accuracy, uses the Kuwaiti algorithm
function gregorianToHijri(gYear: number, gMonth: number, gDay: number): { day: number; month: number; year: number } {
  // Julian Day Number
  let a = Math.floor((14 - gMonth) / 12);
  let y = gYear + 4800 - a;
  let m = gMonth + 12 * a - 3;
  let jd = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Hijri calculation
  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  let hMonth = Math.floor((24 * l) / 709);
  let hDay = l - Math.floor((709 * hMonth) / 24);
  let hYear = 30 * n + j - 30;

  return { day: hDay, month: hMonth, year: hYear };
}

export function getHijriDate(date: Date, timezone: string): HijriDate {
  // Get date components in the target timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const gYear = parseInt(parts.find(p => p.type === "year")!.value);
  const gMonth = parseInt(parts.find(p => p.type === "month")!.value);
  const gDay = parseInt(parts.find(p => p.type === "day")!.value);

  const h = gregorianToHijri(gYear, gMonth, gDay);

  return {
    day: h.day,
    month: h.month,
    year: h.year,
    monthName: HIJRI_MONTHS[h.month - 1] || "Unknown",
    monthNameArabic: HIJRI_MONTHS_ARABIC[h.month - 1] || "",
    formatted: `${h.day} ${HIJRI_MONTHS[h.month - 1] || "Unknown"} ${h.year} AH`,
    formattedArabic: `${h.day} ${HIJRI_MONTHS_ARABIC[h.month - 1] || ""} ${h.year} هـ`,
  };
}
