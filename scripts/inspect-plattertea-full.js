// Inspect portfolio PlatterTea lengkap: record + link + galeri
// Jalankan via: node scripts/run-with-env.js node scripts/inspect-plattertea-full.js
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, query_timeout: 30000, connectionTimeoutMillis: 15000 });
  await c.connect();

  const p = await c.query(
    `SELECT id, slug, title, excerpt, thumbnail, banner, "demoUrl", "githubUrl", status, featured, "createdAt", "updatedAt"
     FROM "Portfolio" WHERE slug = 'plattertea-food-tea-website'`
  );
  const port = p.rows[0];
  if (!port) throw new Error("Portfolio PlatterTea tidak ditemukan");
  console.log("=== PORTFOLIO ===");
  console.log(JSON.stringify(port, null, 2));

  const imgs = await c.query(
    `SELECT id, url, caption, "order" FROM "PortfolioImage" WHERE "portfolioId" = $1 ORDER BY "order" ASC`,
    [port.id]
  );
  console.log(`\n=== GALERI (${imgs.rows.length} gambar) ===`);
  imgs.rows.forEach((r) => {
    console.log(`[order=${r.order}] id=${r.id}`);
    console.log(`   url: ${r.url}`);
    console.log(`   caption: ${(r.caption || "").slice(0, 120)}`);
  });

  await c.end();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
