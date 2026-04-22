"use client";

import { useState, useEffect } from "react";

interface Hadith {
  arabic: string; english: string; reference: string; narrator: string;
}

export default function HadithWidgetV() {
  const [hadith, setHadith] = useState<Hadith | null>(null);

  useEffect(() => {
    fetch("/api/hadith").then((r) => r.json()).then(setHadith).catch(() => {});
  }, []);

  if (!hadith) return <div className="h-full flex items-center justify-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading hadith...</p></div>;

  return (
    <div className="h-full flex flex-col justify-center select-none overflow-hidden px-3">
      <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-faint)" }}>Hadith of the Day</p>
      {hadith.arabic && (
        <p className="text-right text-2xl leading-relaxed mb-3 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>
          {hadith.arabic.length > 200 ? hadith.arabic.substring(0, 200) + "..." : hadith.arabic}
        </p>
      )}
      <p className="text-base leading-relaxed italic" style={{ color: "var(--text-secondary)" }}>
        &ldquo;{hadith.english.length > 300 ? hadith.english.substring(0, 300) + "..." : hadith.english}&rdquo;
      </p>
      <p className="text-sm mt-3 text-right" style={{ color: "var(--accent-text)" }}>
        {hadith.narrator} &middot; {hadith.reference}
      </p>
    </div>
  );
}
