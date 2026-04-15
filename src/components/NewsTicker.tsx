"use client";

import { useState, useEffect, useRef } from "react";

interface NewsItem {
  title: string;
  source: string;
}

export default function NewsTicker() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const tickerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Fetch headlines
  useEffect(() => {
    const load = () => {
      fetch("/api/news")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data) && data.length > 0) setItems(data); })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 15 * 60 * 1000); // refresh every 15 min
    return () => clearInterval(interval);
  }, []);

  // CSS animation for smooth infinite scroll
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || items.length === 0) return;

    // Wait for layout
    const timer = setTimeout(() => {
      const contentWidth = inner.scrollWidth / 2; // we duplicate content
      const speed = 120; // pixels per second
      const duration = contentWidth / speed;
      inner.style.animationDuration = `${duration}s`;
    }, 100);

    return () => clearTimeout(timer);
  }, [items]);

  if (items.length === 0) return null;

  // Build the ticker text — duplicate for seamless loop
  const separator = " \u00A0\u00A0\u2022\u00A0\u00A0 "; // bullet separator
  const tickerText = items.map((item) => item.title).join(separator);

  return (
    <div
      ref={tickerRef}
      className="w-full overflow-hidden select-none"
      style={{
        height: "100%",
        background: "rgba(0,0,0,0.25)",
        borderRadius: "0.75rem",
      }}
    >
      <div
        ref={innerRef}
        className="news-ticker-scroll flex items-center h-full whitespace-nowrap"
        style={{ color: "var(--text-secondary)" }}
      >
        <span className="text-base font-semibold px-4 shrink-0" style={{ color: "var(--accent-text)" }}>
          THE NATIONAL
        </span>
        <span className="text-base">{tickerText}</span>
        <span className="text-base">{separator}{tickerText}</span>
      </div>
    </div>
  );
}
