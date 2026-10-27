import type { Metadata } from "next";
import Link from "next/link";
import { RequestSummary } from "@/components/public/request-summary";
import { SiteIcon } from "@/components/site-templates/site-icon";
import { validSearchStay } from "@/lib/public-search";
import s from "@/components/site-templates/stay-pages.module.css";
import { RequestForm } from "@/components/public/request-form";
import { RequestDateSelector } from "@/components/public/request-date-selector";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { getMinimumNightCountForStay, getResolvedStayPricing } from "@/lib/demo-operations";
import { pickLocalized } from "@/lib/i18n";
import { getLocalizedAvailabilityLabel } from "@/lib/villa-content-i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { formatShortDate } from "@/lib/villa-catalog";
import { findBlockedRange, getNightCount } from "@/lib/villa-availability";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import {
  getDemoCoupons,
  getDemoDiscountCampaigns,
  getDemoPricingRecords,
} from "@/lib/server/demo-operations-store";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return {
    title: pickLocalized(locale, "Talep Olustur", "Create Inquiry"),
    description: pickLocalized(
      locale,
      "Tarih secimi, kisi sayisi ve iletisim bilgileriyle villa talebi olusturun.",
      "Create a villa inquiry with date selection, guest count and contact details.",
    ),
  };
}

type RequestPageProps = {
  searchParams: Promise<{
    villa?: string;
    checkIn?: string;
    checkOut?: string;
  }>;
};

export default async function RequestPage({ searchParams }: RequestPageProps) {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const params = await searchParams;
  const checkIn = params.checkIn ?? "";
  const checkOut = params.checkOut ?? "";
  const villa = params.villa
    ? await getDemoVillaBySlug(params.villa, {
        companyId: company.id,
        includeMetrics: false,
        includeInactive: false,
      })
    : null;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const validDates = Boolean(checkIn && checkOut && validSearchStay(checkIn, checkOut, today));
  const blockedRange =
    villa && validDates
      ? findBlockedRange(checkIn, checkOut, villa.availabilityRanges)
      : null;
  const nightCount = validDates ? getNightCount(checkIn, checkOut) : 0;
  const minimumNightCount = villa
    ? getMinimumNightCountForStay(villa, checkIn, checkOut)
    : 1;
  const belowMinimumStay = Boolean(villa && nightCount > 0 && nightCount < minimumNightCount);
  const isValidSelection = Boolean(
    villa && validDates && nightCount > 0 && !blockedRange && !belowMinimumStay,
  );
  const pricingDependencies = isValidSelection
    ? await Promise.all([
        getDemoPricingRecords({ companyId: company.id }),
        getDemoDiscountCampaigns({ companyId: company.id }),
        getDemoCoupons({ companyId: company.id }),
      ])
    : null;
  const resolvedPricing =
    isValidSelection && villa && pricingDependencies
      ? getResolvedStayPricing({
          villa,
          pricingRecords: pricingDependencies[0],
          discounts: pricingDependencies[1],
          coupons: pricingDependencies[2],
          checkIn,
          checkOut,
        })
      : null;
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const validationMessage = !validDates && (checkIn || checkOut)
    ? t("Giriş ve çıkış tarihlerini kontrol edin. Geçmiş tarihlerle talep oluşturulamaz.", "Check your arrival and departure dates. Past dates cannot be used.")
    : belowMinimumStay
      ? t(`Bu dönem için en az ${minimumNightCount} gece seçmelisiniz.`, `Choose at least ${minimumNightCount} nights for this period.`)
      : blockedRange
        ? t(`${formatShortDate(blockedRange.startDate, locale)} - ${formatShortDate(blockedRange.endDate, locale)} aralığı ${getLocalizedAvailabilityLabel(blockedRange, locale).toLowerCase()}. Lütfen başka tarihler seçin.`, `The villa is unavailable between ${formatShortDate(blockedRange.startDate, locale)} and ${formatShortDate(blockedRange.endDate, locale)}. Please choose other dates.`)
        : "";

  return <div className={s.page}>
    <nav className={s.breadcrumbs} aria-label={t("Sayfa yolu", "Breadcrumb")}>
      <Link href={href("/")}>{t("Ana sayfa", "Home")}</Link><span>/</span>
      <Link href={href(villa ? `/villalar/${villa.slug}` : "/villalar")}>{villa ? t("Villa detayına dön", "Back to villa details") : t("Villa koleksiyonu", "Villa collection")}</Link><span>/</span>
      <span aria-current="page">{t("Konaklama talebi", "Stay inquiry")}</span>
    </nav>
    <header>
      <p className={s.eyebrow}>{company.shortName} / {t("BİRLİKTE PLANLAYALIM", "LET’S PLAN YOUR STAY")}</p>
      <h1 className={s.title}>{t("Size ait bir tatil,", "A holiday of your own,")}<br /><em>{t("bir adım uzakta.", "one step closer.")}</em></h1>
      <p className={s.intro}>{t("Tarihlerinizi ve iletişim bilgilerinizi paylaşın. Size özel konaklamanın detaylarını birlikte netleştirelim.", "Share your dates and contact details. Let’s take care of the details of your next stay together.")}</p>
    </header>
    <ol className={s.steps} aria-label={t("Talep adımları", "Inquiry steps")}>
      <li aria-current={!isValidSelection ? "step" : undefined}><span>01</span>{t("Tarih seçimi", "Your dates")}</li>
      <li aria-current={isValidSelection ? "step" : undefined}><span>02</span>{t("Bilgileriniz", "Your details")}</li>
      <li><span>03</span>{t("Talep ve dönüş", "Send & hear from us")}</li>
    </ol>
    {villa ? isValidSelection && resolvedPricing
      ? <RequestForm key={`${villa.id}-${checkIn}-${checkOut}`} villa={villa} checkIn={checkIn} checkOut={checkOut} initialPricing={resolvedPricing.pricing} locale={locale} companySlug={company.slug} />
      : <div className={s.requestGrid}>
          <div>
            <RequestDateSelector key={`${checkIn}-${checkOut}`} villa={villa} initialCheckIn={checkIn} initialCheckOut={checkOut} locale={locale} companySlug={company.slug} />
            {validationMessage && <p role="alert" className={s.notice} data-tone="error">{validationMessage}</p>}
            <p className={s.note}>{t("Uygun tarihleri uyguladığınızda iletişim formunuz burada açılacak.", "Your contact form will appear here once you apply available dates.")}</p>
          </div>
          <aside className={s.bookingAside}><RequestSummary villa={villa} checkIn={checkIn} checkOut={checkOut} locale={locale} /></aside>
        </div>
      : <section className={s.empty}>
          <p className={s.eyebrow}>{t("ÖNCE SİZE UYGUN EVİ BULALIM", "LET’S FIND YOUR PLACE FIRST")}</p>
          <h2 className={s.sectionTitle}>{t("Hangi villada uyanmak istersiniz?", "Where would you like to wake up?")}</h2>
          <p>{t("Koleksiyonumuzdan bir villa seçin. Ardından uygun tarihleri belirleyerek tatil talebinizi bize iletebilirsiniz.", "Choose a villa from our collection, select available dates and send us your holiday inquiry.")}</p>
          <Link href={href("/villalar")} className={s.button}>{t("Villaları keşfet", "Explore villas")}<SiteIcon name="arrow" /></Link>
        </section>}
  </div>;
}
