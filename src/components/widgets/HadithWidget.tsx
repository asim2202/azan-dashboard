"use client";

import { useState, useEffect } from "react";
import type { WidgetProps } from "@/types/widget";

interface Hadith {
  arabic: string;
  english: string;
  reference: string;
  narrator: string;
}

export default function HadithWidget({ size }: WidgetProps) {
  const [hadith, setHadith] = useState<Hadith | null>(null);

  useEffect(() => {
    fetch("/api/hadith")
      .then((r) => r.json())
      .then(setHadith)
      .catch(() => {});
  }, []);

  if (!hadith) {
    return <div className="h-full flex items-center justify-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading hadith...</p></div>;
  }

  return (
    <div className="h-full flex flex-col justify-center select-none overflow-hidden px-2">
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Hadith of the Day</p>

      {/* Arabic text */}
      {hadith.arabic && size !== "S" && (
        <p className="text-right text-lg sm:text-xl leading-relaxed mb-2 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>
          {hadith.arabic.length > 200 ? hadith.arabic.substring(0, 200) + "..." : hadith.arabic}
        </p>
      )}

      {/* English translation */}
      {size !== "S" && (
        <p className="text-sm leading-relaxed italic" style={{ color: "var(--text-secondary)" }}>
          &ldquo;{hadith.english.length > 300 ? hadith.english.substring(0, 300) + "..." : hadith.english}&rdquo;
        </p>
      )}

      {/* Reference */}
      <p className="text-xs mt-2 text-right" style={{ color: "var(--accent-text)" }}>
        {hadith.narrator} &middot; {hadith.reference}
      </p>
    </div>
  );
}
