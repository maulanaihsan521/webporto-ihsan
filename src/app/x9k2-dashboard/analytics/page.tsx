import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { AnalyticsManager } from "./analytics-manager";
import { startOfJakartaDay } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  await requireAdminSession();

  // FIX 2026-09-17 (waktu admin Indonesia): batas hari pakai midnight WIB,
  // bukan midnight UTC server — tren harian & statistik "hari ini" kini
  // mengikuti kalender Indonesia.
  const todayStart = startOfJakartaDay(0);
  const weekStart = startOfJakartaDay(7);
  const thirtyDaysAgo = startOfJakartaDay(29);

  const [totalVisitors, todayVisitors, weekVisitors] = await Promise.all([
    db.visitor.count(),
    db.visitor.count({ where: { createdAt: { gte: todayStart } } }),
    db.visitor.count({ where: { createdAt: { gte: weekStart } } }),
  ]);

  // Daily trend last 30 days (bucket midnight WIB)
  const daily: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = startOfJakartaDay(i);
    const next = startOfJakartaDay(i - 1);
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
