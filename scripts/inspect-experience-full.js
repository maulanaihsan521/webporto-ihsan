// Lihat data experience lengkap termasuk description, technologies, order
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
  const exps = await prisma.experience.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });
  for (const e of exps) {
    console.log("=".repeat(70));
    console.log(`company: ${e.company}`);
    console.log(`position: ${e.position}`);
    console.log(`location: ${e.location}`);
    console.log(`type: ${e.type} | order: ${e.order} | current: ${e.current}`);
    console.log(`dates: ${e.startDate.toISOString().slice(0, 10)} → ${e.endDate?.toISOString().slice(0, 10) ?? "-"}`);
    console.log(`technologies: ${e.technologies}`);
    console.log(`logo: ${e.logo}`);
    console.log(`description: ${e.description}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
