import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Serve media file from /tmp/uploads/ (serverless-writable directory).
 * SECURITY (Task 12): endpoint kini admin-only (tidak dipakai halaman publik).
 * Content-Type diturunkan dari ekstensi (allowlist) — bukan nilai DB — plus
 * nosniff, dan non-media dipaksa Content-Disposition: attachment supaya
 * file yang tidak dikenal tidak pernah dieksekusi sebagai HTML oleh browser.
 */

// /tmp/uploads is writable on Alibaba Cloud FC
const TMP_UPLOAD_DIR = "/tmp/uploads";
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ekstensi → Content-Type aman (hanya tipe inline-able yang dipetakan)
const SAFE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4",
  ".pdf": "application/pdf", ".txt": "text/plain", ".csv": "text/csv",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // SECURITY (Task 12): wajib session admin — data media adalah aset privat CMS
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;

  // Find media record by ID
  const media = await db.media.findUnique({ where: { id } });
  if (!media) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Only serve files that use /uploads/ paths (not OSS URLs or external URLs)
  if (!media.url.startsWith("/uploads/")) {
    // SECURITY: hanya redirect ke http(s) absolut (tolak javascript:/data: dkk)
    if (/^https?:\/\//i.test(media.url)) {
      return NextResponse.redirect(media.url);
    }
    return new NextResponse("Unsupported media URL", { status: 400 });
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
    // Content-Type dari ekstensi (bukan DB) — unknown → octet-stream + attachment
    const ext = path.extname(media.url).toLowerCase();
    const safeType = SAFE_CONTENT_TYPES[ext] || "application/octet-stream";
    const isInline = safeType.startsWith("image/") || safeType.startsWith("video/") || safeType.startsWith("audio/");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": safeType,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": isInline ? "inline" : `attachment; filename="${media.name.replace(/["\\\r\n]/g, "_")}"`,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return new NextResponse("File read error", { status: 500 });
  }
}
