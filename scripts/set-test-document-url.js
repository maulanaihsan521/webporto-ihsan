// Set documentUrl on the published post for testing (Google Drive example)
const { getConnection } = require("./db-conn");

const TEST_URL = process.argv[2] || null; // pass URL or omit to clear

const client = getConnection();

(async () => {
  await client.connect();
  if (TEST_URL) {
    const r = await client.query(
      `UPDATE "Post" SET "documentUrl" = $1 WHERE published = true RETURNING title, "documentUrl"`,
      [TEST_URL]
    );
    console.log("SET:", r.rows[0]?.title, "→", r.rows[0]?.documentUrl);
  } else {
    const r = await client.query(
      `UPDATE "Post" SET "documentUrl" = NULL WHERE published = true RETURNING title`
    );
    console.log("CLEARED:", r.rows[0]?.title);
  }
  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
