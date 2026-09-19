/**
 * MIGRASI: Artikel Market → Post Blog (kategori "Financial Market")
 * ===================================================================
 * Kebutuhan user: "artikel market pindah ke blog, agar ketika market
 * di-off artikel tetap ada". Semua baris MarketArticle dipindahkan ke
 * tabel Post (kategori Financial Market) sehingga:
 *  - Artikel tampil & dikelola lewat blog (/blog/[slug]) + admin Blog
 *  - Toggle market_section hanya menyembunyikan fitur market
 *    (nav, halaman tools /financial-market), BUKAN artikelnya
 *  - URL lama /financial-market/[slug] di-redirect 308 → /blog/[slug]
 *
 * Mapping field:
 *  - type (ANALYSIS/TECHNICAL/...) → tag "Analisis"/"Teknikal"/...
 *  - instrument (IDX:TLKM dll)     → tag tambahan (tampil sebagai badge)
 *  - readingTime dihitung ulang (kata/200) — pola lib/utils.ts
 *
 * SAFETY:
 *  - Backup seluruh MarketArticle → scripts/data/backup-market-articles.json
 *  - Idempotent: slug yang sudah ada di Post di-skip (match guard)
 *  - Baris MarketArticle TIDAK dihapus (safety net / rollback manual)
 */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(process.cwd(), "scripts", "data");
const BACKUP_FILE = path.join(BACKUP_DIR, "backup-market-articles.json");

// Label tag — KONVENSI yang dipakai juga halaman market (list) & home:
// tag pertama = tipe artikel, tag berikutnya = instrumen.
const TYPE_TO_TAG = {
  ANALYSIS: "Analisis",
  TECHNICAL: "Teknikal",
  FUNDAMENTAL: "Fundamental",
  EDUCATION: "Edukasi",
  RISK: "Risk Management",
  JOURNAL: "Jurnal",
};

function tagSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function computeReadingTime(content) {
  const words = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function getOrCreateTag(name) {
  const existing = await prisma.tag.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.tag.create({ data: { name, slug: tagSlug(name) } });
}

async function main() {
  console.log("=== Migrasi MarketArticle → Post (blog) ===\n");

  const [articles, finCat, adminUser] = await Promise.all([
    prisma.marketArticle.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.category.findFirst({ where: { slug: "financial-market" } }),
    prisma.user.findFirst({ where: { role: "ADMIN" } }),
  ]);

  if (!finCat) throw new Error('Kategori "financial-market" tidak ditemukan di DB');
  if (!adminUser) throw new Error("User ADMIN tidak ditemukan (authorId wajib)");

  console.log(`MarketArticle: ${articles.length} baris`);
  console.log(`Kategori: ${finCat.name} (${finCat.id}) | type: ${finCat.type}`);
  console.log(`Author: ${adminUser.name} (${adminUser.id})\n`);

  // === 1. BACKUP ===
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(articles, null, 2));
  console.log(`Backup ${articles.length} baris → ${path.relative(process.cwd(), BACKUP_FILE)}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const a of articles) {
    // Match guard: slug sudah dipakai Post lain → skip (idempotent)
    const existingPost = await prisma.post.findUnique({ where: { slug: a.slug } });
    if (existingPost) {
      console.log(`SKIP  ${a.slug} — sudah ada di Post (id ${existingPost.id})`);
      skipped++;
      continue;
    }

    // Tags: [labelTipe, instrumen?]
    const tagNames = [TYPE_TO_TAG[a.type] ?? a.type];
    if (a.instrument) tagNames.push(a.instrument);
    const tags = [];
    for (const name of tagNames) {
      tags.push(await getOrCreateTag(name));
    }

    try {
      const post = await prisma.post.create({
        data: {
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          content: a.content,
          coverImage: a.coverImage,
          published: a.published,
          featured: a.featured,
          viewCount: a.viewCount,
          metaTitle: a.metaTitle,
          metaDescription: a.metaDescription,
          readingTime: computeReadingTime(a.content),
          authorId: adminUser.id,
          categoryId: finCat.id,
          publishedAt: a.publishedAt, // null tetap null (draft BBRI)
          tags: { connect: tags.map((t) => ({ id: t.id })) },
        },
      });
      console.log(
        `OK    ${post.slug} — pub:${a.published} feat:${a.featured} tags:[${tagNames.join(", ")}] baca:${post.readingTime}m`,
      );
      created++;
    } catch (e) {
      console.error(`FAIL  ${a.slug} — ${e.message}`);
      failed++;
    }
  }

  // === Ringkasan & verifikasi ===
  const [totalPosts, marketPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { category: { slug: "financial-market" } } }),
  ]);
  const leftoverPublished = await prisma.marketArticle.count({
    where: { published: true },
  });

  console.log("\n=== RINGKASAN ===");
  console.log(`Dibuat: ${created} | Skip: ${skipped} | Gagal: ${failed}`);
  console.log(`Total Post: ${totalPosts} (kategori Financial Market: ${marketPosts})`);
  console.log(
    `MarketArticle legacy tersisa: ${articles.length} baris (published: ${leftoverPublished}) — TIDAK dihapus (safety net)`,
  );
  console.log(
    "\nCatatan: baris legacy tetap tampil di blog-list versi produksi LAMA (merge MarketArticle)\nsampai kode baru di-push — duplikat sementara yang wajar.",
  );
}

main()
  .catch((e) => {
    console.error("MIGRASI GAGAL:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
