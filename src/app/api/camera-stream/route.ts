import { getConfig } from "@/lib/config";

const GO2RTC_API = "http://127.0.0.1:1984";

// Register/update RTSP stream with go2rtc and return the MJPEG URL
export async function GET() {
  const config = getConfig();

  if (!config.camera?.enabled || !config.camera?.url) {
    return Response.json({ error: "Camera not configured" }, { status: 404 });
  }

  const rtspUrl = config.camera.url;

  // If the URL is already HTTP (MJPEG, snapshot, etc), just pass it through
  if (rtspUrl.startsWith("http")) {
    return Response.json({
      streamUrl: rtspUrl,
      type: config.camera.type,
      source: "direct",
    });
  }

  // For RTSP URLs, register with go2rtc and return the MJPEG proxy URL
  try {
    // Add/update the stream in go2rtc via its API
    const addRes = await fetch(
      `${GO2RTC_API}/api/streams?dst=frontdoor&src=${encodeURIComponent(rtspUrl)}`,
      { method: "PUT" }
    );

    if (!addRes.ok) {
      console.error("[Camera] go2rtc stream registration failed:", addRes.status);
      return Response.json({ error: "Failed to register stream with go2rtc" }, { status: 500 });
    }

    return Response.json({
      streamUrl: `${GO2RTC_API}/api/stream.mjpeg?src=frontdoor`,
      type: "image",
      source: "go2rtc",
    });
  } catch (err) {
    console.error("[Camera] go2rtc not available:", err);
    return Response.json({
      error: "go2rtc not running. Use an HTTP URL instead of RTSP, or run in Docker.",
      streamUrl: null,
    }, { status: 503 });
  }
}
