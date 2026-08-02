"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Briefcase, Star, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncate, stripHtml } from "@/lib/utils";

interface RelatedProject {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string;
  thumbnail: string | null;
  banner: string | null;
  featured: boolean;
  category: { name: string } | null;
  images: { url: string }[];
}

export function RelatedProjectsCarousel({ projects }: { projects: RelatedProject[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (projects.length === 0) return null;

  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          {projects.length} proyek lainnya
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="size-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="size-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Scrollable carousel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        {projects.map((p, i) => {
          const thumb = p.thumbnail || p.banner || p.images[0]?.url || null;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="snap-start shrink-0 w-[280px] sm:w-[340px]"
            >
              <Link href={`/portfolio/${p.slug}`} className="group block h-full">
                <Card className="glass relative h-full overflow-hidden p-0 lift">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={p.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-primary">
                        <Briefcase className="size-10 text-white/80" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-70" aria-hidden />
                    {p.featured && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur">
                        <Star className="size-2.5 fill-current" />
                        Unggulan
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-5">
                    {p.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {p.category.name}
                      </Badge>
                    )}
                    <h3 className="line-clamp-1 text-base font-bold transition-colors group-hover:text-primary">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {truncate(stripHtml(p.excerpt), 90)}
                      </p>
                    )}
                    <div className="flex items-center gap-1 pt-2 text-xs font-medium text-primary">
                      Lihat detail
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (projects.length > 3 ? 60 : 100))}%` }} />
      </div>
    </div>
  );
}
