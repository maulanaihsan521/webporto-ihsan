import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Catch-all route to serve uploaded files.
 * Checks /tmp/uploads first (serverless writable), then public/uploads (committed files).
 * This ensures uploaded files are accessible even on read-only serverless filesystems.
 */

const TMP_UPLOAD_DIR = "/tmp/uploads";
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await params;
  const filename = pathParts.join("/");

  // Security: prevent path traversal
  if (filename.includes("..")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Try /tmp/uploads first (serverless writable directory)
  const tmpPath = path.join(TMP_UPLOAD_DIR, filename);
  if (existsSync(tmpPath)) {
    try {
      const buffer = await readFile(tmpPath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = getContentType(ext);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "Content-Length": buffer.length.toString(),
        },
      });
    } catch {}
  }

  // Try public/uploads (local dev or committed files)
  const publicPath = path.join(PUBLIC_UPLOAD_DIR, filename);
  if (existsSync(publicPath)) {
    try {
      const buffer = await readFile(publicPath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = getContentType(ext);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": buffer.length.toString(),
        },
      });
    } catch {}
  }

  return new NextResponse("File not found", { status: 404 });
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".zip": "application/zip",
    ".rar": "application/vnd.rar",
  };
  return types[ext] || "application/octet-stream";
}
