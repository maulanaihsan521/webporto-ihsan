import Link from "next/link";
import { TrendingUp,
  LineChart,
  Eye,
  Newspaper,
  BookOpen,
  Wallet,
  ShieldAlert,
  ArrowRight,
  Target,
  CalendarClock,
  Gauge,
  CircleDot,
  Activity,
  BarChart3,
  AlertTriangle,
  ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getBaseUrl } from "@/lib/server-site-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell } from "@/components/ui/table";
import { SectionReveal } from "@/components/motion-primitives";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { ChartWithSymbolPicker } from "../chart-picker";
import { LazyMount } from "../lazy-mount";
import { PortfolioTable, type HoldingItem } from "../portfolio-table";
import { cn, formatDateShort, truncate, stripHtml, safeJsonLd } from "@/lib/utils";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

export const metadata = {
  title: {
    absolute: "Maulana Ihsan Rohim | Financial Market Analysis",
  },
  description:
    "Pusat analisis pasar keuangan: chart real-time, watchlist, kalender ekonomi, berita pasar, portofolio, dan artikel edukasi trading & investasi.",
  alternates: { canonical: "/financial-market" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Financial Market Analysis",
    description:
      "Pusat analisis pasar keuangan: chart real-time, watchlist, kalender ekonomi, berita pasar, portofolio, dan artikel edukasi trading & investasi.",
    type: "website",
    url: "/financial-market",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Financial Market Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Financial Market Analysis",
    description:
      "Analisis pasar finansial: saham, indeks, komoditas, kripto & forex. Trading dashboard, watchlist, dan insight edukatif.",
  },
};

// Type styling maps
const WATCHLIST_TYPE_BADGE: Record<string, string> = {
  STOCK: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  CRYPTO: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  FOREX: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  COMMODITY: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  INDEX: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
};

const WATCHLIST_TYPE_LABEL: Record<string, string> = {
  STOCK: "Saham",
  CRYPTO: "Kripto",
  FOREX: "Forex",
  COMMODITY: "Komoditas",
  INDEX: "Indeks",
};

// Tipe artikel market kini disimpan sebagai TAG post blog (konvensi
// migrasi scripts/migrate-market-articles-to-blog.mjs: tag pertama = tipe
// artikel, tag berikutnya = instrumen mis. "IDX:TLKM").
const ARTICLE_TYPE_BADGE: Record<string, string> = {
  "Analisis": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "Teknikal": "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  "Fundamental": "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  "Edukasi": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "Risk Management": "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  "Jurnal": "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
};

const ANALYSIS_TAG_NAMES = ["Analisis", "Teknikal", "Fundamental"];

// Stat cards for the Market Overview tab — illustrative placeholders.
const INDICES = [
  { name: "IHSG", symbol: "INDEX:COMPOSITE", region: "IDX" },
  { name: "S&P 500", symbol: "FOREXCOM:SPXUSD", region: "US" },
  { name: "NASDAQ", symbol: "FOREXCOM:NSXUSD", region: "US" },
  { name: "DOW JONES", symbol: "DJI", region: "US" },
  { name: "NIKKEI 225", symbol: "NI225", region: "JP" },
  { name: "HANG SENG", symbol: "HSI", region: "HK" },
];

export default async function FinancialMarketPage() {
  const [articles, watchlist, holdings, settings] = await Promise.all([
    // 2026-09-19: artikel market dipindahkan ke BLOG (tabel Post, kategori
    // "Financial Market") — supaya saat fitur market di-off dari admin,
    // artikel tetap hidup di /blog/[slug]. Halaman ini (fitur market) hanya
    // membaca ulang post kategori tsb sebagai etalase.
    db.post.findMany({
      where: { published: true, category: { slug: "financial-market" } },
      include: { tags: { select: { id: true, name: true, slug: true } } },
      orderBy: { publishedAt: "desc" },
      // PERF (Task 12): etalase market cukup artikel terbaru
      take: 30,
    }),
    db.watchlist.findMany({ orderBy: { createdAt: "asc" } }),
    db.portfolioHolding.findMany(),
    getSettings(),
  ]);

  const showPortfolio = settings.market_portfolio === undefined || settings.market_portfolio === "true";

  // Toggle market off (settings admin) → seluruh halaman tidak tersedia publik
  if (settings.market_section === "false") notFound();

  const analysisArticles = articles.filter((a) =>
    a.tags.some((t) => ANALYSIS_TAG_NAMES.includes(t.name)),
  );
  const educationArticles = articles.filter(
    (a) => !a.tags.some((t) => ANALYSIS_TAG_NAMES.includes(t.name)),
  );

  const holdingItems: HoldingItem[] = holdings.map((h) => ({
    id: h.id,
    symbol: h.symbol,
    name: h.name,
    type: h.type,
    quantity: h.quantity,
    buyPrice: h.buyPrice,
    currentPrice: h.currentPrice,
    notes: h.notes,
  }));

  // TradingView widget configs
  const tickerConfig = {
    showSymbolLogo: true,
    isTransparent: true,
    displayMode: "adaptive",
    colorTheme: "dark",
    symbols: [
      { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
      { proName: "FOREXCOM:NSXUSD", title: "Nasdaq" },
      { proName: "FX_IDC:USDIDR", title: "USD/IDR" },
      { proName: "BINANCE:BTCUSDT", title: "BTC" },
      { proName: "BINANCE:ETHUSDT", title: "ETH" },
      { proName: "OANDA:XAUUSD", title: "Gold" },
      { proName: "INDEX:COMPOSITE", title: "IHSG" },
    ],
  };

  const marketOverviewConfig = {
    colorTheme: "dark",
    dateRange: "12M",
    showChart: true,
    locale: "id",
    isTransparent: true,
    showSymbolLogo: true,
    showFloatingTooltip: true,
    width: "100%",
    height: "100%",
    tabs: [
      {
        title: "Indeks",
        symbols: [
          { s: "INDEX:COMPOSITE", d: "IHSG" },
          { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
          { s: "FOREXCOM:NSXUSD", d: "Nasdaq" },
          { s: "FOREXCOM:DJI", d: "Dow Jones" },
          { s: "NI225", d: "Nikkei 225" },
          { s: "HSI", d: "Hang Seng" },
        ],
      },
      {
        title: "Kripto",
        symbols: [
          { s: "BINANCE:BTCUSDT", d: "BTC/USDT" },
          { s: "BINANCE:ETHUSDT", d: "ETH/USDT" },
          { s: "BINANCE:BNBUSDT", d: "BNB/USDT" },
          { s: "BINANCE:SOLUSDT", d: "SOL/USDT" },
        ],
      },
      {
        title: "Forex",
        symbols: [
          { s: "FX_IDC:USDIDR", d: "USD/IDR" },
          { s: "FX:EURUSD", d: "EUR/USD" },
          { s: "FX:GBPUSD", d: "GBP/USD" },
          { s: "FX:USDJPY", d: "USD/JPY" },
        ],
      },
      {
        title: "Komoditas",
        symbols: [
          { s: "OANDA:XAUUSD", d: "Emas" },
          { s: "OANDA:XAGUSD", d: "Perak" },
          { s: "TVC:USOIL", d: "Minyak WTI" },
        ],
      },
    ],
  };

  const newsConfig = {
    feedMode: "all_symbols",
    isTransparent: true,
    displayMode: "regular",
    width: "100%",
    height: "100%",
    colorTheme: "dark",
    locale: "id",
  };

  const calendarConfig = {
    colorTheme: "dark",
    isTransparent: true,
    width: "100%",
    height: "100%",
    locale: "id",
    importanceFilter: "-1,0,1",
  };

  // JSON-LD CollectionPage + ItemList — structured data untuk daftar
  // artikel market. Item URL menunjuk /blog/[slug] (lokasi final artikel
  // setelah migrasi — /financial-market/[slug] kini hanya redirect 308,
  // structured data harus memakai URL kanonik, bukan URL redirect).
  // (Task 14) origin selalu domain produksi; dev lokal tetap host dev.
  const origin = await getBaseUrl();
  const marketUrl = `${origin}/financial-market`;
  const marketJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Analisis Pasar Keuangan — Maulana Ihsan Rohim",
    url: marketUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${origin}/blog/${a.slug}`,
        name: a.title,
      })),
    },
  };

  return (
    <div className="relative">
      {/* Perf 2026-09-17: buka koneksi ke CDN TradingView sedini mungkin
          (DNS + TCP + TLS) supaya iframe widget tidak menunggu handshake
          dingin saat mulai dimuat. React 19 meng-hoist <link> ini ke <head>. */}
      <link rel="preconnect" href="https://s3.tradingview.com" />
      <link rel="dns-prefetch" href="https://s3.tradingview.com" />
      <link rel="preconnect" href="https://www.tradingview.com" />

      {/* Structured data: CollectionPage + ItemList (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(marketJsonLd) }}
      />

      {/* ===== HERO ===== */}
      <section className="relative">
        <div className="section-pad py-8 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Pasar Keuangan <span className="text-gradient">Real-Time</span>
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                  Chart interaktif, watchlist personal, kalender ekonomi, berita pasar terkini,
                  dan analisis mendalam — semua dalam satu dashboard.
                </p>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.1}>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <a href="#dashboard">
                    <LineChart className="size-4" />
                    Lihat Dashboard
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl gap-2">
                  <a href="#analysis">
                    <TrendingUp className="size-4" />
                    Baca Analisis
                  </a>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== TICKER TAPE (full width) ===== */}
      <div className="border-b border-border bg-background/80">
        <div className="section-pad py-2">
          <TradingViewWidget
            widgetType="ticker"
            config={tickerConfig}
            height={46}
            id="tv-ticker"
            showLoading={false}
          />
        </div>
      </div>

      {/* ===== MAIN TABS ===== */}
      <section
        id="dashboard"
        className="section-pad relative scroll-mt-24 py-8 sm:py-10"
      >
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue="overview" className="gap-6">
            {/* Sticky tab bar */}
            <div className="sticky top-[68px] z-30 -mx-1 mb-2 px-1 py-2">
              <TabsList className="glass-strong flex h-auto w-full flex-wrap items-center justify-start gap-1 rounded-2xl p-1.5 sm:gap-1.5">
                <TabsTrigger value="overview" className="rounded-xl px-3 py-2 text-xs sm:text-sm">
                  <Gauge className="size-4" />
                  <span className="hidden sm:inline">Market Overview</span>
                  <span className="sm:hidden">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="rounded-xl px-3 py-2 text-xs sm:text-sm">
                  <LineChart className="size-4" />
                  <span className="hidden sm:inline">Trading Dashboard</span>
                  <span className="sm:hidden">Chart</span>
                </TabsTrigger>
                <TabsTrigger value="watchlist" className="rounded-xl px-3 py-2 text-xs sm:text-sm">
                  <Eye className="size-4" />
                  <span className="hidden sm:inline">Watchlist</span>
                  <span className="sm:hidden">Watch</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="rounded-xl px-3 py-2 text-xs sm:text-sm">
                  <Newspaper className="size-4" />
                  <span className="hidden sm:inline">Berita & Kalender</span>
                  <span className="sm:hidden">News</span>
                </TabsTrigger>
                <TabsTrigger value="analysis" className="rounded-xl px-3 py-2 text-xs sm:text-sm">
                  <TrendingUp className="size-4" />
                  <span className="hidden sm:inline">Analisis</span>
                  <span className="sm:hidden">Analisis</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="rounded-xl px-3 py-2 text-xs sm:text-sm">
                  <BookOpen className="size-4" />
                  <span className="hidden sm:inline">Edukasi</span>
                  <span className="sm:hidden">Edukasi</span>
                </TabsTrigger>
                {showPortfolio && (
                <TabsTrigger value="portfolio" className="rounded-xl px-3 py-2 text-xs sm:text-sm">
                  <Wallet className="size-4" />
                  <span className="hidden sm:inline">Portofolio</span>
                  <span className="sm:hidden">Portofolio</span>
                </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* ===== TAB: MARKET OVERVIEW ===== */}
            <TabsContent value="overview" className="space-y-6 outline-none">
              <SectionHeading
                icon={<Gauge className="size-5" />}
                title="Market Overview"
                desc="Ringkasan pergerakan indeks utama, kripto, forex, dan komoditas dalam satu tampilan."
              />

              <SectionReveal>
                <div className="glass overflow-hidden rounded-2xl p-2 sm:p-3">
                  {/* Perf 2026-09-17: defer iframe market overview sampai
                      mendekati viewport — tidak berebut bandwidth/main-thread
                      dengan hydration awal halaman. */}
                  <LazyMount minHeight="480px" className="h-[480px] w-full sm:h-[560px]">
                    <TradingViewWidget
                      widgetType="market_overview"
                      config={marketOverviewConfig}
                      height="100%"
                      id="tv-market-overview"
                      loadingLabel="Memuat ringkasan pasar…"
                    />
                  </LazyMount>
                </div>
              </SectionReveal>

              {/* Stat cards grid */}
              <SectionReveal delay={0.05}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {INDICES.map((idx) => (
                    <Link
                      key={idx.name}
                      href="#dashboard"
                      className="glass lift group rounded-xl p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-sm font-bold tracking-tight">
                            {idx.name}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {idx.region}
                          </div>
                        </div>
                        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                      <div className="mt-3 flex items-end gap-1">
                        <BarChart3 className="size-8 text-primary/60" />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {idx.symbol}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionReveal>

              <SectionReveal delay={0.1}>
                <p className="text-center text-xs text-muted-foreground">
                  Data indeks disediakan oleh TradingView. Klik tab{" "}
                  <span className="font-medium text-foreground">Trading Dashboard</span>{" "}
                  untuk chart interaktif lengkap.
                </p>
              </SectionReveal>
            </TabsContent>

            {/* ===== TAB: TRADING DASHBOARD ===== */}
            <TabsContent value="dashboard" className="space-y-6 outline-none">
              <SectionHeading
                icon={<LineChart className="size-5" />}
                title="Trading Dashboard"
                desc="Chart interaktif dengan indikator teknikal. Pilih simbol untuk berpindah instrumen."
              />
              <SectionReveal>
                <ChartWithSymbolPicker />
              </SectionReveal>
            </TabsContent>

            {/* ===== TAB: WATCHLIST ===== */}
            <TabsContent value="watchlist" className="space-y-6 outline-none">
              <SectionHeading
                icon={<Eye className="size-5" />}
                title="Watchlist"
                desc="Daftar instrumen yang dipantau. Tetapkan target harga sebagai referensi titik entry/exit."
              />

              {watchlist.length === 0 ? (
                <EmptyState
                  icon={<Eye className="size-7" />}
                  title="Watchlist masih kosong"
                  desc="Tambahkan instrumen yang ingin dipantau melalui dashboard admin."
                />
              ) : (
                <SectionReveal>
                  <div className="glass overflow-hidden rounded-2xl">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                            <TableHead className="pl-5 text-xs uppercase tracking-wider">Simbol</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider">Nama</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider">Tipe</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider">Target Harga</TableHead>
                            <TableHead className="hidden pr-5 text-xs uppercase tracking-wider sm:table-cell">Catatan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {watchlist.map((w) => (
                            <TableRow key={w.id} className="border-border/60">
                              <TableCell className="pl-5">
                                <div className="flex items-center gap-2">
                                  <CircleDot className="size-3.5 text-primary" />
                                  <span className="font-mono text-sm font-semibold">{w.symbol}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-foreground/80">{w.name}</TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                    WATCHLIST_TYPE_BADGE[w.type] ?? "bg-muted text-muted-foreground border-border",
                                  )}
                                >
                                  {WATCHLIST_TYPE_LABEL[w.type] ?? w.type}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {w.targetPrice
                                  ? Number(w.targetPrice).toLocaleString("id-ID", { maximumFractionDigits: 2 })
                                  : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground sm:table-cell">
                                {w.notes ?? "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </SectionReveal>
              )}
            </TabsContent>

            {/* ===== TAB: MARKET NEWS ===== */}
            <TabsContent value="news" className="space-y-6 outline-none">
              <SectionHeading
                icon={<Newspaper className="size-5" />}
                title="Berita Pasar & Kalender Ekonomi"
                desc="Feed berita pasar real-time dan jadwal rilis data ekonomi penting dari seluruh dunia."
              />

              <SectionReveal>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Newspaper className="size-3.5 text-primary" />
                      <h3 className="text-sm font-semibold">Feed Berita Pasar</h3>
                    </div>
                    <div className="glass overflow-hidden rounded-2xl p-2 sm:p-3">
                      <div className="h-[520px] w-full">
                        <TradingViewWidget
                          widgetType="news"
                          config={newsConfig}
                          height="100%"
                          id="tv-news"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <CalendarClock className="size-3.5 text-primary" />
                      <h3 className="text-sm font-semibold">Kalender Ekonomi</h3>
                    </div>
                    <div className="glass overflow-hidden rounded-2xl p-2 sm:p-3">
                      {/* Perf 2026-09-17: kalender deferred — kolom kanan /
                          bawah-fold di mobile, biar tab berita tidak memuat
                          dua iframe berat sekaligus. */}
                      <LazyMount minHeight="520px" className="h-[520px] w-full">
                        <TradingViewWidget
                          widgetType="calendar"
                          config={calendarConfig}
                          height="100%"
                          id="tv-calendar"
                          loadingLabel="Memuat kalender ekonomi…"
                        />
                      </LazyMount>
                    </div>
                  </div>
                </div>
              </SectionReveal>
            </TabsContent>

            {/* ===== TAB: ANALYSIS ===== */}
            <TabsContent value="analysis" className="space-y-6 outline-none" id="analysis">
              <SectionHeading
                icon={<TrendingUp className="size-5" />}
                title="Artikel Analisis"
                desc="Analisis pasar, teknikal, dan fundamental untuk membantu pengambilan keputusan."
              />

              {analysisArticles.length === 0 ? (
                <EmptyState
                  icon={<TrendingUp className="size-7" />}
                  title="Belum ada artikel analisis"
                  desc="Artikel analisis pasar akan tampil di sini setelah dipublikasikan."
                />
              ) : (
                <SectionReveal>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {analysisArticles.map((a) => (
                      <ArticleCard key={a.id} article={a} />
                    ))}
                  </div>
                </SectionReveal>
              )}
            </TabsContent>

            {/* ===== TAB: EDUCATION ===== */}
            <TabsContent value="education" className="space-y-6 outline-none">
              <SectionHeading
                icon={<BookOpen className="size-5" />}
                title="Edukasi & Jurnal"
                desc="Materi edukasi trading, manajemen risiko, dan jurnal trading untuk pembelajaran."
              />

              {educationArticles.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="size-7" />}
                  title="Belum ada materi edukasi"
                  desc="Materi edukasi, risk management, dan jurnal trading akan tampil di sini."
                />
              ) : (
                <SectionReveal>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {educationArticles.map((a) => (
                      <ArticleCard key={a.id} article={a} />
                    ))}
                  </div>
                </SectionReveal>
              )}
            </TabsContent>

            {/* ===== TAB: PORTFOLIO ===== */}
            {showPortfolio && (
            <TabsContent value="portfolio" className="space-y-6 outline-none">
              <SectionHeading
                icon={<Wallet className="size-5" />}
                title="Portofolio Investasi"
                desc="Daftar pemegangan (holdings) dengan perhitungan P&L real-time berdasarkan harga kini."
              />
              <SectionReveal>
                <PortfolioTable holdings={holdingItems} />
              </SectionReveal>
            </TabsContent>
            )}
          </Tabs>
        </div>
      </section>

      {/* ===== DISCLAIMER ===== */}
      <section className="section-pad pb-16">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="glass-strong relative overflow-hidden rounded-2xl border-l-4 border-l-amber-500 p-6 sm:p-8">
              <div className="absolute -right-12 -top-12 size-40 rounded-full bg-amber-500/10 blur-3xl" aria-hidden />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="size-6" />
                </div>
                <div className="flex-1">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    Disclaimer Pasar Keuangan
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Konten di halaman ini bersifat informasi dan edukasi,{" "}
                    <span className="font-semibold text-foreground">BUKAN saran investasi</span>{" "}
                    atau rekomendasi untuk membeli, menjual, atau menahan instrumen keuangan
                    apa pun. Keputusan investasi adalah tanggung jawab pribadi Anda.
                    Pasar keuangan memiliki risiko kerugian, termasuk kehilangan seluruh
                    modal. Selalu lakukan riset mandiri (DYOR), pertimbangkan toleransi
                    risiko Anda, dan konsultasikan dengan penasihat keuangan yang berlisensi
                    sebelum mengambil keputusan investasi.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3" />
                      Risiko Kerugian
                    </Badge>
                    <Badge variant="outline" className="gap-1 border-rose-500/30 text-rose-600 dark:text-rose-400">
                      Bukan Saran Investasi
                    </Badge>
                    <Badge variant="outline" className="gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400">
                      DYOR
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="section-pad pb-20">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="bg-card relative overflow-hidden rounded-3xl border-0 p-8 text-center sm:p-12 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Siap Mengambil Kendali Portofolio Anda?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Konsultasikan strategi investasi & trading Anda bersama saya.
                  Dapatkan insight personal dan rencana trading yang terukur.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      <Target className="size-4" />
                      Konsultasi Sekarang
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/about">
                      Tentang Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}

/* ===================== Helpers ===================== */

function SectionHeading({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

type ArticleCardProps = {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    featured: boolean;
    viewCount: number;
    publishedAt: Date | null;
    tags: { id: string; name: string; slug: string }[];
  };
};

// Kartu artikel market — data kini berasal dari Post blog (kategori
// Financial Market); kartu menuju /blog/[slug] (bukan /financial-market).
function ArticleCard({ article }: ArticleCardProps) {
  const plainExcerpt =
    article.excerpt ?? truncate(stripHtml(article.content), 200);
  // Tag pertama = tipe (Analisis/Teknikal/...), tag lain = instrumen
  const typeTag = article.tags.find((t) => ARTICLE_TYPE_BADGE[t.name]);
  const instrument = article.tags.find((t) => t !== typeTag)?.name ?? null;
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="glass lift group relative flex flex-col overflow-hidden rounded-2xl"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-amber-500/20">
            <TrendingUp className="size-10 text-primary/60" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {typeTag && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur",
                ARTICLE_TYPE_BADGE[typeTag.name],
              )}
            >
              {typeTag.name}
            </span>
          )}
          {article.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 backdrop-blur dark:text-amber-400">
              Unggulan
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {instrument && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono font-medium">
              <CircleDot className="size-3" />
              {instrument}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3" />
            {article.publishedAt ? formatDateShort(article.publishedAt) : "—"}
          </span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-4 flex-1 text-sm text-muted-foreground leading-relaxed">
          {plainExcerpt}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            {article.viewCount}x dilihat
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
            Baca Selengkapnya
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
