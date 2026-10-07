// Diagnosa: 8 gambar galeri PlatterTea broken di produksi
// Cek: PortfolioImage records + URL fetch status + Media records + file storage
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const portfolio = await db.portfolio.findUnique({
    where: { slug: "plattertea-food-tea-website" },
    select: { id: true, title: true, thumbnail: true, banner: true },
  });
  console.log("PORTFOLIO:", JSON.stringify(portfolio, null, 2));

  const images = await db.portfolioImage.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { order: "asc" },
    select: { id: true, url: true, caption: true, order: true },
  });
  console.log(`\nGALERI: ${images.length} record di DB`);

  for (const img of images) {
    let status = "?";
    try {
      const res = await fetch(img.url, { method: "HEAD" });
      status = res.status;
    } catch (e) {
      status = "ERR:" + e.message.slice(0, 40);
    }
    const flag = status === 200 ? "OK " : "*** BROKEN ***";
    console.log(
      `[${img.order}] ${flag} HTTP ${status} | ${(img.url || "").split("/").pop().slice(0, 55)} | caption: ${(img.caption || "").slice(0, 30)}`
    );
  }

  // Cek Media record untuk URL broken
  console.log("\nMEDIA RECORDS untuk file plattertea:");
  const media = await db.media.findMany({
    where: { name: { contains: "plattertea" } },
    select: { id: true, name: true, url: true },
    orderBy: { name: "asc" },
  });
  for (const m of media) {
    let status = "?";
    try {
      const res = await fetch(m.url, { method: "HEAD" });
      status = res.status;
    } catch (e) {
      status = "ERR";
    }
    console.log(`  media: ${m.name.slice(0, 55)} → HTTP ${status}`);
  }

  // Thumbnail & banner portfolio
  for (const [label, url] of [["thumbnail", portfolio.thumbnail], ["banner", portfolio.banner]]) {
    if (!url) { console.log(`\n${label}: (kosong)`); continue; }
    try {
      const res = await fetch(url, { method: "HEAD" });
      console.log(`\n${label}: HTTP ${res.status} | ${url.split("/").pop().slice(0, 55)}`);
    } catch (e) {
      console.log(`\n${label}: ERR | ${url.split("/").pop().slice(0, 55)}`);
    }
  }
}

main()
  .catch((e) => { console.error("FATAL:", e); process.exit(1); })
  .finally(() => db.$disconnect());
