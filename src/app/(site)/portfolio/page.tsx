import Link from "next/link";
import { ArrowRight, Sparkles, Briefcase, LayoutGrid } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import {
  PortfolioExplorer,
  type PortfolioItem,
  type PortfolioCategoryItem,
} from "./portfolio-explorer";

export const metadata = {
  title: "Portfolio — Maulana Ihsan Rohim",
  description:
    "Koleksi proyek profesional: pengembangan web, kampanye digital marketing, produksi video, fotografi, dan branding. Filter berdasarkan kategori, klien, atau teknologi.",
};

export default async function PortfolioPage() {
  const [portfolios, categories] = await Promise.all([
    db.portfolio.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, images: true },
      orderBy: { projectDate: "desc" },
    }),
    db.category.findMany({
      where: { type: "PORTFOLIO" },
      orderBy: { name: "asc" },
    }),
  ]);

  // map to client-safe typed items
  const typedPortfolios: PortfolioItem[] = portfolios.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    description: p.description,
    thumbnail: p.thumbnail,
    banner: p.banner,
    role: p.role,
    client: p.client,
    featured: p.featured,
    viewCount: p.viewCount,
    projectDate: p.projectDate ?? p.createdAt,
    technologies: p.technologies,
    createdAt: p.createdAt,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          color: p.category.color,
        }
      : null,
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      order: img.order,
    })),
  }));

  const typedCategories: PortfolioCategoryItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
  }));

  return (
    <div className="relative">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden animated-gradient border-b border-border">
        <div className="mesh-bg" aria-hidden />
        <div className="section-pad relative z-10 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <SectionReveal>
              <Badge variant="outline" className="mb-5 glass px-4 py-1.5 text-xs uppercase tracking-wider">
                <Briefcase className="mr-1.5 size-3.5" />
                Portfolio &amp; Case Study
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Karya &amp; <span className="text-gradient">Proyek</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Eksplorasi koleksi proyek profesional yang saya kerjakan — dari
                pengembangan web, kampanye digital marketing, produksi video,
                fotografi, hingga identitas brand.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Mulai Proyek
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

      {/* ===== Explorer ===== */}
      <section className="section-pad py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <LayoutGrid className="mr-1.5 size-3.5 text-primary" />
                Eksplorasi Portfolio
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jelajahi <span className="text-gradient">Semua Karya</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Cari proyek berdasarkan judul, klien, atau teknologi. Filter
                berdasarkan kategori atau urutkan sesuai preferensi Anda.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {typedPortfolios.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Briefcase className="mx-auto mb-3 size-8 text-muted-foreground/60" />
                <p className="text-base font-medium">Belum ada proyek yang dipublikasikan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Proyek baru akan segera hadir. Nantikan!
                </p>
              </Card>
            ) : (
              <PortfolioExplorer
                portfolios={typedPortfolios}
                categories={typedCategories}
              />
            )}
          </SectionReveal>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <Briefcase className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Punya proyek <span className="text-gradient">serupa?</span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Mari diskusikan ide Anda. Saya terbuka untuk kolaborasi
                  freelance, proyek kreatif, maupun konsultasi strategi digital.
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
