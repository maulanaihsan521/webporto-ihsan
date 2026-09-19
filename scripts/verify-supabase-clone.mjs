/**
 * VERIFIKASI CLONE DATABASE: Supabase lama vs Supabase baru.
 *
 * 1. Sync tabel implisit _PostToTag (many-to-many Post↔Tag) yang tidak
 *    ter-cover db-export/db-import (findMany tanpa include relasi).
 *    Idempoten: hanya insert pasangan yang belum ada di DB baru.
 * 2. Bandingkan SEMUA tabel public: jumlah baris + checksum konten.
 *    Checksum = md5 dari baris yang dinormalisasi (key di-sort alfabetis,
 *    baris di-sort by id) — kebal terhadap perbedaan urutan kolom fisik.
 *
 * Jalankan dari root project:
 *   node scripts/verify-supabase-clone.mjs
 */
import { createRequire } from "module";
import { createHash } from "node:crypto";
import { oldDb, newDb, assertEnvs } from "./supabase-envs.mjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

async function connect(url) {
  const c = new Client({ connectionString: url });
  await c.connect();
  return c;
}

/** Normalisasi baris → string stabil (key sort alfabetis, nilai Date→ISO) */
function normalizeRow(row) {
  const keys = Object.keys(row).sort();
  const parts = [];
  for (const k of keys) {
    const v = row[k];
    if (v instanceof Date) parts.push(`${k}=${v.toISOString()}`);
    else if (v === null || v === undefined) parts.push(`${k}=∅`);
    else if (typeof v === "object") parts.push(`${k}=${JSON.stringify(v)}`);
    else parts.push(`${k}=${String(v)}`);
  }
  return parts.join("|");
}

/** Checksum seluruh tabel (baris sort by id) */
function tableChecksum(rows) {
  const sorted = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return createHash("md5").update(sorted.map(normalizeRow).join("\n")).digest("hex");
}

async function listTables(c) {
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
  );
  return r.rows.map((x) => x.tablename);
}

async function main() {
  assertEnvs();
  console.log("════════════════════════════════════════════════════════════");
  console.log("  VERIFIKASI CLONE DATABASE (lama → baru)");
  console.log("════════════════════════════════════════════════════════════\n");

  const oldC = await connect(oldDb.url);
  const newC = await connect(newDb.url);

  // ── 1. Sync _PostToTag ──────────────────────────────────────────────────
  const m2m = await oldC.query('SELECT "A", "B" FROM "_PostToTag"');
  const existing = await newC.query('SELECT "A", "B" FROM "_PostToTag"');
  const have = new Set(existing.rows.map((r) => `${r.A}|${r.B}`));
  let inserted = 0;
  for (const r of m2m.rows) {
    if (!have.has(`${r.A}|${r.B}`)) {
      await newC.query('INSERT INTO "_PostToTag"("A", "B") VALUES ($1, $2)', [r.A, r.B]);
      inserted++;
    }
  }
  console.log(`_PostToTag sync: ${m2m.rows.length} pasangan di lama, ${existing.rows.length} sudah ada, ${inserted} di-insert\n`);

  // ── 2. Bandingkan semua tabel ───────────────────────────────────────────
  const oldTables = await listTables(oldC);
  const newTables = await listTables(newC);
  const allTables = [...new Set([...oldTables, ...newTables])].sort();

  let pass = 0, fail = 0, totalOld = 0, totalNew = 0;
  for (const t of allTables) {
    const inOld = oldTables.includes(t);
    const inNew = newTables.includes(t);
    if (!inOld || !inNew) {
      console.log(`✗ ${t.padEnd(22)} HANYA di ${inOld ? "LAMA" : "BARU"}`);
      fail++;
      continue;
    }
    const o = await oldC.query(`SELECT * FROM "${t}"`);
    const n = await newC.query(`SELECT * FROM "${t}"`);
    totalOld += o.rows.length;
    totalNew += n.rows.length;
    const co = tableChecksum(o.rows);
    const cn = tableChecksum(n.rows);
    if (co === cn) {
      console.log(`✓ ${t.padEnd(22)} ${String(n.rows.length).padStart(7)} baris — checksum cocok`);
      pass++;
    } else {
      console.log(`✗ ${t.padEnd(22)} lama=${o.rows.length} baru=${n.rows.length} — CHECKSUM BEDA (co=${co.slice(0, 8)} cn=${cn.slice(0, 8)})`);
      // Tampilkan baris beda (maks 3)
      const mapO = new Map(o.rows.map((r) => [r.id, normalizeRow(r)]));
      const mapN = new Map(n.rows.map((r) => [r.id, normalizeRow(r)]));
      let shown = 0;
      for (const [id, rowStr] of mapO) {
        if (mapN.get(id) !== rowStr && shown < 3) {
          console.log(`    LAMA ${id}: ${rowStr.slice(0, 160)}`);
          console.log(`    BARU ${id}: ${(mapN.get(id) || "(tidak ada)").slice(0, 160)}`);
          shown++;
        }
      }
      fail++;
    }
  }

  console.log("\n──────────── HASIL VERIFIKASI DB ────────────");
  console.log(`  Tabel cocok : ${pass}/${allTables.length}`);
  console.log(`  Baris lama  : ${totalOld}`);
  console.log(`  Baris baru  : ${totalNew}`);
  console.log(`  _PostToTag  : ${m2m.rows.length} → ${existing.rows.length + inserted}`);
  console.log(fail === 0 ? "  ✅ DATABASE CLONE 100% TERVERIFIKASI" : `  ❌ ${fail} tabel mismatch — periksa detail di atas`);

  await oldC.end();
  await newC.end();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
