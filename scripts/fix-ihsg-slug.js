// =====================================================================
// FIX: kembalikan slug artikel IHSG ke slug yang rapi
// (PUT tanpa field slug me-regenerate slug dari title — perilaku route)
// =====================================================================
const { getConnection, loadEnvValue } = require("./db-conn");
const jwt = require("jsonwebtoken");

const JWT_SECRET = loadEnvValue("JWT_SECRET");
const BASE = "http://localhost:3000";
const POST_ID = "cmvigwfys0007sz9mfot13j28";
const CLEAN_SLUG = "ihsg-pasca-rebound-exit-5798-skenario-4362";

async function main() {
  const client = getConnection();
  await client.connect();
  const user = await client.query(`SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN' LIMIT 1`);
  await client.end();

  const token = jwt.sign(
    { id: user.rows[0].id, email: user.rows[0].email, name: user.rows[0].name, role: user.rows[0].role, image: null },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  const res = await fetch(`${BASE}/api/admin/blog/${POST_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${token}`, Origin: BASE },
    body: JSON.stringify({ slug: CLEAN_SLUG }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`PUT slug gagal: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  }
  console.log("OK — slug:", json.slug, "| cover:", json.coverImage ? "ada" : "kosong");
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
