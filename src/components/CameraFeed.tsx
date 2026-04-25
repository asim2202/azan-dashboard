"use client";

import { useState, useEffect } from "react";
import type { CameraConfig } from "@/types/config";
import HlsVideo from "./HlsVideo";

/**
 * Camera feed renderer.
 *
 * For RTSP/RTSPS URLs in HLS mode: streams .m3u8 from go2rtc into an
 * hls.js-backed <video> element. Most network-resilient option (each
 * segment is a separate HTTP request with its own retry).
 *
 * For RTSP/RTSPS in any other mode (webrtc/mse/mjpeg): iframes go2rtc's
 * built-in player at /stream.html?src=...&mode=...
 *
 * For non-RTSP URLs: uses the user's chosen type (image/iframe) directly.
 */

interface CameraFeedProps {
  config: CameraConfig;
}

type HlsSource = {
  kind: "hls";
  m3u8Url: string;
};
type Go2rtcSource = {
  kind: "go2rtc";
  playerUrl: string;
};
type UrlSource = {
  kind: "url";
  url: string;
  feedType: "image" | "iframe";
};
type Source = HlsSource | Go2rtcSource | UrlSource;

/**
 * Watchdog interval: every N minutes we force-reload the camera iframe
 * by changing a cache-bust query param. Resets any accumulated stream
 * state and recovers from silent stalls — the kind that no protocol-level
 * reconnect will catch.
 */
const WATCHDOG_RELOAD_MINUTES = 30;

export default function CameraFeed({ config }: CameraFeedProps) {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  // Bump this to force the iframe to reload (preserves React tree).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!config.enabled || !config.url) {
      setLoading(false);
      return;
    }

    const isRtsp =
      config.url.startsWith("rtsp://") || config.url.startsWith("rtsps://");

    if (isRtsp) {
      fetch("/api/camera-stream")
        .then((r) => r.json())
        .then((data) => {
          if (data.source === "go2rtc" && data.streamName) {
            const host = window.location.hostname;
            const port = data.go2rtcPort || 1984;
            const mode = config.streamMode || "hls";
            if (mode === "hls") {
              // Use hls.js with go2rtc's m3u8 endpoint directly. Chromium
              // doesn't natively play HLS, so embedding stream.html?mode=hls
              // would show a black screen.
              const m3u8Url = `http://${host}:${port}/api/stream.m3u8?src=${encodeURIComponent(
                data.streamName
              )}`;
              setSource({ kind: "hls", m3u8Url });
            } else {
              // media=video drops the audio track at negotiation time.
              // _wd cache-busts on watchdog reload.
              const playerUrl = `http://${host}:${port}/stream.html?src=${encodeURIComponent(
                data.streamName
              )}&mode=${encodeURIComponent(mode)}&media=video&_wd=${reloadKey}`;
              setSource({ kind: "go2rtc", playerUrl });
            }
            setError(false);
          } else if (data.streamUrl) {
            setSource({
              kind: "url",
              url: data.streamUrl,
              feedType: data.type || "image",
            });
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else {
      setSource({
        kind: "url",
        url: config.url,
        feedType: config.type,
      });
      setLoading(false);
    }
  }, [config.url, config.enabled, config.type, config.streamMode, reloadKey]);

  // Watchdog: periodically bump reloadKey so the iframe re-renders with a
  // fresh URL. Recovers from any silent stalls that accumulate over hours
  // of unattended kiosk operation.
  useEffect(() => {
    if (!config.enabled || !config.url) return;
    const isRtsp =
      config.url.startsWith("rtsp://") || config.url.startsWith("rtsps://");
    if (!isRtsp) return; // Only meaningful for go2rtc-served streams
    const interval = setInterval(() => {
      setReloadKey((k) => k + 1);
    }, WATCHDOG_RELOAD_MINUTES * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.enabled, config.url]);

  // Snapshot refresh (only for static image URLs)
  useEffect(() => {
    if (!source || source.kind !== "url" || source.feedType !== "image") return;
    if (config.refreshInterval <= 0) return;
    const baseUrl = config.url;
    const interval = setInterval(() => {
      const sep = baseUrl.includes("?") ? "&" : "?";
      setSource({
        kind: "url",
        url: `${baseUrl}${sep}t=${Date.now()}`,
        feedType: "image",
      });
    }, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [source, config.url, config.refreshInterval]);

  if (!config.enabled || !config.url) return null;

  if (loading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-xl"
        style={{ background: "var(--card-bg)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Connecting to camera...
        </p>
      </div>
    );
  }

  if (error || !source) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-xl"
        style={{ background: "var(--card-bg)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Camera unavailable
        </p>
      </div>
    );
  }

  if (source.kind === "hls") {
    return (
      <HlsVideo
        src={source.m3u8Url}
        className="w-full h-full rounded-xl"
        muted
        reloadKey={reloadKey}
      />
    );
  }

  if (source.kind === "go2rtc") {
    return (
      <iframe
        src={source.playerUrl}
        className="w-full h-full rounded-xl border-0"
        allow="autoplay; fullscreen; encrypted-media"
        title="Camera Feed"
        style={{ background: "#000" }}
      />
    );
  }

  if (source.feedType === "iframe") {
    return (
      <iframe
        src={source.url}
        className="w-full h-full rounded-xl border-0"
        allow="autoplay; fullscreen"
        title="Camera Feed"
        style={{ background: "#000" }}
      />
    );
  }

  return (
    <img
      src={source.url}
      alt="Camera Feed"
      className="w-full h-full object-cover rounded-xl"
      onError={() => setError(true)}
    />
  );
}
