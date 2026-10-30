import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import localFont from "next/font/local";
import { getCurrentPublicSiteTemplate } from "@/lib/server/public-site-template";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { pickLocalized } from "@/lib/i18n";
import s from "@/components/site-templates/site-templates.module.css";

const sans = localFont({ src: "../../assets/fonts/manrope.woff2", weight: "200 800", style: "normal", variable: "--site-font-sans", display: "swap" });
const serif = localFont({ src: [
  { path: "../../assets/fonts/cormorant-normal.woff2", weight: "400 600", style: "normal" },
  { path: "../../assets/fonts/cormorant-italic.woff2", weight: "400 600", style: "italic" },
], variable: "--site-font-serif", display: "swap" });

export async function PublicSiteShell({ children }: { children: ReactNode }) {
  const { themeKey } = await getCurrentPublicSiteTemplate();
  const locale = await getCurrentLocale();
  return (
    <div className={`${sans.variable} ${serif.variable} ${s.root}`} data-site-theme={themeKey}>
      <a href="#site-content" className={s.skipLink}>{pickLocalized(locale, "İçeriğe geç", "Skip to content")}</a>
      <SiteHeader />
      <main id="site-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
