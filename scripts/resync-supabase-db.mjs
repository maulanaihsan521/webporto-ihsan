/**
 * REFRESH BACKUP DATABASE: kosongkan DB akun baru → export ulang dari
 * DB akun lama → import ulang → verifikasi (termasuk sync _PostToTag).
 *
 * Jalankan SEBELUM failover (selama akun lama masih hidup) supaya
 * backup fresh — menangkap upload/postingan baru sejak clone pertama.
 *
 * ⚠️ JANGAN jalankan SETELAH failover ke akun baru — arah sinkronisasi
 *    hanya lama → baru; menjalankannya setelah switch akan menimpa
 *    data baru di akun baru dengan data lama.
 *
 * Jalankan dari root project:
 *   node scripts/resync-supabase-db.mjs
 */
import { execSync } from "node:child_process";
import { createRequire } from "module";
import { oldDb, newDb, assertEnvs } from "./supabase-envs.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

function run(cmd, env) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env }, timeout: 600000 });
}

async function main() {
  assertEnvs();
  console.log("════════════════════════════════════════════════════════════");
  console.log("  RESYNC BACKUP DB (lama → baru)");
  console.log("════════════════════════════════════════════════════════════\n");

  // 1. Kosongkan semua tabel di DB baru (TRUNCATE CASCADE — urutan FK aman)
  const c = new Client({ connectionString: newDb.url });
  await c.connect();
  const tables = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_%'",
  );
  const list = tables.rows.map((r) => `"${r.tablename}"`).join(", ");
  await c.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  const after = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  console.log(`✓ ${tables.rows.length} tabel di DB baru dikosongkan (TRUNCATE CASCADE)\n`);
  await c.end();

  // 2. Export ulang dari DB lama
  console.log("── Export dari DB lama ──");
  run("node scripts/db-export.mjs", { DATABASE_URL: oldDb.url });
  console.log("");

  // 3. Import ke DB baru
  console.log("── Import ke DB baru ──");
  run("node scripts/db-import.mjs", { DATABASE_URL: newDb.url });
  console.log("");

  // 4. Verifikasi + sync _PostToTag
  console.log("── Verifikasi ──");
  run("node scripts/verify-supabase-clone.mjs", {});

  console.log("\n✅ RESYNC SELESAI — backup DB akun baru kini fresh.");
  console.log("   Lanjut: node scripts/clone-supabase-storage.mjs  (refresh file storage)");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
