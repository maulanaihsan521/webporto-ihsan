// Lihat record Portfolio + PortfolioImage PlatterTea saat ini
// Jalankan via: node scripts/run-with-env.js node scripts/check-plattertea-gallery.js
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const p = await c.query(
    `SELECT id, slug, title, thumbnail, banner FROM "Portfolio" WHERE slug = 'plattertea-food-tea-website'`
  );
  const port = p.rows[0];
  console.log("PORTFOLIO:", JSON.stringify(port, null, 2));

  const imgs = await c.query(
    `SELECT id, url, alt, caption, "orderId", media_id FROM "PortfolioImage" WHERE portfolio_id = $1 ORDER BY "orderId" ASC`,
    [port.id]
  );
  console.log(`\nGALERI (${imgs.rows.length} gambar):`);
  imgs.rows.forEach((r, i) => {
    console.log(`#${i + 1} [orderId=${r.orderId}] ${r.url}`);
    console.log(`   alt: ${r.alt}`);
    console.log(`   caption: ${r.caption}`);
  });

  await c.end();
})();
