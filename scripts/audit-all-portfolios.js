// Inspeksi mendalam: SEMUA portofolio + galeri + format deskripsi
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();

  const ports = await client.query(`
    SELECT p.id, p.title, p.slug, p.excerpt, p.description, p.client, p.role,
           p.technologies, p.thumbnail, p.banner, p."videoUrl", p."youtubeUrl",
           p."githubUrl", p."demoUrl", p."figmaUrl", p."downloadUrl",
           p."categoryId", c.name AS "categoryName", c.slug AS "categorySlug",
           p.featured, p.status, p."projectDate"
    FROM "Portfolio" p
    LEFT JOIN "Category" c ON c.id = p."categoryId"
    ORDER BY p.featured DESC, p."projectDate" DESC NULLS LAST
  `);

  for (const p of ports.rows) {
    console.log(`\n===== ${p.title} (${p.slug}) =====`);
    console.log(`kategori: ${p.categoryName || "-"} | klien: ${p.client || "-"} | role: ${p.role || "-"}`);
    console.log(`tech: ${p.technologies || "-"} | featured: ${p.featured} | status: ${p.status} | tgl: ${p.projectDate?.toISOString?.().slice(0, 10) || "-"}`);
    console.log(`thumbnail: ${p.thumbnail ? "ADA" : "TIDAK"} | banner: ${p.banner ? "ADA" : "TIDAK"}`);
    console.log(`links: demo=${p.demoUrl || "-"} | github=${p.githubUrl || "-"} | figma=${p.figmaUrl || "-"} | youtube=${p.youtubeUrl || "-"} | download=${p.downloadUrl || "-"}`);
    console.log(`excerpt (${p.excerpt?.length || 0} chars): ${p.excerpt || "-"}`);
    const desc = p.description || "";
    const descText = desc.replace(/<[^>]*>/g, "").trim();
    const hasPTag = /<p[\s>]/i.test(desc);
    const hasH = /<h[23][\s>]/i.test(desc);
    const hasUl = /<ul[\s>]/i.test(desc);
    console.log(`deskripsi: ${descText.length} chars teks | <p>:${hasPTag} <h2/h3>:${hasH} <ul>:${hasUl}`);
    console.log(`deskripsi awal: ${descText.slice(0, 200)}`);

    // Galeri
    const imgs = await client.query(
      `SELECT * FROM "PortfolioImage" WHERE "portfolioId" = '${p.id}'`
    );
    if (imgs.rows.length) {
      console.log(`galeri (${imgs.rows.length}):`);
      for (const img of imgs.rows) {
        console.log(`  - ${JSON.stringify(img).slice(0, 200)}`);
      }
    }
  }

  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
