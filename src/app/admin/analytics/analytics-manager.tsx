"use client";

import {
  Activity, Users, Calendar, TrendingUp, Monitor, Smartphone, Tablet,
  Globe, Chrome,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { cn, formatNumber } from "@/lib/utils";

interface Stats {
  total: number;
  today: number;
  week: number;
  daily: { date: string; count: number }[];
  byDevice: { name: string; value: number }[];
  byBrowser: { name: string; value: number }[];
  byPath: { name: string; value: number }[];
}

const DEVICE_COLORS = ["#f59e0b", "#14b8a6", "#8b5cf6", "#ec4899", "#22c55e"];
const DEVICE_ICONS: Record<string, any> = {
  DESKTOP: Monitor,
  MOBILE: Smartphone,
  TABLET: Tablet,
};

export function AnalyticsManager({ stats }: { stats: Stats }) {
  const dailyChart = stats.daily.map((d) => ({
    name: new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    visitors: d.count,
  }));

  const peakDay = stats.daily.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { date: "", count: 0 }
  );

  const topPath = stats.byPath[0];

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Statistik kunjungan situs dan perilaku pengunjung"
        icon={Activity}
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Total Pengunjung"
          value={stats.total}
          icon={Users}
          color="text-amber-500 bg-amber-500/10"
        />
        <StatCard
          label="Hari Ini"
          value={stats.today}
          icon={Calendar}
          color="text-teal-500 bg-teal-500/10"
        />
        <StatCard
          label="Minggu Ini"
          value={stats.week}
          icon={TrendingUp}
          color="text-violet-500 bg-violet-500/10"
        />
        <StatCard
          label="Hari Tersibuk"
          value={peakDay.count}
          subtitle={peakDay.date ? new Date(peakDay.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "—"}
          icon={Activity}
          color="text-rose-500 bg-rose-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily visitors area chart */}
        <Card className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Tren Kunjungan 30 Hari</h3>
              <p className="text-xs text-muted-foreground">Jumlah pengunjung per hari</p>
            </div>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600">
              <TrendingUp className="size-3 mr-1" /> 30 hari
            </Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Pengunjung"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* By device donut */}
        <Card className="glass rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Perangkat</h3>
            <p className="text-xs text-muted-foreground">Distribusi pengunjung</p>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byDevice}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {stats.byDevice.map((_, i) => (
                    <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-3">
            {stats.byDevice.map((d, i) => {
              const Icon = DEVICE_ICONS[d.name] || Monitor;
              const pct = stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0;
              return (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{formatNumber(d.value)}</span>
                    <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
            {stats.byDevice.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
            )}
          </div>
        </Card>

        {/* Top pages bar chart */}
        <Card className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold">Halaman Terpopuler</h3>
            <p className="text-xs text-muted-foreground">Top 10 halaman paling banyak dikunjungi</p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.byPath}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                  cursor={{ fill: "rgba(245, 158, 11, 0.05)" }}
                />
                <Bar
                  dataKey="value"
                  name="Kunjungan"
                  fill="#14b8a6"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* By browser */}
        <Card className="glass rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Browser</h3>
            <p className="text-xs text-muted-foreground">Distribusi per browser</p>
          </div>
          <div className="space-y-3">
            {stats.byBrowser.map((b, i) => {
              const pct = stats.total > 0 ? Math.round((b.value / stats.total) * 100) : 0;
              return (
                <div key={b.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Chrome className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{formatNumber(b.value)}</span>
                      <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.byBrowser.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
            )}
          </div>
        </Card>
      </div>

      {/* Top pages list */}
      {topPath && (
        <Card className="glass rounded-2xl p-5 mt-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Globe className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Halaman paling populer</p>
              <p className="font-semibold">
                {topPath.name} <span className="text-muted-foreground font-normal">— {formatNumber(topPath.value)} kunjungan</span>
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label, value, subtitle, icon: Icon, color,
}: {
  label: string;
  value: number;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  return (
    <Card className="glass rounded-2xl p-4 flex items-center gap-3">
      <div className={cn("size-10 rounded-xl flex items-center justify-center", color)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none">{formatNumber(value)}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle || label}</p>
      </div>
    </Card>
  );
}
