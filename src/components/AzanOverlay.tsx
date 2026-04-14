"use client";

import type { PrayerName } from "@/types/prayer";

interface AzanOverlayProps {
  isPlaying: boolean;
  prayerName: PrayerName | null;
  iqamaCountdownEnd: Date | null;
  currentTime: Date;
  onDismiss: () => void;
}

const PRAYER_DISPLAY: Record<string, { label: string; arabic: string }> = {
  fajr: { label: "Fajr", arabic: "الفجر" },
  dhuhr: { label: "Dhuhr", arabic: "الظهر" },
  asr: { label: "Asr", arabic: "العصر" },
  maghrib: { label: "Maghrib", arabic: "المغرب" },
  isha: { label: "Isha", arabic: "العشاء" },
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function AzanOverlay({
  isPlaying,
  prayerName,
  iqamaCountdownEnd,
  currentTime,
  onDismiss,
}: AzanOverlayProps) {
  if (!prayerName) return null;

  const display = PRAYER_DISPLAY[prayerName] || { label: prayerName, arabic: "" };
  const iqamaMs = iqamaCountdownEnd
    ? iqamaCountdownEnd.getTime() - currentTime.getTime()
    : 0;
  const showIqamaCountdown = !isPlaying && iqamaMs > 0;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 backdrop-blur cursor-pointer"
      onClick={onDismiss}
    >
      {/* Islamic decorative pattern - simplified */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,215,0,0.1) 40px, rgba(255,215,0,0.1) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,215,0,0.1) 40px, rgba(255,215,0,0.1) 41px)`,
        }} />
      </div>

      <div className="relative text-center z-10">
        {/* Bismillah */}
        <p className="text-amber-300/60 text-2xl font-arabic mb-8">
          بسم الله الرحمن الرحيم
        </p>

        {/* Prayer name */}
        <p className="text-amber-300/80 text-lg tracking-widest uppercase mb-2">
          {isPlaying ? "Azan" : "Iqama"} for
        </p>
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-white mb-4">
          {display.label}
        </h1>
        <p className="text-4xl sm:text-5xl text-amber-200/70 font-arabic mb-12">
          {display.arabic}
        </p>

        {/* Status */}
        {isPlaying ? (
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-amber-400 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 20}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-amber-300 text-lg">Playing Azan...</span>
          </div>
        ) : showIqamaCountdown ? (
          <div>
            <p className="text-white/60 text-lg mb-2">Iqama in</p>
            <p
              className="text-5xl sm:text-6xl font-light text-amber-300"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatCountdown(iqamaMs)}
            </p>
          </div>
        ) : (
          <p className="text-amber-300 text-xl">Iqama Time</p>
        )}

        <p className="text-white/20 text-sm mt-12">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
