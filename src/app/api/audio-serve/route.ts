import fs from "fs";
import path from "path";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file");

  if (!file) {
    return new Response("Missing file parameter", { status: 400 });
  }

  // Security: only allow basename, no path traversal
  const safeName = path.basename(file);
  const filePath = path.join(AUDIO_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return new Response("Audio file not found", { status: 404 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
