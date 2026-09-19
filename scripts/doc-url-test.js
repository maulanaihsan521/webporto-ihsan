// Functional test: document URL scenarios + API validation
const { getConnection } = require("./db-conn");

async function setDocUrl(url) {
  const client = getConnection();
  await client.connect();
  await client.query(`UPDATE "Post" SET "documentUrl" = $1 WHERE published = true`, [url]);
  await client.end();
}

(async () => {
  const mode = process.argv[2];
  if (mode === "set") {
    await setDocUrl(process.argv[3]);
    console.log("SET →", process.argv[3]);
  } else if (mode === "clear") {
    await setDocUrl(null);
    console.log("CLEARED");
  }
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
