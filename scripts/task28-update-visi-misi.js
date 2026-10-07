// Task 28 (final — revisi user):
// Layout kartu Visi & Misi DIKEMBALIKAN ke desain asli (2 kartu berdampingan).
// Isi pun kembali ke format asli (paragraf pendek) — perubahan HANYA pada inti
// misi: ditambah "pengembangan website modern" karena 6 dari 8 portofolio di
// situs adalah proyek web development dan Website Development adalah salah satu
// layanan utama. Visi dipertahankan persis seperti sebelumnya (sudah selaras).
const fs = require("fs");

const envRaw = fs.readFileSync("/home/z/my-project/.env", "utf8");
function getEnv(key) {
  const m = envRaw.match(new RegExp("^" + key + "=.*$", "m"));
  return m ? m[0].slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
}
const dbUrl = getEnv("DATABASE_URL");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

// Visi — sesuai teks user (Task 28 revisi final, em-dash DIHAPUS per permintaan):
const VISION =
  "Menjadi mitra kreatif digital terdepan yang memadukan strategi pemasaran digital, " +
  "produksi konten visual, teknologi web, dan wawasan pasar finansial menghadirkan " +
  "solusi berdampak nyata yang membantu bisnis tumbuh dan beradaptasi di era digital.";

// Misi — teks asli + satu tambahan inti: pengembangan website modern
const MISSION =
  "Memberikan solusi digital marketing yang efektif, konten visual berkualitas tinggi, " +
  "pengembangan website modern, serta insight pasar finansial yang akurat untuk membantu " +
  "bisnis dan individu mencapai tujuan mereka.";

// Nilai — dikembalikan seperti sebelumnya
const VALUES = "Profesionalisme, Kreativitas, Integritas, Inovasi, Kolaborasi, Hasil-Oriented";

(async () => {
  try {
    for (const [key, value] of [
      ["owner_vision", VISION],
      ["owner_mission", MISSION],
      ["owner_values", VALUES],
    ]) {
      await prisma.setting.upsert({
        where: { key },
        create: { key, value, group: "PROFILE", type: "TEXTAREA" },
        update: { value, group: "PROFILE", type: "TEXTAREA" },
      });
      console.log(key + " OK");
    }

    const rows = await prisma.setting.findMany({
      where: { key: { in: ["owner_vision", "owner_mission", "owner_values"] } },
    });
    for (const r of rows) {
      console.log("\n[" + r.key + "]");
      console.log(r.value);
    }
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
