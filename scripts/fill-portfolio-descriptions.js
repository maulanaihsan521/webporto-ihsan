// Isi deskripsi 3 portofolio yang kosong via admin API (PUT /api/admin/portfolio/[id])
// Auth: JWT admin (mint dari DB) + cookie admin_token + header Origin (CSRF)
const { getConnection } = require("./db-conn");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// Baca JWT_SECRET dari .env (prioritas file)
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

// ===== Deskripsi baru (HTML — dirender via prose-content) =====

const UPDATES = [
  {
    slug: "website-company-profile",
    fields: {
      excerpt:
        "Website resmi RSUD Waled Kabupaten Cirebon — profil layanan, jadwal dokter, pendaftaran online, edukasi kesehatan, dan kontak IGD 24 jam dalam satu pintu.",
      client: "RSUD Waled Kabupaten Cirebon",
      role: "Full-Stack Developer",
      technologies: "Next.js, TypeScript, Tailwind CSS",
      metaTitle: "Website Company Profile RSUD Waled Cirebon — Portfolio",
      metaDescription:
        "Pengembangan website company profile RSUD Waled Kabupaten Cirebon: jadwal dokter, pendaftaran online, edukasi kesehatan, dan informasi IGD 24 jam.",
      description: [
        '<p>Website company profile resmi untuk <strong>RSUD Waled Kabupaten Cirebon</strong> — Rumah Sakit Umum Daerah Kelas B Pendidikan berstatus BLUD yang telah melayani masyarakat sejak 1931. Situs ini dirancang sebagai pintu informasi utama masyarakat kawasan Cibening dalam mengakses layanan kesehatan rumah sakit secara cepat dan jelas.</p>',
        "<h3>Fitur Utama</h3>",
        "<ul>",
        "<li>Profil rumah sakit, daftar layanan, dan direktori dokter spesialis &amp; subspesialis lengkap dengan jadwal praktik.</li>",
        "<li>Panduan alur pendaftaran rawat jalan serta kanal <strong>Daftar Online</strong> untuk mempersingkat antrean.</li>",
        "<li>Bar kontak <strong>IGD 24 jam</strong> yang selalu terlihat dan mudah dihubungi.</li>",
        "<li>Konten edukasi kesehatan: panduan pertolongan pertama, artikel kesehatan, dan kalkulator indikator kesehatan.</li>",
        "<li>Halaman berita, galeri kegiatan, informasi karir, serta statistik rumah sakit (tempat tidur, akreditasi).</li>",
        "</ul>",
        '<p>Antarmuka responsif dengan dukungan <strong>mode gelap</strong>, disusun agar informasi kritis mudah ditemukan oleh pasien maupun keluarganya — dari Homepage hingga halaman kontak.</p>',
      ].join("\n"),
    },
  },
  {
    slug: "game-ihsan-racing",
    fields: {
      excerpt:
        "Game balap arcade 2D berbasis simulasi fisika: pilih kendaraan, taklukkan medan, kumpulkan koin — dapat dipasang sebagai PWA dan dimainkan offline.",
      client: "Personal Project",
      role: "Game Developer",
      technologies: "Next.js, TypeScript, Canvas 2D, PWA",
      metaTitle: "Ihsan Racing — Game Balap Fisika Arcade 2D",
      metaDescription:
        "Game balap arcade 2D dengan simulasi fisika kendaraan: pilihan mobil & motor, sistem level dan skor, dapat dipasang sebagai PWA untuk bermain offline.",
      description: [
        "<p><strong>Ihsan Racing</strong> adalah game balap arcade 2D bertema petualangan dengan simulasi fisika kendaraan. Pemain mengendalikan kendaraan melewati medan bergelombang yang menantang — menjaga keseimbangan, melakukan manuver flip, mengumpulkan koin, dan memperjuangkan jarak tempuh terjauh.</p>",
        "<h3>Fitur Game</h3>",
        "<ul>",
        "<li>Simulasi fisika arcade: akselerasi, gravitasi, keseimbangan kendaraan, dan flip di medan menantang.</li>",
        "<li>Pilihan kendaraan (mobil klasik &amp; motor) dan peta lintasan bertema desa.</li>",
        "<li>Sistem level dan nyawa, statistik jarak terjauh, koin, XP profil, dan jumlah flip.</li>",
        "<li>Dapat dipasang sebagai <strong>PWA</strong> — unduh sekali, mainkan offline tanpa koneksi internet.</li>",
        "</ul>",
        '<p>Proyek eksplorasi game development berbasis web yang dibangun penuh dengan <strong>Next.js dan TypeScript</strong>, menitikberatkan pada feel fisika yang menyenangkan dan visual kartun yang ceria.</p>',
      ].join("\n"),
    },
  },
  {
    slug: "aplikasiworkspace",
    fields: {
      excerpt:
        "PWA workspace kolaboratif untuk monitoring proyek capstone: Kanban, Gantt, sprint, chat tim, log book, approval, hingga AI assistant.",
      client: "Capstone / Academic Project",
      role: "Full-Stack Developer",
      technologies: "Next.js, TypeScript, Tailwind CSS, PWA",
      metaTitle: "ProjectForge — Collaborative Workspace & Project Monitoring",
      metaDescription:
        "PWA workspace kolaboratif untuk manajemen dan monitoring proyek capstone: Kanban board, timeline Gantt, sprint, chat tim, log book, approval, dan AI assistant.",
      description: [
        "<p><strong>ProjectForge</strong> adalah Progressive Web App (PWA) workspace kolaboratif untuk manajemen dan monitoring proyek tim — dirancang mendampingi alur pengerjaan proyek capstone dari dua sisi sekaligus: ketua tim dan dosen pembimbing.</p>",
        "<h3>Fitur Utama</h3>",
        "<ul>",
        "<li>Dashboard analitik: kartu KPI proyek, progres penyelesaian task, dan distribusi status pekerjaan.</li>",
        "<li>Manajemen pengerjaan: daftar task, <strong>Kanban board</strong>, sprint, timeline &amp; Gantt, dan kalender.</li>",
        "<li>Kolaborasi tim: penjadwalan meeting, file manager, manajemen anggota, dan chat tim.</li>",
        "<li>Monitoring akademik: log book, activity log, alur approval, hingga modul khusus capstone.</li>",
        "<li><strong>AI Assistant</strong> untuk membantu produktivitas dan command palette (⌘K) untuk navigasi cepat.</li>",
        "</ul>",
        '<p>Tersedia peran akun demo (ketua tim &amp; dosen) dengan data lengkap untuk eksplorasi, dan aplikasi dapat dipasang di layar utama perangkat layaknya aplikasi native.</p>',
      ].join("\n"),
    },
  },
];

async function main() {
  const client = getConnection();
  await client.connect();

  // Admin user + JWT
  const user = await client.query(
    `SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN' LIMIT 1`
  );
  if (!user.rows.length) {
    console.error("Tidak ada admin user");
    process.exit(1);
  }
  const admin = user.rows[0];
  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role, image: null },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  console.log("Admin:", admin.email);

  for (const upd of UPDATES) {
    const cur = await client.query(
      `SELECT * FROM "Portfolio" WHERE slug = '${upd.slug}'`
    );
    const p = cur.rows[0];
    if (!p) {
      console.log(`SKIP: ${upd.slug} tidak ditemukan`);
      continue;
    }

    // Body LENGKAP: pertahankan nilai existing, timpa dengan fields baru
    const body = {
      title: p.title,
      slug: p.slug,
      excerpt: upd.fields.excerpt ?? p.excerpt ?? "",
      description: upd.fields.description ?? p.description ?? "",
      thumbnail: p.thumbnail ?? "",
      banner: p.banner ?? "",
      videoUrl: p.videoUrl ?? "",
      role: upd.fields.role ?? p.role ?? "",
      client: upd.fields.client ?? p.client ?? "",
      status: p.status || "PUBLISHED",
      projectDate: p.projectDate ? p.projectDate.toISOString().slice(0, 10) : "",
      startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : "",
      technologies: upd.fields.technologies ?? p.technologies ?? "",
      githubUrl: p.githubUrl ?? "",
      demoUrl: p.demoUrl ?? "",
      figmaUrl: p.figmaUrl ?? "",
      youtubeUrl: p.youtubeUrl ?? "",
      downloadUrl: p.downloadUrl ?? "",
      featured: p.featured,
      metaTitle: upd.fields.metaTitle ?? p.metaTitle ?? "",
      metaDescription: upd.fields.metaDescription ?? p.metaDescription ?? "",
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
    const descLen = upd.fields.description.replace(/<[^>]*>/g, "").length;
    console.log(
      `${res.status === 200 ? "OK " : "ERR"} ${p.title}: status=${res.status} desc=${descLen} chars` +
        (res.status !== 200 ? ` | ${JSON.stringify(json).slice(0, 200)}` : "")
    );
  }

  await client.end();
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
