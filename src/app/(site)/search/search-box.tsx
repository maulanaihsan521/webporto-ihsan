"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SearchBoxProps = {
  popularSearches: string[];
};

export function SearchBox({ popularSearches }: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount (browser native autofocus already covers it,
  // but this makes it explicit and robust). No setState here — safe
  // under React 19's react-hooks/set-state-in-effect rule.
  useEffect(() => {
    inputRef.current?.focus();
    // Move cursor to end of any pre-filled value
    const len = inputRef.current?.value.length ?? 0;
    inputRef.current?.setSelectionRange(len, len);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push("/search");
      return;
    }
    const params = new URLSearchParams();
    params.set("q", q);
    router.push(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
    // If there was a query in URL, clear it
    if (searchParams.get("q")) {
      router.push("/search");
    }
  };

  const handleChip = (term: string) => {
    setValue(term);
    const params = new URLSearchParams();
    params.set("q", term);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={handleSubmit} role="search" aria-label="Pencarian situs">
        <div
          className={cn(
            "glass-strong relative flex items-center gap-2 rounded-full p-2 pl-5 shadow-xl",
            "ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary/40",
          )}
        >
          <Search className="pointer-events-none size-5 shrink-0 text-primary" />
          <Input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Cari artikel, portofolio, sertifikat, galeri..."
            className="h-12 flex-1 border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0 sm:text-lg"
            aria-label="Ketik kata kunci pencarian"
            autoComplete="off"
            spellCheck={false}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus pencarian"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <Button
            type="submit"
            size="lg"
            className="shrink-0 rounded-full px-5 sm:px-7"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Cari</span>
          </Button>
        </div>
      </form>

      {/* Popular searches */}
      {popularSearches.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Pencarian populer:
          </span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleChip(term)}
              className="rounded-full border border-border/60 bg-background/50 px-3 py-1 text-xs font-medium text-foreground/80 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
