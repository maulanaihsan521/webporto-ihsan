/**
 * Migration script: Move local /uploads/ files to Alibaba Cloud OSS.
 *
 * Usage:
 *   bun run scripts/migrate-uploads-to-oss.ts
 *
 * Prerequisites:
 *   - Set OSS env vars in .env:
 *     OSS_REGION=oss-ap-southeast-5
 *     OSS_ACCESS_KEY_ID=your_access_key_id
 *     OSS_ACCESS_KEY_SECRET=your_access_key_secret
 *     OSS_BUCKET=portofolioihsan-uploads
 *     OSS_PUBLIC_BASE=https://portofolioihsan-uploads.oss-ap-southeast-5.aliyuncs.com
 *   - Run from project root
 *
 * This script:
 *   1. Reads all Media records where url starts with /uploads/
 *   2. Reads the file from public/uploads/
 *   3. Uploads to OSS with key uploads/<filename>
 *   4. Updates DB record with full OSS URL
 */

import { db } from "/home/z/my-project/src/lib/db";
import { isOssEnabled, OSS_PUBLIC_BASE, uploadToOss } from "/home/z/my-project/src/lib/oss";
import fs from "fs";

async function migrate() {
  if (!isOssEnabled) {
    console.error("❌ OSS is not configured.");
    console.error("   Set OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET in .env");
    process.exit(1);
  }

  console.log("🚀 Starting migration to OSS...");
  console.log("   OSS Public Base:", OSS_PUBLIC_BASE);

  // Get all media with local URLs
  const media = await db.media.findMany({
    where: { url: { startsWith: "/uploads/" } },
  });

  console.log(`📦 Found ${media.length} media records with local URLs\n`);

  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  for (const m of media) {
    const filename = m.url.replace("/uploads/", "");
    const localPath = `/home/z/my-project/public${m.url}`;

    if (!fs.existsSync(localPath)) {
      console.log(`  ⏭️  SKIP (file not found locally): ${m.url}`);
      skipped++;
      continue;
    }

    const ossKey = `uploads/${filename}`;
    const mimeType = m.mimeType || undefined;
    console.log(`  ⬆️  Uploading: ${filename} → ${ossKey}`);

    try {
      const buffer = fs.readFileSync(localPath);
      const newUrl = await uploadToOss(ossKey, buffer, mimeType);

      await db.media.update({
        where: { id: m.id },
        data: { url: newUrl },
      });

      console.log(`  ✅ Migrated: ${m.url} → ${newUrl}`);
      migrated++;
    } catch (e: any) {
      console.error(`  ❌ FAILED: ${filename} — ${e?.message || e}`);
      failed++;
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped (file not found): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total processed: ${media.length}`);

  await db.$disconnect();
}

migrate().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
