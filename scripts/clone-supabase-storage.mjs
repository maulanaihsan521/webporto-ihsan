/**
 * CLONE SUPABASE STORAGE: akun lama → akun baru (backup/failover).
 *
 * - Membuat bucket yang sama (public, file_size_limit 50MB — persis
 *   konfigurasi bucket aplikasi di src/lib/supabase-storage.ts)
 * - Walk rekursif SEMUA file di bucket lama
 * - Download dari storage lama → upload ke storage baru (x-upsert → idempoten)
 * - Verifikasi: jumlah file + ukuran per file + tes URL publik
 *
 * Re-runnable: jalankan ulang kapan saja untuk sinkron ulang file baru
 * (mis. menjelang failover) — file yang sama akan di-upsert.
 *
 * Kredensial dibaca otomatis:
 *   lama ← .env                 (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   baru ← .env.supabase-backup (NEW_SUPABASE_URL + NEW_SUPABASE_SERVICE_KEY)
 *
 * Jalankan dari root project:
 *   node scripts/clone-supabase-storage.mjs
 */
import {
  oldStorage, newStorage, assertEnvs, storageHeaders,
} from "./supabase-envs.mjs";

const CONCURRENCY = 4;

/** Encode path segments untuk URL (aman untuk nama file dengan spasi/unicode) */
function encodeKey(key) {
  return key.split("/").map(encodeURIComponent).join("/");
}

// ── Storage helpers ──────────────────────────────────────────────────────
async function listBuckets({ url, key }) {
  const res = await fetch(`${url}/storage/v1/bucket`, { headers: storageHeaders(key) });
  if (!res.ok) throw new Error(`list buckets failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createBucket({ url, key }, name) {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: storageHeaders(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: name, name, public: true, file_size_limit: 52428800 }),
  });
  // 409 = sudah ada → sukses (pattern sama dengan ensureBucket aplikasi)
  if (!res.ok && res.status !== 409) {
    const txt = await res.text();
    if (!txt.includes("already exists") && !txt.includes("Duplicate")) {
      throw new Error(`create bucket '${name}' failed: ${res.status} ${txt}`);
    }
  }
}

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
      files = files.concat(await walkFiles({ url, key }, bucket, `${prefix}${it.name}/`));
    } else {
      files.push({
        key: `${prefix}${it.name}`,
        size: it.metadata?.size ?? 0,
        mimeType: it.metadata?.mimetype ?? null,
      });
    }
  }
  return files;
}

async function downloadObject({ url }, bucket, key) {
  // bucket public → object/public bisa di-fetch tanpa auth
  const res = await fetch(`${url}/storage/v1/object/public/${bucket}/${encodeKey(key)}`);
  if (!res.ok) throw new Error(`download ${key} failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadObject({ url, key: auth }, bucket, key, buffer, mimeType) {
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${encodeKey(key)}`, {
    method: "POST",
    headers: storageHeaders(auth, {
      "Content-Type": mimeType || "application/octet-stream",
      "x-upsert": "true",
    }),
    body: new Uint8Array(buffer),
  });
  if (!res.ok) throw new Error(`upload ${key} failed: ${res.status} ${await res.text()}`);
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  assertEnvs();
  console.log("════════════════════════════════════════════════════════════");
  console.log("  CLONE SUPABASE STORAGE (lama → baru)");
  console.log(`  ${oldStorage.url} → ${newStorage.url}`);
  console.log("════════════════════════════════════════════════════════════\n");

  // 1. Pastikan bucket ada di akun baru
  const oldBuckets = await listBuckets(oldStorage);
  const newBuckets = await listBuckets(newStorage);
  const newNames = new Set(newBuckets.map((b) => b.name));

  for (const b of oldBuckets) {
    if (!newNames.has(b.name)) {
      await createBucket(newStorage, b.name);
      console.log(`✓ Bucket '${b.name}' dibuat di akun baru (public, limit 50MB)`);
    } else {
      console.log(`⏭ Bucket '${b.name}' sudah ada di akun baru`);
    }
  }

  // 2. Walk semua file di bucket lama
  const bucket = oldStorage.bucket;
  const oldFiles = await walkFiles(oldStorage, bucket);
  const totalBytes = oldFiles.reduce((s, f) => s + f.size, 0);
  console.log(`\nBucket '${bucket}': ${oldFiles.length} file, ${(totalBytes / 1024 / 1024).toFixed(2)}MB — mulai transfer...\n`);

  // 3. Download → upload (batch CONCURRENCY)
  let ok = 0, fail = 0, skip = 0;
  for (let i = 0; i < oldFiles.length; i += CONCURRENCY) {
    const batch = oldFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (f) => {
        const buffer = await downloadObject(oldStorage, bucket, f.key);
        await uploadObject(newStorage, bucket, f.key, buffer, f.mimeType);
        return { key: f.key, size: buffer.length, expected: f.size };
      }),
    );
    for (const r of results) {
      if (r.status === "rejected") {
        fail++;
        console.error(`✗ GAGAL ${r.reason?.message?.split("\n")[0]}`);
        continue;
      }
      const v = r.value;
      if (v.expected > 0 && v.size !== v.expected) {
        console.warn(`! SIZE BEDA ${v.key}: unduhan ${v.size} vs metadata lama ${v.expected}`);
      } else {
        skip++;
      }
      ok++;
      if (ok % 10 === 0 || i + CONCURRENCY >= oldFiles.length) {
        console.log(`  progress: ${ok}/${oldFiles.length} file ter-upload`);
      }
    }
  }

  console.log(`\nTransfer selesai: ${ok} sukses, ${fail} gagal`);

  // 4. Verifikasi: walk bucket baru, bandingkan
  const newFiles = await walkFiles(newStorage, bucket);
  const mapOld = new Map(oldFiles.map((f) => [f.key, f.size]));
  const mapNew = new Map(newFiles.map((f) => [f.key, f.size]));
  let missing = 0, sizeMismatch = 0, extra = 0;
  for (const [k, s] of mapOld) {
    if (!mapNew.has(k)) { missing++; console.log(`  ✗ hilang: ${k}`); }
    else if (mapNew.get(k) !== s) { sizeMismatch++; console.log(`  ✗ ukuran beda: ${k} (${s} → ${mapNew.get(k)})`); }
  }
  for (const k of mapNew.keys()) if (!mapOld.has(k)) { extra++; console.log(`  + ekstra: ${k}`); }
  const newTotal = newFiles.reduce((s, f) => s + f.size, 0);
  console.log(`\n──────────── VERIFIKASI STORAGE ────────────`);
  console.log(`  File lama : ${oldFiles.length} (${(totalBytes / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`  File baru : ${newFiles.length} (${(newTotal / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`  Hilang: ${missing} | Ukuran beda: ${sizeMismatch} | Ekstra: ${extra}`);

  // 5. Tes URL publik di akun baru (maks 3 file)
  if (newFiles.length) {
    console.log(`\nTes URL publik akun baru:`);
    for (const f of newFiles.slice(0, 3)) {
      const res = await fetch(`${newStorage.url}/storage/v1/object/public/${bucket}/${encodeKey(f.key)}`, { method: "HEAD" });
      console.log(`  ${res.status === 200 ? "✓" : "✗"} ${f.key} → HTTP ${res.status} (${res.headers.get("content-type")})`);
    }
  }

  const success = fail === 0 && missing === 0 && sizeMismatch === 0;
  console.log(success
    ? "\n✅ STORAGE CLONE LENGKAP & TERVERIFIKASI\n"
    : "\n⚠️  Ada masalah di atas — perbaiki lalu jalankan ulang (idempoten).\n");
  process.exit(success ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
