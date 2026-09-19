// Galeri 3 portofolio kosong — pakai simple query protocol (valueset inline) agar bebas isu pgbouncer
const { getConnection } = require("./db-conn");

const client = getConnection();
const IDS = ["cms39bnbs0002ji048u62o74l", "cmrc79i7f001zp209bqr8spyq", "cms1lkr6s000eli04gz7ui7op"];

(async () => {
  await client.connect();
  const idList = IDS.map((id) => `'${id}'`).join(",");
  const g = await client.query(
    `SELECT * FROM "PortfolioImage" WHERE "portfolioId" IN (${idList})`
  );
  console.log("=== GALLERY ===", g.rows.length);
  for (const img of g.rows) console.log(JSON.stringify(img));
  await client.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
