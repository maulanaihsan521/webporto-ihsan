import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight,
  Award,
  Zap,
  TrendingUp,
  ShieldCheck,
  Megaphone } from "lucide-react";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { SkillFilter, type SkillItem } from "./skill-filter";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

import { safeJsonLd } from "@/lib/utils";
export const metadata = {
  title: {
    absolute: "Maulana Ihsan Rohim | Digital Marketing, Social Media & Video Skills",
  },
  description:
    "Daftar lengkap keahlian profesional: Digital Marketing, Social Media, Photography, Videography, Video Editing, Design, Development, Database, Tools, Financial Market, dan Data Analysis.",
  alternates: { canonical: "/skills" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Digital Marketing, Social Media & Video Skills",
    description:
      "Daftar lengkap keahlian profesional: Digital Marketing, Social Media, Photography, Videography, Video Editing, Design, Development, Database, Tools, Financial Market, dan Data Analysis.",
    type: "website",
    url: "/skills",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Skills",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Digital Marketing, Social Media & Video Skills",
    description:
      "Daftar lengkap keahlian profesional: Digital Marketing, Social Media, Photography, Videography, Video Editing, Design, Development, Database, Tools, Financial Market, dan Data Analysis.",
  },
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

  // JSON-LD ProfilePage + Person knowsAbout — structured data untuk
  // daftar keahlian (kategori + nama skill).
  const reqHeaders = await headers();
  const host = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host");
  const skillsUrl = host
    ? `${reqHeaders.get("x-forwarded-proto") || "https"}://${host}/skills`
    : `${SITE_URL}/skills`;
  const skillsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: "Keahlian Maulana Ihsan Rohim",
    url: skillsUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "Person",
      name: "Maulana Ihsan Rohim",
      url: SITE_URL,
      knowsAbout: [
        ...categorySummary.map((c) => c.name),
        ...typedSkills.map((s) => s.name),
      ],
    },
  };

  return (
    <div className="relative">
      {/* Structured data: ProfilePage + Person knowsAbout */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(skillsJsonLd) }}
      />

      {/* ===== Skills content ===== */}
      <section className="section-pad py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Semua <span className="text-gradient">Keahlian</span> Saya
              </h1>
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
      <section className="section-pad py-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-8 text-center">
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
                      <span className="text-lg font-bold text-primary">{cat.avg}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
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
      <section className="section-pad py-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <Card className="glass-strong p-4 sm:p-6">
              <div className="mb-6 text-center">
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
      <section className="section-pad py-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Domain Utama</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Empat pilar utama keahlian yang saya kuasai secara mendalam.
              </p>
            </div>
          </SectionReveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Megaphone,
                title: "Digital Marketing",
                desc: "SEO, Meta & Google Ads, content marketing, dan social media management.",
              },
              {
                icon: TrendingUp,
                title: "Creative Production",
                desc: "Photography, videography, video editing, dan motion graphics profesional.",
              },
              {
                icon: Zap,
                title: "Web Development",
                desc: "Modern stack: React, Next.js, TypeScript, Tailwind, dan Prisma.",
              },
              {
                icon: ShieldCheck,
                title: "Financial Market",
                desc: "Technical & fundamental analysis, risk management, dan investment strategy.",
              },
            ].map((domain, i) => (
              <SectionReveal key={domain.title} delay={i * 0.05}>
                <Card className="glass group relative h-full overflow-hidden p-4 lift">
                  <div className="relative z-10">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
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
            <div className="relative overflow-hidden rounded-3xl border-0 bg-card p-8 text-center sm:p-12 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
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
