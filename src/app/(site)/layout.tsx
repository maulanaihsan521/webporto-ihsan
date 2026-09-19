import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CookieConsent } from "@/components/cookie-consent";
import { VisitorTracker } from "@/components/visitor-tracker";
import { getSettings, isMarketEnabled } from "@/lib/settings";

// Render halaman publik saat diakses (bukan saat build).
// Ini mencegah build gagal karena query database ke Supabase saat build,
// dan memastikan konten CMS selalu terbaru tanpa perlu re-deploy.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const marketEnabled = isMarketEnabled(settings);
  return (
    <div className="relative min-h-screen flex flex-col">
      <SiteHeader marketEnabled={marketEnabled} />
      {/* A11Y (Task 12): skip link — user keyboard langsung lompat ke konten
          tanpa harus men-tab seluruh navbar (situs header fixed). */}
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Langsung ke konten utama
      </a>
      <main id="konten-utama" className="flex-1 pt-20 pb-20 lg:pb-0">{children}</main>
      <SiteFooter />
      <MobileBottomNav />
      <CookieConsent />
      <VisitorTracker />
    </div>
  );
}
