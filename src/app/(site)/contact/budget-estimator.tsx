"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, Briefcase, Camera, Video, Code2, TrendingUp, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  label: string;
  icon: any;
  basePrice: number;
  unit: string;
}

// Default prices — can be overridden via settings (price_* keys)
const DEFAULT_SERVICES: Service[] = [
  { id: "digital-marketing", label: "Digital Marketing", icon: TrendingUp, basePrice: 5000000, unit: "kampanye" },
  { id: "social-media", label: "Social Media Management", icon: Briefcase, basePrice: 3000000, unit: "bulan" },
  { id: "photography", label: "Photography", icon: Camera, basePrice: 1500000, unit: "sesi" },
  { id: "videography", label: "Videography", icon: Video, basePrice: 5000000, unit: "proyek" },
  { id: "video-editing", label: "Video Editing", icon: Video, basePrice: 2000000, unit: "video" },
  { id: "web-development", label: "Website Development", icon: Code2, basePrice: 8000000, unit: "proyek" },
];

const COMPLEXITY = [
  { id: "basic", label: "Basic", multiplier: 1, desc: "Standar, scope jelas" },
  { id: "standard", label: "Standard", multiplier: 1.5, desc: "Custom + revisi" },
  { id: "premium", label: "Premium", multiplier: 2.5, desc: "Kompleks, deadline ketat" },
];

const TIMELINE = [
  { id: "normal", label: "Normal (2-4 minggu)", multiplier: 1 },
  { id: "express", label: "Express (1-2 minggu)", multiplier: 1.3 },
  { id: "rush", label: "Rush (< 1 minggu)", multiplier: 1.6 },
];

interface BudgetEstimatorProps {
  prices?: Record<string, string>;
}

export function BudgetEstimator({ prices = {} }: BudgetEstimatorProps) {
  // Build services with prices from settings, fallback to defaults
  const SERVICES = DEFAULT_SERVICES.map((s) => {
    const priceVal = prices[`price_${s.id}`];
    const parsed = priceVal ? Number(priceVal) : NaN;
    return {
      ...s,
      basePrice: !isNaN(parsed) && parsed > 0 ? parsed : s.basePrice,
    };
  });

  const [selected, setSelected] = useState<string[]>(["digital-marketing"]);
  const [complexity, setComplexity] = useState("standard");
  const [timeline, setTimeline] = useState("normal");

  const toggleService = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const estimate = useMemo(() => {
    const baseTotal = selected.reduce((sum, id) => {
      const svc = SERVICES.find((s) => s.id === id);
      return sum + (svc?.basePrice || 0);
    }, 0);
    const cMult = COMPLEXITY.find((c) => c.id === complexity)?.multiplier || 1;
    const tMult = TIMELINE.find((t) => t.id === timeline)?.multiplier || 1;
    return Math.round((baseTotal * cMult * tMult) / 100000) * 100000;
  }, [selected, complexity, timeline]);

  const formatPrice = (n: number) => {
    if (isNaN(n) || n === undefined || n === null) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-8">
      <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
            <Calculator className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Estimasi Budget Proyek</h3>
            <p className="text-sm text-muted-foreground">Pilih layanan untuk estimasi harga</p>
          </div>
        </div>

        {/* Service selection */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pilih Layanan</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SERVICES.map((svc) => {
              const active = selected.includes(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-accent/50"
                  )}
                >
                  <svc.icon className="size-5" />
                  <span className="text-xs font-medium leading-tight">{svc.label}</span>
                  {active && (
                    <CheckCircle2 className="absolute top-2 right-2 size-3.5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Complexity */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tingkat Kompleksitas</p>
          <div className="grid grid-cols-3 gap-2">
            {COMPLEXITY.map((c) => (
              <button
                key={c.id}
                onClick={() => setComplexity(c.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  complexity === c.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-accent/50"
                )}
              >
                <p className="text-sm font-semibold">{c.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
            <Clock className="size-3" /> Timeline
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TIMELINE.map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeline(t.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all text-sm font-medium",
                  timeline === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 hover:bg-accent/50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <motion.div
          key={estimate}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-primary border border-primary/20 p-5"
        >
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estimasi Total</p>
              <p className="text-3xl sm:text-4xl font-bold text-gradient">
                {selected.length === 0 ? "—" : formatPrice(estimate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selected.length === 0
                  ? "Pilih layanan untuk melihat estimasi"
                  : `Estimasi untuk ${selected.length} layanan · harga dapat dinegosiasikan`}
              </p>
            </div>
            <Button asChild size="lg" className="rounded-xl shadow-lg shadow-primary/30">
              <a href="#contact-form">
                <ArrowRight className="size-4" /> Konsultasi
              </a>
            </Button>
          </div>
        </motion.div>

        <p className="text-[11px] text-muted-foreground mt-4 text-center">
          * Estimasi bersifat indikatif. Harga final ditentukan setelah konsultasi detail.
        </p>
      </div>
    </Card>
  );
}
