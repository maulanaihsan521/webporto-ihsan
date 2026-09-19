// Deep inspect: full content of published post + PDF media + portfolio pattern
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();

  // 1. Full content of the published post
  const post = await client.query(`
    SELECT id, title, slug, content, excerpt, "coverImage"
    FROM "Post" WHERE published = true
  `);
  for (const p of post.rows) {
    console.log("=== FULL CONTENT:", p.title, "===");
    console.log(p.content);
    console.log("\n=== EXCERPT ===");
    console.log(p.excerpt);
  }

  // 2. Portfolio columns + sample
  const pcols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name='Portfolio' ORDER BY ordinal_position
  `);
  console.log("\nPortfolio cols:", pcols.rows.map((c) => c.column_name).join(", "));

  // 3. All media
  const media = await client.query(`
    SELECT url, type, name FROM "Media" ORDER BY "createdAt" DESC LIMIT 100
  `);
  console.log("\n=== MEDIA (" + media.rows.length + ") ===");
  for (const m of media.rows) {
    const isPdf = /\.pdf/i.test(m.url) || /pdf/i.test(m.type || "");
    console.log((isPdf ? "[PDF] " : "      ") + m.url);
  }

  // 4. Settings — any document URL config?
  const settings = await client.query(`SELECT key, LEFT(value, 200) AS v FROM "Setting"`);
  console.log("\n=== SETTINGS ===");
  for (const s of settings.rows) console.log(s.key, "=", s.v);

  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
