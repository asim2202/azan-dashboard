"use client";

import { useState, useEffect } from "react";

interface Hadith {
  arabic: string; english: string; reference: string; narrator: string;
}

export default function HadithWidgetH() {
  const [hadith, setHadith] = useState<Hadith | null>(null);

  useEffect(() => {
    fetch("/api/hadith").then((r) => r.json()).then(setHadith).catch(() => {});
  }, []);

  if (!hadith) return <div className="h-full flex items-center justify-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading hadith...</p></div>;

  return (
    <div className="h-full flex flex-col justify-center select-none overflow-hidden px-2">
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Hadith of the Day</p>
      <p className="text-xs mt-2 text-right" style={{ color: "var(--accent-text)" }}>
        {hadith.narrator} &middot; {hadith.reference}
      </p>
    </div>
  );
}
