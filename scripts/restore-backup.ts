import { db } from "/home/z/my-project/src/lib/db";
import { clearSettingsCache } from "/home/z/my-project/src/lib/settings";
import fs from "fs";

async function restore() {
  const raw = fs.readFileSync("/home/z/my-project/upload/backup-2026-07-08.json", "utf8");
  const data = JSON.parse(raw);

  console.log("📦 Restoring backup from:", data._meta.exportedAt);

  const d = (s: string | null | undefined) => (s ? new Date(s) : null);

  // 1. Settings
  console.log("→ Restoring settings...");
  await db.setting.deleteMany({});
  for (const s of data.settings) {
    await db.setting.create({ data: { key: s.key, value: s.value, type: s.type, group: s.group } });
  }
  clearSettingsCache();
  console.log("  ✓", data.settings.length, "settings");

  // 2. Categories
  console.log("→ Restoring categories...");
  await db.category.deleteMany({});
  for (const c of data.categories) {
    await db.category.create({
      data: { id: c.id, name: c.name, slug: c.slug, type: c.type, description: c.description, color: c.color, createdAt: d(c.createdAt), updatedAt: d(c.updatedAt) },
    });
  }
  console.log("  ✓", data.categories.length, "categories");

  // 3. Tags
  console.log("→ Restoring tags...");
  await db.tag.deleteMany({});
  for (const t of data.tags) {
    await db.tag.create({ data: { id: t.id, name: t.name, slug: t.slug, createdAt: d(t.createdAt) } });
  }
  console.log("  ✓", data.tags.length, "tags");

  // 4. Users — skip (backup doesn't include passwords, keep existing)
  console.log("→ Skipping users (backup excludes passwords, keeping existing admin)");

  // 5. Posts
  console.log("→ Restoring posts...");
  await db.post.deleteMany({});
  for (const p of data.posts) {
    const tagIds = p.tags?.map((t: any) => t.id) || [];
    await db.post.create({
      data: {
        id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
        coverImage: p.coverImage, published: p.published, featured: p.featured,
        viewCount: p.viewCount, metaTitle: p.metaTitle, metaDescription: p.metaDescription,
        metaKeywords: p.metaKeywords, canonical: p.canonical, ogImage: p.ogImage,
        readingTime: p.readingTime, authorId: p.authorId, categoryId: p.categoryId || null,
        publishedAt: d(p.publishedAt), createdAt: d(p.createdAt), updatedAt: d(p.updatedAt),
        tags: tagIds.length > 0 ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
    });
  }
  console.log("  ✓", data.posts.length, "posts");

  // 6. Comments
  console.log("→ Restoring comments...");
  await db.comment.deleteMany({});
  for (const c of data.comments) {
    await db.comment.create({
      data: { id: c.id, name: c.name, email: c.email, content: c.content, parentId: c.parentId, approved: c.approved, postId: c.postId, userId: c.userId || undefined, createdAt: d(c.createdAt), updatedAt: d(c.updatedAt) },
    });
  }
  console.log("  ✓", data.comments.length, "comments");

  // 7. Portfolios
  console.log("→ Restoring portfolios...");
  await db.portfolio.deleteMany({});
  for (const p of data.portfolios) {
    await db.portfolio.create({
      data: {
        id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, description: p.description,
        thumbnail: p.thumbnail, banner: p.banner, videoUrl: p.videoUrl, role: p.role, client: p.client,
        status: p.status, startDate: d(p.startDate), endDate: d(p.endDate), projectDate: d(p.projectDate),
        technologies: p.technologies, githubUrl: p.githubUrl, demoUrl: p.demoUrl, figmaUrl: p.figmaUrl,
        youtubeUrl: p.youtubeUrl, downloadUrl: p.downloadUrl, featured: p.featured, viewCount: p.viewCount,
        metaTitle: p.metaTitle, metaDescription: p.metaDescription, ogImage: p.ogImage,
        categoryId: p.categoryId || null, createdAt: d(p.createdAt), updatedAt: d(p.updatedAt),
      },
    });
  }
  console.log("  ✓", data.portfolios.length, "portfolios");

  // 8. Galleries
  console.log("→ Restoring galleries...");
  await db.gallery.deleteMany({});
  for (const g of data.galleries) {
    await db.gallery.create({
      data: { id: g.id, title: g.title, slug: g.slug, description: g.description, url: g.url, type: g.type, thumbnail: g.thumbnail, album: g.album, featured: g.featured, categoryId: g.categoryId || null, createdAt: d(g.createdAt), updatedAt: d(g.updatedAt) },
    });
  }
  console.log("  ✓", data.galleries.length, "galleries");

  // 9. Certificates
  console.log("→ Restoring certificates...");
  await db.certificate.deleteMany({});
  for (const c of data.certificates) {
    await db.certificate.create({
      data: { id: c.id, title: c.title, slug: c.slug, description: c.description, issuer: c.issuer, issueDate: d(c.issueDate), expiryDate: d(c.expiryDate), credentialId: c.credentialId, credentialUrl: c.credentialUrl, fileUrl: c.fileUrl, imageUrl: c.imageUrl, featured: c.featured, categoryId: c.categoryId || null, createdAt: d(c.createdAt), updatedAt: d(c.updatedAt) },
    });
  }
  console.log("  ✓", data.certificates.length, "certificates");

  // 10. Experiences
  console.log("→ Restoring experiences...");
  await db.experience.deleteMany({});
  for (const e of data.experiences) {
    await db.experience.create({
      data: { id: e.id, company: e.company, logo: e.logo, position: e.position, location: e.location, type: e.type, startDate: d(e.startDate), endDate: d(e.endDate), current: e.current, description: e.description, technologies: e.technologies, order: e.order, createdAt: d(e.createdAt), updatedAt: d(e.updatedAt) },
    });
  }
  console.log("  ✓", data.experiences.length, "experiences");

  // 11. Educations
  console.log("→ Restoring educations...");
  await db.education.deleteMany({});
  for (const e of data.educations) {
    await db.education.create({
      data: { id: e.id, institution: e.institution, logo: e.logo, degree: e.degree, field: e.field, grade: e.grade, startDate: d(e.startDate), endDate: d(e.endDate), current: e.current, description: e.description, achievements: e.achievements, organization: e.organization, order: e.order, createdAt: d(e.createdAt), updatedAt: d(e.updatedAt) },
    });
  }
  console.log("  ✓", data.educations.length, "educations");

  // 12. Skills
  console.log("→ Restoring skills...");
  await db.skill.deleteMany({});
  for (const s of data.skills) {
    await db.skill.create({
      data: { id: s.id, name: s.name, slug: s.slug, category: s.category, percentage: s.percentage, level: s.level, icon: s.icon, description: s.description, color: s.color, featured: s.featured, order: s.order, createdAt: d(s.createdAt), updatedAt: d(s.updatedAt) },
    });
  }
  console.log("  ✓", data.skills.length, "skills");

  // 13. Services
  console.log("→ Restoring services...");
  await db.service.deleteMany({});
  for (const s of data.services) {
    await db.service.create({
      data: { id: s.id, title: s.title, slug: s.slug, description: s.description, icon: s.icon, color: s.color, features: s.features, order: s.order, createdAt: d(s.createdAt), updatedAt: d(s.updatedAt) },
    });
  }
  console.log("  ✓", data.services.length, "services");

  // 14. Testimonials
  console.log("→ Restoring testimonials...");
  await db.testimonial.deleteMany({});
  for (const t of data.testimonials) {
    await db.testimonial.create({
      data: { id: t.id, name: t.name, position: t.position, company: t.company, avatar: t.avatar, rating: t.rating, content: t.content, featured: t.featured, order: t.order, createdAt: d(t.createdAt), updatedAt: d(t.updatedAt) },
    });
  }
  console.log("  ✓", data.testimonials.length, "testimonials");

  // 15. FAQs
  console.log("→ Restoring FAQs...");
  await db.faq.deleteMany({});
  for (const f of data.faqs) {
    await db.faq.create({
      data: { id: f.id, question: f.question, answer: f.answer, category: f.category, order: f.order, published: f.published, createdAt: d(f.createdAt), updatedAt: d(f.updatedAt) },
    });
  }
  console.log("  ✓", data.faqs.length, "FAQs");

  // 16. Messages
  console.log("→ Restoring messages...");
  await db.message.deleteMany({});
  for (const m of data.messages) {
    await db.message.create({
      data: { id: m.id, name: m.name, email: m.email, phone: m.phone, subject: m.subject, message: m.message, read: m.read, starred: m.starred, replied: m.replied, reply: m.reply, replierId: m.replierId || null, createdAt: d(m.createdAt), updatedAt: d(m.updatedAt) },
    });
  }
  console.log("  ✓", data.messages.length, "messages");

  // 17. Newsletters
  console.log("→ Restoring newsletters...");
  await db.newsletter.deleteMany({});
  for (const n of data.newsletters) {
    await db.newsletter.create({ data: { id: n.id, email: n.email, active: n.active, createdAt: d(n.createdAt), updatedAt: d(n.updatedAt) } });
  }
  console.log("  ✓", data.newsletters.length, "newsletters");

  // 18. Market Articles
  console.log("→ Restoring market articles...");
  await db.marketArticle.deleteMany({});
  for (const a of data.marketArticles) {
    await db.marketArticle.create({
      data: { id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content, type: a.type, instrument: a.instrument, coverImage: a.coverImage, published: a.published, featured: a.featured, viewCount: a.viewCount, metaTitle: a.metaTitle, metaDescription: a.metaDescription, createdAt: d(a.createdAt), updatedAt: d(a.updatedAt), publishedAt: d(a.publishedAt) },
    });
  }
  console.log("  ✓", data.marketArticles.length, "market articles");

  // 19. Watchlists
  console.log("→ Restoring watchlists...");
  await db.watchlist.deleteMany({});
  for (const w of data.watchlists) {
    await db.watchlist.create({ data: { id: w.id, symbol: w.symbol, name: w.name, type: w.type, notes: w.notes, targetPrice: w.targetPrice, createdAt: d(w.createdAt), updatedAt: d(w.updatedAt) } });
  }
  console.log("  ✓", data.watchlists.length, "watchlists");

  // 20. Portfolio Holdings
  console.log("→ Restoring portfolio holdings...");
  await db.portfolioHolding.deleteMany({});
  for (const h of data.portfolioHoldings) {
    await db.portfolioHolding.create({ data: { id: h.id, symbol: h.symbol, name: h.name, type: h.type, quantity: h.quantity, buyPrice: h.buyPrice, currentPrice: h.currentPrice, notes: h.notes, createdAt: d(h.createdAt), updatedAt: d(h.updatedAt) } });
  }
  console.log("  ✓", data.portfolioHoldings.length, "portfolio holdings");

  // 21. Media
  console.log("→ Restoring media...");
  await db.media.deleteMany({});
  for (const m of data.media) {
    await db.media.create({ data: { id: m.id, name: m.name, url: m.url, type: m.type, mimeType: m.mimeType, size: m.size, folder: m.folder, width: m.width, height: m.height, alt: m.alt, createdAt: d(m.createdAt), updatedAt: d(m.updatedAt) } });
  }
  console.log("  ✓", data.media.length, "media files");

  // 22. Activity Logs
  console.log("→ Restoring activity logs...");
  await db.activityLog.deleteMany({});
  for (const a of data.activityLogs) {
    await db.activityLog.create({ data: { id: a.id, action: a.action, entity: a.entity, entityId: a.entityId, detail: a.detail, userId: a.userId || null, ipAddress: a.ipAddress, createdAt: d(a.createdAt) } });
  }
  console.log("  ✓", data.activityLogs.length, "activity logs");

  // 23. Visitors
  console.log("→ Restoring visitors...");
  await db.visitor.deleteMany({});
  for (const v of data.visitors) {
    await db.visitor.create({ data: { id: v.id, path: v.path, referrer: v.referrer, country: v.country, city: v.city, device: v.device, browser: v.browser, sessionId: v.sessionId, createdAt: d(v.createdAt) } });
  }
  console.log("  ✓", data.visitors.length, "visitors");

  // 24. Visitor Counts
  console.log("→ Restoring visitor counts...");
  await db.visitorCount.deleteMany({});
  for (const v of data.visitorCounts) {
    await db.visitorCount.create({ data: { id: v.id, date: d(v.date), count: v.count, unique: v.unique, path: v.path } });
  }
  console.log("  ✓", data.visitorCounts.length, "visitor counts");

  console.log("\n✅ Backup restored successfully!");
  await db.$disconnect();
}

restore().catch((e) => {
  console.error("❌ Restore failed:", e);
  process.exit(1);
});
