// Quick check: post metadata for the redesain article
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();
  const res = await client.query(`
    SELECT id, title, slug, published, "documentUrl", "readingTime",
           LENGTH(content) AS content_len,
           "metaTitle", LEFT("metaDescription", 120) AS meta_desc,
           "updatedAt"
    FROM "Post"
    ORDER BY "updatedAt" DESC
  `);
  for (const p of res.rows) {
    console.log(
      `[${p.id}] ${p.title}\n  slug=${p.slug} published=${p.published} docUrl=${p.documentUrl}\n  readingTime=${p.readingTime} contentLen=${p.content_len}\n  metaTitle=${p.metaTitle}\n  metaDesc=${p.meta_desc}\n  updatedAt=${p.updatedAt.toISOString()}\n`
    );
  }
  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
