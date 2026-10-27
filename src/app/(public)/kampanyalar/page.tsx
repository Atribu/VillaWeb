import type { Metadata } from "next";
import Link from "next/link";
import { EditorialBreadcrumbs, EditorialPhoto, PlanningCta } from "@/components/site-templates/editorial-parts";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/editorial-pages.module.css";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { getPublicCampaigns } from "@/lib/public-campaigns";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoDiscountCampaigns } from "@/lib/server/demo-operations-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  return buildPublicMetadata({
    locale,
    title: { tr: "Villa tatili kampanyaları", en: "Villa holiday offers" },
    description: {
      tr: `${company.shortName} villa tatili kampanyalarını keşfedin. Geçerli konaklama dönemlerini ve indirim kapsamını inceleyerek tatilinizi planlayın.`,
      en: `Discover villa holiday offers from ${company.shortName}. Explore eligible stay periods and discounts to plan your next holiday.`,
    },
    canonical: "/kampanyalar",
  });
}

export default async function CampaignsPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const villas = (await getDemoVillas({ publicSite: true, companyId: company.id, includeMetrics: false, includeInactive: false })).filter((villa) => villa.companyId === company.id);
  const discounts = await getDemoDiscountCampaigns({ publicSite: true, companyId: company.id });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const campaigns = getPublicCampaigns(discounts, villas, company.id, today);
  const photo = villas.find((villa) => villa.coverImageUrl);
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const dateFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const formatDate = (date: string) => dateFormatter.format(new Date(`${date}T00:00:00Z`));

  return <div className={s.page}>
    <EditorialBreadcrumbs companySlug={company.slug} locale={locale} label={t("Kampanyalar", "Offers")} />
    <section className={s.hero}>
      <div className={s.heroCopy}>
        <p className={s.eyebrow}>{company.shortName} / {t("TATİLE BİR SEBEP DAHA", "ONE MORE REASON TO GET AWAY")}</p>
        <h1 className={s.title}>{t("Güzel günler,", "Good days,")}<br /><em>{t("güzel fırsatlar.", "better reasons.")}</em></h1>
        <p className={s.intro}>{t("Hayalini kurduğunuz villaya bir adım daha yaklaşın. Seçili konaklama dönemlerine özel avantajları keşfedin, takviminizde kendinize yer açın.", "A little closer to the villa you’ve been dreaming of. Explore offers for selected stay periods and make room in your calendar for yourself.")}</p>
        <a className={s.textLink} href="#firsatlar">{t("Fırsatları inceleyin", "Explore the offers")}<SiteIcon name="arrow" /></a>
      </div>
      <figure className={s.heroFigure}>
        <EditorialPhoto src={photo?.coverImageUrl} alt={t(`${company.shortName} villa koleksiyonundan bir görünüm`, `A view from the ${company.shortName} villa collection`)} />
        <figcaption><span>{t("ACELE ETMEDEN. KEYFİNİ ÇIKARARAK.", "TAKE YOUR TIME. MAKE IT YOURS.")}</span><span>{photo?.locationLabel}</span></figcaption>
      </figure>
    </section>
    <section id="firsatlar" className={s.section}>
      <div className={s.sectionHeading}>
        <div><p className={s.eyebrow}>{t("KONAKLAMANIZA ÖZEL", "FOR YOUR NEXT STAY")}</p><h2 className={s.sectionTitle}>{t("Tatilinize", "A little more")} <em>{t("değer katın.", "to look forward to.")}</em></h2></div>
        <p>{t("Her kampanyanın konaklama dönemi ve villa kapsamı farklıdır. Son fiyatı kendi tarihlerinizle kontrol edin.", "Each offer has its own stay period and eligible villas. Check your dates to see the final price.")}</p>
      </div>
      {campaigns.length ? <div className={s.offerList}>{campaigns.map((campaign) => {
        const villa = villas.find((item) => item.slug === campaign.villaScope);
        const villaTitle = villa && (locale === "en" ? villa.titleEn || villa.title : villa.title);
        return <article className={s.offer} key={campaign.id}>
          <div className={s.offerTop}><div className={s.offerPercent}>{locale === "tr" ? `%${campaign.percentOff}` : `${campaign.percentOff}%`}<small>{t("konaklama indirimi", "off your stay")}</small></div><span className={s.offerStatus}>{campaign.startDate > today ? t("Gelecek dönem", "Upcoming stay period") : t("Geçerli dönem", "Current stay period")}</span></div>
          <h3>{campaign.title || t("Sezon fırsatı", "Seasonal offer")}</h3>
          <p>{villaTitle ? t(`Bu fırsat ${villaTitle} için geçerlidir.`, `This offer applies to ${villaTitle}.`) : t("Bu fırsat villa koleksiyonumuz genelinde geçerlidir.", "This offer applies across our villa collection.")}</p>
          <dl className={s.offerDates}>
            <div><dt>{t("Konaklama başlangıcı", "Stay period starts")}</dt><dd><time dateTime={campaign.startDate}>{formatDate(campaign.startDate)}</time></dd></div>
            <div><dt>{t("Konaklama bitişi", "Stay period ends")}</dt><dd><time dateTime={campaign.endDate}>{formatDate(campaign.endDate)}</time></dd></div>
          </dl>
          <Link className={s.textLink} href={href(villa ? `/villalar/${encodeURIComponent(villa.slug)}` : "/villalar")}>{villa ? t("Villayı ve tarihleri incele", "Explore the villa and dates") : t("Villaları keşfet", "Explore the villas")}<SiteIcon name="arrow" /></Link>
        </article>;
      })}</div> : <div className={s.empty}><SiteIcon name="sun" /><div>
        <h3>{t("Yeni fırsatlara yer açıyoruz.", "Something to look forward to.")}</h3>
        <p>{t("Şu anda yayınlanan bir kampanyamız bulunmuyor. Villa koleksiyonunu inceleyebilir, tercih ettiğiniz tarihler için konaklama tutarını görebilirsiniz.", "There are no published offers at the moment. You can still explore the villa collection and check the stay price for your preferred dates.")}</p>
        <Link className={s.textLink} href={href("/villalar")}>{t("Villa koleksiyonuna göz atın", "Browse the villa collection")}<SiteIcon name="arrow" /></Link>
      </div></div>}
      <p className={s.terms}><SiteIcon name="calendar" />{t("İndirim, giriş ve çıkış tarihleriniz kampanya dönemi içinde kaldığında değerlendirilir. Müsaitlik, minimum gece şartı ve ek ücretler villaya göre değişebilir. Talep oluşturmak kesin rezervasyon değildir.", "The discount is considered when both check-in and check-out fall within the offer period. Availability, minimum stays and additional fees vary by villa. Sending an inquiry does not confirm a reservation.")}</p>
    </section>
    <PlanningCta companySlug={company.slug} locale={locale} />
  </div>;
}
