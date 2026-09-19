// =====================================================================
// ARTIKEL MARKET: Analisa Saham TLKM 2027-2028 (dari PDF user)
// - Upload cover 16:9 + 7 grafik via POST /api/media
// - POST /api/admin/market-articles (konten HTML lengkap)
// - PUT /api/admin/market-articles/[id] (metaTitle, metaDescription, coverImage)
// =====================================================================
const { getConnection, loadEnvValue } = require("./db-conn");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const JWT_SECRET = loadEnvValue("JWT_SECRET");
const IMG_DIR = "/home/z/my-project/scripts/tlkm-imgs";
const BASE = "http://localhost:3000";

const SLUG = "analisa-saham-tlkm-prospek-2027-2028";

// upload file → url
async function upload(token, filename, name) {
  const buffer = fs.readFileSync(path.join(IMG_DIR, filename));
  const file = new File([buffer], name, { type: "image/png" });
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
    throw new Error(`Upload ${filename} gagal: ${res.status} ${JSON.stringify(json).slice(0, 150)}`);
  }
  return json.files[0].url;
}

const CONTENT = [
  require("./tlkm-article-part1.js"),
  require("./tlkm-article-part2.js"),
  require("./tlkm-article-part3.js"),
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

  // 1. Upload aset
  console.log("\nUpload aset gambar...");
  const cover = await upload(token, "cover-tlkm-169.png", "tlkm-cover-teknikal.png");
  console.log("  cover:", cover);
  const g = {};
  const graphs = [
    ["grafik1-pendapatan-laba.png", "g1"],
    ["grafik2-teknikal.png", "g2"],
    ["grafik3-football-field.png", "g3"],
    ["grafik4-target-analis.png", "g4"],
    ["grafik5-dividen-payout.png", "g5"],
    ["grafik6-fcf.png", "g6"],
    ["grafik7-jembatan-laba.png", "g7"],
  ];
  for (const [f, key] of graphs) {
    g[key] = await upload(token, f, "tlkm-" + f);
    console.log(`  ${key}:`, g[key]);
  }

  // 2. Susun konten final (ganti placeholder URL)
  let content = CONTENT;
  for (const [key, url] of Object.entries(g)) {
    content = content.split(`{{${key}}}`).join(url);
  }

  const title = "Analisa Saham TLKM: Prospek Telkom Indonesia 2027–2028 — Valuasi, Dividen, dan Strategi Masuk";
  const excerpt =
    "Harga terkoreksi 41% dari puncak, dividen rekor Rp223,17/saham, laba tertekan 20,5% — tiga fakta yang membentuk tesis investasi TLKM 2027–2028. Kajian lengkap: valuasi tiga metode (nilai wajar Rp2.850), uji dividen berbasis FCF, jembatan laba hingga Rp25 T, analisa teknikal, dan strategi akumulasi dua cabang.";

  // 3. POST artikel
  const postRes = await fetch(`${BASE}/api/admin/market-articles`, {
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
      type: "ANALYSIS",
      instrument: "IDX:TLKM",
      published: true,
      featured: true,
    }),
  });
  const postJson = await postRes.json().catch(() => ({}));
  if (postRes.status !== 200 && postRes.status !== 201) {
    throw new Error(`POST artikel gagal: ${postRes.status} ${JSON.stringify(postJson).slice(0, 300)}`);
  }
  const id = postJson.id;
  console.log("\nPOST artikel OK, id:", id, "| chars:", content.length);

  // 4. PUT meta + coverImage (POST route tidak menerima field ini)
  const putRes = await fetch(`${BASE}/api/admin/market-articles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: `admin_token=${token}`,
      Origin: BASE,
    },
    body: JSON.stringify({
      metaTitle: "Analisa Saham TLKM 2027–2028: Nilai Wajar Rp2.850 & Strategi Akumulasi",
      metaDescription:
        "Analisa lengkap saham Telkom Indonesia (TLKM) untuk horizon 2027–2028: valuasi PER/DDM/EV/EBITDA (nilai wajar Rp2.850), dividen Rp223 & payout 123%, uji FCF, jembatan laba Rp17,8→25 T, teknikal, dan strategi masuk dua cabang.",
      coverImage: cover,
    }),
  });
  const putJson = await putRes.json().catch(() => ({}));
  console.log("PUT meta:", putRes.status === 200 ? "OK" : `ERR ${putRes.status} ${JSON.stringify(putJson).slice(0, 200)}`);

  // 5. Verifikasi
  const after = await client.query(
    `SELECT title, slug, type, instrument, published, featured, "coverImage", "metaTitle", length(content) AS clen FROM "MarketArticle" WHERE id = $1`,
    [id]
  );
  const a = after.rows[0];
  console.log("\nVERIFIKASI:");
  console.log("  title    :", a.title.slice(0, 70));
  console.log("  slug     :", a.slug);
  console.log("  type     :", a.type, "| instrument:", a.instrument);
  console.log("  published:", a.published, "| featured:", a.featured);
  console.log("  cover    :", a.coverImage);
  console.log("  metaTitle:", a.metaTitle);
  console.log("  content  :", a.clen, "chars");

  await client.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
