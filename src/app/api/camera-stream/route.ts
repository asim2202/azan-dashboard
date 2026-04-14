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

  // RTSP/RTSPS - check go2rtc and register stream
  try {
    // Check go2rtc is running
    const ping = await fetch(`${GO2RTC_API}/api/streams`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!ping.ok) throw new Error("go2rtc not responding");

    // Register/update the stream (PUT with plain text body = stream source URL)
    await fetch(`${GO2RTC_API}/api/streams?src=frontdoor`, {
      method: "PUT",
      body: cameraUrl,
    });

    // Verify stream was added
    const streamsRes = await fetch(`${GO2RTC_API}/api/streams`);
    const streams = await streamsRes.json();
    console.log("[Camera] go2rtc streams:", JSON.stringify(streams));

    return Response.json({
      source: "go2rtc",
      streamName: "frontdoor",
      go2rtcPort: 1984,
      type: "image",
    });
  } catch (err) {
    console.error("[Camera] go2rtc error:", err);
    return Response.json({
      error: "go2rtc not available. Restart the container after setting camera URL.",
    }, { status: 503 });
  }
}
