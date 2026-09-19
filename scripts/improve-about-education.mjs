// Perbaiki kualitas bagian "Riwayat Pendidikan" (About & /education).
//
// Permintaan user:
// 1. TAMBAH: SDN Tersana Baru — eskul Marching Band Gema Suara Rajawali
// 2. TAMBAH: SMPN 1 Babakan — eskul NBC (Nebak Basket Club) & SAE (Sutajaya Art Entertainment)
// 3. Buat lebih bagus entri yang sudah ada
//
// Masalah nilai lama:
// - field "Multiedia" (typo → Multimedia)
// - degree "Berjalan" (aneh; badge status sudah dirender terpisah) → "S1"
// - field "S1 Sistem Informasi" dobel dengan degree → "Sistem Informasi"
// - organization kotor: "Exmukensa(Multimedia Skensala)", "Marketing Crew,KSPM"
// - semua deskripsi kosong (null)
//
// TAHUN SD/SMP DIREKA dari progres normal (SMK mulai Jun 2020):
// SD 2011-2017, SMP 2017-2020 — KONFIRMASI ke user, mudah dikoreksi.
//
// Backup nilai lama -> scripts/data/backup-education.json (untuk revert).
// Jalankan: DATABASE_URL=... node scripts/improve-about-education.mjs
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const db = new PrismaClient();

const UPDATES = [
  {
    match: { institution: "Telkom University Purwokerto" },
    values: {
      degree: "S1",
      field: "Sistem Informasi",
      description:
        "Menempuh S1 Sistem Informasi di Telkom University Purwokerto dengan IPK 3.78 (berjalan). Mempelajari pengembangan sistem, analisis data, dan pemanfaatan teknologi untuk solusi bisnis — melengkapi keterampilan praktis digital marketing dengan fondasi teknis yang kuat. Di kampus aktif sebagai student staff di Marketing Crew untuk produksi konten dan pemasaran, serta mengikuti KSPM.",
      organization: "Marketing Crew, KSPM",
    },
  },
  {
    match: { institution: "SMKN 1 Lemahabang" },
    values: {
      field: "Multimedia",
      description:
        "Menempuh SMK jurusan Multimedia di SMKN 1 Lemahabang. Mempelajari dasar-dasar desain grafis, fotografi, videografi, dan editing — kompetensi yang menjadi fondasi karier kreatif hingga sekarang. Menyelesaikan studi dengan nilai rata-rata 88.5 dan terlibat di Exmukensa (Multimedia Skensala).",
      organization: "Exmukensa (Multimedia Skensala)",
    },
  },
];

const CREATES = [
  {
    institution: "SMPN 1 Babakan",
    degree: "SMP",
    field: null,
    startDate: new Date("2017-07-01T00:00:00Z"),
    endDate: new Date("2020-06-01T00:00:00Z"),
    current: false,
    description:
      "Melanjutkan pendidikan ke SMPN 1 Babakan. Aktif mengikuti dua ekstrakurikuler: NBC (Nebak Basket Club) yang mengasah kebugaran, sportivitas, dan mental kompetisi, serta SAE (Sutajaya Art Entertainment) yang menjadi wadah menyalurkan minat seni dan pertunjukan. Perpaduan keduanya menumbuhkan kedisiplinan latihan sekaligus keberanian tampil di depan publik.",
    organization: "Ekstrakurikuler: NBC (Nebak Basket Club), SAE (Sutajaya Art Entertainment)",
    order: 0,
  },
  {
    institution: "SDN Tersana Baru",
    degree: "SD",
    field: null,
    startDate: new Date("2011-07-01T00:00:00Z"),
    endDate: new Date("2017-06-01T00:00:00Z"),
    current: false,
    description:
      "Menempuh pendidikan dasar di SDN Tersana Baru. Mengikuti ekstrakurikuler Marching Band Gema Suara Rajawali — tempat pertama kali belajar disiplin latihan, koordinasi tim, dan tampil di depan publik. Pengalaman bermusik dan apresiasi seni dari marching band menjadi fondasi kreatif yang terbawa hingga kini.",
    organization: "Ekstrakurikuler: Marching Band Gema Suara Rajawali",
    order: 0,
  },
];

async function main() {
  const backup = [];

  for (const { match, values } of UPDATES) {
    const rows = await db.education.findMany({ where: match });
    if (rows.length === 0) {
      console.log(`SKIP (tidak ditemukan): ${match.institution}`);
      continue;
    }
    if (rows.length > 1) {
      console.log(`SKIP (ambigu, >1 baris): ${match.institution}`);
      continue;
    }
    const old = rows[0];
    backup.push(old);
    await db.education.update({ where: { id: old.id }, data: values });
    console.log(`UPDATED: ${match.institution}`);
  }

  // Hindari duplikat jika skrip dijalankan ulang
  for (const c of CREATES) {
    const exists = await db.education.findFirst({ where: { institution: c.institution } });
    if (exists) {
      console.log(`CREATE DILEWATI (sudah ada): ${c.institution}`);
      continue;
    }
    await db.education.create({ data: c });
    console.log(`CREATED: ${c.institution}`);
  }

  writeFileSync(
    new URL("./data/backup-education.json", import.meta.url),
    JSON.stringify(backup, null, 2),
  );
  console.log(`\nBackup ${backup.length} baris nilai lama -> scripts/data/backup-education.json`);

  const after = await db.education.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] });
  console.log(`\n=== VERIFIKASI (${after.length} baris, urutan tampil) ===`);
  for (const e of after) {
    const d = e.description ?? "";
    console.log(`- ${e.degree}${e.field ? " " + e.field : ""} | ${e.institution} | ${e.startDate?.getFullYear()}-${e.endDate?.getFullYear() ?? "sekarang"} | ${d ? d.split(".").length - 1 + " kalimat" : "TANPA DESKRIPSI"}`);
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
