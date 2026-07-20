import Link from "next/link";
import { ArrowRight, Sparkles, Image as ImageIcon, Camera } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import {
  GalleryView,
  type GalleryItem,
  type GalleryCategoryItem,
} from "./gallery-view";

export const metadata = {
  title: "Galeri — Maulana Ihsan Rohim",
  description:
    "Koleksi karya visual: fotografi, video, dan dokumentasi proyek. Filter berdasarkan kategori, album, atau tipe media.",
};

export default async function GalleryPage() {
  const [galleries, categories] = await Promise.all([
    db.gallery.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ where: { type: "GALLERY" } }),
  ]);

  const typedGalleries: GalleryItem[] = galleries.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description,
    url: g.url,
    type: g.type,
    thumbnail: g.thumbnail,
    album: g.album,
    featured: g.featured,
    category: g.category
      ? {
          id: g.category.id,
          name: g.category.name,
          slug: g.category.slug,
          color: g.category.color,
        }
      : null,
  }));

  const typedCategories: GalleryCategoryItem[] = categories.map((c) => ({
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
              <Badge
                variant="outline"
                className="mb-5 glass px-4 py-1.5 text-xs uppercase tracking-wider"
              >
                <Camera className="mr-1.5 size-3.5" />
                Galeri Karya Visual
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Galeri <span className="text-gradient">Kreatif</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Koleksi momen visual hasil eksplorasi kreatif saya — fotografi
                landskap, street, produk, portrait, hingga dokumentasi event.
                Klik setiap karya untuk melihat detail.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/portfolio">
                    Lihat Portfolio
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass">
                  <Link href="/contact">
                    <Sparkles className="size-4" />
                    Konsultasi Proyek
                  </Link>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Gallery ===== */}
      <section className="section-pad py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <ImageIcon className="mr-1.5 size-3.5 text-primary" />
                Jelajahi Karya
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Eksplorasi <span className="text-gradient">Visual</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Filter berdasarkan tipe media, kategori, atau album. Klik gambar
                untuk membuka lightbox dengan navigasi papan tombol.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {typedGalleries.length === 0 ? (
              <Card className="glass p-12 text-center">
                <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground/60" />
                <p className="text-base font-medium">Belum ada media yang dipublikasikan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Galeri akan segera diisi dengan karya terbaru.
                </p>
              </Card>
            ) : (
              <GalleryView
                galleries={typedGalleries}
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
                <Camera className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Butuh <span className="text-gradient">konten visual</span> profesional?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Saya menyediakan jasa fotografi & videografi untuk produk, event,
                  portrait, maupun brand. Mari diskusikan kebutuhan Anda.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
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
