"use client";

import { useState, useEffect } from "react";

interface Verse { arabic: string; translation: string; reference: string; }

export default function QuranVerseWidgetH() {
  const [verse, setVerse] = useState<Verse | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/quran-verse").then((r) => r.json()).then((d) => { if (d.arabic) setVerse(d); }).catch(() => {});
    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!verse) return <div className="h-full flex items-center justify-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading verse...</p></div>;

  return (
    <div className="h-full flex flex-col justify-center select-none overflow-hidden px-2">
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Ayah of the Day</p>
      <p className="text-right text-xl leading-relaxed mb-2 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>
        {verse.arabic.length > 200 ? verse.arabic.substring(0, 200) + "..." : verse.arabic}
      </p>
      <p className="text-xs mt-2 text-right" style={{ color: "var(--accent-text)" }}>{verse.reference}</p>
    </div>
  );
}
