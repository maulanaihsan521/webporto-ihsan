/**
 * SWITCH (FAILOVER) SUPABASE: akun lama ↔ akun baru.
 *
 * MODE:
 *   --to-new  : pindahkan site ke akun BARU (imnjaijdmkxajofqhcju)
 *   --to-old  : kembali ke akun LAMA (vjijkzlzqksgqsdrgxrm)
 *   --apply   : eksekusi beneran (TANPA flag ini = dry-run, hanya laporan)
 *
 * Yang dilakukan saat --to-new --apply:
 *   1. DB BARU  : rewrite semua referensi URL storage (project ref lama → baru)
 *                 di SEMUA kolom teks semua tabel (Media.url, Setting.value,
 *                 Post.content rich-text, Gallery, dst — scan generik)
 *   2. .env     : ganti DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
 *                 SUPABASE_SERVICE_ROLE_KEY ke nilai akun baru
 *                 (file lama dibackup ke .env.pre-failover-<timestamp>)
 *   3. Print langkah manual yang tidak bisa diotomasi (env Vercel + restart)
 *
 * RUNBOOK FAILOVER LENGKAP (jalankan saat akun lama kena 402/paused,
 * atau SEBELUM itu terjadi supaya backup fresh):
 *   node scripts/resync-supabase-db.mjs       # refresh data DB backup
 *   node scripts/clone-supabase-storage.mjs   # refresh file storage backup
 *   node scripts/switch-supabase.mjs --to-new --apply
 *   # → update 4 env var di Vercel Dashboard (nilai tercetak script) + redeploy
 *   pm2 restart webporto
 *
 * Jalankan dari root project:
 *   node scripts/switch-supabase.mjs --to-new          # dry-run (aman)
 *   node scripts/switch-supabase.mjs --to-new --apply  # eksekusi
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "module";
import {
  oldDb, newDb, OLD_PROJECT_REF, NEW_PROJECT_REF, parseEnvFile, assertEnvs,
} from "./supabase-envs.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const TO_NEW = process.argv.includes("--to-new");
const TO_OLD = process.argv.includes("--to-old");
const APPLY = process.argv.includes("--apply");

if (TO_NEW === TO_OLD) {
  console.error("Pilih salah satu: --to-new atau --to-old");
  process.exit(1);
}

const ENV_KEYS = ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

function rewriteEnvFile(file, values) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const out = lines.map((line) => {
    const t = line.trim();
    if (t.startsWith("#")) return line;
    const eq = t.indexOf("=");
    if (eq === -1) return line;
    const k = t.slice(0, eq).trim();
    return k in values ? `${k}=${JSON.stringify(values[k])}` : line;
  });
  fs.writeFileSync(file, out.join("\n"));
}

async function main() {
  assertEnvs();
  const backupEnv = parseEnvFile(".env.supabase-backup");

  const direction = TO_NEW ? "LAMA → BARU" : "BARU → LAMA";
  const refFrom = TO_NEW ? OLD_PROJECT_REF : NEW_PROJECT_REF;
  const refTo = TO_NEW ? NEW_PROJECT_REF : OLD_PROJECT_REF;
  // DB yang di-rewrite = DB yang AKAN dipakai site setelah switch
  const targetDbUrl = TO_NEW ? newDb.url : oldDb.url;

  console.log("════════════════════════════════════════════════════════════");
  console.log(`  SWITCH SUPABASE ${direction} ${APPLY ? "[APPLY]" : "[DRY-RUN — tambahkan --apply untuk eksekusi]"}`);
  console.log("════════════════════════════════════════════════════════════\n");

  const c = new Client({ connectionString: targetDbUrl });
  await c.connect();

  // 1. Scan semua kolom teks di semua tabel public
  const cols = await c.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying', 'character')
    ORDER BY table_name, column_name
  `);

  console.log(`[1/3] Scan referensi '${refFrom}' di ${cols.rows.length} kolom teks...\n`);
  let totalRows = 0;
  const hits = [];
  for (const { table_name, column_name } of cols.rows) {
    const r = await c.query(
      `SELECT count(*)::int AS n FROM "${table_name}" WHERE "${column_name}" LIKE '%' || $1 || '%'`,
      [refFrom],
    );
    if (r.rows[0].n > 0) {
      hits.push({ table_name, column_name, n: r.rows[0].n });
      totalRows += r.rows[0].n;
      console.log(`  ${table_name}.${column_name.padEnd(16)} ${r.rows[0].n} baris mengandung '${refFrom}'`);
    }
  }
  if (!hits.length) console.log("  (tidak ada referensi ditemukan — sudah bersih/idempoten)");

  // 2. Apply rewrite di DB
  if (APPLY && hits.length) {
    console.log(`\n[2/3] Rewrite URL di database target (${TO_NEW ? "akun BARU" : "akun LAMA"})...`);
    for (const { table_name, column_name } of hits) {
      await c.query(
        `UPDATE "${table_name}" SET "${column_name}" = REPLACE("${column_name}", $1, $2)
         WHERE "${column_name}" LIKE '%' || $1 || '%'`,
        [refFrom, refTo],
      );
    }
    // Verifikasi ulang
    let sisa = 0;
    for (const { table_name, column_name } of hits) {
      const r = await c.query(
        `SELECT count(*)::int AS n FROM "${table_name}" WHERE "${column_name}" LIKE '%' || $1 || '%'`,
        [refFrom],
      );
      sisa += r.rows[0].n;
    }
    console.log(sisa === 0 ? "  ✓ Semua referensi berhasil di-rewrite" : `  ⚠️ Masih ada ${sisa} referensi tersisa!`);
    if (sisa > 0) process.exit(1);
  } else if (!APPLY) {
    console.log("\n[2/3] (dry-run — tidak ada perubahan database)");
  }

  // 3. Rewrite .env lokal
  if (APPLY) {
    console.log(`\n[3/3] Update .env lokal...`);
    const envPath = path.join(process.cwd(), ".env");
    const backupPath = `.env.pre-failover-${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    const newValues = TO_NEW
      ? {
          DATABASE_URL: backupEnv.NEW_DATABASE_URL,
          DIRECT_URL: backupEnv.NEW_DIRECT_URL,
          NEXT_PUBLIC_SUPABASE_URL: backupEnv.NEW_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: backupEnv.NEW_SUPABASE_SERVICE_KEY,
        }
      : {
          DATABASE_URL: parseEnvFile(backupPath).DATABASE_URL,
          DIRECT_URL: parseEnvFile(backupPath).DIRECT_URL,
          NEXT_PUBLIC_SUPABASE_URL: parseEnvFile(backupPath).NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: parseEnvFile(backupPath).SUPABASE_SERVICE_ROLE_KEY,
        };
    rewriteEnvFile(envPath, newValues);
    console.log(`  ✓ .env di-update (backup: ${backupPath})`);
  } else {
    console.log("\n[3/3] (dry-run — .env tidak diubah)");
  }

  await c.end();

  // 4. Instruksi manual
  console.log("\n════════ LANGKAH LANJUTAN (MANUAL) ══════════");
  if (APPLY) {
    if (TO_NEW) {
      console.log("1. Vercel Dashboard → Project → Settings → Environment Variables, ganti:");
      console.log(`   DATABASE_URL            = ${backupEnv.NEW_DATABASE_URL}`);
      console.log(`   DIRECT_URL              = ${backupEnv.NEW_DIRECT_URL}`);
      console.log(`   NEXT_PUBLIC_SUPABASE_URL= ${backupEnv.NEW_SUPABASE_URL}`);
      console.log(`   SUPABASE_SERVICE_ROLE_KEY = (nilai di .env.supabase-backup — jangan tampilkan)`);
      console.log("2. Vercel → Deployments → Redeploy (setelah env di-update)");
      console.log("3. Lokal: pm2 restart webporto");
      console.log("4. Cek: halaman utama + gallery + artikel blog (gambar harus tampil dari akun baru)");
    } else {
      console.log("1. Vercel: kembalikan 4 env var ke nilai akun lama (lihat .env.pre-failover-*)");
      console.log("2. Redeploy Vercel + pm2 restart webporto");
      console.log("3. ⚠️ Data yang berubah di akun baru selama failover TIDAK otomatis pindah —");
      console.log("   salin manual bila perlu (resync arahnya hanya lama→baru).");
    }
  } else {
    console.log("(Dry-run — jalankan ulang dengan --apply untuk eksekusi)");
  }
  console.log("");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
