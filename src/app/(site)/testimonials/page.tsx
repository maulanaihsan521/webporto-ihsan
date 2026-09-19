import Link from "next/link";
import { ArrowRight,
  Star,
  Quote,
  Users,
  TrendingUp,
  MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/server-site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { getInitials, cn, safeJsonLd } from "@/lib/utils";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";
import { TestimonialCarousel,
  type TestimonialItem } from "./testimonial-carousel";

export const metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Testimonials — Client Reviews" },
  description:
    "Apa kata klien tentang layanan Maulana Ihsan Rohim. Testimoni nyata dari berbagai industri — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Testimonials — Client Reviews",
    description:
      "Apa kata klien tentang layanan Maulana Ihsan Rohim. Testimoni nyata dari berbagai industri — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
    type: "website",
    url: "/testimonials",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Testimonials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Testimonials — Client Reviews",
    description:
      "Apa kata klien tentang layanan Maulana Ihsan Rohim. Testimoni nyata dari berbagai industri — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
  },
};

const avatarColors = [
  "bg-amber-600",
  "bg-teal-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-emerald-600",
];

function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`Rating ${rating} dari 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

export default async function TestimonialsPage() {
  const testimonials = await db.testimonial.findMany({
    orderBy: { order: "asc" },
  });

  const featured = testimonials.filter((t) => t.featured);
  const featuredItems: TestimonialItem[] = (featured.length > 0 ? featured : testimonials).map(
    (t) => ({
      id: t.id,
      name: t.name,
      position: t.position,
      company: t.company,
      avatar: t.avatar,
      rating: t.rating,
      content: t.content,
    }),
  );

  const total = testimonials.length;
  const avgRating =
    total > 0
      ? testimonials.reduce((s, t) => s + t.rating, 0) / total
      : 0;
  const satisfied = testimonials.filter((t) => t.rating >= 4).length;
  const satisfiedPct = total > 0 ? Math.round((satisfied / total) * 100) : 0;

  // JSON-LD CollectionPage + ItemList — structured data untuk daftar
  // testimoni (tanpa markup Review self-serving yang tidak eligible
  // rich result).
  // (Task 14) URL JSON-LD selalu domain produksi; dev lokal tetap host dev.
  const testimonialsUrl = `${await getBaseUrl()}/testimonials`;
  const testimonialsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Testimoni Klien Maulana Ihsan Rohim",
    url: testimonialsUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: testimonials.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: [t.name, t.position, t.company].filter(Boolean).join(" — "),
      })),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: CollectionPage + ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(testimonialsJsonLd) }}
      />

      {/* ===== Header + Stats ===== */}
      <section className="section-pad py-8 sm:py-12 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Apa Kata <span className="text-gradient">Klien</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Testimoni nyata dari berbagai industri yang telah mempercayakan
                proyeknya kepada saya.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {/* Stats — Horizontal Bar (selaras dengan halaman koleksi lain) */}
            <div className="flex flex-wrap items-stretch justify-center divide-x divide-border rounded-xl sm:rounded-2xl glass overflow-hidden">
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <MessageSquare className="size-3.5 sm:size-5 text-primary shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    <Counter to={total} suffix="+" />
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Total Testimoni
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <Star className="size-3.5 sm:size-5 fill-amber-400 text-amber-500 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    {total > 0 ? avgRating.toFixed(1) : "—"}<span className="text-xs font-medium text-muted-foreground">/5</span>
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Rata-rata Rating
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <Users className="size-3.5 sm:size-5 text-chart-2 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    <Counter to={satisfiedPct} suffix="%" />
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Klien Puas
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Featured Testimonials Carousel ===== */}
      {featuredItems.length > 0 && (
        <section className="section-pad py-8 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Kisah Sukses Klien
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                  Beberapa cerita inspiratif dari klien yang telah merasakan dampak nyata
                  dari hasil kerja sama kami.
                </p>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <TestimonialCarousel items={featuredItems} />
            </SectionReveal>
          </div>
        </section>
      )}

      {/* ===== All Testimonials Grid ===== */}
      <section className="section-pad py-8 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Suara dari Klien
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Jelajahi seluruh testimoni dari klien yang telah memberikan kepercayaannya.
              </p>
            </div>
          </SectionReveal>

          {testimonials.length === 0 ? (
            <SectionReveal>
              <Card className="glass p-10 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto mb-3 size-8 text-muted-foreground" />
                Belum ada testimoni.
              </Card>
            </SectionReveal>
          ) : (
            // Masonry-ish layout via CSS columns
            <div className="gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
              {testimonials.map((t, i) => {
                const initials = getInitials(t.name || "?");
                const grad = gradientForName(t.name || "?");
                return (
                  <SectionReveal key={t.id} delay={(i % 3) * 0.05}>
                    <Card className="glass group relative inline-block w-full break-inside-avoid overflow-hidden p-5 sm:p-6 lift">
                      <Quote
                        className="pointer-events-none absolute right-3 top-3 size-10 text-primary/50 transition-colors group-hover:text-primary/60"
                        aria-hidden
                      />
                      <div className="relative z-10">
                        <Stars rating={t.rating} className="mb-3" />
                        <p className="text-sm leading-relaxed text-foreground/85">
                          {t.content}
                        </p>
                        <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                          {t.avatar ? (
                            <img
                              src={t.avatar}
                              alt={t.name}
                              className="size-10 rounded-full object-cover ring-2 ring-background"
                            />
                          ) : (
                            <div
                              className={cn(
                                "flex size-10 items-center justify-center rounded-full font-bold text-white",
                                grad,
                              )}
                            >
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{t.name}</p>
                            {(t.position || t.company) && (
                              <p className="truncate text-xs text-muted-foreground">
                                {[t.position, t.company].filter(Boolean).join(" • ")}
                              </p>
                            )}
                          </div>
</div>
                      </div>
                    </Card>
                  </SectionReveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <TrendingUp className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Ingin <span className="text-gradient">bekerja sama</span> dengan saya?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Bergabunglah dengan klien-klien yang telah merasakan hasil luar biasa.
                  Mari diskusikan proyek Anda berikutnya.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/portfolio">
                      Lihat Portofolio
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
