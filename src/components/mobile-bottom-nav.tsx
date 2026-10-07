"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Briefcase, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// About menggantikan Contact (permintaan user) & diposisikan tepat di
// sebelah Home — Contact tetap tersedia di header desktop & menu lengkap.
const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "About", href: "/about", icon: User },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Gallery", href: "/gallery", icon: ImageIcon },
  { label: "Blog", href: "/blog", icon: FileText },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-border bg-background/95 backdrop-blur-md"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 safe-area-inset-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-foreground/60 hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
