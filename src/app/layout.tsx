import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { SITE_CONFIG } from "@/lib/site-config";
import { getBaseUrl } from "@/lib/server-site-config";
import { getSettings } from "@/lib/settings";
import { DEFAULT_OG_IMAGE_URL, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, absoluteOgImage, adminOgImageFor } from "@/lib/og-image";

import { safeJsonLd } from "@/lib/utils";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- generateMetadata (dynamic, reads from DB with SITE_CONFIG fallback) ---
// This replaces the static `export const metadata` so that SEO settings
// saved via the admin panel actually affect the website's metadata tags.
export async function generateMetadata(): Promise<Metadata> {
  // Fetch SEO settings from database (cached 5s by settings lib)
  const settings = await getSettings();

  // Dynamic base URL dari incoming request headers (auto-detect domain).
  // Pakai getBaseUrl() supaya metadataBase, canonical, OG URL selalu match
  // domain yang user akses — tidak terikat env var NEXT_PUBLIC_SITE_URL
  // yang di-inject saat build time (yang bisa jadi domain lama).
  const dynamicSiteUrl = await getBaseUrl();

  // SEO values: DB setting → SITE_CONFIG fallback
  const metaTitle = settings.seo_meta_title || SITE_CONFIG.fullTitle;
  const metaDescription = settings.seo_meta_description || SITE_CONFIG.description;
  const metaKeywords = settings.seo_meta_keywords
    ? settings.seo_meta_keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [
        "Maulana Ihsan Rohim",
        "Digital Marketing",
        "Social Media",
        "Video Editor",
        "Financial Market",
        "Portfolio",
        "Freelancer",
      ];
  const ogTitle = settings.seo_og_title || metaTitle;
  const ogDescription = settings.seo_og_description || metaDescription;
  // og:image RELATIVE (di-resolve metadataBase = domain runtime).
  // FIX Task 22: sebelumnya SITE_CONFIG.ogImage (absolut dari env build-time
  // = domain lama vercel.app yang redirect 308) → preview WhatsApp gagal.
  // Nilai dari admin SEO panel dinormalisasi adminOgImageFor(): URL Supabase
  // → proxy terkompresi, aset /uploads di domain lama → path relatif runtime.
  const ogImage = adminOgImageFor(settings.seo_og_image, dynamicSiteUrl);
  // Google Search Console verification token.
  // Priority: DB setting (admin SEO panel) → env var NEXT_PUBLIC_GOOGLE_VERIFICATION.
  // Jangan hardcode token domain lama sebagai fallback — akan menyebabkan
  // GSC verification gagal untuk domain baru karena token tidak cocok.
  // Jika token kosong, meta tag verification tidak di-output (Google abaikan).
  const googleVerification = settings.seo_google_verification ||
    process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
    "";
  const canonicalUrl = settings.seo_canonical_url || dynamicSiteUrl;
  const twitterHandle = settings.seo_twitter_handle || SITE_CONFIG.twitter;

  const metadata: Metadata = {
    metadataBase: new URL(dynamicSiteUrl),
    applicationName: SITE_CONFIG.name,
    title: {
      default: metaTitle,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: metaDescription,
    keywords: metaKeywords,
    authors: [{ name: SITE_CONFIG.author, url: dynamicSiteUrl }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.author,
    icons: {
      // FIX 2026-09-11: favicon lama = JPEG ber-ekstensi .png (content-type
      // mismatch) + huruf hanya 62% lebar frame. Regenerasi via
      // scripts/fix-favicon.mjs: PNG asli, huruf 83% lebar, file per-ukuran
      // nyata (lihat public/apple-touch-icon.png, icon-192/512.png).
      icon: [
        { url: "/logo-mi.png", type: "image/png", sizes: "768x768" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon.ico",
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SITE_CONFIG.name,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      locale: "id_ID",
      siteName: SITE_CONFIG.name,
      url: dynamicSiteUrl,
      images: [
        {
          url: ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: twitterHandle,
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
      // Umumkan kehadiran RSS feed — crawler & reader bisa menemukannya
      // tanpa harus menebak URL /rss.xml.
      types: {
        "application/rss+xml": `${dynamicSiteUrl}/rss.xml`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };

  // Only output verification meta tag if token is set
  // (empty content would render <meta name="google-site-verification" content="">
  //  which is invalid and would fail GSC verification)
  if (googleVerification) {
    metadata.verification = { google: googleVerification };
  }

  return metadata;
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

// --- Structured Data (JSON-LD) ---------------------------------------
// Google's primary signal for Site Name is `WebSite.name`.
// We render both `WebSite` and `Person` schemas in <head> as separate
// <script type="application/ld+json"> blocks — Google accepts multiple blocks.
//
// NOTE: personSchema is built inside RootLayout (async) because it needs
// the profile photo URL from the database (settings.owner_photo).
// Google requires an explicit `image` field in Person schema to reliably
// show the person's photo in search results.

function buildWebsiteSchema(profilePhotoUrl: string | null, metaDescription: string, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.alternateName,
    url: siteUrl,
    description: metaDescription,
    inLanguage: "id-ID",
    publisher: {
      "@type": "Person",
      name: SITE_CONFIG.name,
      url: siteUrl,
      // FIX Task 22: absolut berbasis domain runtime (bukan SITE_CONFIG.ogImage
      // yang absolut domain lama redirect 308).
      // FIX 2026-09-17: JSON-LD image juga via proxy (JPEG) — konsisten dengan
      // og:image; og-default.webp mentah tidak dirender WhatsApp.
      image: profilePhotoUrl || absoluteOgImage(DEFAULT_OG_IMAGE_URL, siteUrl),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

function buildPersonSchema(profilePhotoUrl: string | null, metaDescription: string, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.alternateName,
    url: siteUrl,
    image: profilePhotoUrl || absoluteOgImage(DEFAULT_OG_IMAGE_URL, siteUrl),
    jobTitle: "Digital Marketing Specialist & Financial Market Analyst",
    description: metaDescription,
    knowsAbout: [
      "Digital Marketing",
      "Social Media Management",
      "Photography",
      "Videography",
      "Video Editing",
      "Financial Market Analysis",
    ],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings to get the profile photo URL for Person schema `image` field
  // and SEO meta description for JSON-LD schemas.
  const settings = await getSettings();
  const profilePhotoUrl = settings.owner_photo || null;
  const metaDescription = settings.seo_meta_description || SITE_CONFIG.description;
  // Dynamic site URL dari incoming request headers (auto-detect domain)
  const dynamicSiteUrl = await getBaseUrl();

  const websiteSchema = buildWebsiteSchema(profilePhotoUrl, metaDescription, dynamicSiteUrl);
  const personSchema = buildPersonSchema(profilePhotoUrl, metaDescription, dynamicSiteUrl);

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(personSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <SonnerToaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
