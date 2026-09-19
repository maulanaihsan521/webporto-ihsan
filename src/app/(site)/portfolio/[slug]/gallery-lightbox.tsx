"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ZoomIn, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id: string;
  url: string;
  caption: string | null;
  order: number;
};

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(0);

  const openAt = (i: number) => {
    setActive(i);
    setOpen(true);
  };

  const next = useCallback(() => {
    setActive((i) => (i + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // keyboard navigation while modal open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // lock body scroll
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, next, prev]);

  if (images.length === 0) return null;

  const current = images[active];

  return (
    <>
      {/* ===== Gallery Grid ===== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {images.map((img, i) => (
          <motion.button
            key={img.id}
            type="button"
            onClick={() => openAt(i)}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              i === 0 && images.length > 4 && "sm:col-span-2 sm:row-span-2 sm:aspect-auto",
            )}
            aria-label={`Lihat gambar ${i + 1}${img.caption ? `: ${img.caption}` : ""}`}
          >
            <img
              src={img.url}
              alt={img.caption ?? `Gambar ${i + 1}`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-between gap-2 bg-black/60 p-3 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100">
              {img.caption ? (
                <span className="line-clamp-2 text-[11px] font-medium text-white">
                  {img.caption}
                </span>
              ) : (
                <span />
              )}
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900">
                <ZoomIn className="size-3.5" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ===== Lightbox Dialog ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl gap-0 overflow-hidden rounded-2xl border-border/60 bg-black/95 p-0 sm:max-w-5xl"
          showCloseButton
        >
          <DialogTitle className="sr-only">Galeri Proyek</DialogTitle>
          <DialogDescription className="sr-only">
            Navigasi: gunakan tombol panah kiri/kanan untuk berpindah gambar.
          </DialogDescription>

          <div className="relative flex h-[60vh] w-full items-center justify-center sm:h-[72vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex h-full w-full items-center justify-center"
              >
                <img
                  src={current.url}
                  alt={current.caption ?? "Gambar proyek"}
                  className="max-h-full max-w-full object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {/* Prev button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={prev}
                aria-label="Gambar sebelumnya"
                className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {/* Next button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={next}
                aria-label="Gambar berikutnya"
                className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>

          {/* Caption + counter */}
          <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-3 text-sm">
            <div className="flex min-w-0 items-center gap-2 text-white/80">
              <ImageIcon className="size-4 shrink-0" />
              <span className="truncate">
                {current.caption ?? `Gambar ${active + 1}`}
              </span>
            </div>
            <div className="shrink-0 rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium tabular-nums text-white">
              {active + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
