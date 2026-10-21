const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[k] = v;
}
async function main() {
  const c = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await c.connect();
  const posts = await c.query(`SELECT published, count(*)::int FROM "Post" GROUP BY published`);
  console.log("Post by published:", JSON.stringify(posts.rows));
  const pub = await c.query(`SELECT title, slug, published FROM "Post" WHERE published=true ORDER BY "createdAt" DESC LIMIT 5`);
  console.log("Post published terbaru:");
  pub.rows.forEach(r => console.log(`  - ${r.title} (${r.slug})`));
  const pf = await c.query(`SELECT count(*)::int n FROM "Portfolio"`);
  const cert = await c.query(`SELECT count(*)::int n FROM "Certificate"`);
  const svc = await c.query(`SELECT count(*)::int n FROM "Service"`);
  console.log(`Portfolio: ${pf.rows[0].n} | Certificate: ${cert.rows[0].n} | Service: ${svc.rows[0].n}`);
  await c.end();
}
main().catch(e => { console.error("ERR:", e.message); process.exit(1); });
