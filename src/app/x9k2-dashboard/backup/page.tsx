import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { BackupManager } from "./backup-manager";

export default async function AdminBackupPage() {
  const session = await requireAdminSession();

  const counts = {
    users: await db.user.count(),
    categories: await db.category.count(),
    tags: await db.tag.count(),
    posts: await db.post.count(),
    comments: await db.comment.count(),
    portfolios: await db.portfolio.count(),
    portfolioImages: await db.portfolioImage.count(),
    galleries: await db.gallery.count(),
    certificates: await db.certificate.count(),
    experiences: await db.experience.count(),
    educations: await db.education.count(),
    skills: await db.skill.count(),
    services: await db.service.count(),
    testimonials: await db.testimonial.count(),
    faqs: await db.faq.count(),
    messages: await db.message.count(),
    newsletters: await db.newsletter.count(),
    marketArticles: await db.marketArticle.count(),
    watchlists: await db.watchlist.count(),
    portfolioHoldings: await db.portfolioHolding.count(),
    media: await db.media.count(),
    settings: await db.setting.count(),
    activityLogs: await db.activityLog.count(),
    visitors: await db.visitor.count(),
    visitorCounts: await db.visitorCount.count(),
  };

  return <BackupManager counts={counts} currentRole={session.role} />;
}
