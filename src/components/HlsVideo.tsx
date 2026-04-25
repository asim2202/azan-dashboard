"use client";

import { useEffect, useRef, useState } from "react";

interface HlsVideoProps {
  /** Full HLS playlist URL, e.g. http://host:1984/api/stream.m3u8?src=frontdoor */
  src: string;
  className?: string;
  muted?: boolean;
  /** Cache-bust key — change this to force a fresh reload (watchdog) */
  reloadKey?: number;
}

/**
 * HLS video player with hls.js.
 *
 * Falls back to native HLS playback (Safari) when available, otherwise loads
 * hls.js dynamically. Auto-recovers from network and media errors via hls.js's
 * built-in startLoad/recoverMediaError flow.
 */
export default function HlsVideo({ src, className, muted = true, reloadKey = 0 }: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;

    async function setup() {
      if (!video) return;

      // Native HLS support (Safari/iOS) — just set src and let the browser handle it
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        try { await video.play(); } catch { /* autoplay may need user gesture */ }
        return;
      }

      // Otherwise, use hls.js (Chrome, Firefox, Edge)
      try {
        const mod = await import("hls.js");
        const Hls = mod.default;

        if (!Hls.isSupported()) {
          setError("HLS not supported in this browser");
          return;
        }
        if (destroyed) return;

        hls = new Hls({
          // Tuned for live streams over flaky networks
          liveSyncDuration: 3,         // try to stay 3s behind live
          liveMaxLatencyDuration: 10,  // catch up if we drift past 10s
          maxBufferLength: 15,         // hold at most 15s of buffer
          maxMaxBufferLength: 30,
          // Aggressive auto-recovery
          fragLoadingMaxRetry: 8,
          manifestLoadingMaxRetry: 8,
          levelLoadingMaxRetry: 8,
        });

        hls.on(Hls.Events.ERROR, (_evt: unknown, data: { type: string; details: string; fatal: boolean }) => {
          if (!data.fatal) return;
          // Recover according to hls.js best-practice
          if (data.type === "networkError") {
            console.warn("[HlsVideo] Network error, retrying:", data.details);
            hls.startLoad();
          } else if (data.type === "mediaError") {
            console.warn("[HlsVideo] Media error, recovering:", data.details);
            hls.recoverMediaError();
          } else {
            console.error("[HlsVideo] Fatal error:", data);
            setError(`${data.type}: ${data.details}`);
            hls.destroy();
          }
        });

        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          try { await video.play(); } catch { /* autoplay may need user gesture */ }
        });
      } catch (err) {
        console.error("[HlsVideo] Setup failed:", err);
        setError(String(err));
      }
    }

    setup();

    return () => {
      destroyed = true;
      if (hls) {
        try { hls.destroy(); } catch { /* */ }
      }
      if (video) {
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [src, reloadKey]);

  if (error) {
    return (
      <div
        className={className}
        style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>HLS error: {error}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      muted={muted}
      playsInline
      style={{ background: "#000", width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
