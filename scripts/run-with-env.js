/**
 * Wrapper to force env vars from .env file (overrides system env that has conflicting DATABASE_URL).
 * Usage: node scripts/run-with-env.js <command> [args...]
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Parse .env file manually (simple parser — supports KEY="value with spaces")
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnv(path.join(__dirname, "..", ".env"));

// Force override system env with our .env values
for (const [k, v] of Object.entries(env)) {
  process.env[k] = v;
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

if (!cmd) {
  console.error("Usage: node scripts/run-with-env.js <command> [args...]");
  process.exit(1);
}

// Resolve binary from node_modules/.bin
let binPath = cmd;
if (!cmd.includes("/") && !cmd.includes("\\")) {
  const binCandidate = path.join(__dirname, "..", "node_modules", ".bin", cmd);
  if (fs.existsSync(binCandidate)) {
    binPath = binCandidate;
  }
}

const child = spawn(binPath, args, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
