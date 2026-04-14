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
  iqamaSound: string,
  volume: number
) {
  const [state, setState] = useState<AzanState>({
    isPlaying: false,
    currentPrayer: null,
    showOverlay: false,
    iqamaCountdownEnd: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set()); // "fajr-azan", "fajr-iqama"
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

  // Check for azan and iqama triggers
  useEffect(() => {
    if (!prayers || !audioEnabled || !audioUnlocked) return;
    if (state.isPlaying) return; // Don't interrupt current playback

    const now = currentTime.getTime();

    for (const prayer of prayers) {
      if (!AZAN_PRAYERS.includes(prayer.name)) continue;

      const azanKey = `${prayer.name}-azan`;
      const iqamaKey = `${prayer.name}-iqama`;

      // Check iqama trigger first (if iqama sound is configured)
      if (
        iqamaSound &&
        prayer.iqamaDate &&
        !triggeredRef.current.has(iqamaKey)
      ) {
        const iqamaDiff = now - prayer.iqamaDate.getTime();
        if (iqamaDiff >= 0 && iqamaDiff < 60000) {
          triggeredRef.current.add(iqamaKey);
          const audio = audioRef.current;
          if (audio) {
            audio.src = iqamaSound;
            audio.volume = volume;
            audio.play().catch((err) => {
              console.error("[Iqama] Playback failed:", err);
            });
          }
          setState({
            isPlaying: true,
            currentPrayer: prayer.name,
            showOverlay: false, // No overlay for iqama, just sound
            iqamaCountdownEnd: null,
          });
          return;
        }
      }

      // Check azan trigger
      if (triggeredRef.current.has(azanKey)) continue;

      const azanTime = prayer.azanDate.getTime();
      const diff = now - azanTime;

      if (diff >= 0 && diff < 60000) {
        triggeredRef.current.add(azanKey);

        const src = prayer.name === "fajr" ? fajrAzan : defaultAzan;
        const audio = audioRef.current;
        if (audio && src) {
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

        break;
      }
    }
  }, [prayers, currentTime, audioEnabled, audioUnlocked, defaultAzan, fajrAzan, iqamaSound, volume, state.isPlaying]);

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
