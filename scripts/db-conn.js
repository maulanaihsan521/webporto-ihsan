/**
 * Shared DB connection helper for maintenance scripts.
 * Reads DATABASE_URL from .env (gitignored) — NO hardcoded credentials.
 *
 * Usage: const { getConnection } = require("./db-conn");
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvValue(key) {
  // 1. .env file in project root takes PRIORITY
  //    (system env may contain an unrelated DATABASE_URL, e.g. container default
  //     file:/home/z/my-project/db/custom.db — same reason run-with-env.js exists)
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      if (k !== key) continue;
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      return v;
    }
  }
  // 2. Fallback: real environment variable
  return process.env[key] || null;
}

function getConnection() {
  const url = loadEnvValue("DATABASE_URL");
  if (!url) {
    console.error(
      "FATAL: DATABASE_URL not found. Set it in .env or environment.\n" +
        "(Gunakan Supabase pooler connection string — port 6543)"
    );
    process.exit(1);
  }
  return new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
}

module.exports = { getConnection, loadEnvValue };
