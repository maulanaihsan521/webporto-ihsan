// Exports all data from the current database (SQLite) into a single JSON file.
// Run this BEFORE switching the Prisma datasource to Postgres/Supabase.
//   node scripts/db-export.mjs
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "node:fs";

const db = new PrismaClient();

// Order does not matter for export.
const MODELS = [
  "user", "category", "tag", "post", "comment",
  "portfolio", "portfolioImage", "gallery", "certificate",
  "experience", "education", "skill", "service", "testimonial",
  "faq", "message", "newsletter", "marketArticle", "watchlist",
  "portfolioHolding", "media", "setting", "activityLog",
  "visitor", "visitorCount",
];

const dump = {};
let total = 0;
for (const m of MODELS) {
  const rows = await db[m].findMany();
  dump[m] = rows;
  total += rows.length;
  console.log(`  ${m}: ${rows.length}`);
}

mkdirSync("db", { recursive: true });
writeFileSync("db/export.json", JSON.stringify(dump, null, 2));
console.log(`\n✅ Exported ${total} rows across ${MODELS.length} models -> db/export.json`);
await db.$disconnect();
