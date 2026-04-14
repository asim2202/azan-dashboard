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
import WorldClockWidget from "@/components/widgets/WorldClockWidget";
import HadithWidget from "@/components/widgets/HadithWidget";
import QuranVerseWidget from "@/components/widgets/QuranVerseWidget";

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

  const nextPrayer = useMemo(() => mounted ? getNextPrayer(currentTime) : null, [getNextPrayer, currentTime, mounted]);
  const themeClass = useMemo(() => computeTheme(config.display.theme, prayerData?.prayers, currentTime), [config.display.theme, prayerData?.prayers, currentTime]);

  const azan = useAzan(
    prayerData?.prayers, currentTime, config.audio.enabled, audioUnlocked,
    config.audio.defaultAzan, config.audio.fajrAzan, config.audio.iqamaSound, config.audio.volume
  );

  useEffect(() => { fetch("/api/config").then((r) => r.json()).then(setConfig).catch(() => {}); }, []);
  useEffect(() => {
    let wl: WakeLockSentinel | null = null;
    async function req() { try { if ("wakeLock" in navigator) wl = await navigator.wakeLock.request("screen"); } catch {} }
    req();
    const h = () => { if (document.visibilityState === "visible") req(); };
    document.addEventListener("visibilitychange", h);
    return () => { document.removeEventListener("visibilitychange", h); wl?.release().catch(() => {}); };
  }, []);
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

  const wp: WidgetProps = { size: "M", currentTime, timezone, config, prayerData, nextPrayer, weather };
  const cameraOn = config.camera?.enabled && config.camera?.url;

  return (
    <main
      className={`${themeClass} h-screen flex flex-col overflow-hidden select-none transition-colors duration-1000`}
      style={{ background: `linear-gradient(to bottom, var(--bg-main), var(--bg-main-via), var(--bg-main))` }}
    >
      {config.audio.enabled && !audioUnlocked && <AudioUnlockButton onUnlock={() => setAudioUnlocked(true)} />}
      {azan.showOverlay && (
        <AzanOverlay isPlaying={azan.isPlaying} prayerName={azan.currentPrayer}
          iqamaCountdownEnd={azan.iqamaCountdownEnd} currentTime={currentTime} onDismiss={azan.dismissOverlay} />
      )}

      {/* ===== LANDSCAPE: Two-column, optimized for 1920x1080 24" ===== */}
      <div className="hidden landscape:flex flex-1 min-h-0 p-4 gap-4">
        {/* LEFT COLUMN: ~62% */}
        <div className="flex-[3] flex flex-col gap-3 min-w-0">
          {/* Row 1: Clock + Next Prayer (fixed height) */}
          <div className="flex gap-3" style={{ height: "120px" }}>
            <Card className="flex-[3] p-5">
              <ClockWidget {...wp} size="L" />
            </Card>
            <Card className="flex-[2] p-4">
              <NextPrayerWidget {...wp} size="M" />
            </Card>
          </div>

          {/* Row 2: Prayer Times (grows) */}
          <Card className="flex-1 p-4">
            <PrayerTimesWidget {...wp} size="L" />
          </Card>

          {/* Row 3: Weather + World Clock (fixed height) */}
          <div className="flex gap-3" style={{ height: "240px" }}>
            <Card className="flex-1 p-4">
              <WeatherWidgetComponent {...wp} size="M" />
            </Card>
            <Card className="p-4" style={{ width: "240px" }}>
              <WorldClockWidget {...wp} size="M" />
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: ~38% */}
        <div className="flex-[2] flex flex-col gap-3 min-w-0">
          {/* Camera (takes most space) */}
          {cameraOn ? (
            <Card className="flex-[3]">
              <CameraWidget {...wp} size="L" />
            </Card>
          ) : (
            <Card className="flex-[3] p-4 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>Camera not configured</p>
            </Card>
          )}

          {/* Hadith of the Day */}
          <Card className="flex-[1] p-4">
            <HadithWidget {...wp} size="M" />
          </Card>

          {/* Ayat of the Day */}
          <Card className="flex-[1] p-4">
            <QuranVerseWidget {...wp} size="M" />
          </Card>
        </div>
      </div>

      {/* ===== PORTRAIT: Stacked, optimized for 1080x1920 ===== */}
      <div className="landscape:hidden flex-1 flex flex-col gap-2 p-3 overflow-auto min-h-0">
        <Card className="p-4">
          <ClockWidget {...wp} size="M" />
        </Card>
        <Card className="p-3">
          <NextPrayerWidget {...wp} size="M" />
        </Card>
        <Card className="p-3">
          <PrayerTimesWidget {...wp} size="M" />
        </Card>
        {cameraOn && (
          <Card className="h-56">
            <CameraWidget {...wp} size="M" />
          </Card>
        )}
        <div className="flex gap-2">
          <Card className="flex-1 p-3">
            <WeatherWidgetComponent {...wp} size="S" />
          </Card>
          <Card className="flex-1 p-3">
            <WorldClockWidget {...wp} size="S" />
          </Card>
        </div>
        <Card className="p-3">
          <HadithWidget {...wp} size="M" />
        </Card>
        <Card className="p-3">
          <QuranVerseWidget {...wp} size="M" />
        </Card>
      </div>

      <StatusBar
        source={prayerData?.source || null}
        lastUpdated={prayerData?.lastUpdated || null}
        audioReady={audioUnlocked}
        audioEnabled={config.audio.enabled}
      />
    </main>
  );
}
