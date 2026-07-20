"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Home, User, Briefcase, Code, LineChart, Newspaper, Image, Award, Mail, Settings, FileText, HelpCircle, TrendingUp, Loader2, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PAGES = [
  { label: "Home", href: "/", icon: Home, group: "Pages" },
  { label: "About Me", href: "/about", icon: User, group: "Pages" },
  { label: "Services", href: "/services", icon: Settings, group: "Pages" },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase, group: "Work" },
  { label: "Gallery", href: "/gallery", icon: Image, group: "Work" },
  { label: "Certificates", href: "/certificates", icon: Award, group: "Work" },
  { label: "Experience", href: "/experience", icon: Briefcase, group: "Work" },
  { label: "Education", href: "/education", icon: FileText, group: "Work" },
  { label: "Skills", href: "/skills", icon: Code, group: "Work" },
  { label: "Financial Market", href: "/financial-market", icon: LineChart, group: "Market" },
  { label: "Blog", href: "/blog", icon: Newspaper, group: "Content" },
  { label: "Testimonials", href: "/testimonials", icon: User, group: "Content" },
  { label: "FAQ", href: "/faq", icon: HelpCircle, group: "Content" },
  { label: "Contact", href: "/contact", icon: Mail, group: "Pages" },
  { label: "Admin Dashboard", href: "/admin", icon: Settings, group: "System" },
];

const TYPE_ICONS: Record<string, any> = {
  blog: FileText,
  portfolio: Briefcase,
  certificate: Award,
  market: TrendingUp,
};

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  type: string;
  href: string;
  client?: string;
  issuer?: string;
  instrument?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ posts: SearchResult[]; portfolios: SearchResult[]; certificates: SearchResult[]; marketArticles: SearchResult[] }>({ posts: [], portfolios: [], certificates: [], marketArticles: [] });
  const [loading, setLoading] = useState(false);

  const runCmd = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults({ posts: [], portfolios: [], certificates: [], marketArticles: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ posts: [], portfolios: [], certificates: [], marketArticles: [] });
    }
  }, [open]);

  const allResults = [...results.posts, ...results.portfolios, ...results.certificates, ...results.marketArticles];
  const hasResults = allResults.length > 0;
  const isSearching = query.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl">
        <CommandPrimitive className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-4 [&_[cmdk-input-wrapper]_svg]:text-muted-foreground [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:size-4">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Cari halaman, artikel, portfolio..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
          <CommandPrimitive.List className="max-h-[450px] overflow-y-auto overflow-x-hidden p-2">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
              {isSearching ? "Tidak ada hasil ditemukan." : "Ketik untuk mencari..."}
            </CommandPrimitive.Empty>

            {/* Live search results */}
            {hasResults && (
              <CommandPrimitive.Group heading="Hasil Pencarian">
                {results.posts.map((r) => (
                  <SearchItem key={`post-${r.id}`} result={r} onSelect={runCmd} />
                ))}
                {results.portfolios.map((r) => (
                  <SearchItem key={`port-${r.id}`} result={r} onSelect={runCmd} />
                ))}
                {results.certificates.map((r) => (
                  <SearchItem key={`cert-${r.id}`} result={r} onSelect={runCmd} />
                ))}
                {results.marketArticles.map((r) => (
                  <SearchItem key={`market-${r.id}`} result={r} onSelect={runCmd} />
                ))}
              </CommandPrimitive.Group>
            )}

            {/* Navigation suggestions (always show, but lower priority when searching) */}
            {(!isSearching || !hasResults) && (
              <CommandPrimitive.Group heading={isSearching ? "Navigasi" : "Suggestions"}>
                {PAGES.map((p) => (
                  <CommandPrimitive.Item
                    key={p.href}
                    value={`${p.label} ${p.group}`}
                    onSelect={() => runCmd(p.href)}
                    className="flex items-center gap-3 rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <p.icon className="size-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.group}</div>
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}
          </CommandPrimitive.List>
          <div className="border-t px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1.5 py-0.5">↑</kbd>
                <kbd className="rounded border bg-muted px-1.5 py-0.5">↓</kbd>
                navigasi
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1.5 py-0.5">↵</kbd>
                pilih
              </span>
            </div>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="size-3" /> Buka
            </span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

function SearchItem({ result, onSelect }: { result: SearchResult; onSelect: (href: string) => void }) {
  const Icon = TYPE_ICONS[result.type] || FileText;
  const typeLabels: Record<string, string> = {
    blog: "Blog",
    portfolio: "Portfolio",
    certificate: "Sertifikat",
    market: "Market",
  };
  return (
    <CommandPrimitive.Item
      value={`${result.title} ${result.type}`}
      onSelect={() => onSelect(result.href)}
      className="flex items-center gap-3 rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <Icon className="size-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{result.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {result.excerpt || result.client || result.issuer || result.instrument || typeLabels[result.type]}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">{typeLabels[result.type]}</span>
    </CommandPrimitive.Item>
  );
}
