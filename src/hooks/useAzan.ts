"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PrayerTime, PrayerName } from "@/types/prayer";

interface AzanState {
  isPlaying: boolean;
  currentPrayer: PrayerName | null;
  showOverlay: boolean;
  iqamaCountdownEnd: Date | null;
}

const AZAN_PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export function useAzan(
  prayers: PrayerTime[] | undefined,
  currentTime: Date,
  audioEnabled: boolean,
  audioUnlocked: boolean,
  defaultAzan: string,
  fajrAzan: string,
  volume: number
) {
  const [state, setState] = useState<AzanState>({
    isPlaying: false,
    currentPrayer: null,
    showOverlay: false,
    iqamaCountdownEnd: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triggeredRef = useRef<Set<PrayerName>>(new Set());
  const lastDateRef = useRef<string>("");

  // Reset triggered prayers at midnight
  const today = currentTime.toLocaleDateString("en-CA");
  if (today !== lastDateRef.current) {
    triggeredRef.current.clear();
    lastDateRef.current = today;
  }

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
      }));
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Check for azan trigger
  useEffect(() => {
    if (!prayers || !audioEnabled || !audioUnlocked) return;

    const now = currentTime.getTime();

    for (const prayer of prayers) {
      if (!AZAN_PRAYERS.includes(prayer.name)) continue;
      if (triggeredRef.current.has(prayer.name)) continue;

      const azanTime = prayer.azanDate.getTime();
      const diff = now - azanTime;

      // Trigger if within 60-second window after azan time
      if (diff >= 0 && diff < 60000) {
        triggeredRef.current.add(prayer.name);

        const src = prayer.name === "fajr" ? fajrAzan : defaultAzan;
        const audio = audioRef.current;
        if (audio) {
          audio.src = src;
          audio.volume = volume;
          audio.play().catch((err) => {
            console.error("[Azan] Playback failed:", err);
          });
        }

        setState({
          isPlaying: true,
          currentPrayer: prayer.name,
          showOverlay: true,
          iqamaCountdownEnd: prayer.iqamaDate,
        });

        break; // Only trigger one prayer at a time
      }
    }
  }, [prayers, currentTime, audioEnabled, audioUnlocked, defaultAzan, fajrAzan, volume]);

  const dismissOverlay = useCallback(() => {
    setState((prev) => ({ ...prev, showOverlay: false }));
  }, []);

  // Auto-dismiss overlay after iqama time passes
  useEffect(() => {
    if (!state.showOverlay || !state.iqamaCountdownEnd) return;
    if (!state.isPlaying && currentTime.getTime() > state.iqamaCountdownEnd.getTime() + 60000) {
      setState((prev) => ({ ...prev, showOverlay: false }));
    }
  }, [state.showOverlay, state.iqamaCountdownEnd, state.isPlaying, currentTime]);

  return {
    ...state,
    dismissOverlay,
    audioRef,
  };
}
