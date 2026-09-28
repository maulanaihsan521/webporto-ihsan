import Link from "next/link";
import { ArrowRight, Download, Mail, Github, Linkedin, Instagram, Facebook, Youtube, Star, Calendar, Award, TrendingUp, Briefcase, Users, FileText, Clock, Quote, MessageCircle, Eye } from "lucide-react";
import { getHomeData } from "@/lib/queries";
import { ServiceCard, ServiceCtaCard } from "@/components/service-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { NewsletterForm } from "@/components/newsletter-form";
import { formatDateShort, truncate, stripHtml, getInitials } from "@/lib/utils";
import { isValidSocialUrl } from "@/lib/social-utils";
import { isMarketEnabled } from "@/lib/settings";

import { OptimizedImage } from "@/components/optimized-image";
export default async function HomePage() {
  const { settings, featuredPortfolios, latestPosts, latestCerts, latestGalleries, services, testimonials, skills, featuredMarketArticles } = await getHomeData();

  // Toggle market off (settings admin) → artikel market tidak tampil di home
  const marketEnabled = isMarketEnabled(settings);

  // ===== "Artikel Terbaru": gabungan post blog + artikel market featured =====
  // Artikel market kini = post blog kategori "Financial Market"; yang
  // featured tampil berdampingan dengan post blog terbaru (diurut tanggal).
  // Kartu market tetap menuju /blog/[slug] — toggle market hanya menghilangkan
  // etalase market, artikelnya tetap hidup di blog.
  const latestArticles = [
    ...latestPosts.map((post) => ({
      key: post.id,
      href: `/blog/${post.slug}`,
      kind: "blog" as const,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      readingTime: post.readingTime || 3,
      typeLabel: post.category?.name ?? null,
      instrument: null as string | null,
    })),
    ...(marketEnabled ? featuredMarketArticles : []).map((a) => ({
      key: `market-${a.id}`,
      href: `/blog/${a.slug}`,
      kind: "market" as const,
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      coverImage: a.coverImage,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      readingTime:
        a.readingTime ||
        Math.max(
          1,
          Math.ceil(
            stripHtml(a.content).split(/\s+/).filter(Boolean).length / 200,
          ),
        ),
      // Konvensi tag migrasi: tag pertama = tipe, tag berikutnya = instrumen
      typeLabel: a.tags[0]?.name ?? "Market",
      instrument:
        a.tags
          .slice(1)
          .map((t) => t.name)
          .join(", ") || null,
    })),
  ]
    .sort((a, b) => {
      const da = new Date(a.publishedAt ?? a.createdAt).getTime();
      const db = new Date(b.publishedAt ?? b.createdAt).getTime();
      // tie-break: createdAt terbaru dulu
      return da !== db
        ? db - da
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);


  const stats = [
    { label: "Projects", value: Number(settings.stat_projects || 120), icon: Briefcase, suffix: "+" },
    { label: "Clients", value: Number(settings.stat_clients || 85), icon: Users, suffix: "+" },
    { label: "Certificates", value: Number(settings.stat_certificates || 25), icon: Award, suffix: "+" },
    { label: "Articles", value: Number(settings.stat_articles || 60), icon: FileText, suffix: "+" },
    { label: "Years Experience", value: Number(settings.stat_experience || 5), icon: Clock, suffix: "+" },
  ];

  const socials = [
    { icon: Github, href: settings.social_github, label: "GitHub" },
    { icon: Linkedin, href: settings.social_linkedin, label: "LinkedIn" },
    { icon: Instagram, href: settings.social_instagram, label: "Instagram" },
    { icon: Facebook, href: settings.social_facebook, label: "Facebook" },
    { icon: Youtube, href: settings.social_youtube, label: "YouTube" },
    { icon: MessageCircle, href: settings.social_whatsapp, label: "WhatsApp" },
  ].filter((s) => isValidSocialUrl(s.href));

  return (
    <div className="relative">
      {/* ===== HERO ===== */}
      {/* Section wrapper keeps the page's default light background.
          Inner hero card uses .hero-card class which is theme-aware:
          - Light mode: card follows global theme (white bg, dark text)
          - Dark mode: card uses slate #1E293B (selaras --card global, di atas bg #0F172A) */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:pt-12 sm:pb-20">

        {/* === MOBILE HERO: Horizontal split card + integrated stats bar === */}
        <div className="sm:hidden section-pad relative z-10">
          <div className="hero-card">
            {/* Top: Text (left) + Photo (right) — horizontal split */}
            <div className="relative flex">
              {/* Konten teks di kiri (solid background) */}
              <div className="relative z-10 p-5 w-1/2 min-h-[320px] flex flex-col justify-center space-y-3" style={{ background: "var(--hero-card-bg)" }}>
                {/* Status badge */}
                <div className="hero-status-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium w-fit">
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                    <span className="relative rounded-full bg-green-500 size-1.5" />
                  </span>
                  Available for freelance
                </div>

                {/* Headline — visual-only hero copy. Real H1 ada di desktop
                    version (line ~179) supaya accessibility tree dan SEO crawler
                    hanya melihat SATU H1 per page. Mobile pakai <p> dengan
                    class yang sama persis sehingga visual tidak berubah. */}
                <p className="hero-headline text-2xl leading-[1.1]">
                  <span className="block">Hi, saya</span>
                  <span className="hero-headline-accent block font-bold tracking-tight">
                    {settings.owner_name || "Maulana Ihsan Rohim"}
                  </span>
                </p>

                {/* Sub-headline */}
                <p className="text-sm font-semibold" style={{ color: "var(--hero-card-fg)", opacity: 0.8 }}>
                  Digital Creator &amp; Problem Solver
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm" className="rounded-lg h-9 px-4 shadow-md text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium group">
                    <Link href="/contact">
                      <Mail className="size-3" />
                      Hire Me
                      <ArrowRight className="size-3 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="hero-btn-outline rounded-lg h-9 px-3 text-xs font-medium">
                    <Link href="/portfolio">
                      <Briefcase className="size-3" />
                      Portfolio
                    </Link>
                  </Button>
                </div>

                {/* Social media icon buttons — mobile hero card.
                    Konsisten dengan desktop hero (style .hero-social-btn sama,
                    theme-aware), hanya ukuran lebih compact (size-8) agar muat
                    di kolom teks 50% lebar layar. Sumber: settings DB, sudah
                    difilter isValidSocialUrl → hanya yang valid yang tampil. */}
                {socials.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="hero-social-btn size-8 rounded-lg flex items-center justify-center"
                      >
                        <s.icon className="size-3.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Foto profil di kanan (50% width) */}
              <div className="relative w-1/2 overflow-hidden">
                {settings.owner_photo ? (
                   
                  <img
                    src={settings.owner_photo}
                    alt={settings.owner_name || "Profile"}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl font-bold text-primary/60">MI</span>
                  </div>
                )}
                {/* Badge Experience di pojok kanan atas foto */}
                <div className="hero-exp-badge absolute top-3 right-3 rounded-lg px-2 py-1 flex items-center gap-1">
                  <Award className="size-2.5 text-primary" />
                  <span className="text-[9px] font-bold">{Number(settings.stat_experience || 5)}+ Years</span>
                </div>
              </div>
            </div>

            {/* Bottom: Stats bar (inside the same card) */}
            <div className="hero-stats-bar relative">
              <div className="grid grid-cols-3">
                {stats.slice(0, 3).map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex items-center justify-center gap-2 px-2 py-3 ${i < 2 ? "hero-stat-divider" : ""}`}
                  >
                    <div className="hero-stat-icon-bubble size-7 rounded-md flex items-center justify-center shrink-0">
                      <s.icon className="size-3.5" />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="hero-stat-value text-sm">
                        <Counter to={s.value} suffix={s.suffix} />
                      </div>
                      <p className="hero-stat-label text-[8px]">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 border-t" style={{ borderColor: "var(--hero-card-border)" }}>
                {stats.slice(3).map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex items-center justify-center gap-2 px-2 py-3 ${i < 1 ? "hero-stat-divider" : ""}`}
                  >
                    <div className="hero-stat-icon-bubble size-7 rounded-md flex items-center justify-center shrink-0">
                      <s.icon className="size-3.5" />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="hero-stat-value text-sm">
                        <Counter to={s.value} suffix={s.suffix} />
                      </div>
                      <p className="hero-stat-label text-[8px]">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* === DESKTOP HERO: Theme-aware card with text left, photo right (diagonal cut), stats bottom === */}
        <div className="hidden sm:block section-pad relative z-10">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="hero-card relative">
                {/* Grid: text (left, 1.25fr) | photo (right, 1fr) — active from sm: (640px) */}
                <div className="relative grid sm:grid-cols-[1.25fr_1fr] items-stretch">
                  {/* ---- LEFT: Text content ---- */}
                  <div className="relative z-10 p-6 sm:p-10 xl:p-12 flex flex-col justify-center gap-4 sm:gap-5">
                    <SectionReveal>
                      <div className="hero-status-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium w-fit">
                        <span className="relative flex size-2">
                          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                          <span className="relative rounded-full bg-green-500 size-2" />
                        </span>
                        Available for freelance projects
                      </div>
                    </SectionReveal>

                    <SectionReveal delay={0.1}>
                      <h1 className="hero-headline text-4xl sm:text-5xl lg:text-6xl">
                        <span className="block">Hi, saya</span>
                        <span className="hero-headline-accent block">
                          {settings.owner_name || "Maulana Ihsan Rohim"}
                        </span>
                      </h1>
                    </SectionReveal>

                    <SectionReveal delay={0.2}>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-medium" style={{ color: "var(--hero-card-fg)", opacity: 0.9 }}>
                        Digital Creator &amp; Problem Solver
                      </div>
                    </SectionReveal>

                    <SectionReveal delay={0.3}>
                      <p className="text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: "var(--hero-card-muted)" }}>
                        Helping businesses and brands grow through digital strategy, creative content, technology, and impactful market insights.
                      </p>
                    </SectionReveal>

                    <SectionReveal delay={0.4}>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild size="lg" className="rounded-xl h-12 px-6 shadow-lg shadow-primary/30 bg-primary text-primary-foreground hover:bg-primary/90 font-medium group">
                          <Link href="/contact">
                            <Mail className="size-4" />
                            Hire Me
                            <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>

                        <Button asChild size="lg" className="hero-btn-outline rounded-xl h-12 px-6 font-medium">
                          <Link href="/portfolio">
                            <Briefcase className="size-4" />
                            Portfolio
                          </Link>
                        </Button>

                        <Button asChild size="lg" className="hero-btn-ghost rounded-xl h-12 px-6 font-medium">
                          <Link href="/contact">
                            <Download className="size-4" />
                            Download CV
                          </Link>
                        </Button>
                      </div>
                    </SectionReveal>

                    <SectionReveal delay={0.5}>
                      <div className="flex items-center gap-2">
                        {socials.map((s) => (
                          <a
                            key={s.label}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={s.label}
                            className="hero-social-btn size-11 rounded-xl flex items-center justify-center"
                          >
                            <s.icon className="size-4" />
                          </a>
                        ))}
                      </div>
                    </SectionReveal>
                  </div>

                  {/* ---- RIGHT: Profile photo with diagonal cut ---- */}
                  <div className="relative min-h-[22rem] sm:min-h-[26rem]">
                    {settings.owner_photo ? (
                       
                      <img
                        src={settings.owner_photo}
                        alt={settings.owner_name || "Profile"}
                        className="hero-photo-blend absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-8xl font-bold text-primary/60">MI</span>
                      </div>
                    )}
                    {/* Floating experience badge in top-right corner of photo */}
                    <div className="hero-exp-badge absolute top-5 right-5 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                      <Award className="size-4 text-primary" />
                      <span className="text-xs font-bold">
                        {Number(settings.stat_experience || 5)}+ Years
                      </span>
                    </div>
                  </div>
                </div>

                {/* ---- BOTTOM: Stats bar (inside the same card) ---- */}
                <div className="hero-stats-bar relative">
                  <div className="grid grid-cols-2 sm:grid-cols-5">
                    {stats.map((s, i) => (
                      <div
                        key={s.label}
                        className={`flex items-center justify-center gap-3 px-3 py-4 ${i < stats.length - 1 ? "hero-stat-divider" : ""}`}
                      >
                        <div className="hero-stat-icon-bubble size-9 sm:size-10 rounded-lg flex items-center justify-center shrink-0">
                          <s.icon className="size-4 sm:size-5" />
                        </div>
                        <div className="text-left leading-tight">
                          <div className="hero-stat-value text-lg sm:text-2xl">
                            <Counter to={s.value} suffix={s.suffix} />
                          </div>
                          <p className="hero-stat-label text-[10px] sm:text-xs">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== STATS — Horizontal Bar ===== */}
      {/* Stats bar is now integrated into the hero card above (both mobile and desktop). */}

      {/* ===== FEATURED PORTFOLIO ===== */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Proyek <span className="text-gradient">Pilihan</span></h2>
                <p className="text-muted-foreground mt-2">Hasil kerja terbaik yang telah saya selesaikan</p>
              </div>
              <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-xl">
                <Link href="/portfolio">
                  Lihat Semua <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </SectionReveal>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-6">
            {featuredPortfolios.map((p, i) => (
              <SectionReveal key={p.id} delay={i * 0.1}>
                <Link href={`/portfolio/${p.slug}`}>
                  <div className="relative group rounded-xl sm:rounded-2xl lift overflow-hidden">
                    {/* Gradient border effect */}
                    <div className="absolute -inset-0.5 bg-primary/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                    <Card className="relative group overflow-hidden rounded-xl sm:rounded-2xl h-full glass">
                      <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-primary/10">
                        {p.thumbnail ? (
                           
                          <OptimizedImage src={p.thumbnail} alt={p.title} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <Briefcase className="size-8 sm:size-16 text-primary/70 group-hover:scale-110 transition-transform duration-500" />
                          </div>
                        )}
                        {/* Gradient overlay for text legibility */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden />
                        {/* Featured badge — top-left */}
                        {p.featured && (
                          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-white shadow-md backdrop-blur">
                            <Award className="size-2.5 sm:size-3 fill-current" />
                            <span className="hidden sm:inline">Unggulan</span>
                          </div>
                        )}
                        {/* View count — bottom-left */}
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-medium text-white backdrop-blur-md">
                          <Eye className="size-2.5 sm:size-3" />
                          {p.viewCount.toLocaleString("id-ID")}
                        </div>
                        {/* Hover CTA — bottom-right (only on hover-capable devices) */}
                        <div
                          className="pointer-events-none absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 flex size-9 sm:size-10 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-lg ring-1 ring-black/5 opacity-0 translate-y-2 scale-90 transition-all duration-300 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:pointer-events-auto"
                          aria-hidden
                        >
                          <ArrowRight className="size-4" />
                        </div>
                      </div>
                      <div className="space-y-1.5 p-2.5 sm:space-y-2 sm:p-5">
                        <h3 className="line-clamp-2 text-xs font-bold leading-snug transition-colors group-hover:text-primary sm:text-base">{p.title}</h3>
                        <div className="flex items-center justify-between gap-1.5 text-[9px] text-muted-foreground sm:text-xs">
                          {p.client ? (
                            <span className="truncate font-medium text-foreground/80">{p.client}</span>
                          ) : (
                            <span className="truncate">Personal Project</span>
                          )}
                          {p.projectDate && (
                            <span className="inline-flex shrink-0 items-center gap-0.5">
                              <Calendar className="size-2.5 sm:size-3" />
                              {formatDateShort(p.projectDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Layanan <span className="text-gradient">Profesional</span></h2>
                <p className="text-muted-foreground mt-2 max-w-2xl">Solusi lengkap untuk kebutuhan digital marketing, konten visual, dan analisis pasar finansial Anda</p>
              </div>
              <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-xl">
                <Link href="/services">Lihat Semua <ArrowRight className="size-4" /></Link>
              </Button>
            </div>
          </SectionReveal>
          <div className="grid items-stretch gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <SectionReveal key={s.id} delay={(i % 3) * 0.06} className="h-full">
                <ServiceCard
                  slug={s.slug}
                  title={s.title}
                  description={s.description}
                  icon={s.icon}
                  color={s.color}
                  features={s.features}
                  image={s.image}
                  href="/services"
                />
              </SectionReveal>
            ))}
            {/* Kartu CTA penutup — script "Let's Work Together" + pill gold */}
            {services.length > 0 && (
              <SectionReveal delay={0.12} className="h-full">
                <ServiceCtaCard />
              </SectionReveal>
            )}
          </div>
        </div>
      </section>

      {/* ===== SKILLS HIGHLIGHT ===== */}
      {skills.length > 0 && (
        <section className="section-pad py-16">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Keahlian <span className="text-gradient">Utama</span></h2>
                </div>
                <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-xl">
                  <Link href="/skills">Lihat Semua <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
            </SectionReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skills.map((s, i) => (
                <SectionReveal key={s.id} delay={i * 0.06}>
                  <Card className="lift rounded-2xl p-5 glass">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">{s.name}</span>
                      <span className="text-lg font-bold text-primary">{s.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${s.percentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{s.level}</p>
                  </Card>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== LATEST ARTICLES (Blog + Featured Market) ===== */}
      {latestArticles.length > 0 && (
        <section className="section-pad py-16">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Artikel <span className="text-gradient">Terbaru</span></h2>
                </div>
                <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-xl">
                  <Link href="/blog">Lihat Semua <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
            </SectionReveal>
            <div className="grid md:grid-cols-3 gap-6">
              {latestArticles.map((post, i) => (
                <SectionReveal key={post.key} delay={i * 0.1}>
                  <Link href={post.href}>
                    <Card className="lift group rounded-2xl overflow-hidden h-full glass">
                      <div className="aspect-[16/9] bg-primary/10 relative">
                        {post.coverImage ? (
                           
                          <OptimizedImage src={post.coverImage} alt={post.title} sizes="(max-width: 640px) 100vw, 25vw" className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            {post.kind === "market" ? (
                              <TrendingUp className="size-12 text-primary/70" />
                            ) : (
                              <FileText className="size-12 text-primary/70" />
                            )}
                          </div>
                        )}
                        {/* Badge artikel market — pembeda tipe & instrumen */}
                        {post.kind === "market" && (
                          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                              <TrendingUp className="size-3" />
                              {post.typeLabel}
                            </span>
                            {post.instrument && (
                              <span className="rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] font-medium text-white backdrop-blur-md">
                                {post.instrument}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Calendar className="size-3" />
                          {post.publishedAt ? formatDateShort(post.publishedAt) : formatDateShort(post.createdAt)}
                          <span>·</span>
                          <Clock className="size-3" />
                          {post.readingTime || 3} min read
                        </div>
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt || truncate(stripHtml(post.content), 120)}</p>
                      </div>
                    </Card>
                  </Link>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
        <section className="section-pad py-16">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Apa Kata <span className="text-gradient">Klien</span>
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Kepuasan klien adalah prioritas utama. Berikut beberapa testimoni dari mereka yang telah bekerja sama dengan saya.</p>
              </div>
            </SectionReveal>
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.slice(0, 3).map((t, i) => (
                <SectionReveal key={t.id} delay={i * 0.1}>
                  <div className="rounded-2xl h-full">
                    <Card className="rounded-xl p-4 h-full glass relative overflow-hidden group">
                      <div className="absolute -top-8 -right-8 size-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
                      <Quote className="size-10 text-primary/60 absolute top-4 right-4" />
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed mb-5 relative z-10">"{t.content}"</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        <Avatar className="size-11 ring-2 ring-primary/20">
                          {t.avatar ? (
                             
                            <img src={t.avatar} alt={t.name} className="size-full rounded-full object-cover" />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{getInitials(t.name)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.position}{t.company ? ` · ${t.company}` : ""}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== GALLERY + CERTIFICATES ===== */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-10">
          {/* Latest Gallery */}
          {latestGalleries.length > 0 && (
            <SectionReveal>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Foto Terbaru</h2>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link href="/gallery">Lihat <ArrowRight className="size-3.5" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {latestGalleries.map((g, i) => {
                  const imgSrc = g.type === "VIDEO" ? g.thumbnail : (g.thumbnail || g.url);
                  return (
                    <Link key={g.id} href="/gallery" className="group relative aspect-square rounded-xl overflow-hidden bg-primary">
                      {imgSrc ? (
                         
                        <img src={imgSrc} alt={g.title} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <Youtube className="size-8 text-primary/70" />
                        </div>
                      )}
                      {g.type === "VIDEO" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="flex size-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                            <svg viewBox="0 0 24 24" fill="white" className="size-4 translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </SectionReveal>
          )}

          {/* Latest Certificates */}
          {latestCerts.length > 0 && (
            <SectionReveal delay={0.1}>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Sertifikasi Terbaru</h2>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link href="/certificates">Lihat <ArrowRight className="size-3.5" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {latestCerts.map((c) => (
                  <Card key={c.id} className="lift rounded-2xl p-4 glass flex items-center gap-4">
                    <div className="size-9 rounded-lg bg-amber-400/20 flex items-center justify-center shrink-0">
                      <Award className="size-6 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-1">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.issuer} · {formatDateShort(c.issueDate)}</p>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="rounded-lg shrink-0">
                      <Link href={`/certificates/${c.slug}`}>View</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            </SectionReveal>
          )}
        </div>
      </section>

      {/* ===== FINANCIAL MARKET CTA ===== */}
      {marketEnabled && (
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <Card className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-strong">
              <div className="absolute inset-0 animated-gradient opacity-50" />
              <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                    Insight Pasar Finansial <span className="text-gradient">Real-Time</span>
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-lg">
                    Analisis teknikal & fundamental, watchlist, economic calendar, dan artikel edukasi untuk membantu keputusan investasi Anda.
                  </p>
                  <Button asChild size="lg" className="rounded-xl">
                    <Link href="/financial-market">
                      Eksplorasi Market <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Trading Dashboard", icon: TrendingUp },
                    { label: "Watchlist", icon: Star },
                    { label: "Market News", icon: FileText },
                    { label: "Economic Calendar", icon: Calendar },
                  ].map((item) => (
                    <div key={item.label} className="glass rounded-xl p-4 flex items-center gap-3">
                      <item.icon className="size-5 text-primary" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </SectionReveal>
        </div>
      </section>
      )}

      {/* ===== NEWSLETTER ===== */}
      {settings.newsletter_section !== "false" && (
      <section className="section-pad py-16">
        <div className="mx-auto max-w-3xl">
          <SectionReveal>
            <Card className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-strong text-center">
              <div className="absolute inset-0 animated-gradient opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex size-10 rounded-xl bg-primary/15 items-center justify-center text-primary mb-4">
                  <Mail className="size-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                  Berlangganan Newsletter
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Dapatkan tips digital marketing, insight pasar finansial, dan update konten terbaru langsung di inbox Anda.
                </p>
                <NewsletterForm />
                <p className="text-xs text-muted-foreground mt-3">No spam. Berhenti berlangganan kapan saja.</p>
              </div>
            </Card>
          </SectionReveal>
        </div>
      </section>
      )}

      {/* ===== CTA ===== */}
      <section className="section-pad py-16 pb-24">
        <div className="mx-auto max-w-4xl">
          <SectionReveal>
            <div className="relative rounded-[2rem] overflow-hidden">
              {/* animated gradient border */}
              <div className="absolute -inset-0.5 bg-primary/10 rounded-[2rem] opacity-50 blur-md" />
              <Card className="relative glass-strong rounded-[2rem] p-8 sm:p-12 text-center overflow-hidden">
                <div className="absolute inset-0 animated-gradient opacity-20" />
                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                    Punya proyek? <span className="text-gradient">Mari berkolaborasi</span>
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                    Saya siap membantu mewujudkan visi digital Anda dengan strategi yang efektif dan eksekusi berkualitas.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button asChild size="lg" className="rounded-xl h-12 px-8 shadow-lg shadow-primary/30">
                      <Link href="/contact"><Mail className="size-4" /> Contact Me</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-xl h-12 px-8 glass">
                      <Link href="/services">View Services</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}
