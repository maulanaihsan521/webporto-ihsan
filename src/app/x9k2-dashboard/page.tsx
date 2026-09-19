import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";
import { startOfJakartaDay } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  const [
    portfolioCount, postCount, galleryCount, certificateCount,
    messageCount, unreadCount, testimonialCount, skillCount,
    experienceCount, educationCount, serviceCount, faqCount,
    userCount, mediaCount, subscriberCount, marketArticleCount,
    recentMessages, recentActivity, visitorStats, topPages,
  ] = await Promise.all([
    db.portfolio.count(),
    db.post.count(),
    db.gallery.count(),
    db.certificate.count(),
    db.message.count(),
    db.message.count({ where: { read: false } }),
    db.testimonial.count(),
    db.skill.count(),
    db.experience.count(),
    db.education.count(),
    db.service.count(),
    db.faq.count(),
    db.user.count(),
    db.media.count(),
    db.newsletter.count({ where: { active: true } }),
    // Artikel market kini = post blog kategori Financial Market (migrasi
    // 2026-09-19) — stat dihitung dari Post, bukan tabel MarketArticle legacy.
    db.post.count({ where: { category: { slug: "financial-market" } } }),
    db.message.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    db.activityLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, image: true } } } }),
    getVisitorStats(),
    getTopPages(),
  ]);

  const stats = {
    portfolio: portfolioCount,
    posts: postCount,
    gallery: galleryCount,
    certificates: certificateCount,
    messages: messageCount,
    unread: unreadCount,
    testimonials: testimonialCount,
    skills: skillCount,
    experiences: experienceCount,
    educations: educationCount,
    services: serviceCount,
    faqs: faqCount,
    users: userCount,
    media: mediaCount,
    subscribers: subscriberCount,
    marketArticles: marketArticleCount,
  };

  return (
    <AdminDashboardClient
      stats={stats}
      recentMessages={JSON.parse(JSON.stringify(recentMessages))}
      recentActivity={JSON.parse(JSON.stringify(recentActivity))}
      visitorStats={visitorStats}
      topPages={topPages}
      userName={session.name || "Admin"}
    />
  );
}

async function getVisitorStats() {
  // FIX 2026-09-17 (waktu admin Indonesia): batas hari mengikuti midnight WIB,
  // bukan midnight UTC server — statistik "hari ini"/tren 7 hari kini
  // sesuai kalender yang dilihat admin Indonesia.
  const todayStart = startOfJakartaDay(0);
  const yesterdayStart = startOfJakartaDay(1);
  const weekStart = startOfJakartaDay(7);

  // Build all 7 day ranges upfront (midnight WIB ke midnight WIB berikutnya)
  const dayRanges: { start: Date; end: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfJakartaDay(i);
    const next = startOfJakartaDay(i - 1); // i=0 → hari ini; i-1=-1 → besok
    dayRanges.push({ start: d, end: next });
  }

  // Run ALL queries in parallel (4 summary + 7 daily = 11 queries at once)
  const [today, yesterday, week, total, ...dayCounts] = await Promise.all([
    db.visitor.count({ where: { createdAt: { gte: todayStart } } }),
    db.visitor.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    db.visitor.count({ where: { createdAt: { gte: weekStart } } }),
    db.visitor.count(),
    ...dayRanges.map((r) => db.visitor.count({ where: { createdAt: { gte: r.start, lt: r.end } } })),
  ]);

  const days: { date: string; count: number }[] = dayRanges.map((r, i) => ({
    date: r.start.toISOString(),
    count: dayCounts[i],
  }));

  const change = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : today > 0 ? 100 : 0;

  return { today, yesterday, week, total, days, change };
}

async function getTopPages() {
  const pages = await db.visitor.groupBy({
    by: ["path"],
    _count: true,
    orderBy: { _count: { path: "desc" } },
    take: 8,
  });
  return pages.map((p) => ({ path: p.path, count: p._count }));
}
