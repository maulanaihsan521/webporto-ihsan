"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Counter } from "@/components/motion-primitives";
import { cn } from "@/lib/utils";

export type SkillItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  percentage: number;
  level: string; // BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
  icon: string | null;
  description: string | null;
  color: string | null;
  featured: boolean;
  order: number;
};

const levelMeta: Record<
  string,
  { label: string; color: string; bg: string; text: string }
> = {
  BEGINNER: {
    label: "Beginner",
    color: "bg-amber-500",
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    color: "bg-cyan-500",
    bg: "bg-cyan-500/15",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  ADVANCED: {
    label: "Advanced",
    color: "bg-violet-500",
    bg: "bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
  },
  EXPERT: {
    label: "Expert",
    color: "bg-emerald-500",
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};

// accent gradient per category for progress bar fills
const categoryGradients: Record<string, string> = {
  "Digital Marketing": "from-amber-500 to-orange-500",
  "Social Media": "from-rose-500 to-pink-500",
  Photography: "from-violet-500 to-purple-500",
  Videography: "from-cyan-500 to-teal-500",
  "Video Editing": "from-orange-500 to-amber-500",
  Design: "from-fuchsia-500 to-pink-500",
  Development: "from-emerald-500 to-teal-500",
  Database: "from-green-500 to-emerald-500",
  Tools: "from-sky-500 to-cyan-500",
  "Financial Market": "from-primary to-chart-2",
  "Data Analysis": "from-chart-3 to-chart-5",
};

function gradientFor(category: string): string {
  return categoryGradients[category] ?? "from-primary to-chart-2";
}

export function SkillFilter({ skills }: { skills: SkillItem[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => set.add(s.category));
    return ["Semua", ...Array.from(set)];
  }, [skills]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
      const matchCat = activeCategory === "Semua" || s.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [skills, activeCategory, query]);

  // group filtered by category for visual sectioning
  const grouped = useMemo(() => {
    const map = new Map<string, SkillItem[]>();
    for (const s of filtered) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: skills.length,
      expert: skills.filter((s) => s.level === "EXPERT").length,
      categories: categories.length - 1,
    }),
    [skills, categories],
  );

  return (
    <div>
      {/* Stats */}
      <div className="mb-10 grid grid-cols-3 gap-3 sm:gap-5">
        <Card className="glass p-4 text-center sm:p-6">
          <Sparkles className="mx-auto mb-2 size-5 text-primary" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.total} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Total Skill
          </p>
        </Card>
        <Card className="glass p-4 text-center sm:p-6">
          <div className="mx-auto mb-2 size-5 rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/40" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.expert} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Expert Level
          </p>
        </Card>
        <Card className="glass p-4 text-center sm:p-6">
          <div className="mx-auto mb-2 flex size-5 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-500 ring-2 ring-violet-500/40">
            +
          </div>
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={stats.categories} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Kategori
          </p>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="mb-10 space-y-5">
        {/* Search */}
        <div className="relative mx-auto max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari skill, kategori, atau deskripsi..."
            className="h-12 w-full rounded-full border border-border bg-card/60 pl-11 pr-11 text-sm shadow-sm outline-none backdrop-blur transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "relative overflow-hidden rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="activeCatPill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-chart-2 shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari{" "}
          <strong className="text-foreground">{skills.length}</strong> skill
        </span>
        {(activeCategory !== "Semua" || query) && (
          <button
            type="button"
            onClick={() => {
              setActiveCategory("Semua");
              setQuery("");
            }}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <X className="size-3" /> Reset filter
          </button>
        )}
      </div>

      {/* Skills grouped by category with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + query}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-12"
        >
          {grouped.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Search className="mx-auto mb-3 size-8 text-muted-foreground/60" />
              <p className="text-base font-medium">Tidak ada skill ditemukan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Coba kata kunci atau kategori lain.
              </p>
            </Card>
          ) : (
            grouped.map(([category, items]) => (
              <div key={category}>
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className={cn(
                      "h-1 w-10 rounded-full bg-gradient-to-r",
                      gradientFor(category),
                    )}
                  />
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{category}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {items.length} skill
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((skill, idx) => {
                    const meta = levelMeta[skill.level] ?? levelMeta.INTERMEDIATE;
                    return (
                      <motion.div
                        key={skill.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.04 }}
                      >
                        <Card className="glass group relative h-full overflow-hidden p-5 lift">
                          <div
                            className={cn(
                              "pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-30",
                              gradientFor(skill.category),
                            )}
                            aria-hidden
                          />
                          <div className="relative z-10 flex h-full flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="truncate text-base font-bold leading-tight">
                                  {skill.name}
                                </h4>
                                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                                  {skill.category}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                  meta.bg,
                                  meta.text,
                                )}
                              >
                                {meta.label}
                              </span>
                            </div>

                            {skill.description && (
                              <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                {skill.description}
                              </p>
                            )}

                            {/* Progress */}
                            <div className="mt-auto pt-4">
                              <div className="mb-1.5 flex items-baseline justify-between">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Proficiency
                                </span>
                                <span className="text-xl font-bold tabular-nums">
                                  <Counter to={skill.percentage} suffix="%" />
                                </span>
                              </div>
                              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                                <motion.div
                                  className={cn(
                                    "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                                    gradientFor(skill.category),
                                  )}
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${skill.percentage}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
