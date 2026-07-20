import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Serve media file from /tmp/uploads/ (serverless-writable directory).
 * This route reads the file from the temporary filesystem and streams it as response.
 * Used when OSS is not configured — files are stored in /tmp which is writable
 * on Alibaba Cloud FC (unlike public/ which is read-only).
 *
 * Note: /tmp is ephemeral — files are lost on cold start.
 * For permanent storage, configure OSS.
 */

// /tmp/uploads is writable on Alibaba Cloud FC
const TMP_UPLOAD_DIR = "/tmp/uploads";
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Find media record by ID
  const media = await db.media.findUnique({ where: { id } });
  if (!media) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Only serve files that use /uploads/ paths (not OSS URLs or external URLs)
  if (!media.url.startsWith("/uploads/")) {
    return NextResponse.redirect(media.url);
  }

  const filename = media.url.replace("/uploads/", "");

  // Try /tmp first (serverless writable), then public/ (local dev / committed files)
  const tmpPath = path.join(TMP_UPLOAD_DIR, filename);
  const publicPath = path.join(PUBLIC_UPLOAD_DIR, filename);

  let filePath: string | null = null;
  if (existsSync(tmpPath)) {
    filePath = tmpPath;
  } else if (existsSync(publicPath)) {
    filePath = publicPath;
  }

  if (!filePath) {
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return new NextResponse("File read error", { status: 500 });
  }
}
