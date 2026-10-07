/**
 * Set field logo pada tabel Experience (4 entri karier) dan Education (Telkom).
 * Logo disimpan sebagai path statis /images/companies/*.webp — konsisten dgn
 * pola aset publik lain (mascots, services) dan tampil benar di admin manager
 * (<img src=...>) maupun halaman publik.
 */
const fs = require("fs");

const env = fs.readFileSync("/home/z/my-project/.env", "utf8");
const m = env.match(/DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
process.env.DATABASE_URL = m[1];

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const MAP = {
  experience: [
    { company: "PT Bikin Kreatif Corp", logo: "/images/companies/bikin-kreatif.webp" },
    { company: "Marketing Crew Telkom University Purwokerto", logo: "/images/companies/marketing-crew.webp" },
    { company: "PARADIGMA (Para Digital Marketing)", logo: "/images/companies/paradigma.webp" },
    { company: "Malibu 62 Studio", logo: "/images/companies/malibu-62.webp" },
  ],
  education: [
    { institution: "Telkom University Purwokerto", logo: "/images/companies/smb-telkom.webp" },
  ],
};

(async () => {
  for (const { company, logo } of MAP.experience) {
    const r = await p.experience.updateMany({ where: { company }, data: { logo } });
    console.log(`experience "${company}" → ${logo} (${r.count} row)`);
  }
  for (const { institution, logo } of MAP.education) {
    const r = await p.education.updateMany({ where: { institution }, data: { logo } });
    console.log(`education "${institution}" → ${logo} (${r.count} row)`);
  }
  await p.$disconnect();
})();
