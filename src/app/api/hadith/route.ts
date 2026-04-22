// Hadith of the Day using sunnah.com API
// Returns a random hadith from Sahih Bukhari or Sahih Muslim

let cached: { arabic: string; english: string; reference: string; narrator: string; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — matches client-side refresh so a new hadith appears each hour

// Use specific well-known hadiths from Bukhari/Muslim for reliability
const COLLECTIONS = [
  { name: "bukhari", book: 1, range: [1, 50] },
  { name: "bukhari", book: 2, range: [1, 40] },
  { name: "bukhari", book: 3, range: [1, 40] },
  { name: "muslim", book: 1, range: [1, 50] },
];

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Response.json(cached);
  }

  try {
    // Pick a random collection and hadith number
    const col = COLLECTIONS[Math.floor(Math.random() * COLLECTIONS.length)];
    const hadithNum = col.range[0] + Math.floor(Math.random() * (col.range[1] - col.range[0]));

    const url = `https://api.sunnah.com/v1/hadiths/${col.name}:${hadithNum}`;
    const res = await fetch(url, {
      headers: { "x-api-key": "SqD712P3E82xnwOAEOkGd5JZH8s9wRR24TqNFzjk" },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.hadith) {
        const hadith = data.hadith.find((h: { lang: string }) => h.lang === "en");
        const arabicHadith = data.hadith.find((h: { lang: string }) => h.lang === "ar");

        if (hadith) {
          const result = {
            arabic: arabicHadith?.body || "",
            english: hadith.body.replace(/<[^>]*>/g, "").trim(),
            reference: `${col.name === "bukhari" ? "Sahih al-Bukhari" : "Sahih Muslim"} ${hadithNum}`,
            narrator: hadith.chapterTitle || "",
            timestamp: Date.now(),
          };
          cached = result;
          return Response.json(result);
        }
      }
    }

    // Fallback: use a well-known hadith
    throw new Error("API failed");
  } catch {
    const fallback = {
      arabic: "\u0625\u0650\u0646\u0651\u064E\u0645\u064E\u0627 \u0627\u0644\u0623\u064E\u0639\u0652\u0645\u064E\u0627\u0644\u064F \u0628\u0650\u0627\u0644\u0646\u0651\u0650\u064A\u0651\u064E\u0627\u062A\u0650",
      english: "Actions are judged by intentions, and every person will be rewarded according to what they intended.",
      reference: "Sahih al-Bukhari 1",
      narrator: "Narrated by Umar ibn Al-Khattab",
      timestamp: Date.now(),
    };
    cached = fallback;
    return Response.json(fallback);
  }
}
