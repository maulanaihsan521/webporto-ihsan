/**
 * Unit test untuk src/lib/image-convert.ts (logika yang sama dengan API upload).
 * Test: shouldConvertToWebp + convertImageToWebp + toWebpFilename.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { shouldConvertToWebp, convertImageToWebp, toWebpFilename, toWebpUrl } from "../src/lib/image-convert";

const BACKUP = path.join(process.cwd(), ".originals-backup");
let pass = 0, fail = 0;

function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

async function main() {
  console.log("── shouldConvertToWebp ──");
  assert(shouldConvertToWebp("foto.JPG", "image/jpeg", 500000) === true, "foto.JPG + image/jpeg → true");
  assert(shouldConvertToWebp("foto.png", "image/png", 500000) === true, "foto.png + image/png → true");
  assert(shouldConvertToWebp("anim.gif", "image/gif", 500000) === false, "gif → false (animated)");
  assert(shouldConvertToWebp("logo.svg", "image/svg+xml", 500000) === false, "svg → false (vector)");
  assert(shouldConvertToWebp("sudah.webp", "image/webp", 500000) === false, "webp → false (sudah optimal)");
  assert(shouldConvertToWebp("kecil.jpg", "image/jpeg", 10240) === false, "jpg 10KB → false (< 20KB)");
  assert(shouldConvertToWebp("nofile", "", undefined) === false, "tanpa ext & mime → false");
  // Edge: ext .png tapi mime image/gif → forbidden wins
  assert(shouldConvertToWebp("weird.png", "image/gif", 500000) === false, "ext png + mime gif → false");

  console.log("\n── toWebpFilename / toWebpUrl ──");
  assert(toWebpFilename("1783_foto.JPG") === "1783_foto.webp", "toWebpFilename uppercase ext");
  assert(toWebpUrl("/uploads/a.b.jpg") === "/uploads/a.b.webp", "toWebpUrl path lokal");
  assert(
    toWebpUrl("https://x.supabase.co/storage/v1/object/public/media/uploads/foto.png") ===
      "https://x.supabase.co/storage/v1/object/public/media/uploads/foto.webp",
    "toWebpUrl URL supabase",
  );
  assert(toWebpUrl("/uploads/foto.jpg?w=100") === "/uploads/foto.webp?w=100", "toWebpUrl dengan query string");

  console.log("\n── convertImageToWebp (file nyata) ──");
  if (existsSync(BACKUP)) {
    const testFiles = readdirSync(BACKUP).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).slice(0, 3);
    for (const f of testFiles) {
      const buf = readFileSync(path.join(BACKUP, f));
      const t0 = Date.now();
      const result = await convertImageToWebp(buf);
      const ms = Date.now() - t0;
      assert(
        result.buffer.length < buf.length && result.width > 0 && result.height > 0,
        `${f}: ${(buf.length / 1024).toFixed(0)}KB → ${(result.buffer.length / 1024).toFixed(0)}KB ` +
          `(${((1 - result.buffer.length / buf.length) * 100).toFixed(0)}% hemat, ${result.width}x${result.height}, ${ms}ms)`,
      );
      // Verifikasi output benar-benar WebP (magic bytes RIFF....WEBP)
      const magic = result.buffer.slice(0, 4).toString("ascii") === "RIFF" &&
        result.buffer.slice(8, 12).toString("ascii") === "WEBP";
      assert(magic, `${f}: magic bytes WebP valid`);
    }
  } else {
    console.log("  (skip — tidak ada backup file)");
  }

  console.log(`\n══════ HASIL: ${pass} pass, ${fail} fail ══════`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
