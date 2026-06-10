import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { RequestForm } from "@/components/public/request-form";
import { RequestDateSelector } from "@/components/public/request-date-selector";
import { Container } from "@/components/ui/container";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { getResolvedStayPricing } from "@/lib/demo-operations";
import { pickLocalized } from "@/lib/i18n";
import { getLocalizedAvailabilityLabel, getLocalizedVilla } from "@/lib/villa-content-i18n";
import { getCompanyHeroImage } from "@/lib/public-gallery";
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
  const villa = params.villa ? await getDemoVillaBySlug(params.villa, { companyId: company.id }) : null;
  const localizedVilla = villa ? getLocalizedVilla(villa, locale) : null;
  const blockedRange =
    villa && checkIn && checkOut
      ? findBlockedRange(checkIn, checkOut, villa.availabilityRanges)
      : null;
  const nightCount = checkIn && checkOut ? getNightCount(checkIn, checkOut) : 0;
  const belowMinimumStay = Boolean(villa && nightCount > 0 && nightCount < (villa.minNightCount ?? 1));
  const isValidSelection = Boolean(
    villa && checkIn && checkOut && nightCount > 0 && !blockedRange && !belowMinimumStay,
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
  const recoveryHref = villa ? `/villalar/${villa.slug}` : "/villalar";
  const selectedVillaLabel =
    localizedVilla?.title ??
    pickLocalized(locale, "Villa secimi bekleniyor", "Waiting for villa selection");
  const heroImage = getCompanyHeroImage(company.slug, localizedVilla?.coverImageUrl);
  const validationMessage = !villa
    ? pickLocalized(locale, "Talep formunu acmadan once bir villa secmelisin.", "You need to select a villa before opening the inquiry form.")
    : !checkIn || !checkOut
      ? pickLocalized(locale, "Talep olusturmak icin once villa detayinda giris ve cikis tarihini secmelisin.", "To create an inquiry, you need to choose check-in and check-out dates on the villa detail page first.")
      : nightCount <= 0
        ? pickLocalized(locale, "Cikis tarihi giris tarihinden sonra olmalidir.", "Check-out must be after check-in.")
        : belowMinimumStay
          ? pickLocalized(
              locale,
              `Bu villa icin minimum ${villa.minNightCount ?? 1} gece secmen gerekiyor.`,
              `You need to select at least ${villa.minNightCount ?? 1} nights for this villa.`,
            )
          : blockedRange
          ? pickLocalized(
              locale,
              `${formatShortDate(blockedRange.startDate, locale)} - ${formatShortDate(blockedRange.endDate, locale)} araliginda ${getLocalizedAvailabilityLabel(blockedRange, locale).toLowerCase()} oldugu icin bu talep acilamaz.`,
              `This inquiry cannot be created because ${getLocalizedAvailabilityLabel(blockedRange, locale).toLowerCase()} exists between ${formatShortDate(blockedRange.startDate, locale)} and ${formatShortDate(blockedRange.endDate, locale)}.`,
            )
          : "";

  return (
    <Container className="py-14 sm:py-16">
      <PublicPageHero
        eyebrow={pickLocalized(locale, "Talep Formu", "Inquiry Form")}
        title={pickLocalized(
          locale,
          `${company.shortName} icin tarih secimi tamamlandiginda acilan talep ekrani`,
          `Inquiry screen that opens after date selection is completed for ${company.shortName}`,
        )}
        description={pickLocalized(
          locale,
          "Talep akisi yalnizca aktif firmanin gecerli giris ve cikis secimiyle ilerler. Uygun olmayan tarih secimleri bu ekranin icine dahil edilmez.",
          "The inquiry flow proceeds only with a valid check-in and check-out selection for the active company. Invalid date selections are not allowed into this screen.",
        )}
        backgroundImage={heroImage}
        actions={[
          {
            href: getDemoCompanySiteHref(company.slug, "/villalar"),
            label: pickLocalized(locale, "Tum villalari incele", "Browse all villas"),
          },
          ...(villa
            ? [
                {
                  href: `${recoveryHref}?company=${company.slug}`,
                  label: pickLocalized(locale, "Villa detayina don", "Back to villa details"),
                  variant: "secondary" as const,
                },
              ]
            : []),
        ]}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[12px] border border-white/14 bg-white/10 px-5 py-5 text-sm text-white/82 backdrop-blur">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {pickLocalized(locale, "Villa", "Villa")}
            </span>
            <span className="mt-3 block text-base font-semibold text-white">
              {selectedVillaLabel}
            </span>
          </div>
          <div className="rounded-[12px] border border-white/14 bg-white/10 px-5 py-5 text-sm text-white/82 backdrop-blur">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {pickLocalized(locale, "Giris", "Check-in")}
            </span>
            <span className="mt-3 block text-base font-semibold text-white">
              {checkIn
                ? formatShortDate(checkIn, locale)
                : pickLocalized(locale, "Secilmedi", "Not selected")}
            </span>
          </div>
          <div className="rounded-[12px] border border-white/14 bg-white/10 px-5 py-5 text-sm text-white/82 backdrop-blur">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {pickLocalized(locale, "Cikis", "Check-out")}
            </span>
            <span className="mt-3 block text-base font-semibold text-white">
              {checkOut
                ? formatShortDate(checkOut, locale)
                : pickLocalized(locale, "Secilmedi", "Not selected")}
            </span>
          </div>
        </div>
      </PublicPageHero>

      {villa ? (
        <div className="mt-8">
          <RequestDateSelector
            villa={villa}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            locale={locale}
          />
        </div>
      ) : null}

      {isValidSelection && villa ? (
        <div className="mt-10 space-y-6">
          <div className="rounded-[1.8rem] border border-emerald-200 bg-emerald-50 p-6 text-sm leading-7 text-emerald-700">
            {pickLocalized(
              locale,
              `${nightCount} gecelik uygun aralik secildi. Bu villa icin talep detaylarini doldurabilir, varsa kuponunu uygulayabilir ve formu dogrudan panel akisine dusurebilirsin.`,
              `A valid ${nightCount}-night range has been selected. You can fill in the inquiry details for this villa, apply a coupon if available and send the form directly into the panel flow.`,
            )}
          </div>

          {resolvedPricing ? (
            <RequestForm
              villa={villa}
              checkIn={checkIn}
              checkOut={checkOut}
              initialPricing={resolvedPricing.pricing}
              locale={locale}
            />
          ) : null}
        </div>
      ) : (
        <div className="mt-10 rounded-[2rem] border border-rose-200 bg-rose-50 p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-600">
            {pickLocalized(locale, "Teklif Formu Henuz Acik Degil", "Inquiry Form Not Available Yet")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">
            {villa
              ? pickLocalized(locale, "Uygun tarih secimi tamamlaninca teklif formu otomatik acilir", "The inquiry form will open automatically once valid dates are selected")
              : pickLocalized(locale, "Gecerli bir villa ve tarih secimi olmadan talep formu kullanilamaz", "The inquiry form cannot be used without a valid villa and date selection")}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{validationMessage}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {villa ? (
              <Link
                href={recoveryHref}
                className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {pickLocalized(locale, "Villa Detayina Don", "Back to Villa Detail")}
              </Link>
            ) : null}
            <Link
              href="/villalar"
              className="inline-flex rounded-full border border-black/8 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              {pickLocalized(locale, "Tum Villalari Incele", "Browse All Villas")}
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
