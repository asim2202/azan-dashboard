import fs from "fs";
import { getConfig } from "@/lib/config";

const GO2RTC_CONFIG = "/tmp/go2rtc.yaml";
const GO2RTC_API = "http://127.0.0.1:1984";

function writeGo2rtcConfig(rtspUrl: string) {
  const yaml = `api:
  listen: ":1984"
rtsp:
  listen: ":8554"
streams:
  frontdoor: ${rtspUrl}
`;
  fs.writeFileSync(GO2RTC_CONFIG, yaml, "utf-8");
}

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

  // RTSP/RTSPS - configure go2rtc
  try {
    // Write the RTSP URL into go2rtc config
    writeGo2rtcConfig(cameraUrl);

    // Check if go2rtc is running by pinging its API
    let go2rtcRunning = false;
    try {
      const ping = await fetch(`${GO2RTC_API}/api/streams`, { signal: AbortSignal.timeout(2000) });
      go2rtcRunning = ping.ok;
    } catch {
      go2rtcRunning = false;
    }

    if (!go2rtcRunning) {
      return Response.json({
        error: "go2rtc not running. Restart the Docker container to apply camera settings.",
      }, { status: 503 });
    }

    // Tell go2rtc to reload by adding the stream via API
    try {
      await fetch(`${GO2RTC_API}/api/streams?src=frontdoor`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([cameraUrl]),
      });
    } catch {
      // go2rtc might pick it up from config on next access anyway
    }

    return Response.json({
      source: "go2rtc",
      streamName: "frontdoor",
      go2rtcPort: 1984,
      type: "image",
    });
  } catch (err) {
    console.error("[Camera] Error:", err);
    return Response.json({ error: "Camera setup failed" }, { status: 500 });
  }
}
