import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { AnalyticsManager } from "./analytics-manager";

export default async function AdminAnalyticsPage() {
  await requireAdminSession();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [totalVisitors, todayVisitors, weekVisitors] = await Promise.all([
    db.visitor.count(),
    db.visitor.count({ where: { createdAt: { gte: todayStart } } }),
    db.visitor.count({ where: { createdAt: { gte: weekStart } } }),
  ]);

  // Daily trend last 30 days
  const daily: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = await db.visitor.count({ where: { createdAt: { gte: d, lt: next } } });
    daily.push({ date: d.toISOString(), count });
  }

  // By device
  const byDeviceRaw = await db.visitor.groupBy({
    by: ["device"],
    _count: true,
    orderBy: { _count: { device: "desc" } },
  });
  const byDevice = byDeviceRaw.map((d) => ({ name: d.device || "UNKNOWN", value: d._count }));

  // By browser
  const byBrowserRaw = await db.visitor.groupBy({
    by: ["browser"],
    _count: true,
    orderBy: { _count: { browser: "desc" } },
  });
  const byBrowser = byBrowserRaw.map((b) => ({ name: b.browser || "OTHER", value: b._count }));

  // Top paths
  const byPathRaw = await db.visitor.groupBy({
    by: ["path"],
    _count: true,
    orderBy: { _count: { path: "desc" } },
    take: 10,
  });
  const byPath = byPathRaw.map((p) => ({ name: p.path, value: p._count }));

  const stats = {
    total: totalVisitors,
    today: todayVisitors,
    week: weekVisitors,
    daily,
    byDevice,
    byBrowser,
    byPath,
  };

  return <AnalyticsManager stats={stats} />;
}
