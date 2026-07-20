"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Film,
  Layers,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/motion-primitives";
import { BlurImage } from "@/components/blur-image";
import { cn } from "@/lib/utils";

export type GalleryCategoryItem = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type GalleryItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  url: string;
  type: string; // IMAGE | VIDEO
  thumbnail: string | null;
  album: string | null;
  featured: boolean;
  category: GalleryCategoryItem | null;
};

type TypeFilter = "ALL" | "IMAGE" | "VIDEO";

const typeOptions: { value: TypeFilter; label: string; icon: typeof ImageIcon }[] = [
  { value: "ALL", label: "Semua", icon: LayoutGrid },
  { value: "IMAGE", label: "Foto", icon: ImageIcon },
  { value: "VIDEO", label: "Video", icon: VideoIcon },
];

export function GalleryView({
  galleries,
  categories,
}: {
  galleries: GalleryItem[];
  categories: GalleryCategoryItem[];
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeAlbum, setActiveAlbum] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // derive unique albums from galleries
  const albums = useMemo(() => {
    const set = new Set<string>();
    for (const g of galleries) {
      if (g.album && g.album.trim()) set.add(g.album.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [galleries]);

  // filtered list (memoized)
  const filtered = useMemo(() => {
    return galleries.filter((g) => {
      if (typeFilter !== "ALL" && g.type !== typeFilter) return false;
      if (activeCategory !== "all" && g.category?.id !== activeCategory) return false;
      if (activeAlbum !== "all" && (g.album ?? "") !== activeAlbum) return false;
      return true;
    });
  }, [galleries, typeFilter, activeCategory, activeAlbum]);

  // stats
  const stats = useMemo(
    () => ({
      total: galleries.length,
      images: galleries.filter((g) => g.type === "IMAGE").length,
      videos: galleries.filter((g) => g.type === "VIDEO").length,
      albums: albums.length,
    }),
    [galleries, albums],
  );

  const hasActiveFilters =
    typeFilter !== "ALL" || activeCategory !== "all" || activeAlbum !== "all";

  const resetFilters = () => {
    setTypeFilter("ALL");
    setActiveCategory("all");
    setActiveAlbum("all");
  };

  // Lightbox navigation
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const nextImage = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null) return idx;
      return (idx + 1) % filtered.length;
    });
  }, [filtered.length]);
  const prevImage = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null) return idx;
      return (idx - 1 + filtered.length) % filtered.length;
    });
  }, [filtered.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, nextImage, prevImage, closeLightbox]);

  // Reset lightbox if filtered list changes (avoid out-of-bounds)
  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= filtered.length) {
      setLightboxIndex(null);
    }
  }, [filtered.length, lightboxIndex]);

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div>
      {/* ===== Stats ===== */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="glass p-4 text-center sm:p-5">
          <Layers className="mx-auto mb-2 size-5 text-primary" />
          <div className="text-2xl font-bold sm:text-3xl">
            <Counter to={stats.total} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Total Media
          </p>
        </Card>
        <Card className="glass p-4 text-center sm:p-5">
          <ImageIcon className="mx-auto mb-2 size-5 text-chart-2" />
          <div className="text-2xl font-bold sm:text-3xl">
            <Counter to={stats.images} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Foto
          </p>
        </Card>
        <Card className="glass p-4 text-center sm:p-5">
          <VideoIcon className="mx-auto mb-2 size-5 text-chart-3" />
          <div className="text-2xl font-bold sm:text-3xl">
            <Counter to={stats.videos} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Video
          </p>
        </Card>
        <Card className="glass p-4 text-center sm:p-5">
          <Film className="mx-auto mb-2 size-5 text-chart-4" />
          <div className="text-2xl font-bold sm:text-3xl">
            <Counter to={stats.albums} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Album
          </p>
        </Card>
      </div>

      {/* ===== Filter Bar ===== */}
      <div className="mb-8">
        <Card className="glass overflow-hidden p-4 sm:p-5">
          {/* Type tabs */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-muted/70 p-1">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTypeFilter(opt.value)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    typeFilter === opt.value
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {typeFilter === opt.value && (
                    <motion.span
                      layoutId="activeGalleryType"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-chart-2 shadow-md"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <X className="size-3" />
                Reset filter
              </button>
            )}
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Kategori:
              </span>
              <FilterPill
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              >
                Semua
              </FilterPill>
              {categories.map((c) => (
                <FilterPill
                  key={c.id}
                  active={activeCategory === c.id}
                  onClick={() => setActiveCategory(c.id)}
                >
                  {c.name}
                </FilterPill>
              ))}
            </div>
          )}

          {/* Album pills */}
          {albums.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Album:
              </span>
              <FilterPill
                active={activeAlbum === "all"}
                onClick={() => setActiveAlbum("all")}
              >
                Semua
              </FilterPill>
              {albums.map((a) => (
                <FilterPill
                  key={a}
                  active={activeAlbum === a}
                  onClick={() => setActiveAlbum(a)}
                >
                  {a}
                </FilterPill>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ===== Count display ===== */}
      <div className="mb-6 text-xs text-muted-foreground">
        Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari{" "}
        <strong className="text-foreground">{galleries.length}</strong> media
      </div>

      {/* ===== Masonry grid ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${typeFilter}-${activeCategory}-${activeAlbum}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {filtered.length === 0 ? (
            <Card className="glass p-12 text-center sm:p-16">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <Sparkles className="size-7 text-muted-foreground/60" />
              </div>
              <p className="text-lg font-semibold">Tidak ada media ditemukan</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Coba ubah filter tipe, kategori, atau album untuk melihat lebih banyak
                konten.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <X className="size-4" />
                  Reset Filter
                </button>
              )}
            </Card>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
              {filtered.map((g, idx) => (
                <GalleryCard
                  key={g.id}
                  gallery={g}
                  delay={idx * 0.04}
                  onOpen={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ===== Lightbox Dialog ===== */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && closeLightbox()}
      >
        <DialogContent
          className="max-w-5xl gap-0 overflow-hidden rounded-2xl border-border/60 bg-black/95 p-0"
          showCloseButton
        >
          <DialogTitle className="sr-only">Galeri Media</DialogTitle>
          <DialogDescription className="sr-only">
            Navigasi: gunakan tombol panah kiri/kanan untuk berpindah, Esc untuk menutup.
          </DialogDescription>

          {current && (
            <div className="relative flex min-h-[50vh] w-full items-center justify-center sm:h-[72vh]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex h-full w-full items-center justify-center p-4"
                >
                  {current.type === "VIDEO" ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                      <div className="flex size-20 items-center justify-center rounded-full bg-white/10">
                        <VideoIcon className="size-10 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{current.title}</p>
                        <a
                          href={current.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                        >
                          <ExternalLink className="size-4" />
                          Buka Video
                        </a>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={current.url}
                      alt={current.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next */}
              {filtered.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    aria-label="Media sebelumnya"
                    className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Media berikutnya"
                    className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Caption + counter */}
          {current && (
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{current.title}</p>
                {current.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/60">
                    {current.description}
                  </p>
                )}
                {current.album && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/80">
                    <Film className="size-3" />
                    {current.album}
                  </span>
                )}
              </div>
              <div className="shrink-0 rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium tabular-nums text-white">
                {(lightboxIndex ?? 0) + 1} / {filtered.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function GalleryCard({
  gallery,
  delay,
  onOpen,
}: {
  gallery: GalleryItem;
  delay: number;
  onOpen: () => void;
}) {
  const g = gallery;
  const isVideo = g.type === "VIDEO";
  const thumb = g.thumbnail || g.url;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Buka media: ${g.title}`}
    >
      <BlurImage
        src={thumb}
        alt={g.title}
        containerClassName="w-full"
        className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Overlay */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold text-white">{g.title}</h3>
            {g.album && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                <Film className="size-2.5" />
                {g.album}
              </span>
            )}
          </div>
          {isVideo && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-foreground">
              <VideoIcon className="size-4" />
            </span>
          )}
        </div>
      </div>

      {/* Featured badge */}
      {g.featured && (
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur">
          <Sparkles className="size-2.5 fill-current" />
          Unggulan
        </div>
      )}

      {/* Type chip */}
      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
        {isVideo ? <VideoIcon className="size-2.5" /> : <ImageIcon className="size-2.5" />}
        {isVideo ? "Video" : "Foto"}
      </div>
    </motion.button>
  );
}
