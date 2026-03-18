import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "@/components/public/request-form";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getResolvedStayPricing } from "@/lib/demo-operations";
import { formatShortDate } from "@/lib/villa-catalog";
import { findBlockedRange, getNightCount } from "@/lib/villa-availability";
import {
  getDemoCoupons,
  getDemoDiscountCampaigns,
  getDemoPricingRecords,
} from "@/lib/server/demo-operations-store";
import { getDemoVillaBySlug } from "@/lib/server/demo-villa-store";

export const metadata: Metadata = {
  title: "Talep Olustur",
  description:
    "Tarih secimi, kisi sayisi ve iletisim bilgileriyle villa talebi olusturun.",
};

type RequestPageProps = {
  searchParams: Promise<{
    villa?: string;
    checkIn?: string;
    checkOut?: string;
  }>;
};

export default async function RequestPage({ searchParams }: RequestPageProps) {
  const params = await searchParams;
  const checkIn = params.checkIn ?? "";
  const checkOut = params.checkOut ?? "";
  const villa = params.villa ? await getDemoVillaBySlug(params.villa) : null;
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
    ? await Promise.all([getDemoPricingRecords(), getDemoDiscountCampaigns(), getDemoCoupons()])
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
  const selectedVillaLabel = villa?.title ?? "Villa secimi bekleniyor";
  const validationMessage = !villa
    ? "Talep formunu acmadan once bir villa secmelisin."
    : !checkIn || !checkOut
      ? "Talep olusturmak icin once villa detayinda giris ve cikis tarihini secmelisin."
      : nightCount <= 0
        ? "Cikis tarihi giris tarihinden sonra olmalidir."
        : belowMinimumStay
          ? `Bu villa icin minimum ${villa.minNightCount ?? 1} gece secmen gerekiyor.`
        : blockedRange
          ? `${formatShortDate(blockedRange.startDate)} - ${formatShortDate(blockedRange.endDate)} araliginda ${blockedRange.label.toLowerCase()} oldugu icin bu talep acilamaz.`
          : "";

  return (
    <Container className="py-14 sm:py-16">
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <SectionHeading
          eyebrow="Talep Formu"
          title="Tarih secimi tamamlandiginda acilan modern talep ekrani"
          description="Talep akisi yalnizca gecerli giris ve cikis secimiyle ilerler. Uygun olmayan tarih secimleri bu ekranin icine dahil edilmez."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm text-slate-600">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Villa
            </span>
            <span className="mt-3 block text-base font-semibold text-slate-900">
              {selectedVillaLabel}
            </span>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm text-slate-600">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Giris
            </span>
            <span className="mt-3 block text-base font-semibold text-slate-900">
              {checkIn ? formatShortDate(checkIn) : "Secilmedi"}
            </span>
          </div>
          <div className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm text-slate-600">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Cikis
            </span>
            <span className="mt-3 block text-base font-semibold text-slate-900">
              {checkOut ? formatShortDate(checkOut) : "Secilmedi"}
            </span>
          </div>
        </div>
      </div>

      {isValidSelection && villa ? (
        <div className="mt-10 space-y-6">
          <div className="rounded-[1.8rem] border border-emerald-200 bg-emerald-50 p-6 text-sm leading-7 text-emerald-700">
            {nightCount} gecelik uygun aralik secildi. Bu villa icin talep detaylarini
            doldurabilir, varsa kuponunu uygulayabilir ve formu dogrudan panel akisine
            dusurebilirsin.
          </div>

          {resolvedPricing ? (
            <RequestForm
              villa={villa}
              checkIn={checkIn}
              checkOut={checkOut}
              initialPricing={resolvedPricing.pricing}
            />
          ) : null}
        </div>
      ) : (
        <div className="mt-10 rounded-[2rem] border border-rose-200 bg-rose-50 p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-600">
            Talep Acilamadi
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">
            Gecerli bir tarih araligi secmeden talep formu kullanilamaz
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{validationMessage}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={recoveryHref}
              className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Villa Detayina Don
            </Link>
            <Link
              href="/villalar"
              className="inline-flex rounded-full border border-black/8 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Tum Villalari Incele
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
