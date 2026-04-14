import { getConfig, saveConfig } from "@/lib/config";
import type { AppConfig } from "@/types/config";

export async function GET() {
  return Response.json(getConfig());
}

export async function POST(request: Request) {
  try {
    const body: AppConfig = await request.json();

    // Basic validation
    if (!body.location?.timezone || !body.location?.city) {
      return Response.json({ error: "Missing required location fields" }, { status: 400 });
    }
    if (typeof body.location.latitude !== "number" || typeof body.location.longitude !== "number") {
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    saveConfig(body);

    return Response.json({ success: true, config: getConfig() });
  } catch (err) {
    console.error("[Config] Save failed:", err);
    return Response.json({ error: "Failed to save config" }, { status: 500 });
  }
}
