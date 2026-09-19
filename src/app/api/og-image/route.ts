import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { promises as fsp } from "fs";
import path from "path";

/**
 * OG image proxy — kompres gambar agar aman untuk preview WhatsApp/Telegram
 * saat link dibagikan.
 *
 * KENAPA DIPERLUKAN:
 * - Cover artikel di Supabase ~2MB PNG. WhatsApp hanya menampilkan preview
 *   og:image < ~300KB, jadi tanpa kompresi gambar tidak pernah muncul.
 * - Supabase image transformation (render endpoint) tidak aktif di proyek ini.
 *
 * FIX 2026-09-17 (preview OG tidak muncul di sosial media):
 * Aset LOKAL (/uploads/*.webp) sebelumnya disajikan mentah sebagai
 * image/webp — WhatsApp tidak merender preview WebP (harus JPEG/PNG/GIF)
 * → halaman yang og:image-nya aset lokal tidak memunculkan gambar. Kini
 * path lokal bisa dikonversi lewat param `p` (dibaca dari public/ langsung,
 * tanpa network hop; fallback: fetch origin sendiri).
 *
 * PARAMETER (satu dari dua):
 * - `u` = URL absolut (host wajib *.supabase.co / *.supabase.in / localhost)
 * - `p` = path aset lokal di bawah /uploads (mis. /uploads/banner.webp)
 *
 * KEAMANAN (anti open-proxy / SSRF / path traversal):
 * - `u`: hanya host allowlist; timeout fetch 8 detik; input maks 12MB.
 * - `p`: regex ketat ^/uploads/<segmen-aman>$ + verifikasi hasil resolve
 *   tetap berada di dalam direktori public/ (defense in depth).
 * - Gagal apa pun → konversi og-default (fallback) → 302 ke og-default
 *   (crawler tetap dapat gambar).
 *
 * CACHE: immutable 30 hari (browser) + 1 tahun (CDN) — URL mengandung param
 * `u`/`p` yang unik per sumber gambar, aman di-cache lintas halaman.
 */

export const runtime = "nodejs";

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const TARGET_BYTES = 300 * 1024; // batas preview WhatsApp ~300KB
const ALLOWED_HOST_SUFFIXES = [".supabase.co", ".supabase.in"];
// SECURITY (Task 12): localhost hanya di dev — di production bisa dipakai
// untuk SSRF port-probing (timing side-channel).
const ALLOWED_HOSTS = new Set(
  process.env.NODE_ENV === "production" ? [] : ["localhost", "127.0.0.1"],
);
const DEFAULT_OG_ASSET = "/uploads/og-default.webp";
/** /uploads/<segmen>/<segmen>/... — segmen hanya huruf, angka, . _ - (tanpa .. kosong) */
const LOCAL_PATH_RE = /^\/uploads(?:\/[A-Za-z0-9._-]+)+$/;

function isAllowedHost(hostname: string): boolean {
  return (
    ALLOWED_HOSTS.has(hostname) ||
    ALLOWED_HOST_SUFFIXES.some((s) => hostname.endsWith(s))
  );
}

/**
 * Baca aset lokal dari public/<p> dengan pengamanan path traversal:
 * - regex ketat pada bentuk path
 * - resolved path wajib tetap di dalam direktori public
 * Return null bila file tidak ada / tidak terbaca.
 */
async function readLocalAsset(p: string): Promise<Buffer | null> {
  if (!LOCAL_PATH_RE.test(p)) return null;
  const publicDir = path.resolve(process.cwd(), "public");
  const resolved = path.resolve(publicDir, `.${p}`); // ".${p}" mencegah path absolut
  if (!resolved.startsWith(publicDir + path.sep)) return null;
  try {
    const buf = await fsp.readFile(resolved);
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

/**
 * Fallback terakhir: 302 ke file default mentah (jika bahkan konversi
 * default gagal — sangat jarang, mis. file default hilang).
 */
function redirectFallback(req: NextRequest) {
  return NextResponse.redirect(new URL(DEFAULT_OG_ASSET, req.nextUrl.origin), 302);
}

/**
 * Ambil bytes sumber gambar dari URL upstream (allowlist host) —
 * return null bila gagal fetch / ukuran di luar batas.
 */
async function fetchRemote(src: URL): Promise<Buffer | null> {
  try {
    const upstream = await fetch(src.toString(), {
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "og-image-proxy/1.0" },
      cache: "no-store",
    });
    if (!upstream.ok) return null;
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_INPUT_BYTES) return null;
    return buf;
  } catch {
    return null;
  }
}

/**
 * Ambil bytes aset lokal: fs dulu (cepat, tanpa network), lalu fetch
 * origin sendiri sebagai fallback (menutup lingkungan tempat fs ke public/
 * tidak tersedia).
 */
async function fetchLocal(p: string, req: NextRequest): Promise<Buffer | null> {
  const viaFs = await readLocalAsset(p);
  if (viaFs) return viaFs;
  try {
    const url = new URL(p, req.nextUrl.origin);
    if (url.origin !== req.nextUrl.origin) return null; // sanity: jangan keluar origin
    return await fetchRemote(url);
  } catch {
    return null;
  }
}

/** Konversi buffer apa pun → JPEG 1200x630 < 300KB (kompres adaptif). */
async function toOgJpeg(buf: Buffer): Promise<Buffer | null> {
  if (buf.byteLength === 0 || buf.byteLength > MAX_INPUT_BYTES) return null;
  try {
    for (const q of [78, 62, 48, 38]) {
      const out = await sharp(buf)
        .rotate() // hormati EXIF orientasi
        .resize(1200, 630, { fit: "cover", position: "attention" })
        .jpeg({ quality: q, mozjpeg: true, chromaSubsampling: "4:2:0" })
        .toBuffer();
      if (out.byteLength <= TARGET_BYTES) return out;
    }
    return null; // gambar ekstrem (mis. noise) tidak bisa turun ke <300KB
  } catch {
    return null;
  }
}

function jpegResponse(out: Buffer): NextResponse {
  // Uint8Array view — Buffer tidak diterima BodyInit Next 16 types.
  return new NextResponse(new Uint8Array(out), {
    status: 200,
    headers: {
      "content-type": "image/jpeg",
      "content-length": String(out.byteLength),
      "cache-control": "public, max-age=2592000, s-maxage=31536000, immutable",
    },
  });
}

export async function GET(req: NextRequest) {
  const rawU = req.nextUrl.searchParams.get("u") ?? "";
  const rawP = req.nextUrl.searchParams.get("p") ?? "";

  let source: Buffer | null = null;

  if (rawP) {
    // --- Mode aset lokal (FIX 2026-09-17) ---
    source = await fetchLocal(rawP, req);
  } else if (rawU) {
    // --- Mode URL eksternal (perilaku lama) ---
    try {
      const src = new URL(rawU);
      if ((src.protocol === "https:" || src.protocol === "http:") && isAllowedHost(src.hostname)) {
        source = await fetchRemote(src);
      }
    } catch {
      source = null;
    }
  }

  // Konversi sumber utama; bila gagal → konversi default situs → 302.
  if (source) {
    const out = await toOgJpeg(source);
    if (out) return jpegResponse(out);
  }

  const fallbackBuf = await fetchLocal(DEFAULT_OG_ASSET, req);
  if (fallbackBuf) {
    const out = await toOgJpeg(fallbackBuf);
    if (out) return jpegResponse(out);
  }
  return redirectFallback(req);
}
