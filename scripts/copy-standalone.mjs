// Cross-platform replacement for the Unix `cp -r` steps used after `next build`.
// Next.js "standalone" output does not include static assets or the public/
// folder, so we copy them in. Works on Windows, macOS and Linux.
import { cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

async function copyDir(from, to) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  if (!existsSync(src)) {
    console.warn(`skip: ${from} does not exist`);
    return;
  }
  await cp(src, dest, { recursive: true });
  console.log(`copied ${from} -> ${to}`);
}

await copyDir(".next/static", ".next/standalone/.next/static");
await copyDir("public", ".next/standalone/public");
console.log("standalone assets ready");
