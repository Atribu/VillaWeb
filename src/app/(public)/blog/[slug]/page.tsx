import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialBreadcrumbs, PlanningCta } from "@/components/site-templates/editorial-parts";
import { SiteIcon } from "@/components/site-templates/site-icon";
import e from "@/components/site-templates/editorial-pages.module.css";
import s from "@/components/site-templates/support-pages.module.css";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { getTravelGuide } from "@/lib/travel-journal";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getTravelGuide((await params).slug);
  if (!guide) return { robots: { index: false, follow: false } };
  const locale = await getCurrentLocale();
  return buildPublicMetadata({ locale, title: guide.title, description: guide.intro, canonical: `/blog/${guide.slug}` });
}

export default async function GuidePage({ params }: Props) {
  const guide = getTravelGuide((await params).slug);
  if (!guide) notFound();
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  return <div className={e.page}>
    <EditorialBreadcrumbs companySlug={company.slug} locale={locale} label={t("Tatil rehberi", "Travel journal")} />
    <article>
      <header className={s.heading}><p className={e.eyebrow}>{company.shortName} / {guide.category[locale]}</p><h1 className={e.title}>{guide.title[locale]}</h1><p className={e.intro}>{guide.intro[locale]}</p></header>
      <div className={s.articleLayout}>
        <aside className={s.contents}><p>{t("BU REHBERDE", "IN THIS GUIDE")}</p><nav aria-label={t("Rehber içindekiler", "Guide contents")}>{guide.sections.map((section, index) => <a key={section.title.en} href={`#bolum-${index + 1}`}>0{index + 1}. {section.title[locale]}</a>)}</nav></aside>
        <div className={s.reading}>{guide.sections.map((section, index) => <section key={section.title.en} id={`bolum-${index + 1}`}><h2>{section.title[locale]}</h2><p>{section.text[locale]}</p></section>)}
          <Link className={e.textLink} href={getDemoCompanySiteHref(company.slug, "/blog")}>{t("Tüm rehberlere dön", "Back to the journal")}<SiteIcon name="arrow" /></Link>
        </div>
      </div>
    </article>
    <PlanningCta companySlug={company.slug} locale={locale} />
  </div>;
}
