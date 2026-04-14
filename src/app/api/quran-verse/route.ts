// Ayat of the Day - Muhsin Khan translation (en.hilali)
// Uses Al-Quran Cloud API: https://alquran.cloud/api

let cachedVerse: { arabic: string; translation: string; reference: string; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Popular surahs with impactful short verses
const VERSE_SELECTIONS = [
  { surah: 2, ayah: 255 },    // Ayat al-Kursi
  { surah: 2, ayah: 286 },    // Last verse of Al-Baqarah
  { surah: 3, ayah: 139 },    // Do not lose heart
  { surah: 13, ayah: 28 },    // Hearts find rest in remembrance
  { surah: 16, ayah: 90 },    // Justice and kindness
  { surah: 23, ayah: 115 },   // Created without purpose?
  { surah: 24, ayah: 35 },    // Light upon light
  { surah: 33, ayah: 56 },    // Send blessings on the Prophet
  { surah: 39, ayah: 53 },    // Do not despair
  { surah: 49, ayah: 13 },    // Created from male and female
  { surah: 55, ayah: 13 },    // Which favors will you deny?
  { surah: 93, ayah: 5 },     // Your Lord will give you
  { surah: 94, ayah: 5 },     // With hardship comes ease
  { surah: 94, ayah: 6 },     // With hardship comes ease
  { surah: 112, ayah: 1 },    // Say He is Allah, One
  { surah: 113, ayah: 1 },    // Say I seek refuge
  { surah: 114, ayah: 1 },    // Say I seek refuge in the Lord of mankind
];

export async function GET() {
  if (cachedVerse && Date.now() - cachedVerse.timestamp < CACHE_TTL) {
    return Response.json(cachedVerse);
  }

  try {
    const pick = VERSE_SELECTIONS[Math.floor(Math.random() * VERSE_SELECTIONS.length)];

    // Fetch Arabic and Muhsin Khan translation in parallel
    const [arRes, enRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${pick.surah}:${pick.ayah}/ar.alafasy`),
      fetch(`https://api.alquran.cloud/v1/ayah/${pick.surah}:${pick.ayah}/en.hilali`),
    ]);

    if (!arRes.ok || !enRes.ok) throw new Error("API error");

    const arData = await arRes.json();
    const enData = await enRes.json();

    const surahName = arData.data.surah.englishName;

    const verse = {
      arabic: arData.data.text,
      translation: enData.data.text,
      reference: `${surahName} (${pick.surah}:${pick.ayah})`,
      timestamp: Date.now(),
    };

    cachedVerse = verse;
    return Response.json(verse);
  } catch (err) {
    console.error("[Quran] Fetch failed:", err);

    return Response.json({
      arabic: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650",
      translation: "In the Name of Allah, the Most Gracious, the Most Merciful",
      reference: "Al-Fatihah (1:1)",
    });
  }
}
