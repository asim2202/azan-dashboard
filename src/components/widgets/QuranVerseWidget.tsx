"use client";

import { useState, useEffect } from "react";
import type { WidgetProps } from "@/types/widget";

interface Verse {
  arabic: string;
  translation: string;
  reference: string;
}

export default function QuranVerseWidget({ size }: WidgetProps) {
  const [verse, setVerse] = useState<Verse | null>(null);

  useEffect(() => {
    fetch("/api/quran-verse")
      .then((r) => r.json())
      .then((data) => {
        if (data.arabic) setVerse(data);
      })
      .catch(() => {});

    // Refresh every hour
    const interval = setInterval(() => {
      fetch("/api/quran-verse")
        .then((r) => r.json())
        .then((data) => {
          if (data.arabic) setVerse(data);
        })
        .catch(() => {});
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!verse) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading verse...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center select-none px-2">
      <p className="text-right text-lg sm:text-xl leading-relaxed mb-2 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>
        {verse.arabic}
      </p>
      {size === "L" && (
        <p className="text-sm leading-relaxed italic" style={{ color: "var(--text-secondary)" }}>
          &ldquo;{verse.translation}&rdquo;
        </p>
      )}
      <p className="text-xs mt-2 text-right" style={{ color: "var(--accent-text)" }}>
        {verse.reference}
      </p>
    </div>
  );
}
