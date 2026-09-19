/** Review data: experiences, certificates, cert categories */
const { getConnection } = require("./db-conn");

async function main() {
  const client = await getConnection();
  await client.connect();
  try {
    const exps = await client.query(
      'SELECT position, company, type, "current", "startDate", "endDate", location, technologies FROM "Experience" ORDER BY "order" ASC',
    );
    console.log("=== EXPERIENCES (" + exps.rows.length + ") ===");
    exps.rows.forEach((e) => console.log(JSON.stringify(e)));

    const certs = await client.query(
      'SELECT title, issuer, "categoryId", "imageUrl", "credentialUrl", "credentialId", featured FROM "Certificate"',
    );
    console.log("=== CERTIFICATES (" + certs.rows.length + ") ===");
    certs.rows.forEach((c) => console.log(JSON.stringify(c)));

    const cats = await client.query(
      "SELECT name, slug FROM \"Category\" WHERE type = 'CERTIFICATE'",
    );
    console.log("=== CERT CATEGORIES (" + cats.rows.length + ") ===");
    cats.rows.forEach((c) => console.log(JSON.stringify(c)));

    const settings = await client.query(
      'SELECT key, value FROM "Setting" WHERE key IN (\x27owner_email\x27,\x27owner_phone\x27,\x27owner_location\x27,\x27social_whatsapp\x27,\x27map_embed\x27,\x27budget_estimator\x27)',
    );
    console.log("=== CONTACT SETTINGS ===");
    settings.rows.forEach((s) => console.log(JSON.stringify(s)));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
