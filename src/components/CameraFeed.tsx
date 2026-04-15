"use client";

import { useState, useEffect } from "react";
import type { CameraConfig } from "@/types/config";

interface CameraFeedProps {
  config: CameraConfig;
}

export default function CameraFeed({ config }: CameraFeedProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<"image" | "iframe" | "video">(config.type);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config.enabled || !config.url) {
      setLoading(false);
      return;
    }

    if (config.url.startsWith("rtsp://") || config.url.startsWith("rtsps://")) {
      fetch("/api/camera-stream")
        .then((r) => r.json())
        .then((data) => {
          if (data.source === "go2rtc" && data.streamName) {
            const host = window.location.hostname;
            const port = data.go2rtcPort || 1984;
            // Use MP4 stream directly - smoothest for UniFi cameras
            setStreamUrl(`http://${host}:${port}/api/stream.mp4?src=${data.streamName}`);
            setFeedType("video");
            setError(false);
          } else if (data.streamUrl) {
            setStreamUrl(data.streamUrl);
            setFeedType(data.type || "image");
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else {
      setStreamUrl(config.url);
      setFeedType(config.type);
      setLoading(false);
    }
  }, [config.url, config.enabled, config.type]);

  // Snapshot refresh
  useEffect(() => {
    if (!streamUrl || feedType !== "image" || config.refreshInterval <= 0) return;
    const baseUrl = config.url.startsWith("rtsp") ? streamUrl : config.url;
    const interval = setInterval(() => {
      const sep = baseUrl.includes("?") ? "&" : "?";
      setStreamUrl(`${baseUrl}${sep}t=${Date.now()}`);
    }, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [streamUrl, config.url, config.refreshInterval, feedType]);

  if (!config.enabled || !config.url) return null;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-xl" style={{ background: "var(--card-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Connecting to camera...</p>
      </div>
    );
  }

  if (error || !streamUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-xl" style={{ background: "var(--card-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Camera unavailable</p>
      </div>
    );
  }

  if (feedType === "video") {
    return (
      <video
        src={streamUrl}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover rounded-xl"
        style={{ background: "#000" }}
      />
    );
  }

  if (feedType === "iframe") {
    return (
      <iframe
        src={streamUrl}
        className="w-full h-full rounded-xl border-0"
        allow="autoplay; fullscreen"
        title="Camera Feed"
        style={{ background: "#000" }}
      />
    );
  }

  return (
    <img
      src={streamUrl}
      alt="Camera Feed"
      className="w-full h-full object-cover rounded-xl"
      onError={() => setError(true)}
    />
  );
}
