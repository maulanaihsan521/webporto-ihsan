"use client";

/**
 * Global error boundary (fallback terakhir, termasuk root layout errors).
 * Kustom + tombol reload — jangan tampilkan stack/internal detail ke user.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[global-error]", error);
  return (
    <html lang="id">
      <body style={{ margin: 0, background: "#0F172A", color: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "26rem", textAlign: "center", padding: "2rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.10)", background: "#1E293B" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Terjadi kendala teknis</h2>
            <p style={{ color: "#94A3B8", fontSize: "0.875rem" }}>
              Maaf, terjadi kesalahan tak terduga. Silakan coba muat ulang halaman.
            </p>
            <button
              onClick={reset}
              style={{ marginTop: "1rem", padding: "0.625rem 1.5rem", borderRadius: "999px", background: "#DCAF5E", color: "#0F172A", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              Coba lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
