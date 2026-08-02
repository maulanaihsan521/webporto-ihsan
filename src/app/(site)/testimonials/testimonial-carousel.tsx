"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInitials, cn } from "@/lib/utils";

export type TestimonialItem = {
  id: string;
  name: string;
  position: string | null;
  company: string | null;
  avatar: string | null;
  rating: number;
  content: string;
};

const avatarGradients = [
  "from-amber-500 to-orange-500",
  "from-teal-500 to-emerald-500",
  "from-violet-500 to-fuchsia-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-teal-500",
  "from-emerald-500 to-lime-500",
];

function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`Rating ${rating} dari 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4 transition-colors",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialCarousel({
  items,
}: {
  items: TestimonialItem[];
}) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Each CarouselItem maps to a single slide, so the count is the items length.
  const count = items.length;

  // Subscribe to embla select / reInit events to track the active slide.
  // State updates happen inside the event handler (not synchronously in the
  // effect body) so React's cascading-render lint rule stays happy.
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  // Auto-play every 5.5s, paused on hover
  useEffect(() => {
    if (!api || paused || count <= 1) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5500);
    return () => clearInterval(interval);
  }, [api, paused, count]);

  const scrollTo = useCallback(
    (idx: number) => {
      api?.scrollTo(idx);
    },
    [api],
  );

  if (items.length === 0) return null;

  return (
    <div
      className="relative mx-auto max-w-4xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Testimoni unggulan"
    >
      <Carousel
        opts={{ loop: items.length > 1, align: "center" }}
        setApi={setApi}
        className="overflow-hidden"
      >
        <CarouselContent className="-ml-4">
          {items.map((t) => {
            const initials = getInitials(t.name || "?");
            const grad = gradientForName(t.name || "?");
            return (
              <CarouselItem key={t.id} className="pl-4">
                <Card className="glass-strong relative overflow-hidden p-6 sm:p-10">
                  {/* Decorative quote mark */}
                  <Quote
                    className="pointer-events-none absolute -right-3 -top-3 size-28 text-primary/10 sm:right-6 sm:top-6 sm:size-32"
                    aria-hidden
                  />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <Stars rating={t.rating} className="mb-5" />

                    <blockquote className="text-balance text-lg font-medium leading-relaxed text-foreground/90 sm:text-2xl sm:leading-relaxed">
                      &ldquo;{t.content}&rdquo;
                    </blockquote>

                    <div className="mt-8 flex items-center gap-4">
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="size-14 rounded-full object-cover ring-2 ring-background"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex size-14 items-center justify-center rounded-full bg-primary font-bold text-white shadow-lg ring-2 ring-background",
                            grad,
                          )}
                          aria-hidden
                        >
                          {initials}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-base font-semibold">{t.name}</p>
                        {(t.position || t.company) && (
                          <p className="text-sm text-muted-foreground">
                            {[t.position, t.company].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Prev / Next controls */}
      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="glass size-11 rounded-full"
            aria-label="Testimoni sebelumnya"
            onClick={() => api?.scrollPrev()}
            disabled={count <= 1}
          >
            <ChevronLeft className="size-5" />
          </Button>

          {/* Dot indicators */}
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Pilih testimoni"
          >
            {Array.from({ length: count }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === current}
                aria-label={`Ke testimoni ${idx + 1}`}
                onClick={() => scrollTo(idx)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  idx === current
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="glass size-11 rounded-full"
            aria-label="Testimoni berikutnya"
            onClick={() => api?.scrollNext()}
            disabled={count <= 1}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
