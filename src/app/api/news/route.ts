import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

// Cache in memory — refresh every 15 minutes
let cache: { items: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

function parseXml(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "The National";

    if (title && !title.includes("Google News")) {
      items.push({ title, link, pubDate, source });
    }
  }

  return items;
}

async function fetchNews(): Promise<NewsItem[]> {
  // Google News RSS filtered to The National
  const url = "https://news.google.com/rss/search?q=site:thenationalnews.com&hl=en&gl=AE&ceid=AE:en";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AzanClock/1.0)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseXml(xml).slice(0, 15); // top 15 headlines
  } catch (err) {
    console.error("News fetch failed:", err);
    return [];
  }
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL && cache.items.length > 0) {
    return NextResponse.json(cache.items);
  }

  const items = await fetchNews();

  if (items.length > 0) {
    cache = { items, fetchedAt: now };
  }

  return NextResponse.json(items);
}
