/**
 * Shared env loader untuk operasi clone/failover Supabase (akun lama ↔ baru).
 *
 * - Kredensial LAMA  dibaca dari .env                (gitignored)
 * - Kredensial BARU  dibaca dari .env.supabase-backup (gitignored)
 *
 * Dipakai oleh: clone-supabase-check.mjs, clone-supabase-storage.mjs,
 *               verify-supabase-clone.mjs, switch-supabase.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

export function parseEnvFile(file) {
  const out = {};
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const OLD_ENV = parseEnvFile(".env");
const NEW_ENV = parseEnvFile(".env.supabase-backup");

export const OLD_PROJECT_REF = "vjijkzlzqksgqsdrgxrm";
export const NEW_PROJECT_REF = "imnjaijdmkxajofqhcju";

/** DB lama — session pooler 5432 (untuk SELECT besar / maintenance) */
export const oldDb = {
  url: OLD_ENV.DIRECT_URL || OLD_ENV.DATABASE_URL || "",
};

/** Storage lama */
export const oldStorage = {
  url: (OLD_ENV.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, ""),
  key: OLD_ENV.SUPABASE_SERVICE_ROLE_KEY || "",
  bucket: OLD_ENV.SUPABASE_STORAGE_BUCKET || "media",
};

/** DB baru — session pooler 5432 */
export const newDb = {
  url: NEW_ENV.NEW_DIRECT_URL || NEW_ENV.NEW_DATABASE_URL || "",
};

/** Storage baru */
export const newStorage = {
  url: (NEW_ENV.NEW_SUPABASE_URL || "").replace(/\/$/, ""),
  key: NEW_ENV.NEW_SUPABASE_SERVICE_KEY || "",
  bucket: NEW_ENV.NEW_SUPABASE_STORAGE_BUCKET || oldStorage.bucket,
};

export function assertEnvs() {
  const missing = [];
  if (!oldDb.url) missing.push("DIRECT_URL/DATABASE_URL (.env)");
  if (!oldStorage.url) missing.push("NEXT_PUBLIC_SUPABASE_URL (.env)");
  if (!oldStorage.key) missing.push("SUPABASE_SERVICE_ROLE_KEY (.env)");
  if (!newDb.url) missing.push("NEW_DIRECT_URL (.env.supabase-backup)");
  if (!newStorage.url) missing.push("NEW_SUPABASE_URL (.env.supabase-backup)");
  if (!newStorage.key) missing.push("NEW_SUPABASE_SERVICE_KEY (.env.supabase-backup)");
  if (missing.length) {
    console.error("❌ Env kurang:", missing.join(", "));
    process.exit(1);
  }
}

/** Header auth Storage REST API (format key baru sb_secret_ maupun JWT lama) */
export function storageHeaders(key, extra = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}
