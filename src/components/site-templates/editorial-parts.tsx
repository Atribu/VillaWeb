import Link from "next/link";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized, type AppLocale } from "@/lib/i18n";
import { SiteIcon } from "./site-icon";
import s from "./editorial-pages.module.css";

export function EditorialBreadcrumbs({ companySlug, label, locale }: { companySlug: string; label: string; locale: AppLocale }) {
  return <nav className={s.breadcrumbs} aria-label={pickLocalized(locale, "Sayfa yolu", "Breadcrumb")}>
    <Link href={getDemoCompanySiteHref(companySlug)}>{pickLocalized(locale, "Ana sayfa", "Home")}</Link>
    <span aria-hidden="true">/</span><span aria-current="page">{label}</span>
  </nav>;
}

export function EditorialPhoto({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <div className={s.placeholder} aria-hidden="true"><SiteIcon name="home" /></div>;
  // Use the uploaded WebP directly, as on the collection and villa pages.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={s.photo} src={src} alt={alt} loading="eager" fetchPriority="high" />;
}

export function PlanningCta({ companySlug, locale }: { companySlug: string; locale: AppLocale }) {
  return <section className={s.cta}>
    <div><p className={s.eyebrow}>{pickLocalized(locale, "GÜZEL BİR TATİLE DOĞRU", "YOUR NEXT CHAPTER")}</p>
      <h2 className={s.sectionTitle}>{pickLocalized(locale, "Sizin yeriniz.", "Your place.")} <em>{pickLocalized(locale, "Sizin tatiliniz.", "Your holiday.")}</em></h2>
    </div>
    <Link className={s.button} href={getDemoCompanySiteHref(companySlug, "/villalar")}>{pickLocalized(locale, "Villa koleksiyonunu keşfet", "Explore the villa collection")}<SiteIcon name="arrow" /></Link>
  </section>;
}
