"use client";

import { useMemo } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  brightness: number;
  glow: boolean;
}

export default function StarsOverlay({ isNight }: { isNight: boolean }) {
  const stars = useMemo(() => {
    return Array.from({ length: 140 }, (_, i): Star => {
      // Every ~15th star is a "hero" — bigger + glow
      const isHero = i % 15 === 0;
      return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: isHero ? Math.random() * 2 + 2.5 : Math.random() * 1.8 + 1,
        delay: Math.random() * 10,
        duration: Math.random() * 4 + 2,
        brightness: isHero ? 1 : Math.random() * 0.3 + 0.7,
        glow: isHero,
      };
    });
  }, []);

  if (!isNight) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: `rgba(255, 255, 255, ${star.brightness})`,
            boxShadow: star.glow
              ? `0 0 ${star.size * 3}px rgba(255, 255, 255, 0.9), 0 0 ${star.size * 6}px rgba(180, 200, 255, 0.4)`
              : `0 0 ${star.size * 1.5}px rgba(255, 255, 255, 0.5)`,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
