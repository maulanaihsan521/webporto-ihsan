"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase, FileText, Image as ImageIcon, Award, Mail, Star, Code2,
  Clock, GraduationCap, Settings, HelpCircle, Users, FolderOpen, MailCheck,
  TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Eye, MessageSquare,
  CheckCircle2, Clock as ClockIcon, type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { timeAgo, getInitials, formatNumber } from "@/lib/utils";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

interface Stats {
  portfolio: number; posts: number; gallery: number; certificates: number;
  messages: number; unread: number; testimonials: number; skills: number;
  experiences: number; educations: number; services: number; faqs: number;
  users: number; media: number; subscribers: number; marketArticles: number;
}

interface RecentMessage { id: string; name: string; email: string; subject: string | null; message: string; read: boolean; createdAt: string; }
interface RecentActivity { id: string; action: string; entity: string; detail: string | null; createdAt: string; user: { name: string | null; image: string | null } | null; }
interface VisitorStats { today: number; yesterday: number; week: number; total: number; days: { date: string; count: number }[]; change: number; }
interface TopPage { path: string; count: number; }

export function AdminDashboardClient({
  stats, recentMessages, recentActivity, visitorStats, topPages, userName,
}: {
  stats: Stats;
  recentMessages: RecentMessage[];
  recentActivity: RecentActivity[];
  visitorStats: VisitorStats;
  topPages: TopPage[];
  userName: string;
}) {
  const statCards: { label: string; value: number; icon: LucideIcon; href: string; color: string }[] = [
    { label: "Portfolio", value: stats.portfolio, icon: Briefcase, href: "/admin/portfolio", color: "from-amber-400/20 to-orange-400/20 text-amber-500" },
    { label: "Blog Posts", value: stats.posts, icon: FileText, href: "/admin/blog", color: "from-teal-400/20 to-cyan-400/20 text-teal-500" },
    { label: "Gallery", value: stats.gallery, icon: ImageIcon, href: "/admin/gallery", color: "from-violet-400/20 to-purple-400/20 text-violet-500" },
    { label: "Certificates", value: stats.certificates, icon: Award, href: "/admin/certificates", color: "from-rose-400/20 to-pink-400/20 text-rose-500" },
    { label: "Messages", value: stats.messages, icon: Mail, href: "/admin/messages", color: "from-blue-400/20 to-indigo-400/20 text-blue-500" },
    { label: "Unread", value: stats.unread, icon: MessageSquare, href: "/admin/messages", color: "from-red-400/20 to-orange-400/20 text-red-500" },
    { label: "Testimonials", value: stats.testimonials, icon: Star, href: "/admin/testimonials", color: "from-yellow-400/20 to-amber-400/20 text-yellow-500" },
    { label: "Skills", value: stats.skills, icon: Code2, href: "/admin/skills", color: "from-green-400/20 to-emerald-400/20 text-green-500" },
    { label: "Experience", value: stats.experiences, icon: Clock, href: "/admin/experience", color: "from-cyan-400/20 to-sky-400/20 text-cyan-500" },
    { label: "Education", value: stats.educations, icon: GraduationCap, href: "/admin/education", color: "from-fuchsia-400/20 to-pink-400/20 text-fuchsia-500" },
    { label: "Services", value: stats.services, icon: Settings, href: "/admin/services", color: "from-orange-400/20 to-red-400/20 text-orange-500" },
    { label: "FAQs", value: stats.faqs, icon: HelpCircle, href: "/admin/faq", color: "from-lime-400/20 to-green-400/20 text-lime-500" },
    { label: "Users", value: stats.users, icon: Users, href: "/admin/users", color: "from-indigo-400/20 to-violet-400/20 text-indigo-500" },
    { label: "Media Files", value: stats.media, icon: FolderOpen, href: "/admin/media", color: "from-stone-400/20 to-zinc-400/20 text-stone-500" },
    { label: "Subscribers", value: stats.subscribers, icon: MailCheck, href: "/admin/messages", color: "from-emerald-400/20 to-teal-400/20 text-emerald-500" },
    { label: "Market Articles", value: stats.marketArticles, icon: TrendingUp, href: "/admin/market", color: "from-green-400/20 to-lime-400/20 text-green-500" },
  ];

  const chartData = visitorStats.days.map((d) => ({
    name: new Date(d.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
    visitors: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-8"
      >
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{userName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">Berikut ringkasan portfolio CMS Anda hari ini.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="rounded-xl">
              <Link href="/"><Activity className="size-4" /> View Site</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl glass">
              <Link href="/admin/portfolio"><Briefcase className="size-4" /> New Project</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Visitor stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="Visitors Today" value={visitorStats.today} change={visitorStats.change} color="text-teal-500" />
        <StatCard icon={Eye} label="This Week" value={visitorStats.week} color="text-violet-500" />
        <StatCard icon={Eye} label="Total Visitors" value={visitorStats.total} color="text-amber-500" />
        <StatCard icon={MailCheck} label="Subscribers" value={stats.subscribers} color="text-emerald-500" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl p-5 glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Visitor Trend</h3>
              <p className="text-xs text-muted-foreground">7 hari terakhir</p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {visitorStats.change >= 0 ? <ArrowUpRight className="size-3 mr-1 text-green-500" /> : <ArrowDownRight className="size-3 mr-1 text-red-500" />}
              {Math.abs(visitorStats.change)}%
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                }}
              />
              <Area type="monotone" dataKey="visitors" stroke="var(--primary)" strokeWidth={2} fill="url(#colorVis)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="rounded-2xl p-5 glass">
          <h3 className="font-semibold mb-4">Top Pages</h3>
          <div className="space-y-3">
            {topPages.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
            {topPages.map((p, i) => (
              <div key={p.path} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <Link href={p.path} className="flex-1 text-sm truncate hover:text-primary" title={p.path}>
                  {p.path}
                </Link>
                <Badge variant="secondary" className="rounded-full">{formatNumber(p.count)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Content stats grid */}
      <div>
        <h3 className="font-semibold mb-3 px-1">Content Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={s.href}>
                <Card className="lift group rounded-2xl p-4 glass relative overflow-hidden h-full">
                  <div className={`size-10 rounded-xl bg-primary/10 ${s.color} flex items-center justify-center mb-3`}>
                    <s.icon className="size-5" />
                  </div>
                  <div className="text-2xl font-bold">{formatNumber(s.value)}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent messages + activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl p-5 glass">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Messages</h3>
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/admin/messages">View All</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentMessages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet</p>}
            {recentMessages.map((m) => (
              <Link key={m.id} href="/admin/messages" className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs">{getInitials(m.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    {!m.read && <span className="size-1.5 rounded-full bg-red-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.subject || m.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(m.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl p-5 glass">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/admin/activity-log">View All</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet</p>}
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {a.action === "LOGIN" ? <CheckCircle2 className="size-4 text-green-500" /> : <ClockIcon className="size-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{a.user?.name || "System"}</span>{" "}
                    <span className="text-muted-foreground">{a.action.toLowerCase()}</span>{" "}
                    <span className="font-medium">{a.entity}</span>
                  </p>
                  {a.detail && <p className="text-xs text-muted-foreground truncate">{a.detail}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, color }: { icon: LucideIcon; label: string; value: number; change?: number; color: string }) {
  return (
    <Card className="rounded-2xl p-5 glass relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className={`size-10 rounded-xl bg-primary/5 flex items-center justify-center ${color}`}>
          <Icon className="size-5" />
        </div>
        {change !== undefined && (
          <Badge variant="secondary" className={`rounded-full ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
            {Math.abs(change)}%
          </Badge>
        )}
      </div>
      <div className="text-3xl font-bold mt-3">{formatNumber(value)}</div>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  );
}
