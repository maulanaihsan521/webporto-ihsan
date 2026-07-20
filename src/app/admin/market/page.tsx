import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { MarketManager } from "./market-manager";

export default async function AdminMarketPage() {
  await requireAdminSession();
  const [articles, watchlist, holdings] = await Promise.all([
    db.marketArticle.findMany({ orderBy: { createdAt: "desc" } }),
    db.watchlist.findMany({ orderBy: { createdAt: "asc" } }),
    db.portfolioHolding.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <MarketManager
      articles={JSON.parse(JSON.stringify(articles))}
      watchlist={JSON.parse(JSON.stringify(watchlist))}
      holdings={JSON.parse(JSON.stringify(holdings))}
    />
  );
}
