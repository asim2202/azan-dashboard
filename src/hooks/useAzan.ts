"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PrayerTime, PrayerName } from "@/types/prayer";
import type { PreIqamaAlertOffsets } from "@/types/config";

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
  volume: number,
  preIqamaAlert?: { enabled: boolean; sound: string; offsets: PreIqamaAlertOffsets }
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
  // Hard timer that force-dismisses the overlay after 5 minutes regardless of
  // audio state — protects against a stuck overlay if the audio.ended event
  // never fires (system hang, audio interrupted, browser tab issues).
  const overlayHardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // When audio finishes, hide overlay and clear playing state.
      setState((prev) => ({ ...prev, isPlaying: false, showOverlay: false }));
    });
    // CRITICAL: also clear playing state on audio error. Without this, a
    // failed pre-iqama or iqama playback (network blip while loading) leaves
    // isPlaying stuck true, which blocks every subsequent azan trigger
    // for the rest of the day.
    audio.addEventListener("error", () => {
      console.warn("[useAzan] audio error", audio.error);
      setState((prev) => ({ ...prev, isPlaying: false, showOverlay: false }));
    });
    // Also catch the case where playback never starts (no canplay within 30s)
    // by listening for stalled.
    audio.addEventListener("stalled", () => {
      console.warn("[useAzan] audio stalled");
    });

    return () => {
      audio.pause();
      audio.src = "";
      if (overlayHardTimerRef.current) clearTimeout(overlayHardTimerRef.current);
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
      const preIqamaKey = `${prayer.name}-preiqama`;

      // Check pre-iqama alert trigger
      if (
        preIqamaAlert?.enabled &&
        preIqamaAlert.sound &&
        prayer.iqamaDate &&
        !triggeredRef.current.has(preIqamaKey)
      ) {
        const minutesBefore = preIqamaAlert.offsets[prayer.name as keyof PreIqamaAlertOffsets] || 0;
        if (minutesBefore > 0) {
          const alertTime = prayer.iqamaDate.getTime() - minutesBefore * 60000;
          const alertDiff = now - alertTime;
          if (alertDiff >= 0 && alertDiff < 60000) {
            triggeredRef.current.add(preIqamaKey);
            const audio = audioRef.current;
            if (audio) {
              audio.src = preIqamaAlert.sound;
              audio.volume = volume;
              audio.play().catch((err) => {
                console.error("[Pre-Iqama Alert] Playback failed:", err);
                // play() rejected → audio.ended will never fire → MUST clear isPlaying ourselves
                setState((prev) => ({ ...prev, isPlaying: false }));
              });
            }
            setState({
              isPlaying: true,
              currentPrayer: prayer.name,
              showOverlay: false, // No overlay for pre-iqama alert
              iqamaCountdownEnd: null,
            });
            // Hard ceiling: 5 min from now, force-clear isPlaying even if
            // every event listener fails. Without this, a silently-stuck
            // playback blocks every subsequent prayer for the rest of the day.
            if (overlayHardTimerRef.current) clearTimeout(overlayHardTimerRef.current);
            overlayHardTimerRef.current = setTimeout(() => {
              setState((prev) => ({ ...prev, isPlaying: false, showOverlay: false }));
            }, 5 * 60 * 1000);
            return;
          }
        }
      }

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
              setState((prev) => ({ ...prev, isPlaying: false }));
            });
          }
          setState({
            isPlaying: true,
            currentPrayer: prayer.name,
            showOverlay: false,
            iqamaCountdownEnd: null,
          });
          if (overlayHardTimerRef.current) clearTimeout(overlayHardTimerRef.current);
          overlayHardTimerRef.current = setTimeout(() => {
            setState((prev) => ({ ...prev, isPlaying: false, showOverlay: false }));
          }, 5 * 60 * 1000);
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
            setState((prev) => ({ ...prev, isPlaying: false, showOverlay: false }));
          });
        }

        setState({
          isPlaying: true,
          currentPrayer: prayer.name,
          showOverlay: true,
          iqamaCountdownEnd: prayer.iqamaDate,
        });

        // Hard ceiling: 5 minutes from now, force the overlay to dismiss
        // even if audio.ended never fires.
        if (overlayHardTimerRef.current) clearTimeout(overlayHardTimerRef.current);
        overlayHardTimerRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, showOverlay: false, isPlaying: false }));
        }, 5 * 60 * 1000);

        break;
      }
    }
  }, [prayers, currentTime, audioEnabled, audioUnlocked, defaultAzan, fajrAzan, iqamaSound, volume, state.isPlaying, preIqamaAlert]);

  const dismissOverlay = useCallback(() => {
    if (overlayHardTimerRef.current) {
      clearTimeout(overlayHardTimerRef.current);
      overlayHardTimerRef.current = null;
    }
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
