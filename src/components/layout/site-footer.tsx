import Link from "next/link";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { pickLocalized } from "@/lib/i18n";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/site-templates.module.css";

export async function SiteFooter() {
  const company = await getCurrentPublicCompany();
  const locale = await getCurrentLocale();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const phone = company.phone.replace(/[^\d+]/g, "");
  return <footer className={s.footer}>
    <div className={s.footerTop}>
      <div><Link href={href("/")} className={s.logo}><SiteIcon name="home" /><span>{company.shortName}</span></Link><p>{t("Size ait bir yer. Size ait bir tatil. Sevdiklerinizle paylaşacağınız güzel anlar için villa koleksiyonumuzu keşfedin.", "A place of your own. A holiday at your own pace. Explore our villa collection and make room for moments together.")}</p><Link href={href("/talep")} className={s.textLink}>{t("Tatilini planla", "Plan your stay")}<SiteIcon name="arrow" /></Link></div>
      <div><h2>{t("Keşfet", "Explore")}</h2><nav aria-label={t("Alt menü", "Footer navigation")}>
        {[["/villalar", t("Villa koleksiyonu", "Villa collection")], ["/kampanyalar", t("Kampanyalar", "Offers")], ["/hakkimizda", t("Hakkımızda", "About us")], ["/blog", t("Tatil rehberi", "Travel journal")], ["/sss", t("Sık sorulan sorular", "Frequently asked questions")]].map(([path, label]) => <Link key={path} href={href(path)}>{label}</Link>)}
      </nav></div>
      <div><h2>{t("Birlikte planlayalım", "Let’s plan together")}</h2><nav aria-label={t("İletişim bağlantıları", "Contact links")}>
        {phone && <a href={`tel:${phone}`}>{company.phone}</a>}
        {company.email.includes("@") && <a href={`mailto:${company.email}`}>{company.email}</a>}
        <Link href={href("/iletisim")}>{t("İletişim bilgileri", "Contact details")}</Link>
        <Link href="/panel/giris">{t("İş ortağı / Panel girişi", "Partner / Panel login")}</Link>
      </nav></div>
    </div>
    <div className={s.footerBottom}><p>© {new Date().getFullYear()} {company.shortName}. {t("Tüm hakları saklıdır.", "All rights reserved.")}</p><nav aria-label={t("Yasal bilgiler", "Legal information")}>{[["/kvkk", t("KVKK", "Data protection")], ["/gizlilik", t("Gizlilik politikası", "Privacy policy")], ["/kullanim-kosullari", t("Kullanım koşulları", "Terms of use")]].map(([path, label]) => <Link key={path} href={href(path)}>{label}</Link>)}</nav></div>
  </footer>;
}
