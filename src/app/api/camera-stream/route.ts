import { getConfig } from "@/lib/config";

const GO2RTC_API = "http://127.0.0.1:1984";

export async function GET(request: Request) {
  const config = getConfig();

  if (!config.camera?.enabled || !config.camera?.url) {
    return Response.json({ error: "Camera not configured" }, { status: 404 });
  }

  const cameraUrl = config.camera.url;

  // If the URL is already HTTP (MJPEG, snapshot, etc), pass it through
  if (cameraUrl.startsWith("http")) {
    return Response.json({
      streamUrl: cameraUrl,
      type: config.camera.type,
      source: "direct",
    });
  }

  // For RTSP/RTSPS URLs, register with go2rtc and tell browser to use go2rtc port
  try {
    // Register stream with go2rtc via its API
    // go2rtc API: PUT body with stream source URLs
    const addRes = await fetch(`${GO2RTC_API}/api/streams`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "frontdoor", src: cameraUrl }),
    });

    // Fallback: try query param format if JSON body didn't work
    if (!addRes.ok) {
      const fallbackRes = await fetch(
        `${GO2RTC_API}/api/streams?name=frontdoor&src=${encodeURIComponent(cameraUrl)}`,
        { method: "PUT" }
      );
      if (!fallbackRes.ok) {
        const text = await fallbackRes.text();
        console.error("[Camera] go2rtc registration failed:", fallbackRes.status, text);
        return Response.json({ error: "Failed to register stream" }, { status: 500 });
      }
    }

    // Return go2rtc info - browser will construct URL using its own hostname
    return Response.json({
      source: "go2rtc",
      streamName: "frontdoor",
      go2rtcPort: 1984,
      type: "image",
    });
  } catch (err) {
    console.error("[Camera] go2rtc not available:", err);
    return Response.json({
      error: "go2rtc not running. Use an HTTP URL instead of RTSP, or run in Docker.",
    }, { status: 503 });
  }
}
