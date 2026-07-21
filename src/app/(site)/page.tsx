import Link from "next/link";
import { ArrowRight, Download, Sparkles, Mail, Github, Linkedin, Instagram, Facebook, Youtube, Star, Calendar, Award, TrendingUp, Briefcase, Users, FileText, Clock, Quote, MessageCircle } from "lucide-react";
import { getHomeData } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionReveal, Counter, TypingAnimation, Magnetic } from "@/components/motion-primitives";
import { ParticleBackground } from "@/components/particle-background";
import { TiltCard } from "@/components/tilt-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { formatDateShort, truncate, stripHtml, getInitials } from "@/lib/utils";

export default async function HomePage() {
  const { settings, featuredPortfolios, latestPosts, latestCerts, latestGalleries, services, testimonials, skills } = await getHomeData();

  const professions = [
    "Digital Marketing Specialist",
    "Social Media Specialist",
    "Photo & Video Producer",
    "Video Editor",
    "Financial Market Analyst",
  ];

  const stats = [
    { label: "Projects", value: Number(settings.stat_projects || 120), icon: Briefcase, suffix: "+" },
    { label: "Clients", value: Number(settings.stat_clients || 85), icon: Users, suffix: "+" },
    { label: "Certificates", value: Number(settings.stat_certificates || 25), icon: Award, suffix: "+" },
    { label: "Articles", value: Number(settings.stat_articles || 60), icon: FileText, suffix: "+" },
    { label: "Years Experience", value: Number(settings.stat_experience || 5), icon: Clock, suffix: "+" },
  ];

  const socials = [
    { icon: Github, href: settings.social_github || "#", label: "GitHub" },
    { icon: Linkedin, href: settings.social_linkedin || "#", label: "LinkedIn" },
    { icon: Instagram, href: settings.social_instagram || "#", label: "Instagram" },
    { icon: Facebook, href: settings.social_facebook || "#", label: "Facebook" },
    { icon: Youtube, href: settings.social_youtube || "#", label: "YouTube" },
    { icon: MessageCircle, href: settings.social_whatsapp || "#", label: "WhatsApp" },
  ];

  return (
    <div className="relative">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 animated-gradient" />
        <ParticleBackground count={40} />
        <div className="section-pad relative z-10">
          <div className="mx-auto max-w-7xl grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center min-h-[80vh]">
            <div className="space-y-7">
              <SectionReveal>
                <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium">
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                    <span className="relative rounded-full bg-green-500 size-2" />
                  </span>
                  Available for freelance projects
                </div>
              </SectionReveal>

              <SectionReveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                  Hi, saya{" "}
                  <span className="text-gradient">
                    {settings.owner_name || "Maulana Ihsan Rohim"}
                  </span>
                </h1>
              </SectionReveal>

              <SectionReveal delay={0.2}>
                <div className="text-xl sm:text-2xl lg:text-3xl font-medium text-muted-foreground h-10">
                  <TypingAnimation words={professions} />
                </div>
              </SectionReveal>

              <SectionReveal delay={0.3}>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  {settings.site_tagline || "Helping Businesses Grow Through Digital Marketing, Creative Content, Technology, and Financial Market Insights."}
                </p>
              </SectionReveal>

              <SectionReveal delay={0.4}>
                <div className="flex flex-wrap gap-3">
                  <Magnetic>
                    <Button asChild size="lg" className="rounded-xl h-12 px-6 shadow-lg shadow-primary/30">
                      <Link href="/portfolio">
                        <Briefcase className="size-4" />
                        View Portfolio
                      </Link>
                    </Button>
                  </Magnetic>
                  <Magnetic>
                    <Button asChild size="lg" variant="outline" className="rounded-xl h-12 px-6 glass">
                      <Link href="/contact">
                        <Mail className="size-4" />
                        Hire Me
                      </Link>
                    </Button>
                  </Magnetic>
                  <Magnetic>
                    <Button asChild size="lg" variant="ghost" className="rounded-xl h-12 px-6">
                      <Link href="/contact">
                        <Download className="size-4" />
                        Download CV
                      </Link>
                    </Button>
                  </Magnetic>
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
                      className="size-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 transition-all"
                    >
                      <s.icon className="size-4" />
                    </a>
                  ))}
                </div>
              </SectionReveal>
            </div>

            {/* Profile card */}
            <SectionReveal delay={0.3} className="relative">
              <div className="relative max-w-sm mx-auto">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 via-chart-2/20 to-chart-3/30 rounded-[2.5rem] blur-2xl animate-pulse" />
                <div className="relative glass-strong rounded-[2rem] p-6 shadow-2xl">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-chart-2/15 to-chart-3/20" style={{ transformStyle: "preserve-3d" }}>
                    {settings.owner_photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.owner_photo}
                        alt={settings.owner_name || "Profile"}
                        className="absolute inset-0 size-full object-cover"
                        style={{ transform: "translateZ(20px)" }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "translateZ(40px)" }}>
                        <span className="text-8xl font-bold text-primary/30">MI</span>
                      </div>
                    )}
                    <div className="absolute inset-0 mesh-bg opacity-20" />
                    <div className="absolute bottom-0 inset-x-0 p-4 glass-strong rounded-t-2xl" style={{ transform: "translateZ(30px)" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{settings.owner_name}</p>
                          <p className="text-xs text-muted-foreground">{settings.owner_location}</p>
                        </div>
                        <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-0">
                          <span className="size-1.5 rounded-full bg-green-500 mr-1" /> Online
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-primary/5 p-2">
                      <p className="text-lg font-bold text-primary"><Counter to={Number(settings.stat_projects || 120)} suffix="+" /></p>
                      <p className="text-[10px] text-muted-foreground">Projects</p>
                    </div>
                    <div className="rounded-xl bg-primary/5 p-2">
                      <p className="text-lg font-bold text-primary"><Counter to={Number(settings.stat_clients || 85)} suffix="+" /></p>
                      <p className="text-[10px] text-muted-foreground">Clients</p>
                    </div>
                    <div className="rounded-xl bg-primary/5 p-2">
                      <p className="text-lg font-bold text-primary"><Counter to={Number(settings.stat_experience || 5)} suffix="y" /></p>
                      <p className="text-[10px] text-muted-foreground">Exp</p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE BAND ===== */}
      <section className="py-4 border-y bg-primary/5 overflow-hidden">
        <div className="marquee">
          <div className="marquee-track">
            {["Digital Marketing", "Social Media", "Photography", "Videography", "Video Editing", "SEO", "Meta Ads", "Google Ads", "Content Creation", "Brand Strategy", "UI/UX Design", "Web Development", "Financial Analysis", "Trading", "Motion Graphics"].map((t) => (
              <span key={t} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                {t}
              </span>
            ))}
          </div>
          <div className="marquee-track" aria-hidden>
            {["Digital Marketing", "Social Media", "Photography", "Videography", "Video Editing", "SEO", "Meta Ads", "Google Ads", "Content Creation", "Brand Strategy", "UI/UX Design", "Web Development", "Financial Analysis", "Trading", "Motion Graphics"].map((t) => (
              <span key={t} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map((s, i) => (
              <SectionReveal key={s.label} delay={i * 0.08}>
                <Card className="lift group relative overflow-hidden rounded-2xl p-5 text-center glass hover:border-primary/30 transition-colors">
                  <div className="absolute -top-8 -right-8 size-24 rounded-full bg-primary/15 blur-2xl group-hover:bg-primary/25 transition-colors" />
                  <div className="absolute -bottom-8 -left-8 size-20 rounded-full bg-chart-2/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                      <s.icon className="size-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold tracking-tight">
                      <Counter to={s.value} suffix={s.suffix} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                </Card>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PORTFOLIO ===== */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <Badge variant="secondary" className="mb-3 rounded-full">
                  <Sparkles className="size-3 mr-1" /> Featured Work
                </Badge>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {featuredPortfolios.map((p, i) => (
              <SectionReveal key={p.id} delay={i * 0.1}>
                <Link href={`/portfolio/${p.slug}`}>
                  <div className="relative group rounded-2xl lift overflow-hidden">
                    {/* Gradient border effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/40 via-chart-2/30 to-chart-3/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                    <Card className="relative group overflow-hidden rounded-2xl h-full bg-card border border-border/50">
                      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/15 via-chart-2/10 to-chart-3/15">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail} alt={p.title} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <Briefcase className="size-16 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {p.category && (
                          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border border-border/50 backdrop-blur-md shadow-md">
                            {p.category.name}
                          </Badge>
                        )}
                        {/* Hover overlay with view button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            Lihat Detail
                          </div>
                        </div>
                      </div>
                      <div className="p-5 bg-card">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt || stripHtml(p.description)}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          {p.client && <span className="inline-flex items-center gap-1"><Users className="size-3" /> {p.client}</span>}
                          {p.projectDate && <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {formatDateShort(p.projectDate)}</span>}
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
            <div className="text-center mb-10">
              <Badge variant="secondary" className="mb-3 rounded-full">What I Do</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Layanan <span className="text-gradient">Profesional</span></h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Solusi lengkap untuk kebutuhan digital marketing, konten visual, dan analisis pasar finansial Anda</p>
            </div>
          </SectionReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <SectionReveal key={s.id} delay={i * 0.08}>
                <Card className="lift group rounded-2xl p-6 h-full glass relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 size-24 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{s.description}</p>
                  <Link href="/services" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
                    Selengkapnya <ArrowRight className="size-3.5" />
                  </Link>
                </Card>
              </SectionReveal>
            ))}
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
                  <Badge variant="secondary" className="mb-3 rounded-full">Expertise</Badge>
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
                      <div className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full" style={{ width: `${s.percentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{s.level}</p>
                  </Card>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== LATEST BLOG ===== */}
      {latestPosts.length > 0 && (
        <section className="section-pad py-16">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <Badge variant="secondary" className="mb-3 rounded-full"><FileText className="size-3 mr-1" /> From The Blog</Badge>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Artikel <span className="text-gradient">Terbaru</span></h2>
                </div>
                <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-xl">
                  <Link href="/blog">Lihat Semua <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
            </SectionReveal>
            <div className="grid md:grid-cols-3 gap-6">
              {latestPosts.map((post, i) => (
                <SectionReveal key={post.id} delay={i * 0.1}>
                  <Link href={`/blog/${post.slug}`}>
                    <Card className="lift group rounded-2xl overflow-hidden h-full glass">
                      <div className="aspect-[16/9] bg-gradient-to-br from-primary/15 via-chart-2/10 to-chart-3/15 relative">
                        {post.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.coverImage} alt={post.title} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <FileText className="size-12 text-primary/40" />
                          </div>
                        )}
                        {post.category && (
                          <Badge className="absolute top-3 left-3 glass-strong border-0">{post.category.name}</Badge>
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
                <Badge variant="secondary" className="mb-3 rounded-full"><Quote className="size-3 mr-1" /> Testimonials</Badge>
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
                    <Card className="rounded-2xl p-6 h-full glass relative overflow-hidden group">
                      <div className="absolute -top-8 -right-8 size-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
                      <Quote className="size-10 text-primary/20 absolute top-4 right-4" />
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed mb-5 relative z-10">"{t.content}"</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        <Avatar className="size-11 ring-2 ring-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-chart-2/20 text-primary text-xs font-semibold">{getInitials(t.name)}</AvatarFallback>
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
                  <Badge variant="secondary" className="mb-2 rounded-full">Gallery</Badge>
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
                    <Link key={g.id} href="/gallery" className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 to-chart-2/15">
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt={g.title} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <Youtube className="size-8 text-primary/40" />
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
                  <Badge variant="secondary" className="mb-2 rounded-full"><Award className="size-3 mr-1" /> Certificates</Badge>
                  <h2 className="text-2xl font-bold tracking-tight">Sertifikasi Terbaru</h2>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link href="/certificates">Lihat <ArrowRight className="size-3.5" /></Link>
                </Button>
              </div>
              <div className="space-y-3">
                {latestCerts.map((c) => (
                  <Card key={c.id} className="lift rounded-2xl p-4 glass flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center shrink-0">
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
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <Card className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-strong">
              <div className="absolute inset-0 animated-gradient opacity-50" />
              <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-3 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 border-0">
                    <TrendingUp className="size-3 mr-1" /> Financial Market
                  </Badge>
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

      {/* ===== NEWSLETTER ===== */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-3xl">
          <SectionReveal>
            <Card className="relative overflow-hidden rounded-3xl p-8 sm:p-12 glass-strong text-center">
              <div className="absolute inset-0 animated-gradient opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex size-14 rounded-2xl bg-primary/15 items-center justify-center text-primary mb-4">
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

      {/* ===== CTA ===== */}
      <section className="section-pad py-16 pb-24">
        <div className="mx-auto max-w-4xl">
          <SectionReveal>
            <div className="relative rounded-[2rem] overflow-hidden">
              {/* animated gradient border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-chart-2 to-chart-3 rounded-[2rem] opacity-50 blur-md" />
              <Card className="relative glass-strong rounded-[2rem] p-8 sm:p-12 text-center overflow-hidden">
                <div className="absolute inset-0 animated-gradient opacity-20" />
                <div className="relative z-10">
                  <div className="inline-flex size-14 rounded-2xl bg-primary/15 items-center justify-center text-primary mb-5">
                    <Sparkles className="size-7" />
                  </div>
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
