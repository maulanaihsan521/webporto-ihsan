"use client";

import { useState } from "react";
import { Link2, Twitter, Facebook, Linkedin, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ShareButtonsProps = {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "default" | "compact";
};

/**
 * Reusable social share buttons.
 * - Copy link (clipboard)
 * - X / Twitter
 * - Facebook
 * - LinkedIn
 * - WhatsApp
 *
 * @example
 * <ShareButtons url="https://example.com/post" title="My Awesome Post" />
 */
export function ShareButtons({
  url,
  title,
  description,
  className,
  variant = "default",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof url === "string" ? url : "";
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description ?? title);

  const links = [
    {
      key: "twitter",
      label: "X / Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      hoverClass: "hover:bg-foreground hover:text-background hover:border-foreground",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      hoverClass: "hover:bg-primary hover:text-primary-foreground hover:border-primary",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      hoverClass: "hover:bg-chart-2 hover:text-white hover:border-chart-2",
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      hoverClass: "hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Tautan disalin ke clipboard");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Gagal menyalin tautan");
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Salin tautan"
          className="flex size-9 items-center justify-center rounded-full border bg-background/60 transition-colors hover:bg-accent"
        >
          {copied ? <Check className="size-4 text-emerald-500" /> : <Link2 className="size-4" />}
        </button>
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bagikan ke ${l.label}`}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border bg-background/60 transition-colors",
              l.hoverClass,
            )}
          >
            <l.icon className="size-4" />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-9 items-center gap-2 rounded-full border bg-background/60 px-4 text-sm font-medium transition-colors hover:bg-accent"
      >
        {copied ? <Check className="size-4 text-emerald-500" /> : <Link2 className="size-4" />}
        {copied ? "Tersalin" : "Salin Tautan"}
      </button>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bagikan ke ${l.label}`}
          title={`Bagikan ke ${l.label}`}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full border bg-background/60 transition-colors",
            l.hoverClass,
          )}
        >
          <l.icon className="size-4" />
        </a>
      ))}
    </div>
  );
}
