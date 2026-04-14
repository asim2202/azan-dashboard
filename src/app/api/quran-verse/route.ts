// Returns a random short Quran verse with English translation
// Uses Al-Quran Cloud API: https://alquran.cloud/api

let cachedVerse: { arabic: string; translation: string; reference: string; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Short surahs that work well for display (last juz)
const SHORT_SURAHS = [
  93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
];

export async function GET() {
  // Return cached if fresh
  if (cachedVerse && Date.now() - cachedVerse.timestamp < CACHE_TTL) {
    return Response.json(cachedVerse);
  }

  try {
    // Pick a random short surah
    const surah = SHORT_SURAHS[Math.floor(Math.random() * SHORT_SURAHS.length)];

    // Fetch Arabic and English in parallel
    const [arRes, enRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`),
      fetch(`https://api.alquran.cloud/v1/surah/${surah}/en.sahih`),
    ]);

    if (!arRes.ok || !enRes.ok) throw new Error("API error");

    const arData = await arRes.json();
    const enData = await enRes.json();

    const arAyahs = arData.data.ayahs;
    const enAyahs = enData.data.ayahs;
    const surahName = arData.data.englishName;

    // Pick a random ayah (or first few for very short surahs)
    const idx = Math.floor(Math.random() * Math.min(3, arAyahs.length));

    const verse = {
      arabic: arAyahs[idx].text,
      translation: enAyahs[idx].text,
      reference: `${surahName} (${surah}:${idx + 1})`,
      timestamp: Date.now(),
    };

    cachedVerse = verse;
    return Response.json(verse);
  } catch (err) {
    console.error("[Quran] Fetch failed:", err);

    // Fallback verse
    return Response.json({
      arabic: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650",
      translation: "In the name of Allah, the Most Gracious, the Most Merciful",
      reference: "Al-Fatihah (1:1)",
    });
  }
}
