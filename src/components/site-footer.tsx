import Link from "next/link";
import { Github, Linkedin, Instagram, Facebook, Youtube, Mail, ArrowUp, MessageCircle } from "lucide-react";
import { getSettings, isMarketEnabled } from "@/lib/settings";
import { ScrollToTop } from "@/components/scroll-to-top";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { isValidSocialUrl } from "@/lib/social-utils";

const FOOTER_LINKS = [
  {
    title: "Navigasi",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Konten",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Gallery", href: "/gallery" },
      { label: "Certificates", href: "/certificates" },
      { label: "Experience", href: "/experience" },
      { label: "Skills", href: "/skills" },
    ],
  },
  {
    title: "Lainnya",
    links: [
      { label: "Financial Market", href: "/financial-market" },
      { label: "Testimonials", href: "/testimonials" },
      { label: "FAQ", href: "/faq" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export async function SiteFooter() {
  const s = await getSettings();
  const year = new Date().getFullYear();

  // Link Market disembunyikan saat fitur market di-off (settings admin)
  const footerLinks = isMarketEnabled(s)
    ? FOOTER_LINKS
    : FOOTER_LINKS.map((col) =>
        col.title === "Lainnya"
          ? { ...col, links: col.links.filter((l) => l.href !== "/financial-market") }
          : col,
      );

  const socials = [
    { icon: Github, href: s.social_github, label: "GitHub" },
    { icon: Linkedin, href: s.social_linkedin, label: "LinkedIn" },
    { icon: Instagram, href: s.social_instagram, label: "Instagram" },
    { icon: Facebook, href: s.social_facebook, label: "Facebook" },
    { icon: Youtube, href: s.social_youtube, label: "YouTube" },
    { icon: MessageCircle, href: s.social_whatsapp, label: "WhatsApp" },
    { icon: Mail, href: `mailto:${s.owner_email || "hello@portofolioihsan.space-z.ai"}`, label: "Email" },
  ]
    // Filter out social links yang URL-nya invalid (mis. "https://facebook.com/"
    // tanpa username, atau "https://youtube.com/@" tanpa channel).
    // Mencegah render link palsu yang akan rusak di-klik user + tidak valid untuk SEO.
    .filter((social) => {
      // mailto: links selalu valid (Email)
      if (social.href?.startsWith("mailto:")) return true;
      return isValidSocialUrl(social.href);
    });

  return (
    <footer className="relative mt-24 border-t bg-card/40">
      <div className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 w-fit">
                <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/30">
                  MI
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-base">{s.owner_name || "Maulana Ihsan Rohim"}</span>
                  <span className="text-[11px] text-muted-foreground">Digital Marketing · Finance</span>
                </div>
              </Link>
              <p className="text-sm text-foreground/60 max-w-sm leading-relaxed">
                {s.site_tagline || "Helping businesses grow through digital marketing, creative content, technology, and financial market insights."}
              </p>
              <div className="flex flex-wrap gap-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="size-9 rounded-lg border flex items-center justify-center text-foreground/80 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <social.icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>

            {footerLinks.map((col) => (
              <div key={col.title} className="space-y-3">
                {/* Label kolom footer BUKAN heading (div) — mencegah lompatan
                    hierarki h2 → h4 yang ditandai audit aksesibilitas/SEO. */}
                <div className="text-sm font-semibold">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/70 hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-foreground/60">
            <p>© {year} {s.owner_name || "Maulana Ihsan Rohim"}. All rights reserved.</p>
          </div>
        </div>
      </div>
      {s.whatsapp_float !== "false" && <WhatsAppFloat whatsappUrl={s.social_whatsapp} />}
      <ScrollToTop />
    </footer>
  );
}
