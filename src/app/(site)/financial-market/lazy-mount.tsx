"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Defers mounting heavy children (e.g. TradingView iframes) until the
 * placeholder scrolls close to the viewport.
 *
 * Why: on /financial-market two heavyweight iframes (ticker tape + market
 * overview with ~18 symbols) used to boot at page load, competing for
 * bandwidth and main-thread time with the page's own JS hydration — making
 * the whole page feel laggy. Mounting on approach (300px rootMargin) lets
 * hydration finish first, and the widget is still ready before the user
 * reaches it.
 *
 * Fallback: if IntersectionObserver is unavailable, children mount
 * immediately.
 */
export function LazyMount({
  children,
  minHeight,
  className,
  loadingLabel = "Memuat data pasar…",
}: {
  children: React.ReactNode;
  /** Placeholder height while deferred (px). Should match the widget's height. */
  minHeight: number | string;
  className?: string;
  loadingLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Start loading slightly BEFORE the widget scrolls into view so users
      // on fast connections never see the placeholder.
      { rootMargin: "0px 0px 300px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const minHeightStyle: React.CSSProperties =
    typeof minHeight === "number"
      ? { minHeight: `${minHeight}px` }
      : { minHeight };

  return (
    <div
      ref={ref}
      className={className}
      style={visible ? undefined : minHeightStyle}
    >
      {visible ? (
        children
      ) : (
        <div
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl",
            className,
          )}
          style={minHeightStyle}
          aria-busy="true"
          aria-label={loadingLabel}
        >
          <Loader2 className="size-6 animate-spin text-primary" />
          <div className="shimmer h-1.5 w-40 rounded-full" />
          <p className="text-xs text-muted-foreground">{loadingLabel}</p>
        </div>
      )}
    </div>
  );
}
