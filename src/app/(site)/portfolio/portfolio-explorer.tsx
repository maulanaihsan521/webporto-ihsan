"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Briefcase,
  Calendar,
  Eye,
  Star,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/motion-primitives";
import { cn, formatDateShort, truncate, stripHtml } from "@/lib/utils";

export type PortfolioImageItem = {
  id: string;
  url: string;
  caption: string | null;
  order: number;
};

export type PortfolioCategoryItem = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type PortfolioItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string;
  thumbnail: string | null;
  banner: string | null;
  role: string | null;
  client: string | null;
  featured: boolean;
  viewCount: number;
  projectDate: Date | string | null;
  technologies: string | null;
  createdAt: Date | string;
  category: PortfolioCategoryItem | null;
  images: PortfolioImageItem[];
};

type SortKey = "newest" | "oldest" | "featured" | "viewed";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "featured", label: "Unggulan" },
  { value: "viewed", label: "Terpopuler" },
];

const PAGE_SIZE = 9;

// accent gradients per category for thumbnails / placeholders
const categoryGradients: Record<string, string> = {
  "Web Development": "from-emerald-500 to-teal-500",
  "Video Production": "from-cyan-500 to-teal-500",
  "Digital Marketing": "from-amber-500 to-orange-500",
  Photography: "from-violet-500 to-purple-500",
  Branding: "from-fuchsia-500 to-pink-500",
  Design: "from-rose-500 to-pink-500",
  Default: "from-primary to-chart-2",
};

function gradientFor(category: string | null): string {
  if (!category) return categoryGradients.Default;
  return categoryGradients[category] ?? categoryGradients.Default;
}

export function PortfolioExplorer({
  portfolios,
  categories,
}: {
  portfolios: PortfolioItem[];
  categories: PortfolioCategoryItem[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  // filtered + sorted list (memoized)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = portfolios.filter((p) => {
      const matchCat = activeCategory === "all" || p.category?.id === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      const techs = (p.technologies ?? "").toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.client?.toLowerCase().includes(q) ?? false) ||
        techs.includes(q) ||
        (p.excerpt?.toLowerCase().includes(q) ?? false) ||
        stripHtml(p.description).toLowerCase().includes(q)
      );
    });

    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "oldest":
        sorted.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case "featured":
        sorted.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            +new Date(b.createdAt) - +new Date(a.createdAt),
        );
        break;
      case "viewed":
        sorted.sort((a, b) => b.viewCount - a.viewCount);
        break;
    }
    return sorted;
  }, [portfolios, query, activeCategory, sort]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // stats
  const stats = useMemo(
    () => ({
      total: portfolios.length,
      featured: portfolios.filter((p) => p.featured).length,
      categories: categories.length,
    }),
    [portfolios, categories],
  );

  const resetFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters = query !== "" || activeCategory !== "all" || sort !== "newest";

  // page number array (compact)
  const pageItems = useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    const showAround = 1; // pages shown on each side of current
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - showAround && i <= currentPage + showAround)
      ) {
        items.push(i);
      } else if (items[items.length - 1] !== "ellipsis") {
        items.push("ellipsis");
      }
    }
    return items;
  }, [totalPages, currentPage]);

  return (
    <div>
      {/* ===== Stats ===== */}
      <div className="mb-10 grid grid-cols-3 gap-3 sm:gap-5">
        <Card className="glass p-4 text-center sm:p-6">
          <Briefcase className="mx-auto mb-2 size-5 text-primary" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.total} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Total Proyek
          </p>
        </Card>
        <Card className="glass p-4 text-center sm:p-6">
          <Star className="mx-auto mb-2 size-5 text-amber-500" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.featured} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Unggulan
          </p>
        </Card>
        <Card className="glass p-4 text-center sm:p-6">
          <LayoutGrid className="mx-auto mb-2 size-5 text-chart-2" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.categories} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Kategori
          </p>
        </Card>
      </div>

      {/* ===== Toolbar: search + sort ===== */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari proyek, klien, atau teknologi..."
            aria-label="Cari portfolio"
            className="h-12 w-full rounded-full border border-border bg-card/60 pl-11 pr-11 text-sm shadow-sm outline-none backdrop-blur transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:inline">
            Urutkan
          </span>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as SortKey);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[180px] rounded-full glass">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== Category Pills ===== */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <CategoryPill
          active={activeCategory === "all"}
          onClick={() => {
            setActiveCategory("all");
            setPage(1);
          }}
        >
          Semua
        </CategoryPill>
        {categories.map((c) => (
          <CategoryPill
            key={c.id}
            active={activeCategory === c.id}
            onClick={() => {
              setActiveCategory(c.id);
              setPage(1);
            }}
          >
            {c.name}
          </CategoryPill>
        ))}
      </div>

      {/* ===== Result count ===== */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Menampilkan <strong className="text-foreground">{paged.length}</strong> dari{" "}
          <strong className="text-foreground">{filtered.length}</strong> proyek
          {currentPage > 1 && (
            <>
              {" "}
              · Halaman <strong className="text-foreground">{currentPage}</strong>/{totalPages}
            </>
          )}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <X className="size-3" /> Reset filter
          </button>
        )}
      </div>

      {/* ===== Grid ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeCategory}-${sort}-${query}-${currentPage}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {paged.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((p, idx) => (
                <PortfolioCard key={p.id} portfolio={p} delay={idx * 0.05} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ===== Pagination ===== */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-12 flex flex-wrap items-center justify-center gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-9 rounded-full gap-1.5"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </Button>

          <div className="flex items-center gap-1.5">
            {pageItems.map((item, i) =>
              item === "ellipsis" ? (
                <span
                  key={`e-${i}`}
                  className="flex size-9 items-center justify-center text-muted-foreground"
                >
                  •••
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={item === currentPage ? "page" : undefined}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    item === currentPage
                      ? "bg-gradient-to-r from-primary to-chart-2 text-primary-foreground shadow-md"
                      : "border border-border bg-background/60 hover:bg-accent",
                  )}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-9 rounded-full gap-1.5"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}

function CategoryPill({
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
        "relative overflow-hidden rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="activePortfolioCat"
          className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-chart-2 shadow-md"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}

function PortfolioCard({
  portfolio,
  delay,
}: {
  portfolio: PortfolioItem;
  delay: number;
}) {
  const p = portfolio;
  const gradient = gradientFor(p.category?.name ?? null);
  const thumb = p.thumbnail || p.banner || p.images[0]?.url || null;
  const techs = (p.technologies ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/portfolio/${p.slug}`} className="group block h-full">
        <Card className="glass relative h-full overflow-hidden p-0 lift">
          {/* Thumbnail */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {thumb ? (
              <img
                src={thumb}
                alt={p.title}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <div
                className={cn(
                  "flex size-full items-center justify-center bg-gradient-to-br",
                  gradient,
                )}
              >
                <Briefcase className="size-12 text-white/80" />
              </div>
            )}

            {/* Overlay gradient for legibility */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"
              aria-hidden
            />

            {/* Featured star */}
            {p.featured && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur">
                <Star className="size-3 fill-current" />
                Unggulan
              </div>
            )}

            {/* Category badge */}
            {p.category && (
              <div className="absolute right-3 top-3">
                <Badge
                  variant="secondary"
                  className="border-0 bg-black/40 text-white backdrop-blur-md"
                >
                  {p.category.name}
                </Badge>
              </div>
            )}

            {/* View count chip */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
              <Eye className="size-3" />
              {p.viewCount.toLocaleString("id-ID")}
            </div>

            {/* Hover CTA chip */}
            <div className="absolute bottom-3 right-3 flex size-9 translate-y-2 items-center justify-center rounded-full bg-white/95 text-foreground opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <ArrowRight className="size-4" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 p-5">
            <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">
              {p.title}
            </h3>

            {p.excerpt && (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {truncate(stripHtml(p.excerpt), 120)}
              </p>
            )}

            {/* Tech badges */}
            {techs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {techs.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
                {(p.technologies ?? "").split(",").filter(Boolean).length > 3 && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    +{(p.technologies ?? "").split(",").filter(Boolean).length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Meta row */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              {p.client ? (
                <span className="truncate font-medium text-foreground/80">{p.client}</span>
              ) : (
                <span className="truncate">Personal Project</span>
              )}
              {p.projectDate && (
                <span className="inline-flex shrink-0 items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDateShort(p.projectDate)}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="glass p-12 text-center sm:p-16">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Sparkles className="size-7 text-muted-foreground/60" />
      </div>
      <p className="text-lg font-semibold">Tidak ada proyek ditemukan</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Coba kata kunci lain atau ubah filter kategori untuk melihat lebih banyak
        proyek.
      </p>
      <Button type="button" variant="outline" onClick={onReset} className="mt-6 rounded-full">
        <X className="size-4" />
        Reset Filter
      </Button>
    </Card>
  );
}
