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

      // Prefer hls.js (Chrome's canPlayType lies — returns "maybe" for HLS
      // mime types it can't actually play). Only fall back to native HLS
      // playback when hls.js isn't supported (i.e. Safari).
      try {
        const mod = await import("hls.js");
        const Hls = mod.default;

        if (Hls.isSupported()) {
          if (destroyed) return;

          hls = new Hls({
            // Tuned for live streams over flaky networks
            liveSyncDuration: 3,
            liveMaxLatencyDuration: 10,
            maxBufferLength: 15,
            maxMaxBufferLength: 30,
            fragLoadingMaxRetry: 8,
            manifestLoadingMaxRetry: 8,
            levelLoadingMaxRetry: 8,
          });

          hls.on(Hls.Events.ERROR, (_evt: unknown, data: { type: string; details: string; fatal: boolean }) => {
            if (!data.fatal) return;
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
          return;
        }

        // hls.js not supported — try native HLS (Safari/iOS)
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          try { await video.play(); } catch { /* autoplay may need gesture */ }
          return;
        }

        setError("HLS not supported in this browser");
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
