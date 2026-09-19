/** Task 9 cleanup: hapus test user & media record sisa test E2E (file storage dibiarkan, bucket publik) */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const delUser = await db.user.deleteMany({ where: { email: "task9-e2e@test.local" } });
console.log("test user dihapus:", delUser.count);

// Hapus media record dari file upload test E2E (nama file task9-test-service-photo)
const medias = await db.media.findMany({
  where: { OR: [{ name: { contains: "task9-test-service-photo" } }] },
});
for (const m of medias) {
  console.log("hapus media record:", m.name, m.url.slice(-40));
}
const delMedia = await db.media.deleteMany({
  where: { name: { contains: "task9-test-service-photo" } },
});
console.log("media record test dihapus:", delMedia.count);

// Pastikan semua service kembali ke foto default
const svcs = await db.service.findMany({ orderBy: { order: "asc" } });
const bad = svcs.filter((s) => !s.image);
console.log(`service image: ${svcs.length - bad.length}/${svcs.length} terisi`, bad.length ? `(tanpa foto: ${bad.map((b) => b.slug).join(", ")})` : "");
db.$disconnect();
