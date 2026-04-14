"use client";

import { useState, useEffect, useMemo } from "react";
import Clock from "@/components/Clock";
import DateDisplay from "@/components/DateDisplay";
import NextPrayerBanner from "@/components/NextPrayerBanner";
import PrayerTimesCard from "@/components/PrayerTimesCard";
import WeatherWidget from "@/components/WeatherWidget";
import StatusBar from "@/components/StatusBar";
import AudioUnlockButton from "@/components/AudioUnlockButton";
import AzanOverlay from "@/components/AzanOverlay";
import CameraFeed from "@/components/CameraFeed";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useWeather } from "@/hooks/useWeather";
import { useAzan } from "@/hooks/useAzan";
import type { AppConfig } from "@/types/config";

const DEFAULT_CONFIG: AppConfig = {
  location: { latitude: 25.2048, longitude: 55.2708, city: "Dubai", timezone: "Asia/Dubai" },
  calculationMethod: "Dubai",
  madhab: "Shafi",
  iqamaOffsets: { fajr: 20, dhuhr: 25, asr: 15, maghrib: 5, isha: 15 },
  audio: { enabled: true, defaultAzan: "/audio/azan-makkah.mp3", fajrAzan: "/audio/azan-fajr.mp3", iqamaSound: "", volume: 0.8 },
  display: { timeFormat: "12h", showSeconds: true, theme: "auto" },
  camera: { enabled: false, url: "", type: "image", refreshInterval: 0 },
  dataSources: { iacadEnabled: true, weatherEnabled: true },
};

function computeTheme(
  setting: "auto" | "dark" | "light",
  prayers: { azanDate: Date; name: string }[] | undefined,
  now: Date
): "theme-dark" | "theme-light" {
  if (setting === "dark") return "theme-dark";
  if (setting === "light") return "theme-light";

  // Auto: light between sunrise and maghrib
  if (!prayers) return "theme-dark";
  const sunrise = prayers.find((p) => p.name === "sunrise");
  const maghrib = prayers.find((p) => p.name === "maghrib");
  if (!sunrise || !maghrib) return "theme-dark";

  const nowMs = now.getTime();
  if (nowMs >= sunrise.azanDate.getTime() && nowMs < maghrib.azanDate.getTime()) {
    return "theme-light";
  }
  return "theme-dark";
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const timezone = config.location.timezone;
  const { time: currentTime, mounted } = useCurrentTime();
  const { data: prayerData, loading, getNextPrayer } = usePrayerTimes(timezone);
  const { weather, error: weatherError } = useWeather();

  const nextPrayer = useMemo(
    () => mounted ? getNextPrayer(currentTime) : null,
    [getNextPrayer, currentTime, mounted]
  );

  const themeClass = useMemo(
    () => computeTheme(config.display.theme, prayerData?.prayers, currentTime),
    [config.display.theme, prayerData?.prayers, currentTime]
  );

  const azan = useAzan(
    prayerData?.prayers,
    currentTime,
    config.audio.enabled,
    audioUnlocked,
    config.audio.defaultAzan,
    config.audio.fajrAzan,
    config.audio.iqamaSound,
    config.audio.volume
  );

  const cameraEnabled = config.camera?.enabled && config.camera?.url;

  // Fetch config from API
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  // Screen wake lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {}
    }
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  // Daily auto-refresh at 1:00 AM
  useEffect(() => {
    const now = new Date();
    const next1am = new Date(now);
    next1am.setHours(25, 0, 0, 0);
    const ms = next1am.getTime() - now.getTime();
    const timer = setTimeout(() => window.location.reload(), ms);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <main className="theme-dark h-screen flex items-center justify-center" style={{ background: "var(--bg-main)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4">&#x1F54C;</div>
          <p style={{ color: "var(--text-muted)" }} className="text-lg">Loading Azan Clock...</p>
        </div>
      </main>
    );
  }

  const dashboard = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Top: Clock and Date */}
      <section className="flex-shrink-0 pt-3 portrait:pt-4 landscape:pt-6 sm:landscape:pt-10">
        <Clock
          time={currentTime}
          timezone={timezone}
          format={config.display.timeFormat}
          showSeconds={config.display.showSeconds}
        />
        <div className="mt-1 portrait:mt-1 landscape:mt-2">
          <DateDisplay time={currentTime} timezone={timezone} />
        </div>
      </section>

      {/* Next Prayer Countdown */}
      <section className="flex-shrink-0 portrait:sm:flex-1 portrait:sm:flex portrait:sm:flex-col portrait:sm:justify-center portrait:py-3 landscape:py-0">
        <NextPrayerBanner
          prayer={nextPrayer}
          currentTime={currentTime}
          timezone={timezone}
          format={config.display.timeFormat}
        />
      </section>

      {/* Prayer Times */}
      <section className="flex-1 flex flex-col justify-center min-h-0">
        <div className="portrait:mt-1 landscape:mt-4 sm:landscape:mt-6">
          {prayerData ? (
            <PrayerTimesCard
              prayers={prayerData.prayers}
              currentTime={currentTime}
              timezone={timezone}
              format={config.display.timeFormat}
            />
          ) : loading ? (
            <div className="text-center" style={{ color: "var(--text-faint)" }}>Loading prayer times...</div>
          ) : (
            <div className="text-center text-red-400/60">Failed to load prayer times</div>
          )}
        </div>
      </section>

      {/* Portrait: Camera between prayers and weather */}
      {cameraEnabled && (
        <section className="landscape:hidden flex-shrink-0 px-4 py-2">
          <div className="h-48 sm:h-64">
            <CameraFeed config={config.camera} />
          </div>
        </section>
      )}

      {/* Bottom: Weather + Status */}
      <section className="flex-shrink-0 pb-1 portrait:pb-2">
        <div className="px-4 sm:px-8 mb-1 landscape:mb-2">
          <WeatherWidget
            weather={weather}
            error={weatherError}
            city={config.location.city}
          />
        </div>
        <StatusBar
          source={prayerData?.source || null}
          lastUpdated={prayerData?.lastUpdated || null}
          audioReady={audioUnlocked}
          audioEnabled={config.audio.enabled}
        />
      </section>
    </div>
  );

  return (
    <main
      className={`${themeClass} h-screen flex overflow-hidden transition-colors duration-1000`}
      style={{ background: `linear-gradient(to bottom, var(--bg-main), var(--bg-main-via), var(--bg-main))` }}
    >
      {/* Audio unlock overlay */}
      {config.audio.enabled && !audioUnlocked && (
        <AudioUnlockButton onUnlock={() => setAudioUnlocked(true)} />
      )}

      {/* Azan overlay */}
      {azan.showOverlay && (
        <AzanOverlay
          isPlaying={azan.isPlaying}
          prayerName={azan.currentPrayer}
          iqamaCountdownEnd={azan.iqamaCountdownEnd}
          currentTime={currentTime}
          onDismiss={azan.dismissOverlay}
        />
      )}

      {/* Main layout: landscape with camera = side panel */}
      {dashboard}

      {/* Landscape: Camera side panel */}
      {cameraEnabled && (
        <div className="hidden landscape:flex flex-shrink-0 w-[35%] p-3">
          <CameraFeed config={config.camera} />
        </div>
      )}
    </main>
  );
}
