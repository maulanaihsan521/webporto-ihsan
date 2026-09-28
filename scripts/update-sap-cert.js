// Tambahkan deskripsi pada sertifikat SAP yang sudah ada (agar konsisten
// dengan 3 sertifikat baru yang punya deskripsi lengkap)
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

async function main() {
  const updated = await prisma.certificate.update({
    where: { slug: "business-processes-in-financial-accounting" },
    data: {
      description:
        "Sertifikasi dari SAP yang memvalidakan pemahaman proses bisnis pada modul Financial Accounting (FI) — mencakup alur proses utama mulai dari master data, pencatatan transaksi keuangan, hingga pelaporan. Materi ini menunjang kompetensi analisis proses bisnis dan pemahaman sistem ERP enterprise yang saya terapkan dalam proyek redesain proses bisnis dan implementasi CRM.",
    },
  });
  console.log("SAP cert updated:", updated.title);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
