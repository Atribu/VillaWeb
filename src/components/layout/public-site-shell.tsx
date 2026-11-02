import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import localFont from "next/font/local";
import { getCurrentPublicSiteTemplate } from "@/lib/server/public-site-template";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { pickLocalized } from "@/lib/i18n";
import s from "@/components/site-templates/site-templates.module.css";
import { publicSiteContent } from "@/lib/server/site-publication";
import { FunnelTracker } from "@/components/public/funnel-tracker";

const sans = localFont({ src: "../../assets/fonts/manrope.woff2", weight: "200 800", style: "normal", variable: "--site-font-sans", display: "swap" });
const serif = localFont({ src: [
  { path: "../../assets/fonts/cormorant-normal.woff2", weight: "400 600", style: "normal" },
  { path: "../../assets/fonts/cormorant-italic.woff2", weight: "400 600", style: "italic" },
], variable: "--site-font-serif", display: "swap" });

export async function PublicSiteShell({ children }: { children: ReactNode }) {
  const { themeKey, company } = await getCurrentPublicSiteTemplate();
  const { preview } = await publicSiteContent(company.id);
  const locale = await getCurrentLocale();
  return (
    <div className={`${sans.variable} ${serif.variable} ${s.root}`} data-site-theme={themeKey}>
      {preview && <aside className="bg-amber-100 p-3 text-center text-sm text-amber-950">Taslak önizlemesi. Bu değişiklikler henüz yayınlanmadı. <a href={`/panel/kurulum?companyId=${encodeURIComponent(company.id)}`}>Düzenlemeye dön</a></aside>}
      <a href="#site-content" className={s.skipLink}>{pickLocalized(locale, "İçeriğe geç", "Skip to content")}</a>
      <SiteHeader />
      {!preview && <FunnelTracker companySlug={company.slug} />}
      <main id="site-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
