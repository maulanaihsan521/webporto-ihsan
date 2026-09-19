// Detail lengkap 3 portofolio tanpa deskripsi + galeri
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();
  const r = await client.query(`
    SELECT p.id, p.title, p.slug, p.excerpt, p.description, p.client, p.role,
           p.technologies, p."startDate", p."endDate", p."projectDate",
           p."githubUrl", p."demoUrl", p."figmaUrl", p."youtubeUrl", p."downloadUrl", p."videoUrl",
           p."metaTitle", p."metaDescription", p."categoryId"
    FROM "Portfolio" p
    WHERE p.slug IN ('website-company-profile','game-ihsan-racing','aplikasiworkspace')
  `);
  for (const p of r.rows) {
    console.log(`\n===== ${p.title} (${p.slug}) =====`);
    console.log(JSON.stringify(p, null, 2).slice(0, 1500));
  }
  const g = await client.query(`
    SELECT "portfolioId", url, "altText", "sortOrder" FROM "PortfolioGallery"
    WHERE "portfolioId" = ANY($1::text[])
    ORDER BY "portfolioId", "sortOrder"
  `, [r.rows.map((x) => x.id)]);
  console.log(`\n=== GALLERY (${g.rows.length} gambar) ===`);
  for (const img of g.rows) {
    console.log(`portfolio=${img.portfolioId.slice(-6)} sort=${img.sortOrder} ${img.url.slice(0, 90)} | alt: ${img.altText}`);
  }
  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
