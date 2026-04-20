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
import { getWeatherGradient } from "@/lib/weather-theme";
import type { AppConfig } from "@/types/config";
import type { WidgetProps } from "@/types/widget";

import ClockWidget from "@/components/widgets/ClockWidget";
import NextPrayerWidget from "@/components/widgets/NextPrayerWidget";
import PrayerTimesWidget from "@/components/widgets/PrayerTimesWidget";
import WeatherWidgetComponent from "@/components/widgets/WeatherWidget";
import CameraWidget from "@/components/widgets/CameraWidget";
import WorldClockWidget from "@/components/widgets/WorldClockWidget";
import IslamicContentWidget from "@/components/widgets/IslamicContentWidget";
import AqiWidget from "@/components/widgets/AqiWidget";
import NewsTicker from "@/components/NewsTicker";
import StarsOverlay from "@/components/StarsOverlay";
import WeatherEffectsOverlay from "@/components/WeatherEffectsOverlay";

const DEFAULT_CONFIG: AppConfig = {
  location: { latitude: 25.2048, longitude: 55.2708, city: "Dubai", timezone: "Asia/Dubai" },
  calculationMethod: "Dubai",
  madhab: "Shafi",
  iqamaOffsets: { fajr: 20, dhuhr: 25, asr: 15, maghrib: 5, isha: 15 },
  audio: {
    enabled: true, defaultAzan: "", fajrAzan: "", iqamaSound: "", volume: 0.8,
    preIqamaAlert: { enabled: false, sound: "", offsets: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } },
  },
  display: { timeFormat: "12h", showSeconds: true, theme: "auto" },
  animations: {
    enabled: true, stars: true, weatherEffects: true, gradientDrift: true,
    cardEntrance: true, cardShimmer: true, prayerGlow: true, weatherIcons: true,
  },
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

function Card({ children, className = "", style, index = 0 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; index?: number }) {
  return (
    <div
      className={`rounded-xl overflow-hidden backdrop-blur-sm card-shimmer card-animate ${className}`}
      style={{ background: "var(--card-bg)", "--card-i": index, ...style } as React.CSSProperties}
    >
      <WidgetWrapper>{children}</WidgetWrapper>
    </div>
  );
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null);
  const [orientationOverride, setOrientationOverride] = useState<"auto" | "landscape" | "portrait">("auto");

  const timezone = config.location.timezone;
  const { time: currentTime, mounted } = useCurrentTime();
  const { data: prayerData, getNextPrayer } = usePrayerTimes(timezone);
  const { weather } = useWeather();

  const nextPrayer = useMemo(() => mounted ? getNextPrayer(currentTime) : null, [getNextPrayer, currentTime, mounted]);
  const themeClass = "theme-dark"; // Always dark text for weather gradient backgrounds
  const currentHour = useMemo(() =>
    parseInt(currentTime.toLocaleTimeString("en-GB", { hour: "numeric", hour12: false, timeZone: config.location.timezone })),
    [currentTime, config.location.timezone]
  );
  const weatherGradient = useMemo(() =>
    getWeatherGradient(weather?.weatherCode, currentHour),
    [weather?.weatherCode, currentHour]
  );
  const isNight = currentHour < 5 || currentHour >= 20;

  const azan = useAzan(
    prayerData?.prayers, currentTime, config.audio.enabled, audioUnlocked,
    config.audio.defaultAzan, config.audio.fajrAzan, config.audio.iqamaSound, config.audio.volume,
    config.audio.preIqamaAlert
  );

  useEffect(() => { fetch("/api/config").then((r) => r.json()).then(setConfig).catch(() => {}); }, []);

  // Track viewport for scale calculation
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  if (!mounted || !viewport) {
    return (
      <main className="theme-dark h-screen flex items-center justify-center" style={{ background: "var(--bg-main)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4">&#x1F54C;</div>
          <p style={{ color: "var(--text-muted)" }} className="text-lg">Loading Azan Clock...</p>
        </div>
      </main>
    );
  }

  // Fixed 16:9 render — detect orientation, scale to fit any screen
  const isLandscape = orientationOverride === "auto"
    ? viewport.w >= viewport.h
    : orientationOverride === "landscape";
  const DESIGN_W = isLandscape ? 1920 : 1080;
  const DESIGN_H = isLandscape ? 1080 : 1920;
  const scale = Math.min(viewport.w / DESIGN_W, viewport.h / DESIGN_H);

  const orientation = isLandscape ? "H" as const : "V" as const;
  const wp: WidgetProps = { size: orientation, currentTime, timezone, config, prayerData, nextPrayer, weather };
  const cameraOn = config.camera?.enabled && config.camera?.url;

  // Animation flags — master switch trumps individual toggles
  const a = config.animations;
  const animMaster = a?.enabled !== false;
  const animStars = animMaster && a?.stars !== false;
  const animWeatherFx = animMaster && a?.weatherEffects !== false;
  const animGradient = animMaster && a?.gradientDrift !== false;
  const animEntrance = animMaster && a?.cardEntrance !== false;
  const animShimmer = animMaster && a?.cardShimmer !== false;
  const animPrayerGlow = animMaster && a?.prayerGlow !== false;
  const animWeatherIcons = animMaster && a?.weatherIcons !== false;
  // CSS classes that disable animations globally (applied on root container)
  const animOffClasses = [
    !animEntrance && "no-anim-entrance",
    !animShimmer && "no-anim-shimmer",
    !animPrayerGlow && "no-anim-glow",
    !animWeatherIcons && "no-anim-weather-icons",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={`${themeClass} ${animOffClasses} transition-all duration-[3000ms] relative`}
      style={{
        width: "100vw", height: "100vh", overflow: "hidden",
        background: weatherGradient,
        backgroundSize: animGradient ? "100% 200%" : "100% 100%",
        animation: animGradient ? "gradientDrift 30s ease-in-out infinite" : "none",
      }}
    >
      {/* Atmospheric overlays */}
      {animStars && <StarsOverlay isNight={isNight} />}
      {animWeatherFx && <WeatherEffectsOverlay weatherCode={weather?.weatherCode} />}

      {/* Overlays render at viewport level (outside scale) */}
      {config.audio.enabled && !audioUnlocked && <AudioUnlockButton onUnlock={() => setAudioUnlocked(true)} />}
      {azan.showOverlay && (
        <AzanOverlay isPlaying={azan.isPlaying} prayerName={azan.currentPrayer}
          iqamaCountdownEnd={azan.iqamaCountdownEnd} currentTime={currentTime} onDismiss={azan.dismissOverlay} />
      )}

      {/* Scaled dashboard — always renders at exact 16:9 dimensions */}
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <main
          className="flex flex-col overflow-hidden select-none"
          style={{
            width: `${DESIGN_W}px`,
            height: `${DESIGN_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            flexShrink: 0,
            background: "transparent",
          }}
        >
          {isLandscape ? (
            /* ===== LANDSCAPE: 1920×1080 fixed ===== */
            <div className="flex flex-1 min-h-0 p-4 gap-4">
              {/* LEFT COLUMN: 60% */}
              <div className="flex-[3] flex flex-col gap-3 min-w-0">
                {/* Row 1: Clock + Next Prayer */}
                <div className="flex gap-3" style={{ height: "160px" }}>
                  <Card className="flex-[3] p-5" index={0}>
                    <ClockWidget {...wp} />
                  </Card>
                  <Card className="flex-[2] p-4" index={1}>
                    <NextPrayerWidget {...wp} />
                  </Card>
                </div>

                {/* Row 2: Prayer Times + World Clock (analog) */}
                <div className="flex gap-3 flex-1 min-h-0">
                  <Card className="flex-[3] p-5 min-h-0" index={2}>
                    <PrayerTimesWidget {...wp} />
                  </Card>
                  <Card className="flex-[1] p-3 min-h-0" index={3}>
                    <WorldClockWidget {...wp} />
                  </Card>
                </div>

                {/* Row 3: Weather (full width) */}
                <Card className="p-4" style={{ height: "270px" }} index={4}>
                  <WeatherWidgetComponent {...wp} />
                </Card>

                {/* Row 4: News Ticker */}
                <div className="flex-shrink-0" style={{ height: "48px" }}>
                  <NewsTicker />
                </div>
              </div>

              {/* RIGHT COLUMN: 40% */}
              <div className="flex-[2] flex flex-col gap-3 min-w-0">
                {cameraOn ? (
                  <div className="w-full flex-shrink-0" style={{ aspectRatio: "4 / 3" }}>
                    <Card className="h-full" index={5}>
                      <CameraWidget {...wp} />
                    </Card>
                  </div>
                ) : (
                  <Card className="flex-[5] min-h-0 p-4 flex items-center justify-center" index={5}>
                    <p className="text-sm" style={{ color: "var(--text-faint)" }}>Camera not configured</p>
                  </Card>
                )}

                <Card className="flex-[4] p-4 min-h-0" index={6}>
                  <IslamicContentWidget {...wp} />
                </Card>
              </div>
            </div>
          ) : (
            /* ===== PORTRAIT: 1080×1920 fixed ===== */
            <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden min-h-0">
              {/* Row 1: Clock + Next Prayer side by side */}
              <div className="flex gap-3" style={{ height: "210px" }}>
                <Card className="flex-[3] p-4" index={0}>
                  <ClockWidget {...wp} />
                </Card>
                <Card className="flex-[2] p-3" index={1}>
                  <NextPrayerWidget {...wp} />
                </Card>
              </div>

              {/* Row 2: Prayer Times + (World Clock / AQI) side by side */}
              <div className="flex gap-3 flex-[2.5] min-h-0">
                <Card className="p-4 flex-[3] min-h-0" index={2}>
                  <PrayerTimesWidget {...wp} />
                </Card>
                <div className="flex-[1] flex flex-col gap-3 min-h-0">
                  <Card className="p-3 flex-[3] min-h-0" index={3}>
                    <WorldClockWidget {...wp} size="H" />
                  </Card>
                  <Card className="p-3 flex-[1] min-h-0" index={4}>
                    <AqiWidget {...wp} />
                  </Card>
                </div>
              </div>

              {/* Row 3: Camera + Islamic Content side by side */}
              <div className="flex gap-3 flex-shrink-0" style={{ height: "440px" }}>
                {cameraOn ? (
                  <Card className="h-full overflow-hidden flex-shrink-0" style={{ aspectRatio: "4 / 3" }} index={5}>
                    <CameraWidget {...wp} />
                  </Card>
                ) : (
                  <Card className="h-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ aspectRatio: "4 / 3" }} index={5}>
                    <p className="text-sm" style={{ color: "var(--text-faint)" }}>Camera not configured</p>
                  </Card>
                )}
                <Card className="p-4 flex-1 min-w-0" index={6}>
                  <IslamicContentWidget {...wp} />
                </Card>
              </div>

              {/* Row 4: Weather (full width) */}
              <Card className="p-4 flex-[1.5] min-h-0" index={7}>
                <WeatherWidgetComponent {...wp} />
              </Card>

              {/* Row 5: News Ticker */}
              <div className="flex-shrink-0" style={{ height: "52px" }}>
                <NewsTicker />
              </div>
            </div>
          )}

          <StatusBar
            source={prayerData?.source || null}
            lastUpdated={prayerData?.lastUpdated || null}
            audioReady={audioUnlocked}
            audioEnabled={config.audio.enabled}
            orientation={orientationOverride}
            onOrientationChange={() => setOrientationOverride((prev) => prev === "auto" ? "landscape" : prev === "landscape" ? "portrait" : "auto")}
            onTestAzan={() => {
              const src = config.audio.defaultAzan;
              if (src && azan.audioRef.current) {
                const audio = azan.audioRef.current;
                audio.src = src;
                audio.volume = config.audio.volume;
                audio.play().catch((err) => console.error("[Test Azan] Failed:", err));
              }
            }}
          />
        </main>
      </div>
    </div>
  );
}
