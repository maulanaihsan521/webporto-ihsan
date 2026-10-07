// Task 27: Inspect current owner_vision / owner_mission / related settings + site content
const fs = require("fs");

// Parse DATABASE_URL from .env manually
const envRaw = fs.readFileSync("/home/z/my-project/.env", "utf8");
function getEnv(key) {
  const m = envRaw.match(new RegExp("^" + key + "=.*$", "m"));
  return m ? m[0].slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
}
const dbUrl = getEnv("DATABASE_URL");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

(async () => {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: "owner_" } },
      orderBy: { key: "asc" },
    });
    console.log("=== OWNER SETTINGS ===");
    for (const s of settings) {
      console.log(`[${s.key}] (${s.group || "-"})`);
      console.log(`  ${s.value}`);
      console.log("");
    }

    const siteKeys = ["site_title", "site_description", "site_tagline", "hero_title", "hero_subtitle"];
    const siteSettings = await prisma.setting.findMany({
      where: { key: { in: siteKeys } },
    });
    console.log("=== SITE SETTINGS ===");
    for (const s of siteSettings) {
      console.log(`[${s.key}]`);
      console.log(`  ${s.value}`);
      console.log("");
    }

    const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
    console.log("=== SERVICES (" + services.length + ") ===");
    for (const s of services) {
      console.log(`- ${s.title}: ${(s.description || "").slice(0, 120)}`);
    }
    console.log("");

    const portfolios = await prisma.portfolio.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { title: true, excerpt: true, category: { select: { name: true } } },
    });
    console.log("=== PORTFOLIOS (" + portfolios.length + ") ===");
    for (const p of portfolios) {
      console.log(`- [${p.category?.name || "-"}] ${p.title}: ${(p.excerpt || "").slice(0, 100)}`);
    }
  } catch (e) {
    console.error("ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
