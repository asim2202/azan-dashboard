"use client";

import { useAutoScroll, type Hadith, type Verse } from "./islamic-shared";

interface Props {
  hadith: Hadith | null;
  verse: Verse | null;
  activeSlide: "hadith" | "ayah";
  fading: boolean;
  onSetSlide: (slide: "hadith" | "ayah") => void;
}

export default function IslamicContentWidgetH({ hadith, verse, activeSlide, fading, onSetSlide }: Props) {
  // Scroll should restart ONLY when the displayed content changes.
  // Don't include `fading` (pure visual state) or the non-displayed slide's
  // content (refetching the other one shouldn't reset the current scroll).
  const displayed = activeSlide === "hadith" ? hadith : verse;
  const { outerRef, innerRef, needsScroll } = useAutoScroll([activeSlide, displayed]);

  const showHadith = activeSlide === "hadith" && hadith;
  const showAyah = activeSlide === "ayah" && verse;

  return (
    <div className="h-full flex flex-col select-none overflow-hidden px-4">
      <div className="flex items-center justify-center gap-3 pt-1 pb-3 flex-shrink-0">
        <button onClick={() => onSetSlide("ayah")} className="flex items-center gap-1.5 transition-opacity" style={{ opacity: activeSlide === "ayah" ? 1 : 0.3 }}>
          <span className="block w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="text-sm uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>Ayah</span>
        </button>
        <button onClick={() => onSetSlide("hadith")} className="flex items-center gap-1.5 transition-opacity" style={{ opacity: activeSlide === "hadith" ? 1 : 0.3 }}>
          <span className="block w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="text-sm uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>Hadith</span>
        </button>
      </div>

      <div
        ref={outerRef}
        className={`flex-1 overflow-hidden transition-opacity duration-400 ${needsScroll ? "" : "flex items-center"}`}
        style={{ opacity: fading ? 0 : 1, ...(needsScroll ? { maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)" } : {}) }}
      >
        <div ref={innerRef} className={needsScroll ? "" : "w-full"}>
          {showAyah && verse && (
            <>
              <p className="text-right text-3xl leading-relaxed mb-3 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>{verse.arabic}</p>
              <p className="text-lg leading-relaxed italic mb-3" style={{ color: "var(--text-primary)" }}>&ldquo;{verse.translation}&rdquo;</p>
              <p className="text-base font-semibold text-right" style={{ color: "var(--accent-text)" }}>{verse.reference}</p>
            </>
          )}
          {showHadith && hadith && (
            <>
              {hadith.arabic && (
                <p className="text-right text-3xl leading-relaxed mb-3 font-arabic" style={{ color: "var(--text-primary)", direction: "rtl" }}>{hadith.arabic}</p>
              )}
              <p className="text-lg leading-relaxed italic mb-3" style={{ color: "var(--text-primary)" }}>&ldquo;{hadith.english}&rdquo;</p>
              <p className="text-base font-semibold text-right" style={{ color: "var(--accent-text)" }}>{hadith.narrator} &middot; {hadith.reference}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
