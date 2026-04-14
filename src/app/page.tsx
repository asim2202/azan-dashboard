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
import { getColSpan, DEFAULT_WIDGETS } from "@/lib/widget-registry";
import type { AppConfig } from "@/types/config";
import type { WidgetProps } from "@/types/widget";

// Widget component imports
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

// Widget component map
const WIDGET_COMPONENTS: Record<string, React.ComponentType<WidgetProps>> = {
  "clock": ClockWidget,
  "next-prayer": NextPrayerWidget,
  "prayer-times": PrayerTimesWidget,
  "weather": WeatherWidgetComponent,
  "camera": CameraWidget,
  "analog-clock": AnalogClockWidget,
  "iqama-countdown": IqamaCountdownWidget,
  "quran-verse": QuranVerseWidget,
  "hijri-date": HijriDateWidget,
  "prayer-progress": PrayerProgressWidget,
};

const DEFAULT_CONFIG: AppConfig = {
  location: { latitude: 25.2048, longitude: 55.2708, city: "Dubai", timezone: "Asia/Dubai" },
  calculationMethod: "Dubai",
  madhab: "Shafi",
  iqamaOffsets: { fajr: 20, dhuhr: 25, asr: 15, maghrib: 5, isha: 15 },
  audio: { enabled: true, defaultAzan: "/audio/azan-makkah.mp3", fajrAzan: "/audio/azan-fajr.mp3", iqamaSound: "", volume: 0.8 },
  display: { timeFormat: "12h", showSeconds: true, theme: "auto" },
  camera: { enabled: false, url: "", type: "image", refreshInterval: 0 },
  layout: { widgets: DEFAULT_WIDGETS },
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
  const nowMs = now.getTime();
  if (nowMs >= sunrise.azanDate.getTime() && nowMs < maghrib.azanDate.getTime()) return "theme-light";
  return "theme-dark";
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

  // Screen wake lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function req() { try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch {} }
    req();
    const h = () => { if (document.visibilityState === "visible") req(); };
    document.addEventListener("visibilitychange", h);
    return () => { document.removeEventListener("visibilitychange", h); wakeLock?.release().catch(() => {}); };
  }, []);

  // Daily refresh at 1 AM
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(25, 0, 0, 0);
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

  // Build widget props (shared across all widgets)
  const widgetProps: WidgetProps = {
    size: "M", // overridden per widget
    currentTime,
    timezone,
    config,
    prayerData,
    nextPrayer,
    weather,
  };

  // Get enabled widgets in order
  const widgets = (config.layout?.widgets || DEFAULT_WIDGETS).filter((w) => w.enabled);

  return (
    <main
      className={`${themeClass} h-screen flex flex-col overflow-auto select-none transition-colors duration-1000`}
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

      {/* Widget Grid */}
      <div
        className="flex-1 p-3 sm:p-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
          alignContent: "center",
        }}
      >
        {widgets.map((wc) => {
          const Component = WIDGET_COMPONENTS[wc.id];
          if (!Component) return null;

          return (
            <WidgetWrapper key={wc.id} widgetId={wc.id} size={wc.size}>
              <Component {...widgetProps} size={wc.size} />
            </WidgetWrapper>
          );
        })}
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
