import Link from "next/link";
import { ArrowRight,
  Star,
  Quote,
  Heart,
  Users,
  TrendingUp,
  MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { getInitials, cn } from "@/lib/utils";
import { TestimonialCarousel,
  type TestimonialItem } from "./testimonial-carousel";

export const metadata = {
  title: "Testimoni — Maulana Ihsan Rohim",
  description:
    "Apa kata klien tentang layanan Maulana Ihsan Rohim. Testimoni nyata dari berbagai industri — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
};

const avatarGradients = [
  "from-amber-500 to-orange-500",
  "from-teal-500 to-emerald-500",
  "from-violet-500 to-fuchsia-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-teal-500",
  "from-emerald-500 to-lime-500",
];

function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
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

  return (
    <div className="relative">

      {/* ===== Stats ===== */}
      <section className="section-pad py-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  label: "Total Testimoni",
                  value: total,
                  suffix: "+",
                  accent: "bg-primary",
                },
                {
                  icon: Star,
                  label: "Rata-rata Rating",
                  value: Number(avgRating.toFixed(1)),
                  suffix: "/5",
                  isDecimal: true,
                  accent: "bg-primary",
                },
                {
                  icon: Users,
                  label: "Klien Puas",
                  value: satisfiedPct,
                  suffix: "%",
                  accent: "bg-primary",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="glass relative overflow-hidden rounded-xl p-4 text-center lift"
                >
                  <div className="relative z-10 flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground",
                        s.accent,
                      )}
                    >
                      <s.icon className="size-4" />
                    </div>
                    <div className="text-xl font-bold sm:text-2xl">
                      {s.isDecimal ? (
                        avgRating.toFixed(1)
                      ) : (
                        <Counter to={s.value} suffix={s.suffix} />
                      )}
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
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
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
                <MessageSquare className="mx-auto mb-3 size-8 text-muted-foreground/60" />
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
                        className="pointer-events-none absolute right-3 top-3 size-10 text-primary/10 transition-colors group-hover:text-primary/20"
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
                                "flex size-10 items-center justify-center rounded-full bg-primary font-bold text-white",
                                grad,
                              )}
                              aria-hidden
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
