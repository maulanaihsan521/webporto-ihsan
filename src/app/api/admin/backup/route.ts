import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    users, categories, tags, posts, comments, portfolios, portfolioImages,
    galleries, certificates, experiences, educations, skills, services,
    testimonials, faqs, messages, newsletters, marketArticles, watchlists,
    portfolioHoldings, media, settings, activityLogs, visitors, visitorCounts,
  ] = await Promise.all([
    db.user.findMany({ select: { id: true, email: true, name: true, role: true, image: true, bio: true, createdAt: true, updatedAt: true } }),
    db.category.findMany(),
    db.tag.findMany(),
    db.post.findMany({ include: { tags: true, category: true } }),
    db.comment.findMany(),
    db.portfolio.findMany({ include: { images: true, category: true } }),
    db.portfolioImage.findMany(),
    db.gallery.findMany({ include: { category: true } }),
    db.certificate.findMany({ include: { category: true } }),
    db.experience.findMany(),
    db.education.findMany(),
    db.skill.findMany(),
    db.service.findMany(),
    db.testimonial.findMany(),
    db.faq.findMany(),
    db.message.findMany(),
    db.newsletter.findMany(),
    db.marketArticle.findMany(),
    db.watchlist.findMany(),
    db.portfolioHolding.findMany(),
    db.media.findMany(),
    db.setting.findMany(),
    db.activityLog.findMany({ include: { user: { select: { name: true, image: true } } } }),
    db.visitor.findMany(),
    db.visitorCount.findMany(),
  ]);

  // Convert dates to ISO strings for JSON serialization
  const serialize = (rows: any[]) =>
    rows.map((r: any) => {
      const out: any = Array.isArray(r) ? [...r] : { ...r };
      for (const k of Object.keys(out)) {
        const v = out[k];
        if (v instanceof Date) out[k] = v.toISOString();
        else if (Array.isArray(v)) out[k] = v.map((x) => (x instanceof Date ? x.toISOString() : x));
      }
      return out;
    });

  const data = {
    _meta: {
      exportedAt: new Date().toISOString(),
      exportedBy: session.email,
      version: "1.0",
      counts: {
        users: users.length,
        categories: categories.length,
        tags: tags.length,
        posts: posts.length,
        comments: comments.length,
        portfolios: portfolios.length,
        portfolioImages: portfolioImages.length,
        galleries: galleries.length,
        certificates: certificates.length,
        experiences: experiences.length,
        educations: educations.length,
        skills: skills.length,
        services: services.length,
        testimonials: testimonials.length,
        faqs: faqs.length,
        messages: messages.length,
        newsletters: newsletters.length,
        marketArticles: marketArticles.length,
        watchlists: watchlists.length,
        portfolioHoldings: portfolioHoldings.length,
        media: media.length,
        settings: settings.length,
        activityLogs: activityLogs.length,
        visitors: visitors.length,
        visitorCounts: visitorCounts.length,
      },
    },
    users: serialize(users),
    categories: serialize(categories),
    tags: serialize(tags),
    posts: serialize(posts),
    comments: serialize(comments),
    portfolios: serialize(portfolios),
    portfolioImages: serialize(portfolioImages),
    galleries: serialize(galleries),
    certificates: serialize(certificates),
    experiences: serialize(experiences),
    educations: serialize(educations),
    skills: serialize(skills),
    services: serialize(services),
    testimonials: serialize(testimonials),
    faqs: serialize(faqs),
    messages: serialize(messages),
    newsletters: serialize(newsletters),
    marketArticles: serialize(marketArticles),
    watchlists: serialize(watchlists),
    portfolioHoldings: serialize(portfolioHoldings),
    media: serialize(media),
    settings: serialize(settings),
    activityLogs: serialize(activityLogs),
    visitors: serialize(visitors),
    visitorCounts: serialize(visitorCounts),
  };

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
