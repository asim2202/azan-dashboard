import fs from "fs";
import { getConfig, saveConfig } from "@/lib/config";
import type { AppConfig } from "@/types/config";

const GO2RTC_CONFIG = "/tmp/go2rtc.yaml";

function updateGo2rtcConfig(cameraUrl: string) {
  const streamLine = cameraUrl ? `\n  frontdoor: ${cameraUrl}` : "";
  const yaml = `api:
  listen: ":1984"
rtsp:
  listen: ":8554"
streams:${streamLine || " {}"}
`;
  try {
    fs.writeFileSync(GO2RTC_CONFIG, yaml, "utf-8");
    console.log("[go2rtc] Config updated with stream:", cameraUrl || "(none)");
  } catch (err) {
    console.error("[go2rtc] Failed to write config:", err);
  }
}

export async function GET() {
  return Response.json(getConfig());
}

export async function POST(request: Request) {
  try {
    const body: AppConfig = await request.json();

    if (!body.location?.timezone || !body.location?.city) {
      return Response.json({ error: "Missing required location fields" }, { status: 400 });
    }
    if (typeof body.location.latitude !== "number" || typeof body.location.longitude !== "number") {
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    saveConfig(body);

    // Update go2rtc config if camera URL is RTSP
    const camUrl = body.camera?.url || "";
    if (camUrl.startsWith("rtsp") && body.camera?.enabled) {
      updateGo2rtcConfig(camUrl);

      // Tell go2rtc to reload by restarting its stream
      try {
        await fetch("http://127.0.0.1:1984/api/streams?src=frontdoor", {
          method: "PUT",
          body: camUrl,
        });
        console.log("[go2rtc] Stream registered via API");
      } catch {
        console.log("[go2rtc] API registration failed - stream will load from config on next restart");
      }
    }

    return Response.json({ success: true, config: getConfig() });
  } catch (err) {
    console.error("[Config] Save failed:", err);
    return Response.json({ error: "Failed to save config" }, { status: 500 });
  }
}
