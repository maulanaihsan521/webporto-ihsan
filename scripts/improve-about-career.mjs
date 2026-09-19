// Perbaiki kualitas konten bagian "Karier" (halaman About & Experience).
//
// Masalah nilai lama:
// - Typo: "Stundent staff", "Telkomuniversty", "Spesialist"
// - Position berantakan: "Student Staff,Foto&Video Branding,Admin,Sosial Media Spesialist"
//   (tanpa spasi, campur koma & tanda &)
// - Deskripsi tipis 1 kalimat tanpa konteks/pencapaian
// - technologies kotor: trailing comma, spasi hilang ("Lightroom,Excel")
//
// Backup nilai lama -> scripts/data/backup-experience.json (untuk revert).
// Tanggal/kota/tipe/status-current TIDAK diubah (data faktual user).
//
// Jalankan: DATABASE_URL=... node scripts/improve-about-career.mjs
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";

const db = new PrismaClient();

const UPDATES = [
  {
    match: { company: "PT Bikin Kreatif Corp", position: "Social Media Specialist & Konten Kreator" },
    values: {
      position: "Social Media Specialist & Content Creator",
      description:
        "Mengelola beberapa akun media sosial klien secara end-to-end — riset tren, penyusunan content calendar bulanan, hingga produksi konten visual yang on-brand. Menjalankan kampanye konten organik dari copywriting, desain feed, sampai editing video pendek untuk kebutuhan promosi brand. Berkolaborasi langsung dengan tim kreatif dan klien untuk menjaga konsistensi tone of voice serta target engagement di setiap kanal.",
      technologies: "Canva, CapCut, Content Calendar, Copywriting, Meta Business Suite",
    },
  },
  {
    match: {
      company: "Marketing Crew Telkom University Purwokerto",
      position: "Student Staff,Foto&Video Branding,Admin,Sosial Media Spesialist",
    },
    values: {
      position: "Student Staff — Foto & Video Branding, Admin & Social Media",
      description:
        "Menangani produksi konten visual dan pengelolaan media sosial di tim pemasaran kampus. Memproduksi foto dan video dokumentasi kegiatan kampus — dari shooting, editing, hingga color grading — untuk kebutuhan akun resmi Telkom University Purwokerto. Selain itu membantu administrasi konten dan terlibat dalam strategi kanal digital untuk memperkuat brand kampus.",
      technologies:
        "Adobe Premiere Pro, Adobe Photoshop, Adobe Lightroom, Microsoft Excel, Social Media Management",
    },
  },
  {
    match: { company: "Freelance Digital Marketing", position: "Digital Marketing Specialist" },
    values: {
      position: "Digital Marketing Specialist",
      description:
        "Membantu UMKM dan brand dari berbagai industri tumbuh lewat kanal digital — mulai dari audit kebutuhan, penyusunan strategi, sampai eksekusi kampanye. Mengelola iklan Meta Ads dan Google Ads beserta pengaturan budget, content marketing berkala, serta optimasi SEO on-page dan off-page. Menganalisis performa lewat Google Analytics dan melakukan iterasi berbasis data agar hasil kampanye terus membaik dari bulan ke bulan.",
      technologies: "Meta Ads, Google Ads, SEO, Google Analytics, Canva, Copywriting",
    },
  },
  {
    match: { company: "Malibu 62 Studio", position: "Photo & Video Producer" },
    values: {
      position: "Photo & Video Producer",
      description:
        "Memproduksi konten visual komersial untuk brand dan UMKM — dari pra-produksi, shooting produk, hingga editing final. Menangani color grading video agar konsisten dengan identitas visual klien, serta retouching foto untuk kebutuhan katalog dan materi promosi. Terbiasa menyelesaikan pekerjaan dengan tenggat ketat tanpa mengorbankan kualitas output kreatif.",
      technologies: "Adobe Premiere Pro, Adobe Photoshop, Adobe Lightroom, CorelDRAW",
    },
  },
];

async function main() {
  mkdirSync(new URL("./data/", import.meta.url), { recursive: true });
  const backup = [];

  for (const { match, values } of UPDATES) {
    const rows = await db.experience.findMany({ where: match });
    if (rows.length === 0) {
      console.log(`SKIP (tidak ditemukan): ${match.position} @ ${match.company}`);
      continue;
    }
    if (rows.length > 1) {
      console.log(`SKIP (ambigu, >1 baris): ${match.company}`);
      continue;
    }
    const old = rows[0];
    backup.push(old);
    await db.experience.update({ where: { id: old.id }, data: values });
    console.log(`UPDATED: ${values.position} @ ${old.company}`);
  }

  writeFileSync(
    new URL("./data/backup-experience.json", import.meta.url),
    JSON.stringify(backup, null, 2),
  );
  console.log(`\nBackup ${backup.length} baris nilai lama -> scripts/data/backup-experience.json`);

  const after = await db.experience.findMany({ orderBy: { startDate: "desc" } });
  console.log(`\n=== VERIFIKASI (${after.length} baris) ===`);
  for (const e of after) {
    const d = e.description ?? "";
    console.log(`- [${e.type}] ${e.position} @ ${e.company} (${d.split(".").length - 1} kalimat)`);
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
