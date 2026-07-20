import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieConsent } from "@/components/cookie-consent";
import { VisitorTracker } from "@/components/visitor-tracker";

// Render halaman publik saat diakses (bukan saat build).
// Ini mencegah build gagal karena query database ke Supabase saat build,
// dan memastikan konten CMS selalu terbaru tanpa perlu re-deploy.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-20">{children}</main>
      <SiteFooter />
      <CookieConsent />
      <VisitorTracker />
    </div>
  );
}
