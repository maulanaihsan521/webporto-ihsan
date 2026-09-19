"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Error boundary untuk seluruh area (site) — satu-satunya jaring pengaman
 * bila query database (Supabase) gagal saat render halaman publik.
 * Sebelumnya: tidak ada error.tsx sama sekali → satu DB hiccup = 500
 * dengan UI error bawaan Next.js.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass rounded-2xl p-8 sm:p-12 max-w-md">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Terjadi kendala teknis</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Maaf, halaman ini gagal dimuat sepenuhnya. Kemungkinan gangguan
          koneksi sementara — silakan coba lagi.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="size-4" />
          Coba lagi
        </button>
      </div>
    </div>
  );
}
