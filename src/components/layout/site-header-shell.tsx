"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DemoCompanyRecord } from "@/lib/demo-companies";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import type { SiteTemplateKey } from "@/lib/site-templates";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/site-templates.module.css";

export function SiteHeaderShell({ company, locale, theme }: { company: DemoCompanyRecord; locale: AppLocale; theme: SiteTemplateKey }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const overlay = theme === "kiyi" && pathname === "/";
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const links = [
    { href: "/villalar", label: t("Villaları keşfet", "Explore villas") },
    { href: "/kampanyalar", label: t("Kampanyalar", "Offers") },
    { href: "/hakkimizda", label: t("Bizimle tatil", "About us") },
    { href: "/iletisim", label: t("İletişim", "Contact") },
  ];
  return <header className={`${s.header} ${overlay ? s.overlayHeader : ""}`}>
    <div className={s.headerInner}>
      <Link href={href("/")} className={s.logo} onClick={() => setOpen(false)} aria-label={t(`${company.shortName} ana sayfa`, `${company.shortName} home`)}><SiteIcon name="home" /><span>{company.shortName}</span></Link>
      <nav id="public-navigation" className={`${s.nav} ${open ? s.navOpen : ""}`} aria-label={t("Ana menü", "Main navigation")} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
        {links.map((link) => <Link key={link.href} href={href(link.href)} onClick={() => setOpen(false)} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}</Link>)}
        <div className={s.mobileTools}><LanguageSwitcher locale={locale} variant="light" compact /><Link href="/panel/giris">{t("Panel girişi", "Partner login")}</Link></div>
      </nav>
      <div className={s.headerTools}><LanguageSwitcher locale={locale} variant={overlay ? "dark" : "light"} compact /><Link href={href("/talep")} className={s.headerCta}>{t("Tatilini planla", "Plan your stay")}<SiteIcon name="arrow" /></Link><button type="button" className={s.menuToggle} aria-label={open ? t("Menüyü kapat", "Close menu") : t("Menüyü aç", "Open menu")} aria-controls="public-navigation" aria-expanded={open} onClick={() => setOpen(!open)}><SiteIcon name={open ? "close" : "menu"} /></button></div>
    </div>
  </header>;
}
