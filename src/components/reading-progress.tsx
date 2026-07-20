"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ReadingProgress({ targetSelector = "article" }: { targetSelector?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const onScroll = () => {
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetSelector]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent pointer-events-none"
      style={{ originX: 0 }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-primary via-primary to-chart-2"
        style={{ width: `${progress}%` }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      />
    </motion.div>
  );
}
