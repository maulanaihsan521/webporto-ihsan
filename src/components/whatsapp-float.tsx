"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

interface WhatsAppFloatProps {
  whatsappUrl?: string;
}

export function WhatsAppFloat({ whatsappUrl = "" }: WhatsAppFloatProps) {
  const [show, setShow] = useState(false);
  const [bubble, setBubble] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Determine WhatsApp link: use provided URL from settings, or fallback to default
  const defaultPhone = "6281234567890";
  const defaultMsg = encodeURIComponent("Halo Maulana, saya tertarik dengan layanan Anda.");

  let href: string;
  if (whatsappUrl && whatsappUrl.trim()) {
    // If the URL already starts with https://wa.me/, use it directly
    if (whatsappUrl.startsWith("http")) {
      href = whatsappUrl;
    } else {
      // Assume it's a phone number, build wa.me link
      const cleanPhone = whatsappUrl.replace(/[^\d]/g, "");
      href = `https://wa.me/${cleanPhone}?text=${defaultMsg}`;
    }
  } else {
    href = `https://wa.me/${defaultPhone}?text=${defaultMsg}`;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2"
        >
          <AnimatePresence>
            {bubble && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="glass-strong rounded-2xl rounded-bl-sm p-3 pr-8 max-w-[220px] shadow-xl relative"
              >
                <button
                  onClick={() => setBubble(false)}
                  className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>
                <p className="text-xs font-medium leading-relaxed">
                  👋 Halo! Butuh bantuan dengan proyek digital marketing atau video? Chat saya!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat WhatsApp"
            className="size-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40 flex items-center justify-center hover:scale-110 transition-transform relative"
          >
            <MessageCircle className="size-7" />
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
