import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { MarketManager } from "./market-manager";

export default async function AdminMarketPage() {
  await requireAdminSession();
  // 2026-09-19: artikel market dipindahkan ke Blog (tabel Post, kategori
  // "Financial Market") — CRUD artikel lewat menu Blog (blog-manager).
  // Halaman admin market kini khusus mengelola Watchlist & Holdings
  // (data tool halaman /financial-market).
  const [watchlist, holdings] = await Promise.all([
    db.watchlist.findMany({ orderBy: { createdAt: "asc" } }),
    db.portfolioHolding.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <MarketManager
      watchlist={JSON.parse(JSON.stringify(watchlist))}
      holdings={JSON.parse(JSON.stringify(holdings))}
    />
  );
}
