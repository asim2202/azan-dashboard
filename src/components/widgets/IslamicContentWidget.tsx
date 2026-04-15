"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WidgetProps } from "@/types/widget";

interface Hadith {
  arabic: string;
  english: string;
  reference: string;
  narrator: string;
}

interface Verse {
  arabic: string;
  translation: string;
  reference: string;
}

/* ── Auto-scroll hook: slowly scrolls content when it overflows ── */
function useAutoScroll(deps: unknown[]) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // Reset scroll position on content change
    outer.scrollTop = 0;

    // Wait a moment for layout to settle
    const checkTimer = setTimeout(() => {
      const overflow = inner.scrollHeight - outer.clientHeight;
      if (overflow <= 0) {
        setNeedsScroll(false);
        return; // fits, no scroll needed
      }
      setNeedsScroll(true);

      // Calculate duration: ~40px/sec scroll speed
      const speed = 40;
      const pauseStart = 10000; // 10s pause at top before scrolling
      const pauseEnd = 10000;   // 10s pause at bottom before resetting
      const scrollDuration = (overflow / speed) * 1000;

      let animFrame: number;
      let startTime: number | null = null;
      let phase: "pause-start" | "scrolling" | "pause-end" = "pause-start";
      let phaseStart = 0;

      const el = outer; // capture non-null ref for closure
      function tick(timestamp: number) {
        if (!el) return;
        if (!startTime) {
          startTime = timestamp;
          phaseStart = timestamp;
        }

        const elapsed = timestamp - phaseStart;

        if (phase === "pause-start") {
          if (elapsed >= pauseStart) {
            phase = "scrolling";
            phaseStart = timestamp;
          }
        } else if (phase === "scrolling") {
          const progress = Math.min(elapsed / scrollDuration, 1);
          // Ease in-out for smooth feel
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          el.scrollTop = eased * overflow;

          if (progress >= 1) {
            phase = "pause-end";
            phaseStart = timestamp;
          }
        } else if (phase === "pause-end") {
          if (elapsed >= pauseEnd) {
            // Reset and loop
            el.scrollTop = 0;
            phase = "pause-start";
            phaseStart = timestamp;
          }
        }

        animFrame = requestAnimationFrame(tick);
      }

      animFrame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animFrame);
    }, 500);

    return () => clearTimeout(checkTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { outerRef, innerRef, needsScroll };
}

export default function IslamicContentWidget({ size }: WidgetProps) {
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [activeSlide, setActiveSlide] = useState<"hadith" | "ayah">("ayah");
  const [fading, setFading] = useState(false);

  const { outerRef, innerRef, needsScroll } = useAutoScroll([activeSlide, hadith, verse, fading]);

  // Fetch both
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

  if (!hadith && !verse) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const showHadith = activeSlide === "hadith" && hadith;
  const showAyah = activeSlide === "ayah" && verse;

  return (
    <div className="h-full flex flex-col select-none overflow-hidden px-4">
      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-3 pt-1 pb-4 flex-shrink-0">
        <button
          onClick={() => { if (activeSlide !== "ayah") { setFading(true); setTimeout(() => { setActiveSlide("ayah"); setFading(false); }, 400); } }}
          className="flex items-center gap-1.5 transition-opacity"
          style={{ opacity: activeSlide === "ayah" ? 1 : 0.3 }}
        >
          <span className="block w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="text-sm uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>Ayah</span>
        </button>
        <button
          onClick={() => { if (activeSlide !== "hadith") { setFading(true); setTimeout(() => { setActiveSlide("hadith"); setFading(false); }, 400); } }}
          className="flex items-center gap-1.5 transition-opacity"
          style={{ opacity: activeSlide === "hadith" ? 1 : 0.3 }}
        >
          <span className="block w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="text-sm uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>Hadith</span>
        </button>
      </div>

      {/* Content area with fade + auto-scroll */}
      <div
        ref={outerRef}
        className={`flex-1 overflow-hidden transition-opacity duration-400 ${needsScroll ? "" : "flex items-center"}`}
        style={{ opacity: fading ? 0 : 1, ...(needsScroll ? { maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)" } : {}) }}
      >
        <div ref={innerRef} className={needsScroll ? "" : "w-full"}>
          {showAyah && (
            <>
              <p className="text-right text-3xl leading-relaxed mb-4 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>
                {verse.arabic}
              </p>
              <p className="text-xl leading-relaxed italic mb-4" style={{ color: "var(--text-primary)" }}>
                &ldquo;{verse.translation}&rdquo;
              </p>
              <p className="text-lg font-semibold text-right" style={{ color: "var(--accent-text)" }}>
                {verse.reference}
              </p>
            </>
          )}

          {showHadith && (
            <>
              {hadith.arabic && (
                <p className="text-right text-3xl leading-relaxed mb-4 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>
                  {hadith.arabic}
                </p>
              )}
              <p className="text-xl leading-relaxed italic mb-4" style={{ color: "var(--text-primary)" }}>
                &ldquo;{hadith.english}&rdquo;
              </p>
              <p className="text-lg font-semibold text-right" style={{ color: "var(--accent-text)" }}>
                {hadith.narrator} &middot; {hadith.reference}
              </p>
            </>
          )}

          {/* Fallback if active data hasn't loaded yet */}
          {!showAyah && !showHadith && (
            <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
