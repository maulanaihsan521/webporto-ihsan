// Apply add documentUrl column to Supabase Post table (idempotent)
const { getConnection } = require("./db-conn");

const client = getConnection();

(async () => {
  await client.connect();
  await client.query(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "documentUrl" TEXT;`);
  const check = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Post' AND column_name = 'documentUrl'
  `);
  console.log("Column check:", check.rows.length === 1 ? "OK — documentUrl exists" : "FAILED");
  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
