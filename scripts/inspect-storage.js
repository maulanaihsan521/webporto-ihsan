// List ALL objects in Supabase storage buckets (incl. PDFs not registered in Media table)
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();

  // 1. Buckets
  const buckets = await client.query(`SELECT id, name, public FROM storage.buckets`);
  console.log("=== BUCKETS ===");
  for (const b of buckets.rows) console.log(b.id, "|", b.name, "| public:", b.public);

  // 2. All objects (limit 200, newest first)
  const objs = await client.query(`
    SELECT bucket_id, name, created_at, metadata->>'size' AS size, metadata->>'mimetype' AS mimetype
    FROM storage.objects ORDER BY created_at DESC LIMIT 200
  `);
  console.log("\n=== OBJECTS (" + objs.rows.length + ") ===");
  for (const o of objs.rows) {
    const mt = o.mimetype || "";
    const flag = /pdf/i.test(mt) || /\.pdf$/i.test(o.name) ? "[PDF!] " : "";
    console.log(flag + o.bucket_id + " | " + o.name + " | " + mt + " | " + o.size + "B | " + o.created_at.toISOString().slice(0, 16));
  }

  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
