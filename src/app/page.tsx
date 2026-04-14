"use client";

import { useState, useEffect, useMemo } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import StatusBar from "@/components/StatusBar";
import AudioUnlockButton from "@/components/AudioUnlockButton";
import AzanOverlay from "@/components/AzanOverlay";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useWeather } from "@/hooks/useWeather";
import { useAzan } from "@/hooks/useAzan";
import { DEFAULT_GRID_WIDGETS } from "@/lib/widget-registry";
import type { AppConfig } from "@/types/config";
import type { WidgetProps } from "@/types/widget";

import ClockWidget from "@/components/widgets/ClockWidget";
import NextPrayerWidget from "@/components/widgets/NextPrayerWidget";
import PrayerTimesWidget from "@/components/widgets/PrayerTimesWidget";
import WeatherWidgetComponent from "@/components/widgets/WeatherWidget";
import CameraWidget from "@/components/widgets/CameraWidget";
import AnalogClockWidget from "@/components/widgets/AnalogClockWidget";
import IqamaCountdownWidget from "@/components/widgets/IqamaCountdownWidget";
import QuranVerseWidget from "@/components/widgets/QuranVerseWidget";
import HijriDateWidget from "@/components/widgets/HijriDateWidget";
import PrayerProgressWidget from "@/components/widgets/PrayerProgressWidget";

const DEFAULT_CONFIG: AppConfig = {
  location: { latitude: 25.2048, longitude: 55.2708, city: "Dubai", timezone: "Asia/Dubai" },
  calculationMethod: "Dubai",
  madhab: "Shafi",
  iqamaOffsets: { fajr: 20, dhuhr: 25, asr: 15, maghrib: 5, isha: 15 },
  audio: { enabled: true, defaultAzan: "/audio/azan-makkah.mp3", fajrAzan: "/audio/azan-fajr.mp3", iqamaSound: "", volume: 0.8 },
  display: { timeFormat: "12h", showSeconds: true, theme: "auto" },
  camera: { enabled: false, url: "", type: "image", refreshInterval: 0 },
  layout: { widgets: DEFAULT_GRID_WIDGETS },
  dataSources: { iacadEnabled: true, weatherEnabled: true },
};

function computeTheme(
  setting: "auto" | "dark" | "light",
  prayers: { azanDate: Date; name: string }[] | undefined,
  now: Date
): "theme-dark" | "theme-light" {
  if (setting === "dark") return "theme-dark";
  if (setting === "light") return "theme-light";
  if (!prayers) return "theme-dark";
  const sunrise = prayers.find((p) => p.name === "sunrise");
  const maghrib = prayers.find((p) => p.name === "maghrib");
  if (!sunrise || !maghrib) return "theme-dark";
  if (now.getTime() >= sunrise.azanDate.getTime() && now.getTime() < maghrib.azanDate.getTime()) return "theme-light";
  return "theme-dark";
}

// Shared card style
function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ background: "var(--card-bg)", ...style }}>
      <WidgetWrapper>{children}</WidgetWrapper>
    </div>
  );
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const timezone = config.location.timezone;
  const { time: currentTime, mounted } = useCurrentTime();
  const { data: prayerData, getNextPrayer } = usePrayerTimes(timezone);
  const { weather } = useWeather();

  const nextPrayer = useMemo(
    () => mounted ? getNextPrayer(currentTime) : null,
    [getNextPrayer, currentTime, mounted]
  );

  const themeClass = useMemo(
    () => computeTheme(config.display.theme, prayerData?.prayers, currentTime),
    [config.display.theme, prayerData?.prayers, currentTime]
  );

  const azan = useAzan(
    prayerData?.prayers, currentTime, config.audio.enabled, audioUnlocked,
    config.audio.defaultAzan, config.audio.fajrAzan, config.audio.iqamaSound, config.audio.volume
  );

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig).catch(() => {});
  }, []);

  // Wake lock
  useEffect(() => {
    let wl: WakeLockSentinel | null = null;
    async function req() { try { if ("wakeLock" in navigator) wl = await navigator.wakeLock.request("screen"); } catch {} }
    req();
    const h = () => { if (document.visibilityState === "visible") req(); };
    document.addEventListener("visibilitychange", h);
    return () => { document.removeEventListener("visibilitychange", h); wl?.release().catch(() => {}); };
  }, []);

  // Daily refresh
  useEffect(() => {
    const now = new Date(); const next = new Date(now); next.setHours(25, 0, 0, 0);
    const t = setTimeout(() => window.location.reload(), next.getTime() - now.getTime());
    return () => clearTimeout(t);
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

  const wp: WidgetProps = {
    size: "M", currentTime, timezone, config, prayerData, nextPrayer, weather,
  };

  const cameraOn = config.camera?.enabled && config.camera?.url;

  return (
    <main
      className={`${themeClass} h-screen flex flex-col overflow-hidden select-none transition-colors duration-1000`}
      style={{ background: `linear-gradient(to bottom, var(--bg-main), var(--bg-main-via), var(--bg-main))` }}
    >
      {/* Overlays */}
      {config.audio.enabled && !audioUnlocked && (
        <AudioUnlockButton onUnlock={() => setAudioUnlocked(true)} />
      )}
      {azan.showOverlay && (
        <AzanOverlay
          isPlaying={azan.isPlaying}
          prayerName={azan.currentPrayer}
          iqamaCountdownEnd={azan.iqamaCountdownEnd}
          currentTime={currentTime}
          onDismiss={azan.dismissOverlay}
        />
      )}

      {/* ===== LANDSCAPE LAYOUT ===== */}
      <div className="hidden landscape:flex flex-1 min-h-0 p-3 gap-3">
        {/* Left column: dashboard */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Row 1: Clock + Next Prayer */}
          <div className="flex gap-3" style={{ flex: "0 0 auto" }}>
            <Card className="flex-[3] p-4">
              <ClockWidget {...wp} size="L" />
            </Card>
            <Card className="flex-[2] p-4">
              <NextPrayerWidget {...wp} size="M" />
            </Card>
          </div>

          {/* Row 2: Prayer Times (fills remaining space) */}
          <Card className="flex-1 p-4">
            <PrayerTimesWidget {...wp} size="L" />
          </Card>

          {/* Row 3: Weather + Hijri + Progress */}
          <div className="flex gap-3" style={{ flex: "0 0 auto" }}>
            <Card className="flex-1 p-3">
              <WeatherWidgetComponent {...wp} size="S" />
            </Card>
            <Card className="flex-1 p-3">
              <HijriDateWidget {...wp} size="S" />
            </Card>
            <Card className="flex-1 p-3">
              <PrayerProgressWidget {...wp} size="S" />
            </Card>
          </div>
        </div>

        {/* Right column: Camera + extras */}
        <div className="flex flex-col gap-3" style={{ width: cameraOn ? "35%" : "20%" }}>
          {cameraOn && (
            <Card className="flex-1">
              <CameraWidget {...wp} size="L" />
            </Card>
          )}
          {!cameraOn && (
            <Card className="flex-1 p-4">
              <AnalogClockWidget {...wp} size="L" />
            </Card>
          )}
          <Card className="p-3" style={{ flex: "0 0 auto" }}>
            <QuranVerseWidget {...wp} size="M" />
          </Card>
          <Card className="p-3" style={{ flex: "0 0 auto" }}>
            <IqamaCountdownWidget {...wp} size="M" />
          </Card>
        </div>
      </div>

      {/* ===== PORTRAIT LAYOUT ===== */}
      <div className="landscape:hidden flex-1 flex flex-col gap-2 p-3 overflow-auto min-h-0">
        {/* Clock */}
        <Card className="p-4">
          <ClockWidget {...wp} size="M" />
        </Card>

        {/* Next Prayer */}
        <Card className="p-3">
          <NextPrayerWidget {...wp} size="M" />
        </Card>

        {/* Prayer Times */}
        <Card className="p-3">
          <PrayerTimesWidget {...wp} size="M" />
        </Card>

        {/* Progress bar */}
        <Card className="p-3">
          <PrayerProgressWidget {...wp} size="S" />
        </Card>

        {/* Camera */}
        {cameraOn && (
          <Card className="h-48 sm:h-56">
            <CameraWidget {...wp} size="M" />
          </Card>
        )}

        {/* Bottom row: Weather + Hijri */}
        <div className="flex gap-2">
          <Card className="flex-1 p-3">
            <WeatherWidgetComponent {...wp} size="S" />
          </Card>
          <Card className="flex-1 p-3">
            <HijriDateWidget {...wp} size="S" />
          </Card>
        </div>

        {/* Quran */}
        <Card className="p-3">
          <QuranVerseWidget {...wp} size="M" />
        </Card>
      </div>

      {/* Status Bar */}
      <StatusBar
        source={prayerData?.source || null}
        lastUpdated={prayerData?.lastUpdated || null}
        audioReady={audioUnlocked}
        audioEnabled={config.audio.enabled}
      />
    </main>
  );
}
