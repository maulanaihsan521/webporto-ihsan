/**
 * Site configuration — reads from environment variable.
 * All URLs across the project should use SITE_URL instead of hardcoding.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://portofoliomaulanaihsan.vercel.app";

export const SITE_CONFIG = {
  url: SITE_URL,
  name: "Maulana Ihsan Rohim",
  tagline: "Digital Marketing & Financial Market Analyst",
  description:
    "Portfolio profesional Maulana Ihsan Rohim — Freelancer Digital Marketing, Social Media Specialist, Photo & Video Production, Video Editor, dan Financial Market Analyst.",
  locale: "id_ID",
  author: "Maulana Ihsan Rohim",
  twitter: "@maulanaihsan",
} as const;
