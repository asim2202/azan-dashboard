import fs from "fs";
import { getConfig, saveConfig } from "@/lib/config";
import type { AppConfig } from "@/types/config";

const GO2RTC_CONFIG = "/tmp/go2rtc.yaml";

function updateGo2rtcConfig(cameraUrl: string) {
  // Use exec:ffmpeg to pull RTSPS and pipe to go2rtc via stdout
  // -vcodec copy instead of -c:v copy (go2rtc splits on colons)
  const streamSource = cameraUrl
    ? `\n  frontdoor: "exec:ffmpeg -hide_banner -rtsp_transport tcp -i ${cameraUrl} -vcodec copy -an -f mpegts pipe:"`
    : "";
  const yaml = `api:
  listen: ":1984"
rtsp:
  listen: ":8554"
streams:${streamSource || " {}"}
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
    // go2rtc reads from config file - restart container to apply changes
    const camUrl = body.camera?.url || "";
    if (camUrl.startsWith("rtsp") && body.camera?.enabled) {
      updateGo2rtcConfig(camUrl);
      console.log("[go2rtc] Config written - restart container to apply");
    }

    return Response.json({ success: true, config: getConfig() });
  } catch (err) {
    console.error("[Config] Save failed:", err);
    return Response.json({ error: "Failed to save config" }, { status: 500 });
  }
}
