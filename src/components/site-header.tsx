"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun, Command } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { CommandPalette } from "@/components/command-palette";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Skills", href: "/skills" },
  { label: "Market", href: "/financial-market" },
  { label: "Blog", href: "/blog" },
  { label: "Gallery", href: "/gallery" },
  { label: "Certificates", href: "/certificates" },
  { label: "Experience", href: "/experience" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "py-2" : "py-4"
        )}
      >
        <div className="section-pad">
          <div
            className={cn(
              "mx-auto max-w-7xl flex items-center justify-between gap-4 rounded-2xl px-4 sm:px-6 transition-all duration-300",
              scrolled
                ? "glass-strong shadow-lg h-14"
                : "bg-transparent h-16"
            )}
          >
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative size-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                MI
                <span className="absolute -inset-0.5 rounded-xl bg-primary/30 blur-md -z-10" />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-bold text-sm tracking-tight">Maulana Ihsan</span>
                <span className="text-[10px] text-muted-foreground font-medium">Digital Marketing · Finance</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV.slice(0, 8).map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-lg bg-primary/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
              <div className="relative group">
                <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                  More
                </button>
                <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="glass-strong rounded-xl p-1 min-w-44 shadow-xl">
                    {NAV.slice(8).map((item) => {
                      const active = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "block px-3 py-2 text-sm rounded-lg",
                            active ? "bg-primary/10 text-primary" : "hover:bg-accent"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg"
                onClick={() => setCmdOpen(true)}
                aria-label="Search"
              >
                <Command className="size-4" />
              </Button>
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {theme === "dark" ? (
                      <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                        <Sun className="size-4" />
                      </motion.span>
                    ) : (
                      <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                        <Moon className="size-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              )}
              <Button asChild size="sm" className="hidden sm:inline-flex rounded-lg">
                <Link href="/contact">Hire Me</Link>
              </Button>

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden size-9 rounded-lg" aria-label="Menu" suppressHydrationWarning>
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
                  <SheetHeader>
                    <VisuallyHidden>
                      <SheetTitle>Navigation Menu</SheetTitle>
                    </VisuallyHidden>
                  </SheetHeader>
                  <div className="flex items-center justify-between p-5 border-b">
                    <span className="font-bold">Menu</span>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(false)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  <nav className="flex flex-col p-3 gap-0.5 overflow-y-auto h-[calc(100vh-80px)]">
                    {NAV.map((item) => {
                      const active =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-accent"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                    <div className="h-px bg-border my-3" />
                    <Link
                      href="/testimonials"
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-accent"
                    >
                      Testimonials
                    </Link>
                    <Link
                      href="/faq"
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-accent"
                    >
                      FAQ
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-accent"
                    >
                      Admin Dashboard
                    </Link>
                    <Button asChild className="mt-3 rounded-xl">
                      <Link href="/contact" onClick={() => setOpen(false)}>Hire Me</Link>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
