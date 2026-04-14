import { getConfig } from "@/lib/config";

const GO2RTC_API = "http://127.0.0.1:1984";

export async function GET() {
  const config = getConfig();

  if (!config.camera?.enabled || !config.camera?.url) {
    return Response.json({ error: "Camera not configured" }, { status: 404 });
  }

  const cameraUrl = config.camera.url;

  // HTTP URLs pass through directly
  if (cameraUrl.startsWith("http")) {
    return Response.json({
      streamUrl: cameraUrl,
      type: config.camera.type,
      source: "direct",
    });
  }

  // RTSP/RTSPS - just check go2rtc is running (stream is configured via go2rtc.yaml)
  try {
    const ping = await fetch(`${GO2RTC_API}/api/streams`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!ping.ok) throw new Error("go2rtc not responding");

    return Response.json({
      source: "go2rtc",
      streamName: "frontdoor",
      go2rtcPort: 1984,
      type: "image",
    });
  } catch (err) {
    console.error("[Camera] go2rtc error:", err);
    return Response.json({
      error: "go2rtc not available. Restart container after setting camera URL.",
    }, { status: 503 });
  }
}
