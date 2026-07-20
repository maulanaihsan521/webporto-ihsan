"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
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
};

/**
 * Reusable TradingView widget embedder.
 *
 * TradingView widgets are loaded by injecting a `<script>` tag whose `src`
 * points at `https://s3.tradingview.com/external-embedding/embed-widget-*.js`
 * and whose `innerHTML` is the JSON config. The script creates an iframe
 * inside the container on load.
 *
 * Theme: we read next-themes' resolved theme and inject `colorTheme: "dark" | "light"`
 * unless the caller already specifies `colorTheme` / `theme`. When the OS theme
 * changes, the widget is rebuilt so the iframe matches.
 */
export function TradingViewWidget({
  widgetType,
  config,
  height = 400,
  id,
  className,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const themeColor: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark";

  // Compose the effective config — inject theme unless caller overrides it.
  const effectiveConfig: Record<string, unknown> = {
    ...config,
  };
  if (!("colorTheme" in effectiveConfig) && !("theme" in effectiveConfig)) {
    effectiveConfig.colorTheme = themeColor;
  }
  // For market overview / ticker / news that use `colorTheme`.
  if (widgetType === "ticker" || widgetType === "market_overview" || widgetType === "news") {
    effectiveConfig.colorTheme = themeColor;
  }
  // For the advanced chart widget the property is `theme`.
  if (widgetType === "chart") {
    effectiveConfig.theme = themeColor;
    effectiveConfig.colorTheme = themeColor;
  }

  // Rebuild the widget whenever the type, config, or theme changes.
  useEffect(() => {
    if (!containerRef.current) return;
    // Clear any previous iframe / script so we don't stack duplicates.
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/${WIDGET_SCRIPT[widgetType]}`;
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify(effectiveConfig);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [widgetType, JSON.stringify(effectiveConfig)]);

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
      ref={containerRef}
      aria-label="TradingView widget"
    />
  );
}
