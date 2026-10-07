import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Briefcase } from "lucide-react";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-config";
import { siteOriginFromHeaders } from "@/lib/server-site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";
import { safeJsonLd } from "@/lib/utils";
import { PortfolioExplorer,
  type PortfolioItem,
  type PortfolioCategoryItem } from "../portfolio-explorer";

export const metadata = {
  title: {
    absolute: "Maulana Ihsan Rohim | Digital Marketing, Photography & Video Portfolio",
  },
  description:
    "Koleksi proyek profesional: pengembangan web, kampanye digital marketing, produksi video, fotografi, dan branding. Filter berdasarkan kategori, klien, atau teknologi.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Digital Marketing, Photography & Video Portfolio",
    description:
      "Koleksi proyek profesional: pengembangan web, kampanye digital marketing, produksi video, fotografi, dan branding.",
    type: "website",
    url: "/portfolio",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Digital Marketing, Photography & Video Portfolio",
    description:
      "Koleksi proyek profesional: pengembangan web, kampanye digital marketing, produksi video, fotografi, dan branding.",
  },
};

// URL halaman — SELALU domain produksi (Task 14); host request hanya dipakai
// saat dev lokal. Anti host-spoofing: host apa pun tak masuk URL publik.
function buildPortfolioUrl(currentHeaders: Headers): string {
  return `${siteOriginFromHeaders(currentHeaders)}/portfolio`;
}

export default async function PortfolioPage() {
  const [portfolios, categories] = await Promise.all([
    db.portfolio.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, images: true },
      orderBy: { projectDate: "desc" },
      // PERF (Task 12): batasi jumlah baris utk list publik
      take: 100,
    }),
    // SESUAIKAN FILTER (2026-09-20): kategori pill diturunkan dari kategori
    // yang BENAR-BENAR dipakai portofolio published — bukan semua kategori
    // type=PORTFOLIO. Masalah lama: (a) pill hantu "Branding" & "UI/UX
    // Design" muncul padahal 0 proyek → klik = kosong; (b) kategori
    // "Photography" (type BLOG, dipakai proyek "Fotografer & Editor" dari
    // seed lama) tidak pernah muncul sebagai filter. Dengan relasi
    // `portfolios: { some: { status: "PUBLISHED" } }` filter selalu sinkron
    // dengan data: kategori terpakai pasti tampil, kategori kosong pasti
    // tersembunyi — apa pun type kategorinya.
    db.category.findMany({
      where: { portfolios: { some: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // map to client-safe typed items
  const typedPortfolios: PortfolioItem[] = portfolios.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    // PERF: deskripsi panjang dipangkas — cukup utk preview & search klien
    description: p.description.slice(0, 4000),
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

  // JSON-LD CollectionPage + ItemList CreativeWork — structured data
  // untuk daftar karya (selaras dengan detail yang sudah punya CreativeWork).
  const reqHeaders = await headers();
  const portfolioUrl = buildPortfolioUrl(reqHeaders);
  const portfolioJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Portofolio Maulana Ihsan Rohim",
    url: portfolioUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: portfolios.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${portfolioUrl}/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: CollectionPage + ItemList (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(portfolioJsonLd) }}
      />
      {/* ===== Explorer ===== */}
      <section className="section-pad py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jelajahi <span className="text-gradient">Semua Karya</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Cari proyek berdasarkan judul, klien, atau teknologi. Filter
                berdasarkan kategori atau urutkan sesuai preferensi Anda.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {typedPortfolios.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Briefcase className="mx-auto mb-3 size-8 text-muted-foreground" />
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
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <img
                  src="/images/mascots/mascot-discover.webp"
                  alt="Maskot melakukan riset proyek — mari diskusikan ide Anda"
                  width={64}
                  height={64}
                  loading="lazy"
                  className="mx-auto mb-4 size-16 object-contain drop-shadow-lg"
                />
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
