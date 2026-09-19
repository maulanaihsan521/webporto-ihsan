"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Briefcase, FileText, Image, Award, Clock, GraduationCap,
  Code2, Settings, Star, HelpCircle, Mail, Users, FolderOpen, Search,
  TrendingUp, Activity, Database, ShieldCheck, LogOut, Menu, Bell,
  ChevronDown, ExternalLink, MailCheck, MessageSquare, Tag, FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/x9k2-dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/x9k2-dashboard/analytics", icon: Activity },
      { label: "Visitors", href: "/x9k2-dashboard/visitors", icon: Globe },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Portfolio", href: "/x9k2-dashboard/portfolio", icon: Briefcase },
      { label: "Blog", href: "/x9k2-dashboard/blog", icon: FileText },
      { label: "Comments", href: "/x9k2-dashboard/comments", icon: MessageSquare, badge: "pending" },
      { label: "Gallery", href: "/x9k2-dashboard/gallery", icon: Image },
      { label: "Certificates", href: "/x9k2-dashboard/certificates", icon: Award },
      { label: "Testimonials", href: "/x9k2-dashboard/testimonials", icon: Star },
      { label: "FAQ", href: "/x9k2-dashboard/faq", icon: HelpCircle },
      { label: "Tags", href: "/x9k2-dashboard/tags", icon: Tag },
      { label: "Categories", href: "/x9k2-dashboard/categories", icon: FolderTree },
    ],
  },
  {
    label: "Profile",
    items: [
      { label: "Experience", href: "/x9k2-dashboard/experience", icon: Clock },
      { label: "Education", href: "/x9k2-dashboard/education", icon: GraduationCap },
      { label: "Skills", href: "/x9k2-dashboard/skills", icon: Code2 },
      { label: "Services", href: "/x9k2-dashboard/services", icon: Settings },
    ],
  },
  {
    label: "Financial",
    items: [
      { label: "Market", href: "/x9k2-dashboard/market", icon: TrendingUp },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Messages", href: "/x9k2-dashboard/messages", icon: Mail, badge: "unread" },
      { label: "Newsletter", href: "/x9k2-dashboard/newsletter", icon: MailCheck },
      { label: "Media Library", href: "/x9k2-dashboard/media", icon: FolderOpen },
      { label: "Users", href: "/x9k2-dashboard/users", icon: Users },
      { label: "Settings", href: "/x9k2-dashboard/settings", icon: Settings },
      { label: "SEO", href: "/x9k2-dashboard/seo", icon: Search },
      { label: "Activity Log", href: "/x9k2-dashboard/activity-log", icon: Database },
      { label: "Backup", href: "/x9k2-dashboard/backup", icon: ShieldCheck },
    ],
  },
];

// Add missing Globe import alias
function Globe(props: any) {
  return <Search {...props} />;
}

interface SidebarContentProps {
  pathname: string;
  unreadCount: number;
  pendingComments: number;
  onNavigate: () => void;
}

function SidebarContent({ pathname, unreadCount, pendingComments, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b">
        <Link href="/x9k2-dashboard" className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30">
            MI
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm">Portfolio CMS</span>
            <span className="text-[10px] text-muted-foreground">Admin Dashboard</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/x9k2-dashboard" ? pathname === "/x9k2-dashboard" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                    )}
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge === "unread" && unreadCount > 0 && (
                      <Badge className="bg-red-500/15 text-red-500 border-0 px-1.5 py-0 text-[10px]">
                        {unreadCount}
                      </Badge>
                    )}
                    {item.badge === "pending" && pendingComments > 0 && (
                      <Badge className="bg-amber-500/15 text-amber-600 border-0 px-1.5 py-0 text-[10px]">
                        {pendingComments}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ExternalLink className="size-4" />
          View Website
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingComments, setPendingComments] = useState(0);

  useEffect(() => {
    fetch("/api/contact").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setUnreadCount(data.filter((m: any) => !m.read).length);
      }
    }).catch(() => {});
    fetch("/api/admin/comments?status=pending").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setPendingComments(data.length);
      }
    }).catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    toast.success("Logged out");
    router.push("/x9k2-dashboard/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r bg-card/50 backdrop-blur-xl hidden lg:block">
        <SidebarContent pathname={pathname} unreadCount={unreadCount} pendingComments={pendingComments} onNavigate={() => setMobileOpen(false)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SidebarContent pathname={pathname} unreadCount={unreadCount} pendingComments={pendingComments} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-xl">
          <div className="h-full flex items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden size-9"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Admin</span>
                <span>/</span>
                <span className="text-foreground font-medium capitalize">
                  {pathname === "/x9k2-dashboard" ? "Dashboard" : pathname.split("/")[2] || "Dashboard"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="size-9 relative">
                <Link href="/x9k2-dashboard/messages">
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors" suppressHydrationWarning>
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs">
                        {user.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground">{user.role}</span>
                    </div>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/x9k2-dashboard/settings"><Settings className="size-4 mr-2" /> Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" target="_blank"><ExternalLink className="size-4 mr-2" /> View Site</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                    <LogOut className="size-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
