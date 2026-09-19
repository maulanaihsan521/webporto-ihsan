// =====================================================================
// ISI BANNER HERO PORTOFOLIO (7/7 kosong):
// Upload screenshot banner 1440x480 (3:1) via POST /api/media,
// lalu update field banner tiap portofolio via PUT admin API.
// Thumbnail dipertahankan (sudah diisi user via dashboard).
// Catatan: hero page memakai fallback banner || thumbnail — dengan
// banner khusus, hero tak lagi menampilkan crop tengah thumbnail.
// =====================================================================
const { getConnection, loadEnvValue } = require("./db-conn");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const JWT_SECRET = loadEnvValue("JWT_SECRET");
const BANNER_DIR = "/home/z/my-project/scripts";

// slug → file banner
const BANNERS = {
  "agencyos-erp-crm": "banner-agencyos.png",
  "aruna-cafe-management-system": "banner-aruna.png",
  "website-company-profile": "banner-rsud.png",
  projectforge: "banner-forge.png",
  "game-ihsan-racing": "banner-racing.png",
  "fotografer-editor": "banner-fotografer.png",
  "videografer-editor": "banner-videografer.png",
};

async function uploadBanner(token, filename) {
  const filePath = path.join(BANNER_DIR, filename);
  const buffer = fs.readFileSync(filePath);
  const file = new File([buffer], filename, { type: "image/png" });
  const form = new FormData();
  form.append("files", file);
  form.append("folder", "/");

  const res = await fetch("http://localhost:3000/api/media", {
    method: "POST",
    headers: {
      Cookie: `admin_token=${token}`,
      Origin: "http://localhost:3000",
    },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status !== 200 || !json.ok) {
    throw new Error(`Upload ${filename} gagal: ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  }
  return json.files[0].url;
}

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
  console.log("Admin:", admin.email, "\n");

  for (const [slug, filename] of Object.entries(BANNERS)) {
    const cur = await client.query(`SELECT * FROM "Portfolio" WHERE slug = $1`, [slug]);
    const p = cur.rows[0];
    if (!p) {
      console.log(`SKIP: ${slug} tidak ditemukan`);
      continue;
    }

    // Upload banner
    const bannerUrl = await uploadBanner(token, filename);
    console.log(`UPLOAD ${filename} → ${bannerUrl}`);

    // PUT body LENGKAP — hanya banner yang berubah
    const body = {
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? "",
      description: p.description ?? "",
      thumbnail: p.thumbnail ?? "",
      banner: bannerUrl,
      videoUrl: p.videoUrl ?? "",
      role: p.role ?? "",
      client: p.client ?? "",
      status: p.status || "PUBLISHED",
      projectDate: p.projectDate ? p.projectDate.toISOString().slice(0, 10) : "",
      startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : "",
      technologies: p.technologies ?? "",
      githubUrl: p.githubUrl ?? "",
      demoUrl: p.demoUrl ?? "",
      figmaUrl: p.figmaUrl ?? "",
      youtubeUrl: p.youtubeUrl ?? "",
      downloadUrl: p.downloadUrl ?? "",
      featured: p.featured,
      metaTitle: p.metaTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      ogImage: p.ogImage ?? "",
      categoryId: p.categoryId ?? "",
    };

    const res = await fetch(`http://localhost:3000/api/admin/portfolio/${p.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `admin_token=${token}`,
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    console.log(
      `  PUT ${slug}: ${res.status === 200 ? "OK" : "ERR " + res.status + " " + JSON.stringify(json).slice(0, 150)}`
    );
  }

  // Verifikasi akhir
  const after = await client.query(`
    SELECT slug, banner IS NULL OR banner = '' AS no_banner, thumbnail IS NULL OR thumbnail = '' AS no_thumb
    FROM "Portfolio" ORDER BY "createdAt" ASC
  `);
  console.log("\nVERIFIKASI (no_banner harus false semua):");
  for (const r of after.rows) {
    console.log(`  ${r.slug.padEnd(35)} banner=${r.no_banner ? "KOSONG!" : "ada"} | thumb=${r.no_thumb ? "KOSONG!" : "ada"}`);
  }
  await client.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
