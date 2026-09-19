#!/usr/bin/env node
/**
 * Fix favicon set untuk portofolio.
 *
 * MASALAH (ditemukan 2026-09-11):
 * 1. public/logo-mi.png sebenarnya berisi data JPEG (1024x1024) dengan ekstensi
 *    .png — diserve dengan content-type image/png → mismatch; crawler favicon
 *    Google bisa menolak/menampilkan buruk.
 * 2. Huruf emas "M1" hanya menempati 62% lebar x 42% tinggi frame — background
 *    adalah gradient radial gelap (bukan hitam solid), ada glow luas di sekitar
 *    huruf. Pada ukuran kecil (16-28px di tab browser & Google SERP) logo
 *    terlihat kecil/tidak sesuai.
 *
 * FIX:
 * - Deteksi bbox huruf dengan threshold grayscale 60 (background gradient
 *    bernilai < 60 di area luar huruf; threshold rendah salah tangkap glow)
 * - Crop jendela persegi 768px (kelipatan 48 sesuai panduan Google Search)
 *   berpusat di centroid huruf → huruf mengisi ~83% lebar frame
 *    (window 768 dipilih karena 638px huruf / 768 = 83%)
 * - Tulis PNG ASLI (tanpa resize, crop murni — kualitas piksel asli):
 *    public/logo-mi.png (768), src/app/icon.png (512),
 *    public/apple-touch-icon.png (180), public/icon-192.png, public/icon-512.png
 * - Rebuild public/favicon.ico (16/32/48/64, PNG-in-ICO)
 * - Preview 32/64px untuk verifikasi visual
 *
 * Idempoten: re-run pada file hasil run ini tetap menghasilkan output sama
 * (huruf tetap 83% → window 768 dari 768 = seluruh frame).
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "logo-mi.png");
const OUT_LOGO = path.join(ROOT, "public", "logo-mi.png");
const OUT_APP_ICON = path.join(ROOT, "src", "app", "icon.png");
const OUT_ICO = path.join(ROOT, "public", "favicon.ico");
const OUT_APPLE = path.join(ROOT, "public", "apple-touch-icon.png");
const OUT_192 = path.join(ROOT, "public", "icon-192.png");
const OUT_512 = path.join(ROOT, "public", "icon-512.png");
const PREVIEW_DIR = "/home/z/my-project/scripts";

// --- Konfigurasi framing ---
const WINDOW = 768;         // jendela crop persegi (kelipatan 48, panduan Google)
const ICO_SIZES = [16, 32, 48, 64];
const LETTER_THRESHOLD = 60; // piksel > threshold = huruf emas (glow gradient < 60)
const SAFETY_PAD = 12;      // px margin ekstra pada bbox huruf (shadow ikut)

async function main() {
  const srcBuf = await fs.readFile(SRC);
  const meta = await sharp(srcBuf).metadata();
  console.log(`[1] Source: ${path.basename(SRC)} — format=${meta.format} ${meta.width}x${meta.height} (${srcBuf.length} bytes)`);

  // --- Scan bounding box HURUF (grayscale raw full-res, threshold tinggi) ---
  // Threshold 60 penting: background logo adalah gradient radial (glow) yang
  // bernilai 11-60 di sekitar huruf. Threshold rendah salah tangkap glow →
  // bbox menempel tepi frame → crop tidak memperbesar huruf.
  const { data: gray, info } = await sharp(srcBuf)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let minX = W, minY = H, maxX = -1, maxY = -1, bright = 0;
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      if (gray[row + x] > LETTER_THRESHOLD) {
        bright++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("Tidak ada konten terdeteksi — logo kosong?");
  const lettersW = maxX - minX + 1;
  const lettersH = maxY - minY + 1;
  console.log(`[2] Bounding box huruf: x=${minX}..${maxX} y=${minY}..${maxY} → ${lettersW}x${lettersH} (${(lettersW / W * 100).toFixed(0)}% x ${(lettersH / H * 100).toFixed(0)}% frame, ${((bright / (W * H)) * 100).toFixed(1)}% piksel)`);

  // --- Hitung jendela crop persegi berpusat di centroid huruf ---
  // Window 768 = kelipatan 48 (panduan Google Search favicon). Huruf 638px
  // → mengisi 83% lebar. Glow & gradient ikut di dalam jendela (otomatis
  // ter-center di centroid) — tampilan tetap natural, tanpa composite buatan.
  const win = Math.min(WINDOW, W, H);
  const cx = Math.round((minX + maxX) / 2);
  const cy = Math.round((minY + maxY) / 2);
  const left = Math.max(0, Math.min(W - win, cx - (win >> 1)));
  const top = Math.max(0, Math.min(H - win, cy - (win >> 1)));
  const composed = await sharp(srcBuf)
    .extract({ left, top, width: win, height: win })
    .png({ compressionLevel: 9 })
    .toBuffer();
  console.log(`[3] Crop jendela ${win}x${win} pada (${left},${top}) — huruf kini ~${(lettersW / win * 100).toFixed(0)}% lebar frame (dari ${(lettersW / W * 100).toFixed(0)}%)`);

  // --- Tulis logo utama (PNG asli, tanpa resize — kualitas piksel asli) ---
  await fs.writeFile(OUT_LOGO, composed);
  console.log(`[4] Ditulis ${path.relative(ROOT, OUT_LOGO)} — ${composed.length} bytes (${win}x${win} PNG asli)`);

  // --- Tulis turunan berbagai ukuran (semua PNG asli hasil downscale lanczos3) ---
  const variants = [
    [OUT_APP_ICON, 512, "src/app/icon.png (file convention Next.js)"],
    [OUT_APPLE, 180, "public/apple-touch-icon.png (iOS)"],
    [OUT_192, 192, "public/icon-192.png (PWA manifest)"],
    [OUT_512, 512, "public/icon-512.png (PWA manifest)"],
  ];
  for (const [out, size, label] of variants) {
    const buf = await sharp(composed).resize(size, size, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();
    await fs.writeFile(out, buf);
    console.log(`    ${label} — ${buf.length} bytes`);
  }

  // --- Rebuild favicon.ico (PNG-in-ICO 16/32/48/64) ---
  const pngs = [];
  for (const size of ICO_SIZES) {
    const buf = await sharp(composed).resize(size, size, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();
    pngs.push({ size, buf });
  }
  const ico = buildIco(pngs);
  await fs.writeFile(OUT_ICO, ico);
  console.log(`[5] Ditulis ${path.relative(ROOT, OUT_ICO)} — ${ico.length} bytes (${ICO_SIZES.join("/")} px)`);

  // --- Preview untuk verifikasi visual ---
  for (const s of [32, 64]) {
    const prev = await sharp(composed).resize(s, s, { kernel: "lanczos3" }).png().toBuffer();
    await fs.writeFile(path.join(PREVIEW_DIR, `favicon-preview-${s}.png`), prev);
  }
  console.log(`[6] Preview: ${PREVIEW_DIR}/favicon-preview-{32,64}.png`);

  // --- Verifikasi ---
  // CATATAN: sharp TIDAK bisa membaca format ICO sebagai input — verifikasi
  // favicon.ico dilakukan manual via header buffer (magic + entries).
  console.log("\n=== VERIFIKASI ===");
  for (const [label, p] of [["logo-mi.png", OUT_LOGO], ["app icon.png", OUT_APP_ICON], ["apple-touch", OUT_APPLE], ["icon-192", OUT_192], ["icon-512", OUT_512]]) {
    const buf = await fs.readFile(p);
    const m = await sharp(buf).metadata();
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    console.log(`${label}: ${m.format} ${m.width}x${m.height} ${buf.length}B — magic ${isPng ? "PNG OK" : "???"}`);
  }
  const icoBuf = await fs.readFile(OUT_ICO);
  const icoValid =
    icoBuf[0] === 0x00 && icoBuf[1] === 0x00 && icoBuf[2] === 0x01 && icoBuf[3] === 0x00 &&
    icoBuf[4] === ICO_SIZES.length % 256 && icoBuf[5] === Math.floor(ICO_SIZES.length / 256);
  const pngMagicAfterHeader =
    icoBuf[6 + 16 * ICO_SIZES.length + 0] === 0x89 && icoBuf[6 + 16 * ICO_SIZES.length + 1] === 0x50;
  console.log(`favicon.ico: ICO magic ${icoValid ? "OK" : "???"} (${icoBuf.length}B, ${ICO_SIZES.length} entri, data pertama ${pngMagicAfterHeader ? "PNG OK" : "???"})`);
  console.log("\nSELESAI — semua file favicon ter-regenerasi.");
}

/** Bangun container ICO dari daftar PNG buffer (PNG-in-ICO, didukung Chrome/Edge/Firefox). */
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);      // type: icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + 16 * count;
  const dirs = [];
  const blobs = [];
  for (const { size, buf } of pngs) {
    const dir = Buffer.alloc(16);
    dir[0] = size >= 256 ? 0 : size;   // width (0 = 256)
    dir[1] = size >= 256 ? 0 : size;   // height
    dir[2] = 0;                         // palette
    dir[3] = 0;                         // reserved
    dir.writeUInt16LE(1, 4);            // color planes
    dir.writeUInt16LE(32, 6);           // bits per pixel
    dir.writeUInt32LE(buf.length, 8);   // bytes in resource
    dir.writeUInt32LE(offset, 12);      // offset
    dirs.push(dir);
    blobs.push(buf);
    offset += buf.length;
  }
  return Buffer.concat([header, ...dirs, ...blobs]);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
