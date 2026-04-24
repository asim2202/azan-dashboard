"use client";

import { useState, useEffect } from "react";
import type { CameraConfig } from "@/types/config";

/**
 * Simple camera feed renderer.
 *
 * For RTSP/RTSPS URLs: fetches /api/camera-stream to confirm go2rtc is up
 * and to get the stream name, then renders an iframe pointing at go2rtc's
 * built-in player at http://<host>:1984/stream.html?src=<name>&mode=<mode>.
 *
 * go2rtc handles ALL the WebRTC/MSE negotiation internally — we just embed
 * its player. Much more reliable than rolling our own PeerConnection.
 *
 * For non-RTSP URLs: uses the user's chosen type (image/iframe) directly.
 */

interface CameraFeedProps {
  config: CameraConfig;
}

type Go2rtcSource = {
  kind: "go2rtc";
  playerUrl: string;
};
type UrlSource = {
  kind: "url";
  url: string;
  feedType: "image" | "iframe";
};
type Source = Go2rtcSource | UrlSource;

export default function CameraFeed({ config }: CameraFeedProps) {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

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
            const mode = config.streamMode || "webrtc";
            const playerUrl = `http://${host}:${port}/stream.html?src=${encodeURIComponent(
              data.streamName
            )}&mode=${encodeURIComponent(mode)}`;
            setSource({ kind: "go2rtc", playerUrl });
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
  }, [config.url, config.enabled, config.type, config.streamMode]);

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
