import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { isOssEnabled, uploadToOss, deleteFromOss } from "@/lib/oss";
import { isSupabaseStorageEnabled, uploadToSupabase, deleteFromSupabase, isSupabaseStorageUrl } from "@/lib/supabase-storage";
import { revalidatePublicPages } from "@/lib/revalidate";

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const TMP_UPLOAD_DIR = "/tmp/uploads"; // Writable on Alibaba Cloud FC serverless
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const folder = (formData.get("folder") as string) || "/";

    // Ensure upload directories exist
    for (const dir of [PUBLIC_UPLOAD_DIR, TMP_UPLOAD_DIR]) {
      if (!existsSync(dir)) {
        try { await mkdir(dir, { recursive: true }); } catch {}
      }
    }

    const results = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        results.push({ name: file.name, error: "File too large (max 20MB)" });
        continue;
      }
      const ext = path.extname(file.name).toLowerCase();
      const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
      const filename = `${Date.now()}_${baseName}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      let type = "DOCUMENT";
      const mime = file.type || "application/octet-stream";
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
          name: file.name,
          url,
          type,
          mimeType: mime,
          size: file.size,
          folder,
        },
      });
      results.push(media);
    }

    revalidatePublicPages();
    return NextResponse.json({ ok: true, files: results });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
