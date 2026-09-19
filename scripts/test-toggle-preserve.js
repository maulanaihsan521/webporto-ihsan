// End-to-end test: toggle-publish PUT must NOT wipe fields (data-loss fix)
// 1. Set known fields on published post (documentUrl + metaTitle + coverImage + excerpt)
// 2. Send PUT with ONLY { published } (simulating toggle click)
// 3. Verify fields survive
const { getConnection } = require("./db-conn");
const jwt = require("jsonwebtoken");

// Secret harus sama dengan JWT_SECRET yang dipakai dev server (pass via env TEST_JWT_SECRET)
const TEST_SECRET = process.env.TEST_JWT_SECRET || "";

async function main() {
  const client = getConnection();
  await client.connect();

  // Get admin user + published post
  const user = await client.query(`SELECT id, email, name, role FROM "User" WHERE role = 'ADMIN' LIMIT 1`);
  const post = await client.query(`SELECT id, title FROM "Post" WHERE published = true LIMIT 1`);
  if (!user.rows.length || !post.rows.length) {
    console.log("SKIP: no admin user or published post");
    await client.end();
    return;
  }
  const admin = user.rows[0];
  const postId = post.rows[0].id;
  console.log("Admin:", admin.email, "| Post:", post.rows[0].title.slice(0, 50));

  // Backup current values
  const backup = await client.query(
    `SELECT "documentUrl", "metaTitle", "excerpt", "coverImage", "categoryId" FROM "Post" WHERE id = $1`,
    [postId]
  );
  const old = backup.rows[0];

  // Set test values
  await client.query(
    `UPDATE "Post" SET "documentUrl" = 'https://drive.google.com/file/d/TEST/view', "metaTitle" = 'TEST-META-TITLE' WHERE id = $1`,
    [postId]
  );

  // Mint JWT
  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role, image: null },
    TEST_SECRET,
    { expiresIn: "1h" }
  );

  // Send toggle-publish PUT (only { published: true })
  const res = await fetch(`http://localhost:3000/api/admin/blog/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: `admin_token=${token}`,
      Origin: "http://localhost:3000", // CSRF check: origin must match request host
    },
    body: JSON.stringify({ published: true }),
  });
  const json = await res.json();
  console.log("PUT status:", res.status);

  // Verify fields preserved
  const after = await client.query(
    `SELECT "documentUrl", "metaTitle", "excerpt", "coverImage", "categoryId", published FROM "Post" WHERE id = $1`,
    [postId]
  );
  const now = after.rows[0];
  const checks = [
    ["documentUrl", now.documentUrl === "https://drive.google.com/file/d/TEST/view"],
    ["metaTitle", now.metaTitle === "TEST-META-TITLE"],
    ["excerpt", (now.excerpt ?? null) === (old.excerpt ?? null)],
    ["coverImage", (now.coverImage ?? null) === (old.coverImage ?? null)],
    ["categoryId", (now.categoryId ?? null) === (old.categoryId ?? null)],
    ["published", now.published === true],
  ];
  let pass = 0;
  for (const [name, ok] of checks) {
    if (ok) pass++;
    console.log(`${ok ? "✓" : "✗ FAIL"} ${name} preserved: ${JSON.stringify(now[name])}`);
  }

  // Restore original values
  await client.query(
    `UPDATE "Post" SET "documentUrl" = $1, "metaTitle" = $2 WHERE id = $3`,
    [old.documentUrl, old.metaTitle, postId]
  );
  console.log("\n(restored original values)");
  console.log(`${pass}/${checks.length} checks passed`);
  await client.end();
  process.exit(pass === checks.length ? 0 : 1);
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
