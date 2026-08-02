"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };
  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="fixed bottom-20 lg:bottom-4 inset-x-4 z-50 mx-auto max-w-3xl"
        >
          <div className="glass-strong rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Cookie className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-0.5">Kami menggunakan cookies</p>
              <p className="text-xs text-muted-foreground">
                Kami menggunakan cookies untuk meningkatkan pengalaman Anda. Dengan terus menggunakan situs ini, Anda menyetujui kebijakan privasi kami.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={decline} className="flex-1 sm:flex-none rounded-lg">
                Tolak
              </Button>
              <Button size="sm" onClick={accept} className="flex-1 sm:flex-none rounded-lg">
                Terima
              </Button>
            </div>
            <button
              onClick={decline}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground sm:hidden"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
