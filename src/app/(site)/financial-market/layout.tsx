import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";

export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  // Toggle market off (settings admin) → halaman fitur market (tools,
  // watchlist, dll.) tidak tersedia untuk publik. Artikel market TIDAK
  // terpengaruh — kini hidup di /blog (kategori Financial Market).
  //
  // Cek dilakukan di LAYOUT, bukan di page: loading.tsx pada rute (list) akan
  // flush shell HTTP 200 segera — notFound() yang dilempar page SETELAH shell
  // ter-flush hanya mengganti isi stream menjadi UI not-found (soft-404, status
  // tetap 200). Dari layout, notFound() terjadi sebelum response dimulai sehingga
  // status HTTP benar-benar 404 — bersih untuk crawler & user.
  const settings = await getSettings();
  if (settings.market_section === "false") notFound();
  return <>{children}</>;
}
