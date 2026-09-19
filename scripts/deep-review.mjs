#!/usr/bin/env node
/**
 * Deep Review & Iteration — audit menyeluruh situs portfolio
 *
 * Checklist:
 *  A. Semua halaman publik (dari sitemap.xml + halaman statis) → HTTP 200
 *  B. Semua URL aset (img src, link href, meta og:image) yang dirender → 200
 *  C. Meta tag tiap halaman: title, description, canonical, og tags
 *  D. Deteksi konten error ("Application error", "500", dsb.)
 *  E. Deteksi referensi gambar non-WebP yang tersisa (jpg/png besar)
 *
 * Output: laporan JSON + ringkasan console.
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

const STATIC_PAGES = [
  "/", "/about", "/gallery", "/portfolio", "/blog", "/experience",
      "/certificates", "/services", "/contact", "/education", "/faq",
      "/financial-market", "/skills", "/testimonials", "/search",
      "/privacy-policy", "/terms", "/sitemap",
];

async function fetchPage(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();
    return { ok: true, status: res.status, finalUrl: res.url, html };
  } catch (e) {
    return { ok: false, status: 0, error: e.message, html: "" };
  }
}

function extractAssets(html) {
  const assets = new Set();
  // img src (single/double quote)
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/g)) assets.add(m[1]);
  // link rel icon/apple/manifest
  for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)) assets.add(m[1]);
  // og:image / twitter:image meta
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["']/g)) {
    const v = m[1];
    if (/^https?:\/\//.test(v) && (/\.(webp|png|jpe?g|gif|svg|ico)/i.test(v) || /og-image/.test(v))) assets.add(v);
  }
  return [...assets].filter((a) => a && !a.startsWith("data:"));
}

function toAbsolute(a, pageUrl) {
  if (a.startsWith("//")) return "https:" + a;
  if (a.startsWith("/")) return BASE + a;
  if (/^https?:\/\//.test(a)) return a;
  try { return new URL(a, pageUrl).href; } catch { return a; }
}

async function main() {
  console.log(`=== DEEP REVIEW: ${BASE} ===\n`);

  // --- Kumpulkan URL halaman: statis + slug dinamis dari sitemap ---
  const pageUrls = [...STATIC_PAGES];
  const sitemapRes = await fetch(BASE + "/sitemap.xml").catch(() => null);
  if (sitemapRes && sitemapRes.ok) {
    const xml = await sitemapRes.text();
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const u = m[1].replace(BASE, "");
      if (!pageUrls.includes(u)) pageUrls.push(u);
    }
  }
  console.log(`[A] Halaman ditemukan: ${pageUrls.length} (statis ${STATIC_PAGES.length} + sitemap)\n`);

  const results = [];
  const assetFailures = [];
  const metaIssues = [];
  const allAssets = new Map(); // url -> {pages: []}
  const nonWebpImages = new Map();

  for (const p of pageUrls) {
    const url = BASE + p;
    const r = await fetchPage(url);
    const entry = { page: p, status: r.status, title: "", issues: [] };

    if (!r.ok || r.status !== 200) {
      entry.issues.push(`HTTP ${r.status || "ERR"} ${r.error || ""}`);
      results.push(entry);
      continue;
    }

    const html = r.html;
    // title
    const t = html.match(/<title>([^<]*)<\/title>/);
    entry.title = t ? t[1].trim() : "(NO TITLE)";
    if (!t || !t[1].trim()) entry.issues.push("missing <title>");
    if (/application error|internal server error|dsq.*error/i.test(html)) entry.issues.push("error text in HTML");

    // meta description
    if (!/<meta[^>]+name=["']description["']/i.test(html)) entry.issues.push("missing meta description");

    // canonical
    if (!/<link[^>]+rel=["']canonical["']/i.test(html)) entry.issues.push("missing canonical");

    // assets
    const assets = extractAssets(html);
    for (const a of assets) {
      const abs = toAbsolute(a, url);
      if (!allAssets.has(abs)) allAssets.set(abs, { pages: [] });
      allAssets.get(abs).pages.push(p);
      // deteksi gambar jpg/png non-webp yang bukan favicon
      if (/\.(jpe?g|png)(\?|$)/i.test(abs) && !/logo|favicon|icon/i.test(abs)) {
        if (!nonWebpImages.has(abs)) nonWebpImages.set(abs, { pages: [] });
        nonWebpImages.get(abs).pages.push(p);
      }
    }
    results.push(entry);
  }

  // --- C. Test semua aset unik ---
  console.log(`[B] Menguji ${allAssets.size} URL aset unik...`);
  const uniqueAssets = [...allAssets.keys()];
  const CONCURRENCY = 8;
  for (let i = 0; i < uniqueAssets.length; i += CONCURRENCY) {
    const batch = uniqueAssets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (a) => {
        try {
          const res = await fetch(a, { method: "GET", redirect: "follow" });
          const info = allAssets.get(a);
          if (res.status !== 200) {
            assetFailures.push({ url: a, status: res.status, pages: [...new Set(info.pages)].slice(0, 5) });
          }
        } catch (e) {
          assetFailures.push({ url: a, status: "ERR", error: e.message, pages: [...new Set(allAssets.get(a).pages)].slice(0, 5) });
        }
      })
    );
  }

  // --- Laporan ---
  console.log("\n=== RINGKASAN ===");
  const failed = results.filter((r) => r.issues.length);
  console.log(`Halaman: ${results.length} total, ${results.length - failed.length} OK, ${failed.length} bermasalah`);
  for (const f of failed) console.log(`  ! ${f.page}: ${f.issues.join("; ")}`);
  console.log(`\nAset: ${uniqueAssets.length} unik, ${assetFailures.length} GAGAL:`);
  for (const f of assetFailures) console.log(`  ! [${f.status}] ${f.url}\n      dipakai di: ${f.pages.join(", ")}`);
  console.log(`\nGambar non-WebP (jpg/png, non-ikon): ${nonWebpImages.size}`);
  for (const [u, info] of nonWebpImages) console.log(`  - ${u} (di: ${[...new Set(info.pages)].slice(0, 3).join(", ")})`);

  // judul halaman
  console.log("\n=== TITLE HALAMAN ===");
  for (const r of results) console.log(`  ${r.status} ${r.page.padEnd(28)} ${r.title.slice(0, 80)}`);

  // simpan laporan
  const fs = await import("node:fs/promises");
  const report = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    pages: results,
    assetFailures,
    nonWebpImages: [...nonWebpImages.entries()].map(([u, v]) => ({ url: u, pages: [...new Set(v.pages)] })),
  };
  await fs.writeFile("/home/z/my-project/scripts/deep-review-report.json", JSON.stringify(report, null, 2));
  console.log("\nLaporan lengkap: /home/z/my-project/scripts/deep-review-report.json");
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
