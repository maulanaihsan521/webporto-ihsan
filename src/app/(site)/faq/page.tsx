import Link from "next/link";
import {
  HelpCircle,
  Search,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { FaqExplorer, type FaqItem } from "./faq-explorer";

export const metadata = {
  title: "FAQ — Maulana Ihsan Rohim",
  description:
    "Pertanyaan yang sering diajukan tentang layanan Maulana Ihsan Rohim — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
};

export default async function FaqPage() {
  const faqs = await db.faq.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  // Group for popular categories count
  const categories = Array.from(
    new Set(faqs.map((f) => f.category || "Lainnya")),
  );

  const items: FaqItem[] = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
  }));

  return (
    <div className="relative">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden animated-gradient border-b border-border">
        <div className="mesh-bg" aria-hidden />
        <div className="section-pad relative z-10 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <SectionReveal>
              <Badge
                variant="outline"
                className="mb-5 glass px-4 py-1.5 text-xs uppercase tracking-wider"
              >
                <HelpCircle className="mr-1.5 size-3.5" />
                Pusat Bantuan
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Pertanyaan yang <span className="text-gradient">Sering Diajukan</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Temukan jawaban cepat untuk pertanyaan umum seputar layanan, proses
                kerja, pembayaran, dan analisis finansial.
              </p>
            </SectionReveal>

            {/* Quick stats */}
            <SectionReveal delay={0.15}>
              <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:gap-6">
                {[
                  { icon: Layers, label: "Pertanyaan", value: faqs.length, suffix: "" },
                  { icon: Search, label: "Kategori", value: categories.length, suffix: "" },
                  { icon: Sparkles, label: "Topik Aktif", value: faqs.length, suffix: "+" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-2xl p-4 text-center">
                    <s.icon className="mx-auto mb-2 size-5 text-primary" />
                    <div className="text-2xl font-bold sm:text-3xl">
                      <Counter to={s.value} suffix={s.suffix} />
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== FAQ Explorer ===== */}
      <section className="section-pad py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <Search className="mr-1.5 size-3.5 text-primary" />
                Jelajahi FAQ
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Cari Jawaban Anda
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Gunakan kolom pencarian atau pilih kategori untuk menemukan jawaban
                yang Anda butuhkan.
              </p>
            </div>
          </SectionReveal>

          {items.length === 0 ? (
            <SectionReveal>
              <div className="glass mx-auto max-w-2xl rounded-2xl p-10 text-center text-sm text-muted-foreground">
                <HelpCircle className="mx-auto mb-3 size-8 text-muted-foreground/60" />
                Belum ada FAQ yang dipublikasikan.
              </div>
            </SectionReveal>
          ) : (
            <SectionReveal delay={0.1}>
              <FaqExplorer items={items} />
            </SectionReveal>
          )}
        </div>
      </section>

      {/* ===== Bottom CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <MessageCircle className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Siap memulai <span className="text-gradient">proyek</span> Anda?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Jangan ragu untuk menghubungi saya. Konsultasi awal selalu gratis dan
                  tanpa komitmen.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Konsultasi Gratis
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
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}
