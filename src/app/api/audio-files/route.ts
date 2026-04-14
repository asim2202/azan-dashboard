import fs from "fs";
import path from "path";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

export async function GET() {
  try {
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
      return Response.json({ files: [] });
    }

    const entries = fs.readdirSync(AUDIO_DIR);
    const files = entries
      .filter((f) => /\.(mp3|wav|ogg|m4a)$/i.test(f))
      .map((f) => {
        const stat = fs.statSync(path.join(AUDIO_DIR, f));
        return {
          name: f,
          path: `/audio/${f}`,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({ files });
  } catch (err) {
    console.error("[Audio Files] List failed:", err);
    return Response.json({ files: [], error: "Failed to list audio files" });
  }
}

export async function DELETE(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return Response.json({ error: "Missing file name" }, { status: 400 });
    }

    // Sanitize filename
    const safeName = path.basename(name);
    const filePath = path.join(AUDIO_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return Response.json({ success: true });
  } catch (err) {
    console.error("[Audio Files] Delete failed:", err);
    return Response.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
