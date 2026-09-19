// Perluas singkatan KSPM di entri pendidikan Telkom University:
// organization  : "Marketing Crew, KSPM" -> "Marketing Crew, KSPM (Kelompok Study Pasar Modal)"
// description   : sebutan "serta mengikuti KSPM." -> konteks apa yang dipelajari di sana
// (nilai sebelumnya terdokumentasi di scripts/improve-about-education.mjs yang sudah commit)
// Jalankan: DATABASE_URL=... node scripts/update-telkom-kspm.mjs
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const rows = await db.education.findMany({ where: { institution: "Telkom University Purwokerto" } });
  if (rows.length !== 1) {
    console.log(`ABORT: match Telkom = ${rows.length} baris (harus 1)`);
    process.exit(1);
  }
  const before = rows[0];
  console.log("SEBELUM:");
  console.log("  organization:", before.organization);
  console.log("  description :", (before.description ?? "").slice(0, 120) + "...");

  await db.education.update({
    where: { id: before.id },
    data: {
      organization: "Marketing Crew, KSPM (Kelompok Study Pasar Modal)",
      description:
        "Menempuh S1 Sistem Informasi di Telkom University Purwokerto dengan IPK 3.78 (berjalan). Mempelajari pengembangan sistem, analisis data, dan pemanfaatan teknologi untuk solusi bisnis — melengkapi keterampilan praktis digital marketing dengan fondasi teknis yang kuat. Di kampus aktif sebagai student staff di Marketing Crew untuk produksi konten dan pemasaran, serta bergabung dengan KSPM (Kelompok Study Pasar Modal) — komunitas studi investasi tempat memperdalam analisis pasar keuangan, saham, dan manajemen portofolio.",
    },
  });

  const after = await db.education.findUnique({ where: { id: before.id } });
  console.log("\nSESUDAH:");
  console.log("  organization:", after.organization);
  console.log("  description :", after.description);
}

main()
  .catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
