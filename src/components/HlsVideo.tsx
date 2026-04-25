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
    let stallWatchdog: ReturnType<typeof setInterval> | null = null;
    let lastProgressTime = 0;
    let lastCurrentTime = 0;

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
            // Tuned for live streams over flaky networks.
            // Higher retry counts and exponential backoff help survive long
            // WiFi blips without giving up.
            liveSyncDuration: 3,
            liveMaxLatencyDuration: 10,
            maxBufferLength: 15,
            maxMaxBufferLength: 30,
            fragLoadingMaxRetry: 999,
            manifestLoadingMaxRetry: 999,
            levelLoadingMaxRetry: 999,
            fragLoadingRetryDelay: 1000,
            manifestLoadingRetryDelay: 1000,
            levelLoadingRetryDelay: 1000,
            fragLoadingMaxRetryTimeout: 30000,
          });

          // Track playback progress; we use this to detect silent stalls.
          video.addEventListener("timeupdate", () => {
            if (video.currentTime !== lastCurrentTime) {
              lastCurrentTime = video.currentTime;
              lastProgressTime = Date.now();
            }
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
              // Other fatal — destroy and rebuild from scratch instead of giving up
              console.warn("[HlsVideo] Fatal error, rebuilding:", data);
              try { hls.destroy(); } catch { /* */ }
              hls = null;
              setTimeout(() => { if (!destroyed) setup(); }, 2000);
            }
          });

          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, async () => {
            try { await video.play(); } catch { /* autoplay may need user gesture */ }
          });

          // Stall watchdog: if currentTime hasn't advanced for 8 seconds,
          // tear down and rebuild. Also: if the video stays paused after a
          // rebuild (paused with no err state), force a play() retry.
          lastProgressTime = Date.now();
          stallWatchdog = setInterval(() => {
            if (destroyed) return;
            // If paused with no error, try to resume — covers the case where
            // a rebuild's MANIFEST_PARSED → play() failed silently.
            if (video.paused && !video.error) {
              video.play().catch(() => {});
              return;
            }
            const idleMs = Date.now() - lastProgressTime;
            if (idleMs > 8000) {
              console.warn(`[HlsVideo] Stalled for ${(idleMs/1000).toFixed(0)}s — rebuilding player`);
              try { hls?.destroy(); } catch { /* */ }
              hls = null;
              lastProgressTime = Date.now(); // avoid immediate re-trigger
              setTimeout(() => { if (!destroyed) setup(); }, 1500);
            }
          }, 3000);

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
      if (stallWatchdog) clearInterval(stallWatchdog);
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
