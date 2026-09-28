/**
 * Tambah riwayat karir: PARADIGMA (Para Digital Marketing) — agensi digital
 * marketing yang didirikan bersama teman, 9 Nov 2022 - 25 Jun 2023.
 * Format menyesuaikan record experience lain (deskripsi 4 kalimat,
 * technologies, type badge).
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
process.env.DATABASE_URL = env.DATABASE_URL;

const prisma = new PrismaClient();

const DATA = {
  company: "PARADIGMA (Para Digital Marketing)",
  position: "Co-Founder & Digital Marketing Strategist",
  location: "Ciledug, Kab. Cirebon",
  type: "FULL_TIME",
  startDate: new Date("2022-11-09T00:00:00.000Z"),
  endDate: new Date("2023-06-25T00:00:00.000Z"),
  current: false,
  description:
    "Mendirikan agensi digital marketing bersama rekan bisnis dengan misi membantu UMKM kuliner dan usaha lokal naik kelas melalui kanal digital. Menangani lima klien sekaligus — Oseng-Oseng Rajamercon Ciledug, Saung Bukit Ajimut, Kelvinjaya Ciledug, Nord Cofe, dan Dapur Kopi — dari konsultasi kebutuhan, produksi konten, hingga pengelolaan media sosial mereka. Menjalankan proses end-to-end: copywriting promosi, desain konten visual, penjadwalan content calendar, hingga evaluasi performa dan pelaporan ke klien. Pengalaman membangun agensi dari nol ini mengasah kemampuan manajemen klien, negosiasi, dan eksekusi kampanye dengan tanggung jawab penuh atas hasil.",
  technologies:
    "Canva, Meta Ads, Instagram Business, Copywriting, Content Calendar, Client Relations",
  order: 0,
};

async function main() {
  // Cek dulu apakah sudah ada (idempotent)
  const existing = await prisma.experience.findFirst({
    where: { company: DATA.company },
  });
  if (existing) {
    console.log("Sudah ada, update record:", existing.id);
    const updated = await prisma.experience.update({
      where: { id: existing.id },
      data: DATA,
    });
    console.log("Updated:", updated.company, "|", updated.position);
    return;
  }

  const created = await prisma.experience.create({ data: DATA });
  console.log("Created:", created.company, "|", created.position);
  console.log(`Periode: ${created.startDate.toISOString().slice(0, 10)} → ${created.endDate?.toISOString().slice(0, 10)}`);

  // Tampilkan urutan timeline hasilnya
  const all = await prisma.experience.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
    select: { company: true, startDate: true, endDate: true, current: true },
  });
  console.log("\nUrutan timeline (order asc, startDate desc):");
  all.forEach((e, i) => {
    console.log(`${i + 1}. ${e.company} (${e.startDate.toISOString().slice(0, 10)} → ${e.current ? "sekarang" : e.endDate?.toISOString().slice(0, 10)})`);
  });
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); }).finally(() => prisma.$disconnect());
