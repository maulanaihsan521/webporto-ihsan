// =====================================================================
// GANTI THUMBNAIL artikel IHSG dengan thumbnail custom dari user
// - Upload ihsg-thumbnail-user.webp via POST /api/media
// - PUT /api/admin/blog/[id] → coverImage + ogImage
// =====================================================================
const { getConnection, loadEnvValue } = require("./db-conn");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const JWT_SECRET = loadEnvValue("JWT_SECRET");
const IMG_DIR = "/home/z/my-project/scripts/ihsg-imgs";
const BASE = "http://localhost:3000";
const POST_ID = "cmvigwfys0007sz9mfot13j28"; // artikel ihsg-pasca-rebound-exit-5798-skenario-4362
const SLUG = "ihsg-pasca-rebound-exit-5798-skenario-4362";

async function upload(token, filename, name) {
  const buffer = fs.readFileSync(path.join(IMG_DIR, filename));
  const file = new File([buffer], name, { type: "image/webp" });
  const form = new FormData();
  form.append("files", file);
  form.append("folder", "/");
  const res = await fetch(`${BASE}/api/media`, {
    method: "POST",
    headers: { Cookie: `admin_token=${token}`, Origin: BASE },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status !== 200 || !json.ok) {
    throw new Error(`Upload gagal: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json.files[0].url;
}

async function main() {
  // admin token
  const client = getConnection();
  await client.connect();
  const user = await client.query(`SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN' LIMIT 1`);
  const admin = user.rows[0];
  await client.end();
  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role, image: null },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  console.log("Admin:", admin.email);

  // 1. Upload thumbnail user
  console.log("Upload thumbnail...");
  const thumb = await upload(token, "ihsg-thumbnail-user.webp", "ihsg-thumbnail-user.webp");
  console.log("  url:", thumb);

  // 2. Update post: coverImage + ogImage
  const putRes = await fetch(`${BASE}/api/admin/blog/${POST_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${token}`, Origin: BASE },
    body: JSON.stringify({ coverImage: thumb, ogImage: thumb }),
  });
  const putJson = await putRes.json().catch(() => ({}));
  if (putRes.status !== 200 && putRes.status !== 201 && putRes.status !== 204) {
    throw new Error(`PUT gagal: ${putRes.status} ${JSON.stringify(putJson).slice(0, 300)}`);
  }
  console.log("PUT OK — coverImage & ogImage diperbarui");
  console.log("Cek:", `/blog/${SLUG}`);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
