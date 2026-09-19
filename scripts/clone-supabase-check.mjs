/**
 * CEK KONEKSI SEBELUM CLONE: Supabase lama → Supabase baru.
 *
 * Memverifikasi:
 *   1. DB lama   (session pooler) — versi PG, daftar tabel, jumlah baris
 *   2. DB baru   (session pooler) — versi PG, harus kosong (belum ada tabel)
 *   3. Storage lama — daftar bucket + walk semua file
 *   4. Storage baru — daftar bucket (harus kosong)
 *
 * Jalankan dari root project:
 *   node scripts/clone-supabase-check.mjs
 */
import { createRequire } from "module";
import {
  oldDb, oldStorage, newDb, newStorage,
  assertEnvs, storageHeaders,
} from "./supabase-envs.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

// ── DB ───────────────────────────────────────────────────────────────────
async function dbInfo(label, url) {
  const c = new Client({ connectionString: url });
  const info = { ok: false };
  try {
    await c.connect();
    info.ok = true;
    info.version = (await c.query("SELECT version()")).rows[0].version.split(" ").slice(0, 2).join(" ");
    const tables = await c.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    );
    info.tables = {};
    for (const { tablename } of tables.rows) {
      const r = await c.query(`SELECT count(*)::int AS n FROM "${tablename}"`);
      info.tables[tablename] = r.rows[0].n;
    }
  } catch (e) {
    info.error = e.message;
  } finally {
    await c.end().catch(() => {});
  }

  console.log(`\n[${label}]`);
  if (!info.ok) {
    console.log(`  ❌ GAGAL: ${info.error}`);
    return info;
  }
  console.log(`  ✓ Terhubung — ${info.version}`);
  const entries = Object.entries(info.tables);
  if (entries.length === 0) {
    console.log(`  (belum ada tabel — database kosong)`);
  } else {
    let total = 0;
    for (const [t, n] of entries) {
      console.log(`    ${t.padEnd(22)} ${String(n).padStart(7)} baris`);
      total += n;
    }
    console.log(`  Total: ${entries.length} tabel, ${total} baris`);
  }
  return info;
}

// ── Storage ──────────────────────────────────────────────────────────────
async function listBuckets(label, { url, key }) {
  console.log(`\n[${label}]`);
  try {
    const res = await fetch(`${url}/storage/v1/bucket`, { headers: storageHeaders(key) });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const buckets = await res.json();
    console.log(`  ✓ Terhubung — ${buckets.length} bucket`);
    for (const b of buckets) {
      console.log(`    - ${b.name} (public: ${b.public})`);
    }
    return buckets;
  } catch (e) {
    console.log(`  ❌ GAGAL: ${e.message}`);
    return null;
  }
}

/** Walk rekursif semua file di bucket (list API mengembalikan name relatif prefix) */
async function walkFiles({ url, key }, bucket, prefix = "") {
  const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: storageHeaders(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ prefix, limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) throw new Error(`list '${prefix}' failed: ${res.status} ${await res.text()}`);
  const items = await res.json();
  let files = [];
  for (const it of items) {
    if (it.id === null) {
      // folder placeholder → recurse
      files = files.concat(await walkFiles({ url, key }, bucket, `${prefix}${it.name}/`));
    } else {
      files.push({
        key: `${prefix}${it.name}`,
        size: it.metadata?.size ?? 0,
        mimeType: it.metadata?.mimetype ?? null,
        updatedAt: it.updated_at ?? null,
      });
    }
  }
  return files;
}

async function main() {
  assertEnvs();
  console.log("════════════════════════════════════════════════════════════");
  console.log("  CEK KONEKSI SUPABASE LAMA vs BARU (pra-clone)");
  console.log("════════════════════════════════════════════════════════════");

  const oldInfo = await dbInfo("DB LAMA  (vjijkzlzqksgqsdrgxrm)", oldDb.url);
  const newInfo = await dbInfo("DB BARU  (imnjaijdmkxajofqhcju)", newDb.url);

  const oldBuckets = await listBuckets("STORAGE LAMA", oldStorage);
  const newBuckets = await listBuckets("STORAGE BARU", newStorage);

  // Walk file di semua bucket lama
  if (oldBuckets && oldBuckets.length) {
    for (const b of oldBuckets) {
      const files = await walkFiles(oldStorage, b.name);
      const total = files.reduce((s, f) => s + f.size, 0);
      console.log(`\n  Bucket '${b.name}' (lama): ${files.length} file, ${(total / 1024 / 1024).toFixed(2)}MB`);
      const byFolder = {};
      for (const f of files) {
        const folder = f.key.includes("/") ? `${f.key.split("/")[0]}/` : "(root)";
        byFolder[folder] = (byFolder[folder] || 0) + 1;
      }
      for (const [folder, n] of Object.entries(byFolder)) {
        console.log(`    ${folder.padEnd(20)} ${n} file`);
      }
    }
  }

  // Ringkasan siap / tidak
  console.log("\n──────────── KESIMPULAN ────────────");
  console.log(`  DB lama OK      : ${oldInfo.ok ? "YA" : "TIDAK"}`);
  console.log(`  DB baru OK      : ${newInfo.ok ? "YA" : "TIDAK"}`);
  const newEmpty = newInfo.ok && Object.keys(newInfo.tables || {}).length === 0;
  console.log(`  DB baru kosong  : ${newEmpty ? "YA (siap clone)" : "TIDAK — sudah ada tabel!"}`);
  console.log(`  Storage lama OK : ${oldBuckets ? "YA" : "TIDAK"}`);
  console.log(`  Storage baru OK : ${newBuckets ? "YA" : "TIDAK"}`);
  const ready = oldInfo.ok && newInfo.ok && newEmpty && oldBuckets && newBuckets;
  console.log(ready ? "\n✅ SIAP LANJUT KE PROSES CLONE.\n" : "\n⚠️  Ada masalah di atas — perbaiki dulu sebelum clone.\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
