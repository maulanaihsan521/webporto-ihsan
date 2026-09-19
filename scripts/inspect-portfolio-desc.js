// Inspect semua portofolio: mana yang belum ada deskripsi
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();
  const res = await client.query(`
    SELECT id, title, slug, excerpt, description,
           client, role, technologies, "projectDate",
           featured, status
    FROM "Portfolio"
    ORDER BY featured DESC, "projectDate" DESC NULLS LAST
  `);

  for (const p of res.rows) {
    const descLen = p.description ? p.description.replace(/<[^>]*>/g, "").trim().length : 0;
    const excerptLen = p.excerpt ? p.excerpt.trim().length : 0;
    const hasDesc = descLen > 20;
    console.log(
      `${hasDesc ? "[OK]    " : "[KOSONG]"} ${p.title} (${p.slug})
   klien=${p.client || "-"} | role=${p.role || "-"}
   tech=${Array.isArray(p.technologies) ? p.technologies.join(", ") : (p.technologies || "-")}
   excerpt=${excerptLen} chars | desc=${descLen} chars | featured=${p.featured} | status=${p.status}
   thumbnail ada: ${p.thumbnail ? "ya" : "TIDAK"} | banner ada: ${p.banner ? "ya" : "TIDAK"}`
    );
  }
  console.log(`\nTotal: ${res.rows.length} portofolio`);
  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
