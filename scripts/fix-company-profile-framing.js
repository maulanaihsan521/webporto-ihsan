// Fix: Website Company Profile = PROYEK PERSONAL (bukan website resmi RSUD)
// Ubah framing: studi kasus RSUD Waled, klien = Personal Project, meta SEO disesuaikan
const { getConnection } = require("./db-conn");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function loadEnvValue(key) {
  const envPath = path.join(__dirname, "..", ".env");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (t.slice(0, eq).trim() === key) {
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  return "";
}

const JWT_SECRET = loadEnvValue("JWT_SECRET");
if (!JWT_SECRET) {
  console.error("JWT_SECRET tidak ditemukan di .env");
  process.exit(1);
}

const FIELDS = {
  excerpt:
    "Proyek personal: konsep website company profile rumah sakit dengan studi kasus RSUD Waled Kabupaten Cirebon — profil layanan, jadwal dokter, pendaftaran online, hingga edukasi kesehatan.",
  client: "Personal Project",
  role: "Full-Stack Developer",
  technologies: "Next.js, TypeScript, Tailwind CSS",
  metaTitle: "Website Company Profile Rumah Sakit (Studi Kasus RSUD Waled) — Portfolio",
  metaDescription:
    "Proyek personal: konsep website company profile rumah sakit dengan studi kasus RSUD Waled Kabupaten Cirebon — jadwal dokter, pendaftaran online, edukasi kesehatan, dan IGD 24 jam.",
  description: [
    '<p>Proyek <strong>personal</strong> yang saya bangun untuk mengasah kemampuan full-stack development: sebuah konsep website company profile rumah sakit dengan <strong>studi kasus RSUD Waled Kabupaten Cirebon</strong>. Situs ini bukan website resmi rumah sakit, melainkan hasil eksplorasi saya dalam merancang pengalaman informasi layanan kesehatan yang tertata, cepat, dan mudah diakses.</p>',
    "<h3>Fitur yang Dikembangkan</h3>",
    "<ul>",
    "<li>Halaman profil rumah sakit, daftar layanan, dan direktori dokter spesialis &amp; subspesialis lengkap dengan jadwal praktik.</li>",
    "<li>Panduan alur pendaftaran rawat jalan serta kanal <strong>Daftar Online</strong>.</li>",
    "<li>Bar kontak <strong>IGD 24 jam</strong> yang selalu terlihat dan mudah dihubungi.</li>",
    "<li>Konten edukasi kesehatan: panduan pertolongan pertama, artikel kesehatan, dan kalkulator indikator kesehatan.</li>",
    "<li>Halaman berita, galeri kegiatan, informasi karir, serta statistik rumah sakit (tempat tidur, akreditasi).</li>",
    "</ul>",
    '<p>Antarmuka responsif dengan dukungan <strong>mode gelap</strong>. Melalui proyek ini saya berlatih menyusun arsitektur halaman yang kompleks, menyajikan informasi kritis secara hierarkis, dan menjaga konsistensi desain dari beranda hingga halaman kontak.</p>',
  ].join("\n"),
};

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

  const cur = await client.query(`SELECT * FROM "Portfolio" WHERE slug = 'website-company-profile'`);
  const p = cur.rows[0];
  if (!p) {
    console.error("Portfolio tidak ditemukan");
    process.exit(1);
  }

  const body = {
    title: p.title,
    slug: p.slug,
    excerpt: FIELDS.excerpt,
    description: FIELDS.description,
    thumbnail: p.thumbnail ?? "",
    banner: p.banner ?? "",
    videoUrl: p.videoUrl ?? "",
    role: FIELDS.role,
    client: FIELDS.client,
    status: p.status || "PUBLISHED",
    projectDate: p.projectDate ? p.projectDate.toISOString().slice(0, 10) : "",
    startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : "",
    endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : "",
    technologies: FIELDS.technologies,
    githubUrl: p.githubUrl ?? "",
    demoUrl: p.demoUrl ?? "",
    figmaUrl: p.figmaUrl ?? "",
    youtubeUrl: p.youtubeUrl ?? "",
    downloadUrl: p.downloadUrl ?? "",
    featured: p.featured,
    metaTitle: FIELDS.metaTitle,
    metaDescription: FIELDS.metaDescription,
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
    `Update "${p.title}": status=${res.status}` +
      (res.status !== 200 ? ` | ${JSON.stringify(json).slice(0, 300)}` : " OK")
  );

  await client.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
