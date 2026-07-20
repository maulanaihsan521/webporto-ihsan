import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { AdminDashboardClient } from "@/components/admin/dashboard-client";

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
    db.marketArticle.count(),
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
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  // Build all 7 day ranges upfront
  const dayRanges: { start: Date; end: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
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
