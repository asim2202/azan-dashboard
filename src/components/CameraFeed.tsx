"use client";

import { useState, useEffect } from "react";
import type { CameraConfig } from "@/types/config";

interface CameraFeedProps {
  config: CameraConfig;
}

export default function CameraFeed({ config }: CameraFeedProps) {
  const [imgSrc, setImgSrc] = useState(config.url);
  const [error, setError] = useState(false);

  // For snapshot mode: refresh at interval
  useEffect(() => {
    if (config.type !== "image" || config.refreshInterval <= 0) return;

    const interval = setInterval(() => {
      const separator = config.url.includes("?") ? "&" : "?";
      setImgSrc(`${config.url}${separator}t=${Date.now()}`);
    }, config.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [config.url, config.refreshInterval, config.type]);

  if (!config.enabled || !config.url) return null;

  if (error) {
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

  if (config.type === "iframe") {
    return (
      <iframe
        src={config.url}
        className="w-full h-full rounded-xl border-0"
        allow="autoplay"
        title="Camera Feed"
        onError={() => setError(true)}
      />
    );
  }

  // Image/MJPEG mode
  return (
    <img
      src={imgSrc}
      alt="Camera Feed"
      className="w-full h-full object-cover rounded-xl"
      onError={() => setError(true)}
    />
  );
}
