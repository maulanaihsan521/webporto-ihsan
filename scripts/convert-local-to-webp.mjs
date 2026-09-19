/**
 * MIGRASI LOKAL: Konversi semua JPG/PNG di public/uploads/ → WebP
 * + update referensi URL di database Supabase.
 *
 * Latar: kuota Cached Egress Supabase (5GB/bln) terlampaui 138%.
 * Gambar full-res JPG (hingga 12MB) adalah penyumbang terbesar.
 *
 * Yang dilakukan script ini:
 * 1. Backup semua original ke .originals-backup/ (bukan di dalam public/,
 *    jadi tidak bisa diakses via web)
 * 2. Konversi setiap .jpg/.jpeg/.png → .webp (quality 82, max 2560px)
 * 3. Hapus file asli setelah konversi sukses
 * 4. Update SEMUA referensi URL di DB (Media, Gallery, Portfolio,
 *    PortfolioImage, Setting, User, Post, Certificate, Service, Testimonial)
 * 5. Cetak laporan penghematan ukuran
 *
 * File yang DILEWATI: .gif (animated), .svg (vector), .webp (sudah optimal),
 * file < 20KB (ikon kecil — biaya konversi tak sebanding).
 *
 * Idempoten: file yang sudah .webp dilewati; referensi DB yang sudah
 * menunjuk .webp tidak diubah.
 *
 * Jalankan:
 *   node scripts/convert-local-to-webp.mjs
 * (membaca DATABASE_URL dari .env)
 */
import { readdir, readFile, writeFile, mkdir, unlink, copyFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createRequire } from "module";
import dotenv from "dotenv";

// override: true PENTING — sandbox punya system DATABASE_URL (sqlite) yang
// kalau tidak dioverride akan dipakai Prisma dan menyebabkan error protokol.
dotenv.config({ path: path.join(process.cwd(), ".env"), override: true });

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");
const db = new PrismaClient();

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const BACKUP_DIR = path.join(process.cwd(), ".originals-backup");

const WEBP_QUALITY = 82;
const MAX_DIMENSION = 2560;
const MIN_SIZE = 20 * 1024; // 20KB — file kecil dilewati

const CONVERTIBLE = new Set([".jpg", ".jpeg", ".png"]);

// ─────────────────────────────────────────────────────────────────────────
// Konversi satu file
// ─────────────────────────────────────────────────────────────────────────
async function convertFile(filePath) {
  const buffer = await readFile(filePath);
  const { data, info } = await sharp(buffer)
    .rotate() // hormati EXIF orientation
    .resize(MAX_DIMENSION, MAX_DIMENSION, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, originalSize: buffer.length };
}

// ─────────────────────────────────────────────────────────────────────────
// Update referensi URL di database
// ─────────────────────────────────────────────────────────────────────────
function mapUrl(oldUrl, renameMap) {
  if (!oldUrl || typeof oldUrl !== "string") return oldUrl;
  // Cocokkan berdasarkan nama file (mendukung path lokal /uploads/xxx.jpg
  // maupun URL Supabase storage .../uploads/xxx.jpg)
  for (const [oldName, newName] of renameMap) {
    if (oldUrl.includes(oldName)) {
      return oldUrl.replace(oldName, newName);
    }
  }
  return oldUrl;
}

async function updateDatabase(renameMap, fileStats) {
  let totalUpdates = 0;

  // 1. Media
  const media = await db.media.findMany({ select: { id: true, url: true, name: true } });
  for (const m of media) {
    const newUrl = mapUrl(m.url, renameMap);
    const newName = m.name ? mapUrl(m.name, renameMap) : m.name;
    if (newUrl !== m.url || newName !== m.name) {
      const stat = fileStats.get(path.basename(newUrl));
      await db.media.update({
        where: { id: m.id },
        data: {
          ...(newUrl !== m.url ? { url: newUrl } : {}),
          ...(newName !== m.name ? { name: newName } : {}),
          ...(stat ? { size: stat.size, mimeType: "image/webp", width: stat.width, height: stat.height } : {}),
        },
      });
      totalUpdates++;
    }
  }

  // 2. Gallery (url, thumbnail)
  const galleries = await db.gallery.findMany({ select: { id: true, url: true, thumbnail: true } });
  for (const g of galleries) {
    const data = {};
    const newUrl = mapUrl(g.url, renameMap);
    const newThumb = mapUrl(g.thumbnail, renameMap);
    if (newUrl !== g.url) data.url = newUrl;
    if (newThumb !== g.thumbnail) data.thumbnail = newThumb;
    if (Object.keys(data).length) {
      await db.gallery.update({ where: { id: g.id }, data });
      totalUpdates++;
    }
  }

  // 3. Portfolio (thumbnail, banner)
  const portfolios = await db.portfolio.findMany({ select: { id: true, thumbnail: true, banner: true } });
  for (const p of portfolios) {
    const data = {};
    const newThumb = mapUrl(p.thumbnail, renameMap);
    const newBanner = mapUrl(p.banner, renameMap);
    if (newThumb !== p.thumbnail) data.thumbnail = newThumb;
    if (newBanner !== p.banner) data.banner = newBanner;
    if (Object.keys(data).length) {
      await db.portfolio.update({ where: { id: p.id }, data });
      totalUpdates++;
    }
  }

  // 4. PortfolioImage (url)
  try {
    const pImages = await db.portfolioImage.findMany({ select: { id: true, url: true } });
    for (const pi of pImages) {
      const newUrl = mapUrl(pi.url, renameMap);
      if (newUrl !== pi.url) {
        await db.portfolioImage.update({ where: { id: pi.id }, data: { url: newUrl } });
        totalUpdates++;
      }
    }
  } catch { /* tabel mungkin kosong/tidak ada field */ }

  // 5. Setting (value — mis. owner_photo, seo_og_image)
  const settings = await db.setting.findMany({ select: { id: true, value: true } });
  for (const s of settings) {
    const newValue = mapUrl(s.value, renameMap);
    if (newValue !== s.value) {
      await db.setting.update({ where: { id: s.id }, data: { value: newValue } });
      totalUpdates++;
    }
  }

  // 6. User (image)
  const users = await db.user.findMany({ select: { id: true, image: true } });
  for (const u of users) {
    const newImage = mapUrl(u.image, renameMap);
    if (newImage !== u.image) {
      await db.user.update({ where: { id: u.id }, data: { image: newImage } });
      totalUpdates++;
    }
  }

  // 7. Post (coverImage)
  const posts = await db.post.findMany({ select: { id: true, coverImage: true } });
  for (const p of posts) {
    const newCover = mapUrl(p.coverImage, renameMap);
    if (newCover !== p.coverImage) {
      await db.post.update({ where: { id: p.id }, data: { coverImage: newCover } });
      totalUpdates++;
    }
  }

  // 8. Certificate (imageUrl, logo)
  try {
    const certs = await db.certificate.findMany({ select: { id: true, imageUrl: true, logo: true } });
    for (const c of certs) {
      const data = {};
      const newImg = mapUrl(c.imageUrl, renameMap);
      const newLogo = mapUrl(c.logo, renameMap);
      if (newImg !== c.imageUrl) data.imageUrl = newImg;
      if (newLogo !== c.logo) data.logo = newLogo;
      if (Object.keys(data).length) {
        await db.certificate.update({ where: { id: c.id }, data });
        totalUpdates++;
      }
    }
  } catch { /* field opsional */ }

  // 9. Service (icon, logo)
  try {
    const services = await db.service.findMany({ select: { id: true, icon: true, logo: true } });
    for (const s of services) {
      const data = {};
      const newIcon = mapUrl(s.icon, renameMap);
      const newLogo = mapUrl(s.logo, renameMap);
      if (newIcon !== s.icon) data.icon = newIcon;
      if (newLogo !== s.logo) data.logo = newLogo;
      if (Object.keys(data).length) {
        await db.service.update({ where: { id: s.id }, data });
        totalUpdates++;
      }
    }
  } catch { /* field opsional */ }

  // 10. Testimonial (avatar)
  try {
    const testimonials = await db.testimonial.findMany({ select: { id: true, avatar: true } });
    for (const t of testimonials) {
      const newAvatar = mapUrl(t.avatar, renameMap);
      if (newAvatar !== t.avatar) {
        await db.testimonial.update({ where: { id: t.id }, data: { avatar: newAvatar } });
        totalUpdates++;
      }
    }
  } catch { /* field opsional */ }

  return totalUpdates;
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("════════════════════════════════════════════════════════════");
  console.log("  MIGRASI JPG/PNG → WEBP (file lokal public/uploads/)");
  console.log(`  Quality: ${WEBP_QUALITY} | Max dimensi: ${MAX_DIMENSION}px`);
  console.log("════════════════════════════════════════════════════════════\n");

  if (!existsSync(UPLOADS_DIR)) {
    console.error("Folder public/uploads/ tidak ditemukan!");
    process.exit(1);
  }

  const files = (await readdir(UPLOADS_DIR)).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return CONVERTIBLE.has(ext);
  });

  console.log(`Ditemukan ${files.length} file JPG/PNG untuk dikonversi.\n`);

  await mkdir(BACKUP_DIR, { recursive: true });

  const renameMap = new Map(); // old filename → new filename
  const fileStats = new Map(); // new filename → {size, width, height}
  let totalBefore = 0;
  let totalAfter = 0;
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  // ── REKONSILIASI (untuk re-run setelah crash) ──────────────────────
  // Kalau konversi file sudah selesai sebelumnya (original sudah terhapus,
  // .webp sudah ada, backup ada di .originals-backup/), bangun ulang
  // renameMap + fileStats dari keadaan disk supaya update DB tetap jalan.
  if (files.length === 0 && existsSync(BACKUP_DIR)) {
    const backups = (await readdir(BACKUP_DIR)).filter((f) => CONVERTIBLE.has(path.extname(f).toLowerCase()));
    for (const oldName of backups) {
      const ext = path.extname(oldName);
      const newName = `${oldName.slice(0, -ext.length)}.webp`;
      const webpPath = path.join(UPLOADS_DIR, newName);
      if (existsSync(webpPath)) {
        renameMap.set(oldName, newName);
        const buf = await readFile(webpPath);
        const meta = await sharp(buf).metadata();
        fileStats.set(newName, { size: buf.length, width: meta.width, height: meta.height });
        totalBefore += (await stat(path.join(BACKUP_DIR, oldName))).size;
        totalAfter += buf.length;
      }
    }
    if (renameMap.size > 0) {
      console.log(`Rekonsiliasi: ${renameMap.size} file sudah terkonversi sebelumnya (dari backup).`);
    }
  }

  for (const file of files) {
    const filePath = path.join(UPLOADS_DIR, file);
    const ext = path.extname(file);
    const baseName = file.slice(0, -ext.length);
    const newName = `${baseName}.webp`;
    const newPath = path.join(UPLOADS_DIR, newName);

    // Idempoten: .webp sudah ada → hapus original, registrasi rename saja
    if (existsSync(newPath)) {
      await unlink(filePath).catch(() => {});
      renameMap.set(file, newName);
      console.log(`↷ Sudah webp, hapus duplikat asli: ${file}`);
      continue;
    }

    try {
      const fileStat = await stat(filePath);
      if (fileStat.size < MIN_SIZE) {
        skipped++;
        console.log(`⏭ Skip (kecil, ${fileStat.size}B): ${file}`);
        continue;
      }

      const result = await convertFile(filePath);

      // Backup original dulu SEBELUM menulis .webp baru
      await copyFile(filePath, path.join(BACKUP_DIR, file)).catch((e) =>
        console.warn(`  ! backup gagal: ${e.message}`),
      );

      // Tulis file .webp baru
      await writeFile(newPath, result.buffer);
      // Hapus original
      await unlink(filePath);

      renameMap.set(file, newName);
      fileStats.set(newName, {
        size: result.buffer.length,
        width: result.width,
        height: result.height,
      });
      totalBefore += result.originalSize;
      totalAfter += result.buffer.length;
      converted++;

      const saving = ((1 - result.buffer.length / result.originalSize) * 100).toFixed(1);
      console.log(
        `✓ ${file} → ${newName}  ` +
          `${(result.originalSize / 1024 / 1024).toFixed(2)}MB → ${(result.buffer.length / 1024 / 1024).toFixed(2)}MB (${saving}% hemat, ${result.width}x${result.height})`,
      );
    } catch (e) {
      failed++;
      console.error(`✗ GAGAL ${file}: ${e.message}`);
    }
  }

  console.log("\n──────────── KONVERSI FILE SELESAI ────────────");
  console.log(`Berhasil: ${converted} | Skip: ${skipped} | Gagal: ${failed}`);
  if (totalBefore > 0) {
    console.log(
      `Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB ` +
        `(${((1 - totalAfter / totalBefore) * 100).toFixed(1)}% hemat)`,
    );
  }

  // Update database
  if (renameMap.size > 0) {
    console.log(`\nMengupdate referensi database (${renameMap.size} rename)...`);
    const updates = await updateDatabase(renameMap, fileStats);
    console.log(`✓ ${updates} baris database diperbarui.`);
  }

  console.log(`\nBackup original tersimpan di: ${BACKUP_DIR}`);
  console.log("NOTE: file Supabase Storage (60 file) dimigrasi terpisah via");
  console.log("      scripts/convert-supabase-to-webp.mjs (butuh service role key).");

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("FATAL:", e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
