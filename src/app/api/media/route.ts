import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { isOssEnabled, uploadToOss, deleteFromOss } from "@/lib/oss";
import { isSupabaseStorageEnabled, uploadToSupabase, deleteFromSupabase, isSupabaseStorageUrl } from "@/lib/supabase-storage";
import { revalidatePublicPages } from "@/lib/revalidate";
import { shouldConvertToWebp, convertImageToWebp, toWebpFilename } from "@/lib/image-convert";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const TMP_UPLOAD_DIR = "/tmp/uploads"; // Writable on Alibaba Cloud FC serverless
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

// SECURITY (Task 12): Allowlist ekstensi upload — tolak SVG/HTML/exe (stored-XSS
// via content-type serv asli / navigasi langsung). Semua upload kini admin-only.
const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif",
  ".mp4", ".webm", ".mov", ".mp3", ".wav", ".ogg", ".m4a",
  ".pdf", ".zip", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv",
]);
const BLOCKED_MIME = new Set([
  "text/html", "application/xhtml+xml", "image/svg+xml", "application/xml", "text/xml",
]);

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || undefined;
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const where: any = {};
  if (folder) where.folder = folder;
  if (type) where.type = type;
  if (q) where.name = { contains: q };

  const media = await db.media.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const folder = (formData.get("folder") as string) || "/";

    // Ensure upload directories exist
    for (const dir of [PUBLIC_UPLOAD_DIR, TMP_UPLOAD_DIR]) {
      if (!existsSync(dir)) {
        try { await mkdir(dir, { recursive: true }); } catch {}
      }
    }

    // ITERATION 2026-08-26: Explicit type annotation untuk fix TS inference
    // error (sebelumnya `results = []` di-infer sebagai `never[]`).
    type UploadResult = { name: string; error: string } | {
      id: string; name: string; url: string; type: string;
      mimeType: string | null; size: number; folder: string;
      width: number | null; height: number | null; alt: string | null;
      createdAt: Date; updatedAt: Date;
    };
    const results: UploadResult[] = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        results.push({ name: file.name, error: "File too large (max 20MB)" });
        continue;
      }
      let ext = path.extname(file.name).toLowerCase();
      let mime = file.type || "application/octet-stream";

      // SECURITY (Task 12): gate ekstensi + MIME sebelum diproses/di-upload.
      if (!ALLOWED_EXTENSIONS.has(ext) || BLOCKED_MIME.has(mime)) {
        results.push({ name: file.name, error: `Tipe file tidak diizinkan (${ext || "tanpa ekstensi"})` });
        continue;
      }
      // Anotasi eksplisit `Buffer` (= Buffer<ArrayBufferLike>): Buffer.from()
      // menghasilkan Buffer<ArrayBuffer>, sedangkan output sharp toBuffer()
      // bertipe Buffer<ArrayBufferLike> → tanpa anotasi, assignment
      // hasil konversi WebP di bawah menghasilkan TS2322.
      let buffer: Buffer = Buffer.from(await file.arrayBuffer());
      let displayName = file.name;

      // ── WEBP AUTO-CONVERSION ──────────────────────────────────────────
      // Hemat egress Supabase (kuota free plan 5GB/bln terlampaui):
      // semua JPG/PNG dikonversi ke WebP q82 max 2560px → ukuran turun
      // 60-90%, kualitas visual tetap bagus. GIF/SVG/WebP/file kecil dilewati.
      let convertedWidth: number | null = null;
      let convertedHeight: number | null = null;
      if (shouldConvertToWebp(file.name, mime, buffer.length)) {
        try {
          const converted = await convertImageToWebp(buffer);
          // Safety net: kalau hasil konversi malah lebih besar dari aslinya
          // (sangat jarang — mis. PNG 1-bit), pakai file asli.
          if (converted.buffer.length < buffer.length) {
            buffer = converted.buffer;
            ext = ".webp";
            mime = "image/webp";
            displayName = toWebpFilename(displayName);
            convertedWidth = converted.width;
            convertedHeight = converted.height;
          }
        } catch (e) {
          // Konversi gagal (file korup?) → upload file asli apa adanya.
          console.warn(`[webp-convert] skip ${file.name}:`, (e as Error)?.message);
        }
      }

      const baseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9-_]/g, "_");
      const filename = `${Date.now()}_${baseName}${ext}`;

      let type = "DOCUMENT";
      if (mime.startsWith("image/")) type = "IMAGE";
      else if (mime.startsWith("video/")) type = "VIDEO";
      else if (mime.startsWith("audio/")) type = "AUDIO";
      else if (/(zip|rar|7z|tar|gz)/.test(ext)) type = "ARCHIVE";

      let url: string;

      if (isSupabaseStorageEnabled) {
        // ✅ Supabase Storage: permanent cloud storage (survives re-deploys)
        url = await uploadToSupabase(`uploads/${filename}`, buffer, mime);
      } else if (isOssEnabled) {
        // ✅ OSS: Upload to cloud (permanent storage)
        const ossKey = `uploads/${filename}`;
        url = await uploadToOss(ossKey, buffer, mime);
      } else {
        // ✅ No OSS: Write to /tmp/uploads (writable on serverless) AND public/uploads (local dev)
        let written = false;

        // Try /tmp/uploads (serverless writable)
        try {
          const tmpPath = path.join(TMP_UPLOAD_DIR, filename);
          await writeFile(tmpPath, buffer);
          written = true;
        } catch {}

        // Also try public/uploads (local dev)
        try {
          const publicPath = path.join(PUBLIC_UPLOAD_DIR, filename);
          await writeFile(publicPath, buffer);
        } catch {}

        if (!written) {
          results.push({ name: file.name, error: "Cannot save file. Filesystem not writable." });
          continue;
        }

        url = `/uploads/${filename}`;
      }

      const media = await db.media.create({
        data: {
          name: displayName,
          url,
          type,
          mimeType: mime,
          size: buffer.length, // ukuran SETELAH konversi WebP (bukan file asli)
          folder,
          ...(convertedWidth ? { width: convertedWidth } : {}),
          ...(convertedHeight ? { height: convertedHeight } : {}),
        },
      });
      results.push(media);
    }

    revalidatePublicPages();
    return NextResponse.json({ ok: true, files: results });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const media = await db.media.findUnique({ where: { id } });
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (isSupabaseStorageEnabled && isSupabaseStorageUrl(media.url)) {
      // ✅ Supabase Storage: delete from bucket
      await deleteFromSupabase(media.url);
    } else if (media.url.startsWith("http")) {
      await deleteFromOss(media.url);
    } else if (media.url.startsWith("/uploads/")) {
      const filename = media.url.replace("/uploads/", "");
      // Try delete from /tmp
      try {
        const tmpPath = path.join(TMP_UPLOAD_DIR, filename);
        if (existsSync(tmpPath)) await unlink(tmpPath);
      } catch {}
      // Try delete from public
      try {
        const publicPath = path.join(PUBLIC_UPLOAD_DIR, filename);
        if (existsSync(publicPath)) await unlink(publicPath);
      } catch {}
    }

    await db.media.delete({ where: { id } });
    revalidatePublicPages();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    const body = await req.json();
    const { id, name, alt, folder } = body;
    const media = await db.media.update({
      where: { id },
      data: { name, alt, folder },
    });
    return NextResponse.json(media);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
