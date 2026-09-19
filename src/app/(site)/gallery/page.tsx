import Link from "next/link";
import { ArrowRight, Image as ImageIcon, Camera } from "lucide-react";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/server-site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";
import { safeJsonLd } from "@/lib/utils";
import { GalleryView,
  type GalleryItem,
  type GalleryCategoryItem } from "./gallery-view";

export const metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Gallery — Photography & Video" },
  description:
    "Koleksi karya visual: fotografi, video, dan dokumentasi proyek. Filter berdasarkan kategori, album, atau tipe media.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Gallery — Photography & Video",
    description:
      "Koleksi karya visual: fotografi, video, dan dokumentasi proyek. Filter berdasarkan kategori, album, atau tipe media.",
    type: "website",
    url: "/gallery",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Gallery — Photography & Video",
    description:
      "Koleksi karya visual: fotografi, video, dan dokumentasi proyek. Filter berdasarkan kategori, album, atau tipe media.",
  },
};

export default async function GalleryPage() {
  const [galleries, categories] = await Promise.all([
    db.gallery.findMany({
      include: { category: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      // PERF (Task 12): batasi jumlah baris utk galeri publik
      take: 300,
    }),
    // SESUAIKAN FILTER (2026-09-20): pill kategori = kategori yang benar-benar
    // dipakai item gallery — bukan semua type=GALLERY. Menghapus pill hantu
    // (Design, Travel = 0 item) dan selalu sinkron dengan data.
    db.category.findMany({ where: { galleries: { some: {} } } }),
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

  // JSON-LD CollectionPage + ItemList ImageObject — structured data
  // untuk galeri media visual.
  // (Task 14) URL JSON-LD selalu domain produksi; dev lokal tetap host dev.
  const galleryUrl = `${await getBaseUrl()}/gallery`;
  const galleryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Galeri Karya Visual Maulana Ihsan Rohim",
    url: galleryUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: galleries.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        ...(g.url ? { url: g.url } : {}),
      })),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: CollectionPage + ItemList (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(galleryJsonLd) }}
      />

      {/* ===== Gallery ===== */}
      <section className="section-pad py-8 sm:py-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Eksplorasi <span className="text-gradient">Visual</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Filter berdasarkan tipe media, kategori, atau album. Klik gambar
                untuk membuka lightbox dengan navigasi papan tombol.
              </p>
            </div>
          </SectionReveal>

          {typedGalleries.length === 0 ? (
              <Card className="glass p-12 text-center">
                <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
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
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
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
