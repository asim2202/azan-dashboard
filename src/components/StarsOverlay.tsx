"use client";

import { useMemo } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  brightness: number;
}

export default function StarsOverlay({ isNight }: { isNight: boolean }) {
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (): Star => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 10,
      duration: Math.random() * 4 + 2,
      brightness: Math.random() * 0.5 + 0.5,
    }));
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
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
