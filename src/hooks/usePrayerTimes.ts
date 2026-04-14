"use client";

import { useState, useEffect, useCallback } from "react";
import type { DailyPrayers, PrayerTime, PrayerName } from "@/types/prayer";

interface PrayerTimesState {
  data: DailyPrayers | null;
  loading: boolean;
  error: string | null;
  nextPrayer: PrayerTime | null;
}

const AZAN_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export function usePrayerTimes(timezone: string) {
  const [state, setState] = useState<PrayerTimesState>({
    data: null,
    loading: true,
    error: null,
    nextPrayer: null,
  });

  const fetchTimes = useCallback(async () => {
    try {
      const res = await fetch("/api/prayer-times");
      if (!res.ok) throw new Error("Failed to fetch prayer times");
      const data: DailyPrayers = await res.json();

      // Rehydrate dates from ISO strings
      data.prayers = data.prayers.map((p) => ({
        ...p,
        azanDate: new Date(p.azanDate),
        iqamaDate: p.iqamaDate ? new Date(p.iqamaDate) : null,
      }));

      // Cache in localStorage
      try {
        localStorage.setItem("prayerTimes", JSON.stringify(data));
      } catch {}

      setState((prev) => ({ ...prev, data, loading: false, error: null }));
    } catch (error) {
      // Try localStorage fallback
      try {
        const cached = localStorage.getItem("prayerTimes");
        if (cached) {
          const data: DailyPrayers = JSON.parse(cached);
          data.prayers = data.prayers.map((p) => ({
            ...p,
            azanDate: new Date(p.azanDate),
            iqamaDate: p.iqamaDate ? new Date(p.iqamaDate) : null,
          }));
          setState((prev) => ({ ...prev, data, loading: false, error: "Using cached data" }));
          return;
        }
      } catch {}
      setState((prev) => ({ ...prev, loading: false, error: "Failed to load prayer times" }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTimes();
  }, [fetchTimes]);

  // Refresh at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 30, 0); // 30 seconds past midnight
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => {
      fetchTimes();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [fetchTimes, state.data?.date]);

  // Compute next prayer whenever time updates (called from component)
  const getNextPrayer = useCallback(
    (now: Date): PrayerTime | null => {
      if (!state.data) return null;

      // Only consider azan prayers (not sunrise)
      const azanPrayers = state.data.prayers.filter((p) =>
        AZAN_PRAYERS.includes(p.name)
      );

      for (const prayer of azanPrayers) {
        if (prayer.azanDate.getTime() > now.getTime()) {
          return prayer;
        }
      }

      // All prayers passed today - return tomorrow's Fajr conceptually
      return azanPrayers[0] || null;
    },
    [state.data]
  );

  return {
    ...state,
    getNextPrayer,
    refetch: fetchTimes,
  };
}
