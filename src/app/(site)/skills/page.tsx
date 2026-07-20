import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Award,
  GraduationCap,
  Zap,
  TrendingUp,
  Brain,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import { SkillFilter, type SkillItem } from "./skill-filter";

export const metadata = {
  title: "Skills — Maulana Ihsan Rohim",
  description:
    "Daftar lengkap keahlian profesional: Digital Marketing, Social Media, Photography, Videography, Video Editing, Design, Development, Database, Tools, Financial Market, dan Data Analysis.",
};

const levelLegend = [
  {
    level: "Beginner",
    description: "Pemula — dasar & sedang berkembang",
    color: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/15",
    range: "0–40%",
  },
  {
    level: "Intermediate",
    description: "Menengah — mampu dengan bimbingan",
    color: "bg-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/15",
    range: "41–70%",
  },
  {
    level: "Advanced",
    description: "Mahir — mandiri & percaya diri",
    color: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/15",
    range: "71–89%",
  },
  {
    level: "Expert",
    description: "Ahli — pemimpin & inovator",
    color: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/15",
    range: "90–100%",
  },
];

export default async function SkillsPage() {
  const skills = await db.skill.findMany({ orderBy: { order: "asc" } });

  const typedSkills: SkillItem[] = skills.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    percentage: s.percentage,
    level: s.level,
    icon: s.icon,
    description: s.description,
    color: s.color,
    featured: s.featured,
    order: s.order,
  }));

  // Compute category summaries
  const categoryMap = new Map<string, { total: number; sum: number; count: number }>();
  for (const s of typedSkills) {
    const existing = categoryMap.get(s.category) || { total: 0, sum: 0, count: 0 };
    existing.sum += s.percentage;
    existing.count += 1;
    existing.total = Math.round(existing.sum / existing.count);
    categoryMap.set(s.category, existing);
  }
  const categorySummary = Array.from(categoryMap.entries())
    .map(([name, data]) => ({ name, avg: data.total, count: data.count }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="relative">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden animated-gradient border-b border-border">
        <div className="mesh-bg" aria-hidden />
        <div className="section-pad relative z-10 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <SectionReveal>
              <Badge variant="outline" className="mb-5 glass px-4 py-1.5 text-xs uppercase tracking-wider">
                <Zap className="mr-1.5 size-3.5" />
                Keahlian &amp; Kompetensi
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-gradient">Skill</span> &amp; Expertise
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Kombinasi keahlian lintas-disiplin — dari kreativitas konten visual, teknologi
                pengembangan web, hingga analisis pasar finansial.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Kerja Sama
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass">
                  <Link href="/services">
                    <Sparkles className="size-4" />
                    Lihat Layanan
                  </Link>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Skills content ===== */}
      <section className="section-pad py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <Award className="mr-1.5 size-3.5 text-primary" />
                Eksplorasi Keahlian
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Semua <span className="text-gradient">Keahlian</span> Saya
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Filter berdasarkan kategori atau cari berdasarkan nama. Klik kategori untuk
                mempersempit hasil.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <SkillFilter skills={typedSkills} />
          </SectionReveal>
        </div>
      </section>

      {/* ===== Category Progress Summary ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-8 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <BarChart3 className="mr-1.5 size-3.5 text-primary" />
                Ringkasan Kategori
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Rata-rata per <span className="text-gradient">Kategori</span>
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Tingkat kompetensi rata-rata untuk setiap kategori keahlian.
              </p>
            </div>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <div className="grid gap-3 sm:grid-cols-2">
              {categorySummary.map((cat, i) => (
                <div key={cat.name} className="rounded-2xl glass p-4 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full text-[10px]">{cat.count} skill</Badge>
                      <span className="text-lg font-bold text-primary">{cat.avg}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-700"
                      style={{ width: `${cat.avg}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Level Legend ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <Card className="glass-strong p-6 sm:p-10">
              <div className="mb-6 text-center">
                <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                  <GraduationCap className="mr-1.5 size-3.5 text-primary" />
                  Tingkat Penguasaan
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Legenda Level</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                  Sistem level digunakan untuk menggambarkan tingkat penguasaan tiap skill.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {levelLegend.map((item, i) => (
                  <div
                    key={item.level}
                    className="glass rounded-2xl p-5 text-center"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div
                      className={`mx-auto mb-3 flex size-12 items-center justify-center rounded-full ${item.bg}`}
                    >
                      <span className={`size-4 rounded-full ${item.color}`} />
                    </div>
                    <h3 className={`text-base font-bold ${item.text}`}>{item.level}</h3>
                    <p className="mt-1 text-xs font-medium tabular-nums text-muted-foreground">
                      {item.range}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Skill Domains Highlights ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <Brain className="mr-1.5 size-3.5 text-primary" />
                Bidang Keahlian
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Domain Utama</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Empat pilar utama keahlian yang saya kuasai secara mendalam.
              </p>
            </div>
          </SectionReveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "Digital Marketing",
                desc: "SEO, Meta & Google Ads, content marketing, dan social media management.",
                accent: "from-amber-500 to-orange-500",
              },
              {
                icon: TrendingUp,
                title: "Creative Production",
                desc: "Photography, videography, video editing, dan motion graphics profesional.",
                accent: "from-rose-500 to-pink-500",
              },
              {
                icon: Zap,
                title: "Web Development",
                desc: "Modern stack: React, Next.js, TypeScript, Tailwind, dan Prisma.",
                accent: "from-emerald-500 to-teal-500",
              },
              {
                icon: ShieldCheck,
                title: "Financial Market",
                desc: "Technical & fundamental analysis, risk management, dan investment strategy.",
                accent: "from-violet-500 to-purple-500",
              },
            ].map((domain, i) => (
              <SectionReveal key={domain.title} delay={i * 0.05}>
                <Card className="glass group relative h-full overflow-hidden p-6 lift">
                  <div
                    className={`pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br ${domain.accent} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-30`}
                    aria-hidden
                  />
                  <div className="relative z-10">
                    <div
                      className={`mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${domain.accent} text-white shadow-lg`}
                    >
                      <domain.icon className="size-6" />
                    </div>
                    <h3 className="text-base font-bold">{domain.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{domain.desc}</p>
                  </div>
                </Card>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <Award className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Butuh <span className="text-gradient">keahlian</span> tertentu?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Saya terbuka untuk proyek freelance, kolaborasi, maupun konsultasi. Mari diskusi
                  kebutuhan Anda.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/about">
                      <Sparkles className="size-4" />
                      Tentang Saya
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}
