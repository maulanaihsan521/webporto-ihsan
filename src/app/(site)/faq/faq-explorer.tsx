"use client";

import { useMemo, useState } from "react";
import { Search, HelpCircle, X, MessageCircle, Tag } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
};

type FaqExplorerProps = {
  items: FaqItem[];
};

const categoryAccent: Record<string, string> = {
  Layanan: "from-amber-500 to-orange-500",
  Pembayaran: "from-teal-500 to-emerald-500",
  Finansial: "from-violet-500 to-fuchsia-500",
};

const fallbackAccent = "from-cyan-500 to-teal-500";

function accentFor(cat: string) {
  return categoryAccent[cat] ?? fallbackAccent;
}

export function FaqExplorer({ items }: FaqExplorerProps) {
  const [query, setQuery] = useState("");

  // Group FAQs by category (preserve insertion order)
  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const item of items) {
      const cat = item.category || "Lainnya";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const categories = grouped.map(([cat]) => cat);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        (f.category ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  // Re-group filtered items (preserving category order from `grouped`)
  const groupedFiltered = useMemo(() => {
    const filteredSet = new Set(filtered.map((f) => f.id));
    return grouped
      .map(([cat, list]) => [cat, list.filter((f) => filteredSet.has(f.id))] as const)
      .filter(([, list]) => list.length > 0);
  }, [grouped, filtered]);

  const hasResults = groupedFiltered.length > 0;
  const totalShown = filtered.length;

  const handleChipClick = (cat: string) => {
    const el = document.getElementById(`faq-cat-${cat.replace(/\s+/g, "-").toLowerCase()}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div>
      {/* Search + category chips */}
      <div className="mx-auto max-w-3xl">
        <Card className="glass-strong relative overflow-hidden p-4 sm:p-6">
          <div className="relative z-10">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari pertanyaan atau kata kunci..."
                className="h-12 rounded-full pl-10 pr-10 text-base"
                aria-label="Cari FAQ"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Category chips */}
            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="size-3.5" />
                  Kategori:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleChipClick(cat)}
                    className="rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs font-medium text-foreground/80 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Result hint */}
            {query && (
              <p className="mt-3 text-xs text-muted-foreground">
                {hasResults
                  ? `Menampilkan ${totalShown} pertanyaan untuk "${query}".`
                  : `Tidak ada hasil untuk "${query}".`}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Grouped accordions */}
      <div className="mx-auto mt-10 max-w-3xl space-y-8">
        {hasResults ? (
          groupedFiltered.map(([cat, list]) => {
            const slug = cat.replace(/\s+/g, "-").toLowerCase();
            const accent = accentFor(cat);
            return (
              <section key={cat} id={`faq-cat-${slug}`} className="scroll-mt-28">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                      accent,
                    )}
                    aria-hidden
                  >
                    <HelpCircle className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{cat}</h3>
                    <p className="text-xs text-muted-foreground">
                      {list.length} pertanyaan
                    </p>
                  </div>
                </div>

                <Card className="glass overflow-hidden p-2 sm:p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {list.map((f) => (
                      <AccordionItem
                        key={f.id}
                        value={f.id}
                        className="border-border/60 px-2 last:border-b-0"
                      >
                        <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline sm:text-base">
                          {f.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                          {f.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </section>
            );
          })
        ) : (
          <Card className="glass p-10 text-center">
            <HelpCircle className="mx-auto mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">Pertanyaan tidak ditemukan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Coba kata kunci lain atau hubungi saya langsung untuk pertanyaan Anda.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 rounded-full"
              onClick={() => setQuery("")}
            >
              <X className="size-3.5" />
              Reset pencarian
            </Button>
          </Card>
        )}
      </div>

      {/* Still have questions CTA */}
      <div className="mx-auto mt-12 max-w-3xl">
        <Card className="glass-strong relative overflow-hidden p-6 text-center sm:p-8">
          <div className="mesh-bg opacity-50" aria-hidden />
          <div className="relative z-10">
            <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
              <MessageCircle className="mr-1.5 size-3.5 text-primary" />
              Butuh bantuan lebih?
            </Badge>
            <h3 className="text-xl font-bold sm:text-2xl">Masih ada pertanyaan?</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Tidak menemukan jawaban yang Anda cari? Saya siap membantu. Hubungi saya
              dan dapatkan respons dalam 1x24 jam.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link href="/contact">
                <MessageCircle className="size-4" />
                Hubungi Saya
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
