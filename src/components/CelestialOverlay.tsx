"use client";

import { useMemo } from "react";

interface Props {
  currentTime: Date;
  sunrise: Date | null;
  maghrib: Date | null;
  weatherCode?: number;
  /** Enable sun / moon disc */
  celestial?: boolean;
  /** Enable drifting clouds */
  clouds?: boolean;
  /** Enable lightning flashes */
  lightning?: boolean;
}

/**
 * Simple moon-phase calculation based on a known new moon reference date.
 * Returns a value 0..1 where:
 *   0.0  = new moon
 *   0.25 = first quarter (waxing half)
 *   0.5  = full moon
 *   0.75 = last quarter (waning half)
 */
function getMoonPhase(date: Date): number {
  const referenceNewMoon = new Date("2024-01-11T11:57:00Z").getTime();
  const lunarCycleMs = 29.53058867 * 24 * 60 * 60 * 1000;
  const diff = date.getTime() - referenceNewMoon;
  const p = ((diff % lunarCycleMs) + lunarCycleMs) % lunarCycleMs;
  return p / lunarCycleMs;
}

/** Compute sun or moon position on an arc from horizon to horizon. */
function arcPosition(progress: number, peakTopPct: number, horizonTopPct: number) {
  const p = Math.max(0, Math.min(1, progress));
  const leftPct = p * 100;
  const parabola = 1 - 4 * Math.pow(p - 0.5, 2); // 0 at edges, 1 at middle
  const topPct = horizonTopPct - parabola * (horizonTopPct - peakTopPct);
  return { leftPct, topPct };
}

function Sun({ leftPct, topPct }: { leftPct: number; topPct: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: "translate(-50%, -50%)",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,240,180,1) 0%, rgba(255,210,100,0.95) 40%, rgba(255,180,80,0.6) 65%, rgba(255,180,80,0) 90%)",
        boxShadow: "0 0 120px 40px rgba(255, 210, 120, 0.35)",
        filter: "blur(0.3px)",
      }}
    />
  );
}

function Moon({ leftPct, topPct, phase }: { leftPct: number; topPct: number; phase: number }) {
  // Phase 0 = new moon (dark), 0.5 = full moon (bright), returns to 0 at 1.
  // We draw a white circle and overlay a dark circle offset horizontally
  // based on phase. This approximates the lit/unlit terminator.
  const size = 110;
  // Offset of shadow disc: at phase 0 (new) shadow is centered → fully dark.
  // At phase 0.5 (full) shadow is fully off to the side → fully bright.
  const isWaxing = phase <= 0.5;
  const distFromFull = Math.abs(phase - 0.5) * 2; // 0 at full, 1 at new
  const shadowOffsetX = (isWaxing ? -1 : 1) * distFromFull * size;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: "translate(-50%, -50%)",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        background: "radial-gradient(circle at 35% 35%, #f4f1ea 0%, #d8d5cc 60%, #b8b5ad 100%)",
        boxShadow: "0 0 50px 10px rgba(220, 215, 200, 0.25)",
      }}
    >
      {/* Shadow that simulates the moon phase */}
      <div
        className="absolute"
        style={{
          left: `${shadowOffsetX}px`,
          top: 0,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "rgba(8, 10, 20, 0.92)",
          boxShadow: "inset 0 0 25px 5px rgba(8, 10, 20, 0.8)",
        }}
      />
    </div>
  );
}

function Cloud({ top, left, size, delay, duration, opacity }: {
  top: number; left: number; size: number; delay: number; duration: number; opacity: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size * 0.5}px`,
        opacity,
        animation: `cloudDrift ${duration}s linear ${delay}s infinite`,
      }}
    >
      <svg viewBox="0 0 120 60" width="100%" height="100%">
        <ellipse cx="30" cy="40" rx="25" ry="18" fill="white" />
        <ellipse cx="55" cy="30" rx="30" ry="22" fill="white" />
        <ellipse cx="85" cy="38" rx="25" ry="18" fill="white" />
        <ellipse cx="60" cy="45" rx="40" ry="12" fill="white" />
      </svg>
    </div>
  );
}

export default function CelestialOverlay({
  currentTime,
  sunrise,
  maghrib,
  weatherCode,
  celestial = true,
  clouds = true,
  lightning = true,
}: Props) {
  const showClouds = clouds && weatherCode !== undefined && (weatherCode === 2 || weatherCode === 3);
  const showLightning = lightning && weatherCode !== undefined && weatherCode >= 95;

  // Compute sun position (if we're in daytime between sunrise and maghrib)
  const sunInfo = useMemo(() => {
    if (!celestial || !sunrise || !maghrib) return null;
    const t = currentTime.getTime();
    const sr = sunrise.getTime();
    const mg = maghrib.getTime();
    if (t < sr || t >= mg) return null;
    const progress = (t - sr) / (mg - sr);
    const { leftPct, topPct } = arcPosition(progress, 8, 22);
    return { leftPct, topPct };
  }, [currentTime, sunrise, maghrib, celestial]);

  // Compute moon position (if it's nighttime — between maghrib and next sunrise)
  const moonInfo = useMemo(() => {
    if (!celestial || !sunrise || !maghrib) return null;
    const t = currentTime.getTime();
    const sr = sunrise.getTime();
    const mg = maghrib.getTime();
    // Moon visible from maghrib until next sunrise. Approximate next sunrise as sunrise + 24h if we're past maghrib.
    const nextSr = t >= mg ? sr + 24 * 60 * 60 * 1000 : sr;
    if (t < mg && t >= sr) return null; // daytime
    // If it's after midnight but before sunrise, use prev maghrib (maghrib - 24h) as start
    const startMg = t >= mg ? mg : mg - 24 * 60 * 60 * 1000;
    const progress = (t - startMg) / (nextSr - startMg);
    if (progress < 0 || progress > 1) return null;
    const { leftPct, topPct } = arcPosition(progress, 8, 22);
    const phase = getMoonPhase(currentTime);
    return { leftPct, topPct, phase };
  }, [currentTime, sunrise, maghrib, celestial]);

  const cloudList = useMemo(() => {
    if (!showClouds) return [];
    return Array.from({ length: 5 }, (_, i) => ({
      top: 5 + Math.random() * 25,
      left: -20 + (i * 30),
      size: 150 + Math.random() * 100,
      delay: Math.random() * 30,
      duration: 60 + Math.random() * 60,
      opacity: 0.25 + Math.random() * 0.25,
    }));
  }, [showClouds]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {sunInfo && <Sun leftPct={sunInfo.leftPct} topPct={sunInfo.topPct} />}
      {moonInfo && <Moon leftPct={moonInfo.leftPct} topPct={moonInfo.topPct} phase={moonInfo.phase} />}
      {cloudList.map((c, i) => <Cloud key={i} {...c} />)}
      {showLightning && (
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            animation: "lightningFlash 9s ease-in-out infinite",
            opacity: 0,
          }}
        />
      )}
    </div>
  );
}
