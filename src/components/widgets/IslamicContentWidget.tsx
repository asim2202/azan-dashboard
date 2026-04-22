"use client";

import { useState, useEffect, useCallback } from "react";
import type { WidgetProps } from "@/types/widget";
import type { Hadith, Verse } from "./islamic-shared";
import IslamicContentWidgetH from "./IslamicContentWidgetH";
import IslamicContentWidgetV from "./IslamicContentWidgetV";

export default function IslamicContentWidget({ size }: WidgetProps) {
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [activeSlide, setActiveSlide] = useState<"hadith" | "ayah">("ayah");
  const [fading, setFading] = useState(false);

  // Fetch both sources, then refresh hourly
  useEffect(() => {
    fetch("/api/hadith").then((r) => r.json()).then(setHadith).catch(() => {});
    fetch("/api/quran-verse").then((r) => r.json()).then((d) => { if (d.arabic) setVerse(d); }).catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/hadith").then((r) => r.json()).then(setHadith).catch(() => {});
      fetch("/api/quran-verse").then((r) => r.json()).then((d) => { if (d.arabic) setVerse(d); }).catch(() => {});
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Rotate every 30s
  const rotate = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setActiveSlide((prev) => (prev === "ayah" ? "hadith" : "ayah"));
      setFading(false);
    }, 400);
  }, []);

  useEffect(() => {
    const timer = setInterval(rotate, 30000);
    return () => clearInterval(timer);
  }, [rotate]);

  // Manual slide change (on dot button click) — fade, switch, fade back
  const setSlide = useCallback((slide: "hadith" | "ayah") => {
    setActiveSlide((prev) => {
      if (prev === slide) return prev;
      setFading(true);
      setTimeout(() => {
        setActiveSlide(slide);
        setFading(false);
      }, 400);
      return prev;
    });
  }, []);

  if (!hadith && !verse) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const viewProps = { hadith, verse, activeSlide, fading, onSetSlide: setSlide };
  return size === "H" ? <IslamicContentWidgetH {...viewProps} /> : <IslamicContentWidgetV {...viewProps} />;
}
