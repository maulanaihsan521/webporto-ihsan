// Imports data from db/export.json into the CURRENT Prisma datasource (Supabase/Postgres).
// Insertion order respects foreign-key dependencies. Uses upsert-free createMany where safe,
// and falls back to per-row create so a single bad row doesn't abort the whole table.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

// Order matters: parents before children (FK constraints are enforced in Postgres).
const ORDER = [
  "user",
  "category",
  "tag",
  "post",
  "comment",
  "portfolio",
  "portfolioImage",
  "gallery",
  "certificate",
  "experience",
  "education",
  "skill",
  "service",
  "testimonial",
  "faq",
  "message",
  "newsletter",
  "marketArticle",
  "watchlist",
  "portfolioHolding",
  "media",
  "setting",
  "activityLog",
  "visitor",
  "visitorCount",
];

// Relations that must be connected after scalar fields are set (m-n or nested).
// post.tags and post.categoryId — categoryId is a scalar FK so it imports directly.
// post<->tag is many-to-many (implicit join table); handle separately.
function stripRelations(model, row) {
  const clone = { ...row };
  // Remove nested relation arrays/objects that Prisma won't accept in a flat create.
  for (const key of Object.keys(clone)) {
    const v = clone[key];
    if (Array.isArray(v)) delete clone[key];
    else if (v && typeof v === "object" && !(v instanceof Date)) {
      // Date strings come back as strings from JSON; leave them.
      delete clone[key];
    }
  }
  return clone;
}

// Convert ISO date strings back to Date objects for known DateTime fields.
function coerceDates(row) {
  for (const key of Object.keys(row)) {
    const v = row[key];
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) row[key] = d;
    }
  }
  return row;
}

async function main() {
  const file = path.join(process.cwd(), "db", "export.json");
  const data = JSON.parse(readFileSync(file, "utf8"));

  let total = 0;
  const postTagLinks = [];

  for (const model of ORDER) {
    const rows = data[model] || [];
    if (!rows.length) {
      console.log(`  ${model}: 0 (skipped)`);
      continue;
    }

    let ok = 0;
    for (const raw of rows) {
      // Capture post<->tag links before stripping relations.
      if (model === "post" && Array.isArray(raw.tags)) {
        for (const t of raw.tags) postTagLinks.push({ postId: raw.id, tagId: t.id });
      }
      const row = coerceDates(stripRelations(model, raw));
      try {
        await prisma[model].create({ data: row });
        ok++;
      } catch (err) {
        console.warn(`    ! ${model} row ${row.id ?? "?"} failed: ${err.message.split("\n")[0]}`);
      }
    }
    console.log(`  ${model}: ${ok}/${rows.length}`);
    total += ok;
  }

  // Re-link post <-> tag many-to-many.
  if (postTagLinks.length) {
    let linked = 0;
    for (const { postId, tagId } of postTagLinks) {
      try {
        await prisma.post.update({
          where: { id: postId },
          data: { tags: { connect: { id: tagId } } },
        });
        linked++;
      } catch (err) {
        console.warn(`    ! post-tag link ${postId}->${tagId} failed: ${err.message.split("\n")[0]}`);
      }
    }
    console.log(`  post<->tag links: ${linked}/${postTagLinks.length}`);
  }

  console.log(`\n✅ Imported ${total} rows into Supabase.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
