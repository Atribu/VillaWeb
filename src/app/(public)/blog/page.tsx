import type { Metadata } from "next";
import Link from "next/link";
import { EditorialBreadcrumbs, EditorialPhoto, PlanningCta } from "@/components/site-templates/editorial-parts";
import { SiteIcon } from "@/components/site-templates/site-icon";
import e from "@/components/site-templates/editorial-pages.module.css";
import s from "@/components/site-templates/support-pages.module.css";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { travelGuides } from "@/lib/travel-journal";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  return buildPublicMetadata({ locale, title: { tr: "Tatil rehberi", en: "Travel journal" },
    description: { tr: "Villa seçimi, tarih planlama ve birlikte tatil için kısa rehberler. Kendi tatilinizi planlarken ayrıntılara yer açın.", en: "Short guides to choosing a villa, planning dates and travelling together. Make room for the details of your next stay." }, canonical: "/blog" });
}

export default async function BlogPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const villas = await getDemoVillas({ publicSite: true, companyId: company.id, includeInactive: false, includeMetrics: false });
  const photo = villas.find(villa => villa.companyId === company.id && villa.coverImageUrl);
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const featured = travelGuides[0];
  return <div className={e.page}>
    <EditorialBreadcrumbs companySlug={company.slug} locale={locale} label={t("Tatil rehberi", "Travel journal")} />
    <header className={s.heading}>
      <p className={e.eyebrow}>{company.shortName} / {t("TATİLDEN ÖNCE", "BEFORE YOU GO")}</p>
      <h1 className={e.title}>{t("Güzel bir tatil,", "A good holiday,")} <em>{t("küçük ayrıntılar.", "little details.")}</em></h1>
      <p className={e.intro}>{t("Bir sonraki konaklamanız için notlar, fikirler ve küçük kontrol listeleri. Tatilinizi kendi ritminizde planlayın.", "Notes, ideas and little checklists for your next stay. Plan a holiday at your own pace.")}</p>
    </header>
    <section className={s.journalFeature}>
      <div className={s.featureImage}><EditorialPhoto src={photo?.coverImageUrl} alt={t("Villa koleksiyonumuzdan bir görünüm", "A view from our villa collection")} /></div>
      <div className={s.featureCopy}>
        <p className={e.eyebrow}>{t("BAŞLAMAK İÇİN", "A PLACE TO START")} / {featured.category[locale]}</p>
        <h2>{featured.title[locale]}</h2><p>{featured.intro[locale]}</p>
        <Link className={e.textLink} href={href(`/blog/${featured.slug}`)}>{t("Rehberi okuyun", "Read the guide")}<SiteIcon name="arrow" /></Link>
      </div>
    </section>
    <div className={s.journalGrid}>{travelGuides.map((guide, index) => <article key={guide.slug} className={s.journalCard}>
      <span className={e.eyebrow}>0{index + 1} / {guide.category[locale]}</span>
      <h2><Link href={href(`/blog/${guide.slug}`)}>{guide.title[locale]}</Link></h2><p>{guide.intro[locale]}</p>
      <Link className={e.textLink} href={href(`/blog/${guide.slug}`)} aria-label={t(`Rehberi oku: ${guide.title.tr}`, `Read the guide: ${guide.title.en}`)}>{t("Okumaya devam et", "Continue reading")}<SiteIcon name="arrow" /></Link>
    </article>)}</div>
    <PlanningCta companySlug={company.slug} locale={locale} />
  </div>;
}
