"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search,
  X,
  Newspaper,
  Calendar,
  Eye,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Clock,
  Hash,
  TrendingUp,
  User,
  BookOpen,
  Tag as TagIcon } from "lucide-react";
import { Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import { DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/motion-primitives";
import { cn, formatDateShort, truncate, stripHtml, getInitials } from "@/lib/utils";

// ===== Types =====
export type BlogCategoryItem = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type BlogTagItem = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPostItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  featured: boolean;
  viewCount: number;
  readingTime: number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  author: { name: string | null; image: string | null } | null;
  category: BlogCategoryItem | null;
  tags: BlogTagItem[];
};

type SortKey = "newest" | "popular";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Terbaru" },
  { value: "popular", label: "Terpopuler" },
];

const PAGE_SIZE = 6;

// Accent gradients per category for placeholder covers
const categoryGradients: Record<string, string> = {
  "Digital Marketing": "from-amber-500 to-orange-500",
  "Web Development": "from-emerald-500 to-teal-500",
  "Video Production": "from-cyan-500 to-teal-500",
  Photography: "from-violet-500 to-purple-500",
  Branding: "from-fuchsia-500 to-pink-500",
  Design: "from-rose-500 to-pink-500",
  Finance: "from-teal-500 to-emerald-500",
  Default: "bg-primary",
};

function gradientFor(category: string | null): string {
  if (!category) return categoryGradients.Default;
  return categoryGradients[category] ?? categoryGradients.Default;
}

// ===== Main component =====
export function BlogExplorer({
  posts,
  categories,
  tags,
}: {
  posts: BlogPostItem[];
  categories: BlogCategoryItem[];
  tags: BlogTagItem[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  // Featured post (first featured=true), excluded from the grid
  const featuredPost = useMemo(() => {
    return (
      posts.find((p) => p.featured) ?? null
    );
  }, [posts]);

  // Compute tag counts for the tag cloud — only show top tags (max 15)
  const tagCounts = useMemo(() => {
    const map = new Map<string, { tag: BlogTagItem; count: number }>();
    for (const p of posts) {
      for (const t of p.tags) {
        const cur = map.get(t.id);
        if (cur) cur.count += 1;
        else map.set(t.id, { tag: t, count: 1 });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [posts]);

  // Recent posts (newest 5 by publishedAt/createdAt) for sidebar mini list
  const recentPosts = useMemo(() => {
    return [...posts]
      .sort(
        (a, b) =>
          +new Date(b.publishedAt ?? b.createdAt) -
          +new Date(a.publishedAt ?? a.createdAt),
      )
      .slice(0, 5);
  }, [posts]);

  // Popular posts (top 5 by viewCount) for sidebar mini list
  const popularPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  }, [posts]);

  // Filtered + sorted list (memoized)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = posts.filter((p) => {
      // skip featured post in grid
      if (featuredPost && p.id === featuredPost.id) return false;

      const matchCat = activeCategory === "all" || p.category?.id === activeCategory;
      if (!matchCat) return false;
      const matchTags =
        activeTagIds.length === 0 ||
        activeTagIds.every((tid) => p.tags.some((t) => t.id === tid));
      if (!matchTags) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.excerpt?.toLowerCase().includes(q) ?? false) ||
        stripHtml(p.content).toLowerCase().includes(q)
      );
    });

    const sorted = [...list];
    if (sort === "newest") {
      sorted.sort(
        (a, b) =>
          +new Date(b.publishedAt ?? b.createdAt) -
          +new Date(a.publishedAt ?? a.createdAt),
      );
    } else if (sort === "popular") {
      sorted.sort(
        (a, b) =>
          b.viewCount - a.viewCount ||
          +new Date(b.publishedAt ?? b.createdAt) -
            +new Date(a.publishedAt ?? a.createdAt),
      );
    }
    return sorted;
  }, [posts, query, activeCategory, activeTagIds, sort, featuredPost]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Stats
  const stats = useMemo(
    () => ({
      total: posts.length,
      featured: posts.filter((p) => p.featured).length,
      categories: categories.length,
      views: posts.reduce((acc, p) => acc + p.viewCount, 0),
    }),
    [posts, categories],
  );

  const resetFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setActiveTagIds([]);
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters =
    query !== "" || activeCategory !== "all" || activeTagIds.length > 0 || sort !== "newest";

  const toggleTag = (id: string) => {
    setActiveTagIds((cur) =>
      cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id],
    );
    setPage(1);
  };

  // Compact page numbers with ellipsis
  const pageItems = useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    const showAround = 1;
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
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <Card className="glass p-3 text-center sm:p-4">
          <Newspaper className="mx-auto mb-2 size-5 text-primary" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.total} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Total Artikel
          </p>
        </Card>
        <Card className="glass p-3 text-center sm:p-4">
          <Star className="mx-auto mb-2 size-5 text-amber-500" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.featured} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Unggulan
          </p>
        </Card>
        <Card className="glass p-3 text-center sm:p-4">
          <LayoutGrid className="mx-auto mb-2 size-5 text-chart-2" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.categories} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Kategori
          </p>
        </Card>
        <Card className="glass p-3 text-center sm:p-4">
          <Eye className="mx-auto mb-2 size-5 text-chart-3" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.views} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Total Views
          </p>
        </Card>
      </div>

      {/* ===== Featured Hero Post ===== */}
      {featuredPost && (
        <div className="mb-12">
          <FeaturedHero post={featuredPost} />
        </div>
      )}

      {/* ===== Layout: grid + sidebar ===== */}
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* ===== Main column ===== */}
        <div className="min-w-0">
          {/* Toolbar: search + sort */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari artikel..."
                aria-label="Cari artikel"
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
              <TagFilterDropdown
                tags={tags}
                activeTagIds={activeTagIds}
                onToggle={toggleTag}
                onClear={() => {
                  setActiveTagIds([]);
                  setPage(1);
                }}
              />
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
                <SelectTrigger className="h-10 w-[160px] rounded-full glass">
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

          {/* Category pills */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
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

          {/* Active tag chips */}
          {activeTagIds.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Tag aktif:</span>
              {activeTagIds.map((tid) => {
                const tag = tags.find((t) => t.id === tid);
                if (!tag) return null;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => toggleTag(tid)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Hash className="size-3" />
                    {tag.name}
                    <X className="size-3" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Result count */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Menampilkan <strong className="text-foreground">{paged.length}</strong> dari{" "}
              <strong className="text-foreground">{filtered.length}</strong> artikel
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

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory}-${sort}-${query}-${currentPage}-${activeTagIds.join(",")}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {paged.length === 0 ? (
                <EmptyState onReset={resetFilters} />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {paged.map((p, idx) => (
                    <PostCard key={p.id} post={p} delay={idx * 0.05} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Pagination artikel"
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
                          ? "bg-primary text-primary-foreground shadow-md"
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

        {/* ===== Sidebar ===== */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Categories list */}
          <SidebarCard title="Kategori" icon={<LayoutGrid className="size-4 text-primary" />}>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("all");
                    setPage(1);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    activeCategory === "all"
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span>Semua Kategori</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums">
                    {posts.length}
                  </span>
                </button>
              </li>
              {categories.map((c) => {
                const count = posts.filter((p) => p.category?.id === c.id).length;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(c.id);
                        setPage(1);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                        activeCategory === c.id
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums">
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </SidebarCard>

          {/* Popular tags cloud */}
          {tagCounts.length > 0 && (
            <SidebarCard title="Tag Populer" icon={<TagIcon className="size-4 text-chart-2" />}>
              <div className="flex flex-wrap gap-1.5">
                {tagCounts.map(({ tag, count }) => {
                  const active = activeTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      title={`${tag.name} (${count} artikel)`}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <Hash className="size-2.5" />
                      {tag.name}
                      <span
                        className={cn(
                          "ml-0.5 rounded-full px-1.5 text-[9px] tabular-nums",
                          active ? "bg-primary-foreground/20" : "bg-muted",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SidebarCard>
          )}

          {/* Recent posts mini list */}
          {recentPosts.length > 0 && (
            <SidebarCard title="Artikel Terbaru" icon={<Clock className="size-4 text-chart-3" />}>
              <ul className="space-y-3">
                {recentPosts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="group flex gap-3 rounded-lg p-1 transition-colors hover:bg-accent"
                    >
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-white",
                          gradientFor(p.category?.name ?? null),
                        )}
                      >
                        <Newspaper className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-medium leading-snug transition-colors group-hover:text-primary">
                          {p.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatDateShort(p.publishedAt ?? p.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          )}

          {/* Popular posts mini list */}
          {popularPosts.length > 0 && (
            <SidebarCard title="Artikel Terpopuler" icon={<TrendingUp className="size-4 text-amber-500" />}>
              <ul className="space-y-3">
                {popularPosts.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="group flex gap-3 rounded-lg p-1 transition-colors hover:bg-accent"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-medium leading-snug transition-colors group-hover:text-primary">
                          {p.title}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Eye className="size-2.5" />
                          {p.viewCount.toLocaleString("id-ID")} views
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          )}

          {/* CTA card */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-5">
            <BookOpen className="mb-2 size-6 text-primary" />
            <p className="text-sm font-semibold">Butuh konten yang lebih dalam?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hubungi saya untuk konsultasi strategi konten &amp; digital marketing.
            </p>
            <Button asChild size="sm" className="mt-4 w-full rounded-full">
              <Link href="/contact">
                Konsultasi Sekarang
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ===== Sub-components =====

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
          layoutId="activeBlogCat"
          className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}

function TagFilterDropdown({
  tags,
  activeTagIds,
  onToggle,
  onClear,
}: {
  tags: BlogTagItem[];
  activeTagIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 gap-1.5 rounded-full glass"
        >
          <TagIcon className="size-4" />
          <span className="hidden sm:inline">Tag</span>
          {activeTagIds.length > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeTagIds.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Filter berdasarkan tag</span>
          {activeTagIds.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Bersihkan
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tags.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground">
            Belum ada tag tersedia.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {tags.map((t) => (
              <DropdownMenuCheckboxItem
                key={t.id}
                checked={activeTagIds.includes(t.id)}
                onCheckedChange={() => onToggle(t.id)}
                onSelect={(e) => e.preventDefault()}
                className="text-sm"
              >
                <Hash className="mr-1.5 size-3 text-muted-foreground" />
                {t.name}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {children}
    </Card>
  );
}

function FeaturedHero({ post }: { post: BlogPostItem }) {
  const gradient = gradientFor(post.category?.name ?? null);
  const cover = post.coverImage || null;
  return (
    <SectionRevealFeatured>
      <Link href={`/blog/${post.slug}`} className="group block">
        <Card className="glass-strong relative overflow-hidden p-0 lift">
          <div className="grid md:grid-cols-2">
            {/* Image / gradient */}
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[320px]">
              {cover ? (
                <img
                  src={cover}
                  alt={post.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div
                  className={cn(
                    "flex size-full items-center justify-center bg-primary/10",
                    gradient,
                  )}
                >
                  <Newspaper className="size-14 text-white/80" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-black/60 md:bg-primary" aria-hidden />
              {/* Featured badge */}
              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md backdrop-blur">
                <Star className="size-3 fill-current" />
                Artikel Unggulan
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
<h2 className="text-2xl font-bold leading-tight tracking-tight transition-colors group-hover:text-primary sm:text-3xl">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {truncate(stripHtml(post.excerpt), 200)}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {post.author && (
                  <span className="inline-flex items-center gap-1.5">
                    <AuthorAvatar name={post.author.name ?? "?"} image={post.author.image} size={20} />
                    <span className="font-medium text-foreground/80">
                      {post.author.name ?? "Anonim"}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDateShort(post.publishedAt ?? post.createdAt)}
                </span>
                {post.readingTime > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {post.readingTime} mnt baca
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3" />
                  {post.viewCount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-transform group-hover:scale-[1.02]">
                  Baca Selengkapnya
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </SectionRevealFeatured>
  );
}

// Local reveal wrapper for the featured hero (uses motion from framer-motion already imported).
function SectionRevealFeatured({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function AuthorAvatar({
  name,
  image,
  size = 32,
}: {
  name: string;
  image: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-border"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ring-1 ring-border"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(name) || "?"}
    </span>
  );
}

function PostCard({ post, delay }: { post: BlogPostItem; delay: number }) {
  const gradient = gradientFor(post.category?.name ?? null);
  const cover = post.coverImage || null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <Card className="glass relative flex h-full flex-col overflow-hidden p-0 lift">
          {/* Cover */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {cover ? (
              <img
                src={cover}
                alt={post.title}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <div
                className={cn(
                  "flex size-full items-center justify-center bg-primary/10",
                  gradient,
                )}
              >
                <Newspaper className="size-12 text-white/80" />
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-0 bg-black/60 opacity-70"
              aria-hidden
            />
            {post.featured && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur">
                <Star className="size-3 fill-current" />
                Unggulan
              </div>
            )}
            {post.category && (
              <div className="absolute right-3 top-3">
                </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                <Eye className="size-3" />
                {post.viewCount.toLocaleString("id-ID")}
              </div>
              {post.readingTime > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                  <Clock className="size-3" />
                  {post.readingTime} mnt
                </div>
              )}
            </div>
            <div className="absolute bottom-3 right-3 flex size-9 translate-y-2 items-center justify-center rounded-full bg-white/95 text-foreground opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <ArrowRight className="size-4" />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col space-y-3 p-5">
            <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                {truncate(stripHtml(post.excerpt), 130)}
              </p>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    <Hash className="mr-0.5 size-2" />
                    {t.name}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Author + date */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              {post.author ? (
                <div className="flex min-w-0 items-center gap-2">
                  <AuthorAvatar
                    name={post.author.name ?? "?"}
                    image={post.author.image}
                    size={24}
                  />
                  <span className="truncate text-[11px] font-medium text-foreground/80">
                    {post.author.name ?? "Anonim"}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <User className="size-3" />
                  Anonim
                </span>
              )}
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="size-3" />
                {formatDateShort(post.publishedAt ?? post.createdAt)}
              </span>
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
      </div>
      <p className="text-lg font-semibold">Tidak ada artikel ditemukan</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Coba kata kunci lain atau ubah filter kategori/tag untuk melihat lebih
        banyak artikel.
      </p>
      <Button type="button" variant="outline" onClick={onReset} className="mt-6 rounded-full">
        <X className="size-4" />
        Reset Filter
      </Button>
    </Card>
  );
}
