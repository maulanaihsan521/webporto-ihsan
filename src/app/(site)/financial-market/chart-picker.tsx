"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { cn } from "@/lib/utils";

type SymbolOption = {
  /** TradingView proName, e.g. "FX_IDC:USDIDR" */
  symbol: string;
  /** Short label shown on the button, e.g. "USD/IDR" */
  label: string;
  /** Optional sub-label, e.g. the full TradingView symbol */
  description?: string;
  /** Accent gradient classes for the active pill */
  accent: string;
};

const SYMBOLS: SymbolOption[] = [
  {
    symbol: "FX_IDC:USDIDR",
    label: "USD/IDR",
    description: "Dolar Amerika / Rupiah Indonesia",
    accent: "from-amber-500 to-orange-500",
  },
  {
    symbol: "BINANCE:BTCUSDT",
    label: "BTC",
    description: "Bitcoin / Tether",
    accent: "from-orange-500 to-rose-500",
  },
  {
    symbol: "BINANCE:ETHUSDT",
    label: "ETH",
    description: "Ethereum / Tether",
    accent: "from-violet-500 to-purple-500",
  },
  {
    symbol: "OANDA:XAUUSD",
    label: "Gold",
    description: "Emas / Dolar Amerika",
    accent: "from-yellow-500 to-amber-500",
  },
  {
    symbol: "INDEX:COMPOSITE",
    label: "IHSG",
    description: "Indeks Harga Saham Gabungan",
    accent: "from-teal-500 to-emerald-500",
  },
];

/**
 * Client component: a symbol picker (pill buttons) above a large TradingView
 * advanced-chart widget. Selecting a new symbol re-keys the widget so the
 * chart re-mounts cleanly (TradingView doesn't retarget a live iframe reliably).
 */
export function ChartWithSymbolPicker() {
  const [active, setActive] = useState<SymbolOption>(SYMBOLS[0]);

  const chartConfig = {
    autosize: true,
    symbol: active.symbol,
    interval: "D",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "id",
    grid: true,
    toolbar_bg: "transparent",
    enable_publishing: false,
    allow_symbol_change: false,
    hide_side_toolbar: false,
    withdateranges: true,
    details: false,
    studies: ["STD;SMA", "STD;RSI"],
    support_host: "https://www.tradingview.com",
  };

  return (
    <div className="space-y-5">
      {/* Symbol picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Simbol:
        </span>
        {SYMBOLS.map((s) => {
          const isActive = s.symbol === active.symbol;
          return (
            <button
              key={s.symbol}
              type="button"
              onClick={() => setActive(s)}
              aria-pressed={isActive}
              aria-label={`Tampilkan chart ${s.label}`}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-transparent text-white shadow-md"
                  : "border-border bg-background/60 text-foreground/80 hover:bg-accent hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="activeSymbol"
                  className={cn(
                    "absolute inset-0 -z-10 rounded-full bg-primary",
                    s.accent,
                  )}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Description line */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={active.symbol}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-lg font-semibold tracking-tight text-foreground"
          >
            {active.symbol}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-muted-foreground">{active.description}</span>
      </div>

      {/* Chart — keyed by symbol so it re-mounts cleanly */}
      <div className="glass overflow-hidden rounded-2xl p-2 sm:p-3">
        {/* The widget's outer div controls height; TradingView autosize fills it. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.symbol}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-[420px] w-full sm:h-[520px] lg:h-[600px]"
          >
            <TradingViewWidget
              widgetType="chart"
              config={chartConfig}
              height="100%"
              id={`tv-chart-${active.symbol.replace(/[^a-zA-Z0-9]/g, "")}`}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground">
        Chart disediakan oleh{" "}
        <a
          href="https://www.tradingview.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          TradingView
        </a>
        . Data dapat tertunda; gunakan untuk tujuan edukasi & analisis, bukan
        saran investasi.
      </p>
    </div>
  );
}
