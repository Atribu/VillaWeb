import type { Metadata } from "next";
import Link from "next/link";
import { EditorialBreadcrumbs, EditorialPhoto, PlanningCta } from "@/components/site-templates/editorial-parts";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/editorial-pages.module.css";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  return buildPublicMetadata({
    locale,
    title: { tr: "Hakkımızda", en: "About us" },
    description: {
      tr: `${company.shortName} ile kendi ritminizde bir villa tatili. Koleksiyonumuzu, tatil anlayışımızı ve rezervasyon sürecini keşfedin.`,
      en: `A villa holiday at your own pace with ${company.shortName}. Discover our collection, approach to travel and booking process.`,
    },
    canonical: "/hakkimizda",
  });
}

export default async function AboutPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const villas = await getDemoVillas({ publicSite: true, companyId: company.id, includeMetrics: false, includeInactive: false });
  const photo = villas.find((villa) => villa.companyId === company.id && villa.coverImageUrl);
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const values = [
    { icon: "home" as const, title: t("Size ait bir alan.", "A space of your own."), text: t("Ortak bir lobi yerine kendi salonunuz. Sevdiklerinizle aynı çatı altında, günün akışını sizin belirlediğiniz bir konaklama.", "Your own living room instead of a shared lobby. Stay under one roof with your favourite people and let the day follow your rhythm.") },
    { icon: "sun" as const, title: t("Kendi ritminizde.", "At your own pace."), text: t("Uzun bir kahvaltı, denize ayrılan bir öğleden sonra ya da hiçbir şey yapmadığınız bir gün. Tatilin programı size kalsın.", "A slow breakfast, an afternoon by the sea or a day with nothing planned. Leave room for the kind of holiday you need.") },
    { icon: "people" as const, title: t("Birlikte planlayalım.", "Let’s plan together."), text: t("Konum, tarihler ve sizin için önemli ayrıntıları paylaşın. Villa seçiminiz ve konaklama koşulları hakkında ekibimizden bilgi alın.", "Tell us your destination, dates and what matters to you. Talk to our team about your villa choice and the details of your stay.") },
  ];
  const steps = [
    { title: t("Kendinize göre bir villa bulun", "Find your kind of villa"), text: t("Konum ve misafir sayısıyla koleksiyonu daraltın. Fotoğrafları, olanakları ve ev kurallarını inceleyin.", "Narrow the collection by destination and guest count. Explore the photos, amenities and house rules.") },
    { title: t("Tarihlerinizi seçin", "Choose your dates"), text: t("Villa takviminden uygun günleri seçerek konaklama tutarını ve varsa ek ücretleri görün.", "Choose available dates in the villa calendar to see the stay price and any additional charges.") },
    { title: t("Detayları birlikte netleştirelim", "Let’s work out the details"), text: t("Talebinizi gönderin. Ekibimiz sizinle iletişime geçerek uygunluğu, ödeme ve onay koşullarını paylaşsın.", "Send your inquiry. Our team will contact you to discuss availability, payment and confirmation terms.") },
  ];

  return <div className={s.page}>
    <EditorialBreadcrumbs companySlug={company.slug} locale={locale} label={t("Hakkımızda", "About us")} />
    <section className={s.hero}>
      <div className={s.heroCopy}>
        <p className={s.eyebrow}>{company.shortName} / {t("TATİLE BAKIŞIMIZ", "OUR APPROACH TO TRAVEL")}</p>
        <h1 className={s.title}>{t("Bir yerden", "More than")}<br /><em>{t("daha fazlası.", "a place.")}</em></h1>
        <p className={s.intro}>{t(`${company.shortName} olarak tatilin yalnızca bir adres seçmek olmadığını düşünüyoruz. Kendinize zaman ayırmak, sevdiklerinizle bir araya gelmek ve bir süreliğine kendi ritminizde yaşamak.`, `At ${company.shortName}, we believe a holiday is more than choosing an address. It is time for yourself, moments with the people you love and a chance to live at your own pace.`)}</p>
        <Link className={s.textLink} href={href("/villalar")}>{t("Koleksiyonumuzu keşfedin", "Discover our collection")}<SiteIcon name="arrow" /></Link>
      </div>
      <figure className={s.heroFigure}>
        <EditorialPhoto src={photo?.coverImageUrl} alt={t(`${company.shortName} villa koleksiyonundan bir görünüm`, `A view from the ${company.shortName} villa collection`)} />
        <figcaption><span>{t("DAHA YAVAŞ. DAHA SİZ.", "A SLOWER PACE. A LITTLE MORE YOU.")}</span><span>{photo?.locationLabel}</span></figcaption>
      </figure>
    </section>
    <div className={s.values}>{values.map((item) => <article key={item.icon}>
      <SiteIcon name={item.icon} /><h2>{item.title}</h2><p>{item.text}</p>
    </article>)}</div>
    <section className={s.story}>
      <div><p className={s.eyebrow}>{t("İLK HAYALDEN İLK GÜNE", "FROM YOUR FIRST IDEA TO YOUR FIRST DAY")}</p>
        <h2 className={s.sectionTitle}>{t("Tatil başlarken", "A clear path to")}<br /><em>{t("aklınız rahat olsun.", "your next holiday.")}</em></h2>
        <p className={s.body}>{t("Güzel bir tatil, ne bekleyeceğinizi bilmekle başlar. Villa özelliklerinden tarih seçimine, ilk talebinizden rezervasyon onayına kadar her adımda ihtiyacınız olan bilgiyi bulmanızı istiyoruz.", "A good holiday starts with knowing what to expect. From villa details and choosing dates to your first inquiry and booking confirmation, we want you to find the information you need.")}</p>
        <Link className={s.textLink} href={href("/iletisim")}>{t("Bize bir merhaba deyin", "Say hello to our team")}<SiteIcon name="arrow" /></Link>
      </div>
      <ol className={s.steps}>{steps.map((step, index) => <li key={step.title}>
        <span className={s.stepNumber} aria-hidden="true">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div>
      </li>)}</ol>
    </section>
    <PlanningCta companySlug={company.slug} locale={locale} />
  </div>;
}
