"use client";

import { useState, useEffect, useRef } from "react";

export interface Hadith {
  arabic: string;
  english: string;
  reference: string;
  narrator: string;
}

export interface Verse {
  arabic: string;
  translation: string;
  reference: string;
}

/** Auto-scroll hook: slowly scrolls content when it overflows. */
export function useAutoScroll(deps: unknown[]) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    outer.scrollTop = 0;

    // Track animation frame at the effect scope so cleanup actually cancels it.
    let animFrame: number | null = null;

    const checkTimer = setTimeout(() => {
      const el = outer;
      const overflow = inner.scrollHeight - el.clientHeight;
      if (overflow <= 0) {
        setNeedsScroll(false);
        return;
      }
      setNeedsScroll(true);

      const speed = 40; // px/sec
      const pauseStart = 10000;
      const pauseEnd = 10000;
      const scrollDuration = (overflow / speed) * 1000;

      let phase: "pause-start" | "scrolling" | "pause-end" = "pause-start";
      let phaseStart = 0;

      function tick(timestamp: number) {
        if (!phaseStart) phaseStart = timestamp;
        const elapsed = timestamp - phaseStart;

        if (phase === "pause-start") {
          if (elapsed >= pauseStart) {
            phase = "scrolling";
            phaseStart = timestamp;
          }
        } else if (phase === "scrolling") {
          const progress = Math.min(elapsed / scrollDuration, 1);
          const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          el.scrollTop = eased * overflow;
          if (progress >= 1) {
            phase = "pause-end";
            phaseStart = timestamp;
          }
        } else if (phase === "pause-end") {
          if (elapsed >= pauseEnd) {
            el.scrollTop = 0;
            phase = "pause-start";
            phaseStart = timestamp;
          }
        }
        animFrame = requestAnimationFrame(tick);
      }
      animFrame = requestAnimationFrame(tick);
    }, 500);

    return () => {
      clearTimeout(checkTimer);
      if (animFrame !== null) cancelAnimationFrame(animFrame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { outerRef, innerRef, needsScroll };
}
