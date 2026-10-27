import type { Metadata } from "next";
import Link from "next/link";
import { EditorialBreadcrumbs } from "@/components/site-templates/editorial-parts";
import { FaqExplorer } from "@/components/site-templates/faq-explorer";
import { SiteIcon } from "@/components/site-templates/site-icon";
import e from "@/components/site-templates/editorial-pages.module.css";
import s from "@/components/site-templates/support-pages.module.css";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { getPublicFaqGroups } from "@/lib/public-faq";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  return buildPublicMetadata({ locale, title: { tr: "Sık sorulan sorular", en: "Frequently asked questions" },
    description: { tr: "Villa seçimi, uygun tarihler, fiyatlar ve rezervasyon talebi hakkında sorularınızın yanıtları.", en: "Answers to your questions about villa selection, available dates, prices and booking inquiries." }, canonical: "/sss" });
}

export default async function FaqPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const items = getPublicFaqGroups(locale).flatMap(group => group.items);
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return <div className={e.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <EditorialBreadcrumbs companySlug={company.slug} locale={locale} label={t("Sık sorulan sorular", "Frequently asked questions")} />
    <header className={s.heading}>
      <p className={e.eyebrow}>{t("AKLINIZDA KALMASIN", "GOOD TO KNOW")}</p>
      <h1 className={e.title}>{t("Küçük sorular.", "A few questions.")} <em>{t("Net cevaplar.", "Clear answers.")}</em></h1>
      <p className={e.intro}>{t("Villa seçiminizden konaklama talebine kadar merak ettiğiniz ayrıntılar. Bir konu seçin ya da sorunuzu arayın.", "From finding a villa to sending a stay inquiry, explore the details you want to know. Choose a topic or search your question.")}</p>
    </header>
    <FaqExplorer locale={locale} />
    <section className={s.helpCta}>
      <div><h2>{t("Bir sorunuz daha mı var?", "Still have a question?")}</h2><p>{t("Kendi tatil planınızın ayrıntılarını birlikte konuşalım.", "Let’s talk through the details of your own holiday plans.")}</p></div>
      <Link className={e.button} href={getDemoCompanySiteHref(company.slug, "/iletisim")}>{t("Bize ulaşın", "Contact us")}<SiteIcon name="arrow" /></Link>
    </section>
  </div>;
}
