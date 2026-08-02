"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieIcon,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Counter } from "@/components/motion-primitives";

export type HoldingItem = {
  id: string;
  symbol: string;
  name: string;
  type: string; // STOCK | CRYPTO | FOREX | COMMODITY | INDEX
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  notes: string | null;
};

type SortKey = "symbol" | "name" | "type" | "quantity" | "buyPrice" | "currentPrice" | "value" | "pnl" | "pnlPct";
type SortDir = "asc" | "desc";

const TYPE_BADGE: Record<string, string> = {
  STOCK: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  CRYPTO: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  FOREX: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  COMMODITY: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  INDEX: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  STOCK: "Saham",
  CRYPTO: "Kripto",
  FOREX: "Forex",
  COMMODITY: "Komoditas",
  INDEX: "Indeks",
};

// Palette for donut slices — amber/teal/violet/yellow/orange (NO blue/indigo).
const SLICE_COLORS = [
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#eab308", // yellow
  "#f97316", // orange
  "#ec4899", // pink
  "#10b981", // emerald
  "#a855f7", // purple
];

function formatPrice(n: number): string {
  if (n >= 1000) return formatNumber(Number(n.toFixed(2)));
  return n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return formatNumber(n);
  return n.toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function PortfolioTable({ holdings }: { holdings: HoldingItem[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    return holdings.map((h) => {
      const value = h.currentPrice * h.quantity;
      const cost = h.buyPrice * h.quantity;
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { ...h, value, cost, pnl, pnlPct };
    });
  }, [holdings]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(() => {
    const value = rows.reduce((s, r) => s + r.value, 0);
    const cost = rows.reduce((s, r) => s + r.cost, 0);
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const winners = rows.filter((r) => r.pnl > 0).length;
    const losers = rows.filter((r) => r.pnl < 0).length;
    return { value, cost, pnl, pnlPct, winners, losers };
  }, [rows]);

  const donutData = useMemo(() => {
    return rows
      .map((r) => ({ name: r.symbol, value: r.value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const renderSortHeader = (label: string, k: SortKey, align: "left" | "right" = "left") => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
        align === "right" ? "flex-row-reverse" : "",
        sortKey === k ? "text-foreground" : "text-muted-foreground",
      )}
      aria-label={`Urutkan berdasarkan ${label}`}
    >
      {label}
      {sortKey === k ? (
        sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
      ) : (
        <ArrowDownUp className="size-3 opacity-40" />
      )}
    </button>
  );

  if (holdings.length === 0) {
    return (
      <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Wallet className="size-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Belum ada posisi portofolio</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Pemegangan (holdings) akan ditampilkan di sini setelah ditambahkan
          melalui dashboard admin.
        </p>
      </div>
    );
  }

  const pnlPositive = totals.pnl >= 0;

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Nilai Portofolio"
          value={formatNumber(Number(totals.value.toFixed(2)))}
          icon={<Wallet className="size-4" />}
          accent="from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400"
        />
        <SummaryCard
          label="Total Modal"
          value={formatNumber(Number(totals.cost.toFixed(2)))}
          icon={<PieIcon className="size-4" />}
          accent="from-teal-500/15 to-teal-500/5 text-teal-600 dark:text-teal-400"
        />
        <SummaryCard
          label="Total P&L"
          value={`${pnlPositive ? "+" : ""}${formatNumber(Number(totals.pnl.toFixed(2)))}`}
          icon={pnlPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          accent={
            pnlPositive
              ? "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400"
              : "from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400"
          }
          suffix={
            <span
              className={cn(
                "ml-1 text-sm font-semibold",
                pnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
              )}
            >
              ({pnlPositive ? "+" : ""}
              {totals.pnlPct.toFixed(2)}%)
            </span>
          }
        />
        <SummaryCard
          label="Win / Loss"
          value={`${totals.winners} / ${totals.losers}`}
          icon={<ArrowDownUp className="size-4" />}
          accent="from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Holdings table */}
        <div className="glass overflow-hidden rounded-2xl">
          <div className="border-b border-border px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="size-4 text-primary" />
              Daftar Holdings
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Klik judul kolom untuk mengurutkan. P&L dihitung dari selisih harga
              beli & harga kini.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left">{renderSortHeader("Simbol", "symbol")}</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">{renderSortHeader("Tipe", "type")}</th>
                  <th className="px-4 py-3 text-right">{renderSortHeader("Qty", "quantity", "right")}</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">{renderSortHeader("Beli", "buyPrice", "right")}</th>
                  <th className="px-4 py-3 text-right">{renderSortHeader("Kini", "currentPrice", "right")}</th>
                  <th className="hidden px-4 py-3 text-right lg:table-cell">{renderSortHeader("Nilai", "value", "right")}</th>
                  <th className="px-4 py-3 text-right">{renderSortHeader("P&L", "pnl", "right")}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const positive = r.pnl >= 0;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-semibold">{r.symbol}</div>
                        <div className="line-clamp-1 max-w-[180px] text-xs text-muted-foreground">
                          {r.name}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                            TYPE_BADGE[r.type] ?? "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {TYPE_LABEL[r.type] ?? r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{formatQty(r.quantity)}</td>
                      <td className="hidden px-4 py-3 text-right font-mono text-sm text-muted-foreground md:table-cell">
                        {formatPrice(r.buyPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{formatPrice(r.currentPrice)}</td>
                      <td className="hidden px-4 py-3 text-right font-mono text-sm lg:table-cell">
                        {formatNumber(Number(r.value.toFixed(2)))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className={cn(
                            "font-mono text-sm font-semibold",
                            positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                          )}
                        >
                          {positive ? "+" : ""}
                          {formatNumber(Number(r.pnl.toFixed(2)))}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            positive ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-rose-600/80 dark:text-rose-400/80",
                          )}
                        >
                          {positive ? "+" : ""}
                          {r.pnlPct.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/40">
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground" colSpan={5}>
                    Total Portofolio
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono text-sm font-semibold lg:table-cell">
                    {formatNumber(Number(totals.value.toFixed(2)))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div
                      className={cn(
                        "font-mono text-sm font-bold",
                        pnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {pnlPositive ? "+" : ""}
                      {formatNumber(Number(totals.pnl.toFixed(2)))}
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        pnlPositive ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-rose-600/80 dark:text-rose-400/80",
                      )}
                    >
                      {pnlPositive ? "+" : ""}
                      {totals.pnlPct.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Allocation donut */}
        <div className="glass flex flex-col rounded-2xl p-5">
          <div className="mb-2 flex items-center gap-2">
            <PieIcon className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Alokasi Portofolio</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Distribusi nilai pasar per simbol.
          </p>

          <div className="relative h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [
                    `${formatNumber(Number(Number(v).toFixed(2)))} (${((Number(v) / totals.value) * 100).toFixed(1)}%)`,
                    n,
                  ]}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total
              </span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-base font-bold"
              >
                <Counter to={Math.round(totals.value)} duration={1.4} />
              </motion.span>
            </div>
          </div>

          {/* Allocation list */}
          <div className="mt-4 space-y-2">
            {donutData.map((d, i) => {
              const pct = (d.value / totals.value) * 100;
              return (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                  />
                  <span className="flex-1 font-mono font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
  suffix,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="glass relative overflow-hidden rounded-xl p-4">
      <div className={cn("mb-2 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10", accent)}>
        {icon}
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="font-mono text-lg font-bold tracking-tight">{value}</span>
        {suffix}
      </div>
    </div>
  );
}
