/**
 * Set field logo pada tabel Education (4 entri) — pasangan Task 17
 * (set-company-logos.js). Logo disimpan sebagai path statis
 * /images/education/*.webp — tampil benar di admin education-manager
 * (<img src=...>) maupun halaman publik /education & /about.
 */
const fs = require("fs");

const env = fs.readFileSync("/home/z/my-project/.env", "utf8");
const m = env.match(/DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
process.env.DATABASE_URL = m[1];

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const MAP = [
  { institution: "SDN Tersana Baru", logo: "/images/education/sdn-tersana-baru.webp" },
  { institution: "SMPN 1 Babakan", logo: "/images/education/smpn-1-babakan.webp" },
  { institution: "SMKN 1 Lemahabang", logo: "/images/education/smkn-1-lemahabang.webp" },
  { institution: "Telkom University Purwokerto", logo: "/images/education/telkom-university.webp" },
];

(async () => {
  for (const { institution, logo } of MAP) {
    const r = await p.education.updateMany({ where: { institution }, data: { logo } });
    console.log(`education "${institution}" → ${logo} (${r.count} row)`);
  }
  // verifikasi akhir
  const all = await p.education.findMany({ orderBy: { startDate: "asc" } });
  for (const e of all) console.log("  ✓", e.institution, "→", e.logo);
  await p.$disconnect();
})();
