import Link from "next/link";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { SiteIcon } from "./site-icon";
import e from "./editorial-pages.module.css";
import s from "./support-pages.module.css";

export async function PublicNotFound() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  return <div className={e.page}><div className={s.notFound}>
    <span className={s.notFoundNumber} aria-hidden="true">404</span>
    <p className={e.eyebrow}>{t("SAYFA BULUNAMADI", "PAGE NOT FOUND")}</p>
    <h1 className={e.title}>{t("Bu yol burada", "This path")}<br /><em>{t("sona eriyor.", "ends here.")}</em></h1>
    <p className={e.intro}>{t("Aradığınız sayfa taşınmış, kaldırılmış veya bağlantısı değişmiş olabilir. Villa koleksiyonuna dönerek keşfe devam edebilirsiniz.", "This page may have moved, been removed or changed its address. Return to the villa collection to keep exploring.")}</p>
    <div className={s.bookingActions}><Link className={e.button} href={href("/villalar")}>{t("Villaları keşfet", "Explore villas")}<SiteIcon name="arrow" /></Link><Link className={s.secondaryButton} href={href("/")}>{t("Ana sayfaya dön", "Back to home")}</Link></div>
  </div></div>;
}
