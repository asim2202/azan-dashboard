"use client";

import { useState, useEffect, useRef } from "react";
import type { CameraConfig } from "@/types/config";

/** WebRTC live video player — uses go2rtc's WHEP-style endpoint for sub-second latency */
function LiveVideo({
  host,
  port,
  streamName,
  className,
}: {
  host: string;
  port: number;
  streamName: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function connect() {
      const video = ref.current;
      if (!video || cancelled) return;

      // Close any previous connection
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      const pc = new RTCPeerConnection({
        iceServers: [],
        bundlePolicy: "max-bundle",
      });
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      pc.ontrack = (ev) => {
        if (video.srcObject !== ev.streams[0]) {
          video.srcObject = ev.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          // Auto-reconnect after short delay
          retryTimer = setTimeout(() => {
            if (!cancelled) connect();
          }, 1500);
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE gathering to complete (simpler than trickle ICE)
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === "complete") return resolve();
          const check = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", check);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", check);
          // Hard timeout after 2s
          setTimeout(resolve, 2000);
        });

        if (cancelled) return;

        const resp = await fetch(
          `http://${host}:${port}/api/webrtc?src=${encodeURIComponent(streamName)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/sdp" },
            body: pc.localDescription?.sdp ?? "",
          }
        );

        if (!resp.ok) throw new Error(`go2rtc webrtc ${resp.status}`);
        const answerSdp = await resp.text();
        if (cancelled) return;

        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch (err) {
        console.error("[Camera] WebRTC error:", err);
        if (!cancelled) {
          setFailed(true);
          retryTimer = setTimeout(() => {
            setFailed(false);
            if (!cancelled) connect();
          }, 3000);
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [host, port, streamName]);

  if (failed) {
    return (
      <div
        className={className}
        style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Reconnecting…</p>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className={className}
      style={{ background: "#000" }}
    />
  );
}

interface CameraFeedProps {
  config: CameraConfig;
}

type WebRtcSource = {
  kind: "webrtc";
  host: string;
  port: number;
  streamName: string;
};
type UrlSource = {
  kind: "url";
  url: string;
  feedType: "image" | "iframe" | "video";
};
type Source = WebRtcSource | UrlSource;

export default function CameraFeed({ config }: CameraFeedProps) {
  const [source, setSource] = useState<Source | null>(null);
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
            // WebRTC — sub-second latency, no drift
            setSource({
              kind: "webrtc",
              host: window.location.hostname,
              port: data.go2rtcPort || 1984,
              streamName: data.streamName,
            });
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
      setSource({ kind: "url", url: config.url, feedType: config.type });
      setLoading(false);
    }
  }, [config.url, config.enabled, config.type]);

  // Snapshot refresh (only for static image URLs)
  useEffect(() => {
    if (!source || source.kind !== "url" || source.feedType !== "image") return;
    if (config.refreshInterval <= 0) return;
    const baseUrl = config.url;
    const interval = setInterval(() => {
      const sep = baseUrl.includes("?") ? "&" : "?";
      setSource({ kind: "url", url: `${baseUrl}${sep}t=${Date.now()}`, feedType: "image" });
    }, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [source, config.url, config.refreshInterval]);

  if (!config.enabled || !config.url) return null;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-xl" style={{ background: "var(--card-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Connecting to camera...</p>
      </div>
    );
  }

  if (error || !source) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-xl" style={{ background: "var(--card-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Camera unavailable</p>
      </div>
    );
  }

  if (source.kind === "webrtc") {
    return (
      <LiveVideo
        host={source.host}
        port={source.port}
        streamName={source.streamName}
        className="w-full h-full object-cover rounded-xl"
      />
    );
  }

  const streamUrl = source.url;
  const feedType = source.feedType;

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
