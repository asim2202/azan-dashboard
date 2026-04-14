"use client";

import { useState, useEffect } from "react";
import type { WeatherData } from "@/types/weather";

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("Weather fetch failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setWeather(data);
        setError(null);
      } catch (err) {
        setError("Weather unavailable");
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // 30 min
    return () => clearInterval(interval);
  }, []);

  return { weather, error };
}
