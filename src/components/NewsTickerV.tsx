"use client";

import { useState, useEffect, useRef } from "react";

interface NewsItem { title: string; source: string; }

export default function NewsTickerV() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/news")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data) && data.length > 0) setItems(data); })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || items.length === 0) return;
    const timer = setTimeout(() => {
      const contentWidth = inner.scrollWidth / 2;
      const speed = 140;
      const duration = contentWidth / speed;
      inner.style.animationDuration = `${duration}s`;
    }, 100);
    return () => clearTimeout(timer);
  }, [items]);

  if (items.length === 0) return null;

  const separator = " \u00A0\u00A0\u2022\u00A0\u00A0 ";
  const tickerText = items.map((item) => item.title).join(separator);

  return (
    <div className="w-full overflow-hidden select-none h-full" style={{ background: "rgba(0,0,0,0.25)", borderRadius: "0.75rem" }}>
      <div
        ref={innerRef}
        className="news-ticker-scroll flex items-center h-full whitespace-nowrap"
        style={{ color: "var(--text-secondary)" }}
      >
        <span className="text-2xl font-semibold px-6 shrink-0" style={{ color: "var(--accent-text)" }}>
          THE NATIONAL
        </span>
        <span className="text-2xl">{tickerText}</span>
        <span className="text-2xl">{separator}{tickerText}</span>
      </div>
    </div>
  );
}
