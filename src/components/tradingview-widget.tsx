"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Maps a high-level `widgetType` to the actual TradingView embed script filename.
 */
const WIDGET_SCRIPT: Record<TradingViewWidgetProps["widgetType"], string> = {
  ticker: "embed-widget-ticker-tape.js",
  chart: "embed-widget-advanced-chart.js",
  calendar: "embed-widget-events.js",
  news: "embed-widget-timeline.js",
  market_overview: "embed-widget-market-overview.js",
  symbols: "embed-widget-symbol-info.js",
  screener: "embed-widget-screener.js",
  technical_analysis: "embed-widget-technical-analysis.js",
  company_profile: "embed-widget-company-profile.js",
  fundamental_data: "embed-widget-financials.js",
  topstories: "embed-widget-timeline.js",
};

export type TradingViewWidgetProps = {
  /**
   * Which TradingView widget to embed. Determines the script file used.
   */
  widgetType:
    | "ticker"
    | "chart"
    | "calendar"
    | "news"
    | "market_overview"
    | "symbols"
    | "screener"
    | "technical_analysis"
    | "company_profile"
    | "fundamental_data"
    | "topstories";
  /**
   * Configuration object that will be serialized into the script body.
   * TradingView reads this JSON to render the widget.
   */
  config: Record<string, unknown>;
  /**
   * Height of the container (px or any CSS string). TradingView widgets
   * collapse without a defined height, so a sensible default is provided.
   */
  height?: number | string;
  /**
   * Unique DOM id for the container (useful when stacking several widgets).
   */
  id?: string;
  className?: string;
  /**
   * Show a lightweight loading overlay while the TradingView iframe is being
   * created. Without it the container is a blank box for 1–3s, which users
   * perceive as "lag / frozen". Defaults to true.
   */
  showLoading?: boolean;
  /**
   * Optional label shown inside the loading overlay (e.g. "Memuat chart…").
   */
  loadingLabel?: string;
};

/**
 * Reusable TradingView widget embedder.
 *
 * TradingView widgets are loaded by injecting a `<script>` tag whose `src`
 * points at `https://s3.tradingview.com/external-embedding/embed-widget-*.js`
 * and whose `innerHTML` is the JSON config. The script creates an iframe
 * inside the container on load.
 *
 * Perf notes (2026-09-17 lag fix):
 * - The embed script gives no load callback, so a MutationObserver watches
 *   the container and hides the loading overlay once TradingView inserts its
 *   iframe (+400ms paint delay for a smooth handover to TV's own loader).
 * - The config is memoized and serialized into a stable string used as the
 *   single effect dependency — the widget only rebuilds when the config
 *   actually changes (value equality, not object identity).
 * - Theme: we read next-themes' resolved theme and inject
 *   `colorTheme: "dark" | "light"` unless the caller already specifies it.
 */
export function TradingViewWidget({
  widgetType,
  config,
  height = 400,
  id,
  className,
  showLoading = true,
  loadingLabel = "Memuat data pasar…",
}: TradingViewWidgetProps) {
  // Inner container that hosts the injected script + iframe. The overlay
  // lives in the outer wrapper so `innerHTML = ""` cleanup never wipes it.
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [iframeReady, setIframeReady] = useState(false);

  const themeColor: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";

  // Compose the effective config — inject theme unless caller overrides it.
  const effectiveConfig = useMemo(() => {
    const cfg: Record<string, unknown> = { ...config };
    if (!("colorTheme" in cfg) && !("theme" in cfg)) {
      cfg.colorTheme = themeColor;
    }
    // For market overview / ticker / news that use `colorTheme`.
    if (widgetType === "ticker" || widgetType === "market_overview" || widgetType === "news") {
      cfg.colorTheme = themeColor;
    }
    // For the advanced chart widget the property is `theme`.
    if (widgetType === "chart") {
      cfg.theme = themeColor;
      cfg.colorTheme = themeColor;
    }
    return cfg;
  }, [config, themeColor, widgetType]);

  // Stable serialization — the effect below only re-runs when this string
  // actually changes (same content ⇒ same string ⇒ no iframe reload).
  const configKey = useMemo(() => JSON.stringify(effectiveConfig), [effectiveConfig]);

  // Rebuild the widget whenever the type or the serialized config changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setIframeReady(false);
    // Clear any previous iframe / script so we don't stack duplicates.
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/${WIDGET_SCRIPT[widgetType]}`;
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = configKey;
    container.appendChild(script);

    // TradingView inserts `<div class="tradingview-widget-copyright">` + an
    // iframe into the container once the embed script boots. Watch for it so
    // we can hand over from our overlay to TV's own inline loading state.
    let paintTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      if (container.querySelector("iframe")) {
        observer.disconnect();
        // Small grace period so the iframe paints its first frame before
        // the overlay fades out (avoids a white/black flash).
        paintTimer = setTimeout(() => setIframeReady(true), 400);
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (paintTimer) clearTimeout(paintTimer);
      container.innerHTML = "";
    };
  }, [widgetType, configKey]);

  const heightStyle: React.CSSProperties =
    typeof height === "number" ? { height: `${height}px` } : { height };

  return (
    <div
      className={cn(
        "tradingview-widget-container relative w-full overflow-hidden rounded-xl",
        className,
      )}
      style={heightStyle}
      id={id}
      aria-label="TradingView widget"
    >
      {/* Script + iframe host — TradingView manages this subtree. */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Loading overlay — pure CSS, pointer-transparent, fades out when ready. */}
      {showLoading && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/70 transition-opacity duration-300",
            iframeReady ? "opacity-0" : "opacity-100",
          )}
        >
          <Loader2 className="size-6 animate-spin text-primary" />
          <div className="shimmer h-1.5 w-40 rounded-full" />
          {loadingLabel && (
            <p className="text-xs text-muted-foreground">{loadingLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
