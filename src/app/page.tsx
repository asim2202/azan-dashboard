"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ResponsiveGridLayout } = require("react-grid-layout");
import WidgetWrapper from "@/components/WidgetWrapper";
import StatusBar from "@/components/StatusBar";
import AudioUnlockButton from "@/components/AudioUnlockButton";
import AzanOverlay from "@/components/AzanOverlay";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { useWeather } from "@/hooks/useWeather";
import { useAzan } from "@/hooks/useAzan";
import { WIDGET_DEFINITIONS, DEFAULT_GRID_WIDGETS } from "@/lib/widget-registry";
import type { AppConfig, WidgetGridItem } from "@/types/config";
import type { WidgetProps } from "@/types/widget";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RGLLayout = any;

// Widget imports
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
  layout: { widgets: DEFAULT_GRID_WIDGETS },
  dataSources: { iacadEnabled: true, weatherEnabled: true },
};

function widgetToSize(w: number): "S" | "M" | "L" {
  if (w <= 2) return "S";
  if (w <= 3) return "M";
  return "L";
}

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

function gridItemsToLayout(items: WidgetGridItem[]): RGLLayout[] {
  return items
    .filter((w) => w.enabled)
    .map((w) => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h, minW: 1, minH: 1 }));
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Container width for grid layout
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    setContainerWidth(containerRef.current.offsetWidth);
    return () => obs.disconnect();
  }, [mounted]);

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

  const widgets = config.layout?.widgets || DEFAULT_GRID_WIDGETS;
  const enabledWidgets = widgets.filter((w) => w.enabled);
  const layout = gridItemsToLayout(widgets).map((item: RGLLayout) => ({
    ...item,
    static: !editMode,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = useCallback((currentLayout: any, allLayouts: any) => {
    if (!editMode) return;
    // currentLayout is a Layout (readonly array of LayoutItem)
    const items = Array.from(currentLayout) as { i: string; x: number; y: number; w: number; h: number }[];
    setConfig((prev) => {
      const updatedWidgets = prev.layout.widgets.map((w) => {
        const item = items.find((l) => l.i === w.i);
        if (item) return { ...w, x: item.x, y: item.y, w: item.w, h: item.h };
        return w;
      });
      return { ...prev, layout: { ...prev.layout, widgets: updatedWidgets } };
    });
  }, [editMode]);

  const saveLayout = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
    } catch {}
    setSaving(false);
    setEditMode(false);
  }, [config]);

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

  const widgetProps: WidgetProps = {
    size: "M",
    currentTime,
    timezone,
    config,
    prayerData,
    nextPrayer,
    weather,
  };

  return (
    <main
      className={`${themeClass} h-screen flex flex-col overflow-auto select-none transition-colors duration-1000 ${editMode ? "edit-mode" : ""}`}
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

      {/* Edit mode toolbar */}
      {editMode && (
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2" style={{ background: "var(--accent)", color: "#000" }}>
          <span className="text-sm font-medium">Edit Mode: Drag to move, resize from corners</span>
          <div className="flex gap-2">
            <button onClick={() => setEditMode(false)} className="px-3 py-1 text-sm rounded bg-black/20 hover:bg-black/30">Cancel</button>
            <button onClick={saveLayout} disabled={saving} className="px-3 py-1 text-sm rounded bg-black/30 hover:bg-black/40 font-medium">
              {saving ? "Saving..." : "Save Layout"}
            </button>
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className="flex-1 p-2 sm:p-3" ref={containerRef}>
        <ResponsiveGridLayout
          className="layout"
          width={containerWidth}
          layouts={{ lg: layout, md: layout, sm: layout }}
          breakpoints={{ lg: 1200, md: 768, sm: 0 }}
          cols={{ lg: 6, md: 4, sm: 2 }}
          rowHeight={80}
          onLayoutChange={handleLayoutChange}
          compactType="vertical"
          margin={[10, 10]}
          useCSSTransforms
        >
          {enabledWidgets.map((wc) => {
            const Component = WIDGET_COMPONENTS[wc.i];
            if (!Component) return <div key={wc.i} />;
            const size = widgetToSize(wc.w);

            return (
              <div key={wc.i} className="widget-card rounded-xl overflow-hidden" style={{ background: "var(--card-bg)" }}>
                <WidgetWrapper>
                  <div className="h-full p-3 sm:p-4">
                    <Component {...widgetProps} size={size} />
                  </div>
                </WidgetWrapper>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0">
        <StatusBar
          source={prayerData?.source || null}
          lastUpdated={prayerData?.lastUpdated || null}
          audioReady={audioUnlocked}
          audioEnabled={config.audio.enabled}
          onEditLayout={() => setEditMode(!editMode)}
        />
      </div>
    </main>
  );
}
