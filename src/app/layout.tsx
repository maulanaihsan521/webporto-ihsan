import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { SITE_URL, SITE_CONFIG } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Maulana Ihsan Rohim — Digital Marketing & Financial Market Analyst",
    template: "%s | Maulana Ihsan Rohim",
  },
  description:
    "Portfolio profesional Maulana Ihsan Rohim — Freelancer Digital Marketing, Social Media Specialist, Photo & Video Production, Video Editor, dan Financial Market Analyst.",
  keywords: [
    "Maulana Ihsan Rohim",
    "Digital Marketing",
    "Social Media",
    "Video Editor",
    "Financial Market",
    "Portfolio",
    "Freelancer",
  ],
  authors: [{ name: "Maulana Ihsan Rohim" }],
  creator: "Maulana Ihsan Rohim",
  icons: {
    icon: [
      { url: "/logo-mi.png", type: "image/png", sizes: "1024x1024" },
      { url: "/logo-mi.png", type: "image/png", sizes: "512x512" },
      { url: "/logo-mi.png", type: "image/png", sizes: "192x192" },
      { url: "/logo-mi.png", type: "image/png", sizes: "32x32" },
      { url: "/logo-mi.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/logo-mi.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/logo-mi.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Maulana Ihsan Rohim",
  },
  openGraph: {
    title: "Maulana Ihsan Rohim — Digital Marketing & Financial Market Analyst",
    description:
      "Portfolio profesional Maulana Ihsan Rohim — Digital Marketing, Social Media, Photo & Video, Financial Market.",
    type: "website",
    locale: "id_ID",
    siteName: "Maulana Ihsan Rohim",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim",
    description: "Digital Marketing & Financial Market Analyst Portfolio",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "PinzlrJb7G_xNlItF640a5xdPF3xo_IwVhzM99MmBW8",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Maulana Ihsan Rohim",
              jobTitle: "Digital Marketing Specialist & Financial Market Analyst",
              url: SITE_URL,
              knowsAbout: [
                "Digital Marketing",
                "Social Media Management",
                "Photography",
                "Videography",
                "Video Editing",
                "Financial Market Analysis",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
