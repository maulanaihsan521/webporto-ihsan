"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { List, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ contentHtml }: { contentHtml: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Parse headings from the rendered HTML in the DOM
    const proseEl = document.querySelector(".prose-content");
    if (!proseEl) return;
    const headings = Array.from(proseEl.querySelectorAll("h2, h3"));
    const parsed: TocItem[] = headings.map((h, i) => {
      const text = h.textContent || `Section ${i + 1}`;
      const id = h.id || `heading-${i}`;
      h.id = id;
      return { id, text, level: h.tagName === "H2" ? 2 : 3 };
    });
    setItems(parsed);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [contentHtml]);

  if (items.length < 2) return null;

  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2 mb-3">
        <List className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Daftar Isi</h3>
      </div>
      <nav className="space-y-0.5">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "flex items-start gap-1.5 text-xs leading-relaxed py-1.5 px-2 rounded-lg transition-colors",
              item.level === 3 && "pl-6",
              activeId === item.id
                ? "text-primary bg-primary/5 font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <ChevronRight className={cn("size-3 mt-0.5 shrink-0", activeId === item.id ? "text-primary" : "text-muted-foreground/50")} />
            <span className="line-clamp-2">{item.text}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
