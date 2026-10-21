// =====================================================================
// ARTIKEL BLOG: IHSG Pasca-Rebound (dari DOCX user)
// - Upload cover 16:9 + chart teknikal via POST /api/media
// - Pastikan tag "IHSG" ada (POST /api/admin/tags)
// - POST /api/admin/blog (konten HTML lengkap + SEO meta)
// Pola mengikuti create-tlkm-article.js
// =====================================================================
const { getConnection, loadEnvValue } = require("./db-conn");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const JWT_SECRET = loadEnvValue("JWT_SECRET");
const IMG_DIR = "/home/z/my-project/scripts/ihsg-imgs";
const BASE = "http://localhost:3000";

const SLUG = "ihsg-pasca-rebound-exit-5798-skenario-4362";

// upload file → url
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
    throw new Error(`Upload ${filename} gagal: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json.files[0].url;
}

// pastikan tag ada → kembalikan id
async function ensureTag(token, name) {
  const res = await fetch(`${BASE}/api/admin/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${token}`, Origin: BASE },
    body: JSON.stringify({ name }),
  });
  if (res.status === 201) {
    const t = await res.json();
    console.log(`  tag baru dibuat: ${name} (${t.id})`);
    return t.id;
  }
  // 400 = sudah ada → cari id-nya via GET
  const listRes = await fetch(`${BASE}/api/admin/tags`, {
    headers: { Cookie: `admin_token=${token}`, Origin: BASE },
  });
  const list = await listRes.json();
  const found = list.find((t) => t.name === name);
  if (!found) throw new Error(`Tag ${name} tidak ditemukan`);
  return found.id;
}

const CONTENT = [
  require("./ihsg-article-part1.js"),
  require("./ihsg-article-part2.js"),
  require("./ihsg-article-part3.js"),
].join("\n");

async function main() {
  const client = getConnection();
  await client.connect();

  const user = await client.query(
    `SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN' LIMIT 1`
  );
  const admin = user.rows[0];
  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role, image: null },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  console.log("Admin:", admin.email);

  // Cegah duplikat jika script dijalankan ulang
  const dup = await client.query(`SELECT id FROM "Post" WHERE slug = $1`, [SLUG]);
  if (dup.rowCount > 0) {
    console.error(`ABORT: slug "${SLUG}" sudah ada di database (id: ${dup.rows[0].id})`);
    await client.end();
    process.exit(1);
  }

  // Kategori Financial Market (BLOG)
  const cat = await client.query(
    `SELECT id, name FROM "Category" WHERE slug = 'financial-market' AND type = 'BLOG' LIMIT 1`
  );
  if (cat.rowCount === 0) throw new Error("Kategori Financial Market (BLOG) tidak ditemukan");
  const categoryId = cat.rows[0].id;
  console.log("Kategori:", cat.rows[0].name, categoryId);

  await client.end();

  // 1. Upload aset
  console.log("\nUpload aset gambar...");
  const cover = await upload(token, "ihsg-cover-pasca-rebound.webp", "ihsg-cover-pasca-rebound.webp");
  console.log("  cover:", cover);
  const chart = await upload(token, "ihsg-chart-teknikal.webp", "ihsg-chart-teknikal.webp");
  console.log("  chart:", chart);

  // 2. Tags
  console.log("\nSiapkan tags...");
  const tagIds = [];
  for (const name of ["IHSG", "Teknikal", "Analisis", "INDEX:COMPOSITE", "Manajemen Risiko", "Edukasi"]) {
    tagIds.push(await ensureTag(token, name));
  }

  // 3. Susun konten final (ganti placeholder URL)
  let content = CONTENT.split("{{CHART}}").join(chart);

  const title = "IHSG Pasca-Rebound: Dari Anjlokan 11,57% Menuju Exit di 5.798 dan Skenario Menuju 4.362";
  const excerpt =
    "IHSG anjlok 11,57% pada 16 Oktober 2026 — salah satu koreksi terdalam sepanjang sejarahnya. Studi kasus lengkap aksi serok di tengah kepanikan, exit terencana di Fibonacci 0,618 + bibir gap di 5.798, peta teknikal Head & Shoulders dengan proyeksi menuju 4.362, dan enam pelajaran manajemen risiko bagi investor pemula.";
  const metaTitle = "Analisa IHSG Pasca-Rebound: Exit di 5.798, Skenario Menuju 4.362 — Maulana Ihsan Rohim";
  const metaDescription =
    "Bedah teknikal IHSG pasca-anjlok 11,57%: serok di tengah kepanikan, exit terencana di 5.798 (Fibonacci 0,618 + bibir gap), skenario bearish menuju 4.362, dan manajemen risikonya.";
  const metaKeywords =
    "IHSG, analisa teknikal IHSG, IHSG anjlok 11,57%, IHSG rebound, Fibonacci 0,618, head and shoulders, gap IHSG, target IHSG 4.362, support 3.977, serok saham, manajemen risiko trading";

  // 4. POST artikel
  const postRes = await fetch(`${BASE}/api/admin/blog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `admin_token=${token}`,
      Origin: BASE,
    },
    body: JSON.stringify({
      title,
      slug: SLUG,
      excerpt,
      content,
      coverImage: cover,
      published: true,
      featured: true,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage: cover,
      categoryId,
      tagIds,
    }),
  });
  const postJson = await postRes.json().catch(() => ({}));
  if (postRes.status !== 200 && postRes.status !== 201) {
    throw new Error(`POST artikel gagal: ${postRes.status} ${JSON.stringify(postJson).slice(0, 300)}`);
  }
  const id = postJson.id;
  console.log("\nPOST artikel OK, id:", id, "| chars:", content.length);
  console.log("readingTime:", postJson.readingTime, "| publishedAt:", postJson.publishedAt);
  console.log("Tags:", (postJson.tags || []).map((t) => t.name).join(", "));
  console.log("\nURL: /blog/" + SLUG);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
