"use client";

import { useMemo } from "react";

type Effect = "rain" | "snow" | "drizzle" | null;

function getEffect(weatherCode: number | undefined): Effect {
  if (weatherCode === undefined) return null;
  if (weatherCode >= 71 && weatherCode <= 75) return "snow";
  if (weatherCode >= 51 && weatherCode <= 55) return "drizzle";
  if ((weatherCode >= 61 && weatherCode <= 65) || (weatherCode >= 80 && weatherCode <= 82) || weatherCode >= 95) return "rain";
  return null;
}

interface Particle {
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

export default function WeatherEffectsOverlay({ weatherCode }: { weatherCode?: number }) {
  const effect = getEffect(weatherCode);

  const particles = useMemo(() => {
    if (!effect) return [];
    const count = effect === "rain" ? 80 : effect === "drizzle" ? 35 : 50;
    return Array.from({ length: count }, (): Particle => ({
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: effect === "snow"
        ? Math.random() * 5 + 5
        : effect === "drizzle"
          ? Math.random() * 2 + 1.5
          : Math.random() * 1.5 + 0.6,
      size: effect === "snow"
        ? Math.random() * 4 + 2
        : Math.random() * 1.5 + 0.5,
      opacity: effect === "snow"
        ? Math.random() * 0.3 + 0.15
        : Math.random() * 0.15 + 0.08,
    }));
  }, [effect]);

  if (!effect) return null;

  const isSnow = effect === "snow";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            width: isSnow ? `${p.size}px` : `${p.size}px`,
            height: isSnow ? `${p.size}px` : `${p.size * 15}px`,
            background: isSnow
              ? `rgba(255, 255, 255, ${p.opacity})`
              : `rgba(180, 210, 255, ${p.opacity})`,
            borderRadius: isSnow ? "50%" : "2px",
            animation: `${isSnow ? "snowFall" : "rainDrop"} ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
