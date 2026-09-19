"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

export function BlurImage({ src, alt, className, containerClassName, priority }: BlurImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setInView(true);
      return;
    }
    // Fallback: render immediately, then use IntersectionObserver for optimization
    setInView(true);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-muted/30", containerClassName)}>
      {/* Blur placeholder shimmer */}
      {!loaded && <div className="absolute inset-0 shimmer" />}
      {inView && (
         
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          className={cn(
            "transition-all duration-700",
            loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-xl scale-105",
            className
          )}
        />
      )}
    </div>
  );
}
