import fs from "fs";
import path from "path";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    if (!/\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
      return Response.json({ error: "Invalid file type. Supported: mp3, wav, ogg, m4a" }, { status: 400 });
    }

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Ensure directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    const filePath = path.join(AUDIO_DIR, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return Response.json({
      success: true,
      file: {
        name: safeName,
        path: `/audio/${safeName}`,
        size: file.size,
      },
    });
  } catch (err) {
    console.error("[Audio Upload] Failed:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
