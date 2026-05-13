import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

const NOTES_DIR_NAME = "학습정리";

const MIME_MAP: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);

  if (decoded.includes("/") || decoded.includes("\\") || decoded.includes("..")) {
    return new Response("Invalid filename", { status: 400 });
  }

  const filePath = path.join(process.cwd(), NOTES_DIR_NAME, decoded);

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(decoded).toLowerCase();
    const contentType = MIME_MAP[ext] ?? "application/octet-stream";
    const inline = ext === ".html" || ext === ".htm" || ext === ".pdf";

    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(decoded)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
