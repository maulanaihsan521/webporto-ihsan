"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription } from "@/components/ui/dialog";
import { Image as ImageIcon,
  Video as VideoIcon,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Film,
  Layers,
  ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/motion-primitives";
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
      {/* ===== Stats — Horizontal Bar ===== */}
      <div className="mb-6 flex flex-wrap items-stretch justify-center divide-x divide-border rounded-xl sm:rounded-2xl glass overflow-hidden">
        <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
          <Layers className="size-3.5 sm:size-5 text-primary shrink-0" />
          <div className="text-left leading-tight">
            <div className="text-sm font-bold sm:text-xl"><Counter to={stats.total} /></div>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Total Media</p>
          </div>
        </div>
        <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
          <ImageIcon className="size-3.5 sm:size-5 text-primary shrink-0" />
          <div className="text-left leading-tight">
            <div className="text-sm font-bold sm:text-xl"><Counter to={stats.images} /></div>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Foto</p>
          </div>
        </div>
        <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
          <VideoIcon className="size-3.5 sm:size-5 text-primary shrink-0" />
          <div className="text-left leading-tight">
            <div className="text-sm font-bold sm:text-xl"><Counter to={stats.videos} /></div>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Video</p>
          </div>
        </div>
        <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
          <Film className="size-3.5 sm:size-5 text-primary shrink-0" />
          <div className="text-left leading-tight">
            <div className="text-sm font-bold sm:text-xl"><Counter to={stats.albums} /></div>
            <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">Album</p>
          </div>
        </div>
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
                      className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
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
      <div>
          {filtered.length === 0 ? (
            <Card className="glass p-12 text-center sm:p-16">
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
              {filtered.map((g, idx) => (
                <GalleryCard
                  key={g.id}
                  gallery={g}
                  eager={idx < 8}
                  onOpen={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}
      </div>

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
  eager,
  onOpen,
}: {
  gallery: GalleryItem;
  eager?: boolean;
  onOpen: () => void;
}) {
  const g = gallery;
  const isVideo = g.type === "VIDEO";
  const thumb = g.thumbnail || g.url;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-2xl border-0 bg-muted text-left shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 aspect-[3/4] sm:aspect-[4/5]"
      aria-label={`Buka media: ${g.title}`}
    >
      <div className="absolute inset-0">
        { }
        <img
          src={thumb}
          alt={g.title}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "low"}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      {/* Overlay */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
        aria-hidden
      >
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-sm font-semibold text-white">{g.title}</h2>
            {g.album && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                <Film className="size-2.5" />
                {g.album}
              </span>
            )}
          </div>
          {isVideo && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900">
              <VideoIcon className="size-4" />
            </span>
          )}
        </div>
      </div>

      {/* Featured badge */}
      {g.featured && (
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur">
          Unggulan
        </div>
      )}

      {/* Type chip */}
      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
        {isVideo ? <VideoIcon className="size-2.5" /> : <ImageIcon className="size-2.5" />}
        {isVideo ? "Video" : "Foto"}
      </div>
    </button>
  );
}
