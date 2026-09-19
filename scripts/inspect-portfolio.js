// Check Portfolio + Certificate for document URLs related to the CRM paper
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();

  const port = await client.query(`
    SELECT title, slug, "downloadUrl", "demoUrl", "githubUrl", "youtubeUrl", "figmaUrl"
    FROM "Portfolio" ORDER BY "createdAt" DESC
  `);
  console.log("=== PORTFOLIO (" + port.rows.length + ") ===");
  for (const r of port.rows) {
    console.log("\n---", r.title);
    console.log("  download:", r.downloadUrl, "| demo:", r.demoUrl, "| github:", r.githubUrl, "| yt:", r.youtubeUrl, "| figma:", r.figmaUrl);
  }

  const certs = await client.query(`
    SELECT title, slug, url, "fileUrl", "imageUrl" FROM "Certificate" ORDER BY "createdAt" DESC
  `);
  console.log("\n=== CERTIFICATES ===");
  const ccols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='Certificate' ORDER BY ordinal_position`);
  console.log("cols:", ccols.rows.map((c) => c.column_name).join(", "));
  for (const r of certs.rows) console.log(r.title, "|", r.url, "|", r.fileUrl, "|", r.imageUrl);

  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
