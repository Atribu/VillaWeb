import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { isBookableRange, getNightCount } from "@/lib/villa-availability";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCompanyHeroImage } from "@/lib/public-gallery";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { formatShortDate } from "@/lib/villa-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "Villalar", en: "Villas" },
    description: {
      tr: "Lokasyon, kategori ve tatil tipine gore kesfedilebilen villa koleksiyonunu inceleyin.",
      en: "Explore the villa collection by destination, category and holiday style.",
    },
    keywords: {
      tr: ["villa kiralama", "kalkan villa", "fethiye villa", "bodrum villa", "ozel havuzlu villa"],
      en: ["villa rental", "kalkan villa", "fethiye villa", "bodrum villa", "private pool villa"],
    },
    canonical: "/villalar",
  });
}

export const dynamic = "force-dynamic";

type VillasSearchParams = {
  location?: string | string[];
  checkIn?: string | string[];
  checkOut?: string | string[];
  guests?: string | string[];
};

type VillasPageProps = {
  searchParams?: Promise<VillasSearchParams>;
};

function getSearchParamValue(value?: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function normalizeForSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

function parseGuestCount(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function buildCompanyListingHref(companySlug: string) {
  const params = new URLSearchParams({ company: companySlug });
  return `/villalar?${params.toString()}`;
}

export default async function VillasPage({ searchParams }: VillasPageProps) {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const params = (await searchParams) ?? {};
  const locationQuery = getSearchParamValue(params.location).trim();
  const checkIn = getSearchParamValue(params.checkIn).trim();
  const checkOut = getSearchParamValue(params.checkOut).trim();
  const guestCount = parseGuestCount(getSearchParamValue(params.guests));
  const hasDateInputs = Boolean(checkIn || checkOut);
  const hasValidDateKeys = isDateKey(checkIn) && isDateKey(checkOut);
  const nightCount = hasValidDateKeys ? getNightCount(checkIn, checkOut) : 0;
  const hasValidDateRange = hasValidDateKeys && nightCount > 0;
  const hasInvalidDateRange = hasDateInputs && !hasValidDateRange;
  const villaCatalog = await getDemoVillas({
    companyId: company.id,
    includeMetrics: false,
    includeInactive: false,
  });
  const normalizedLocationQuery = normalizeForSearch(locationQuery);
  const filteredVillaCatalog = villaCatalog.filter((villa) => {
    if (normalizedLocationQuery) {
      const haystack = [
        villa.title,
        villa.titleEn,
        villa.city,
        villa.district,
        villa.locationLabel,
        villa.category,
        villa.categoryEn,
        villa.badge,
        villa.badgeEn,
        villa.focusKeyword,
        villa.focusKeywordEn,
      ]
        .filter(Boolean)
        .map((value) => normalizeForSearch(String(value)))
        .join(" ");

      if (!haystack.includes(normalizedLocationQuery)) {
        return false;
      }
    }

    if (guestCount && villa.capacity < guestCount) {
      return false;
    }

    if (hasValidDateRange) {
      const meetsMinimumStay = nightCount >= (villa.minNightCount ?? 1);

      if (!meetsMinimumStay || !isBookableRange(checkIn, checkOut, villa.availabilityRanges)) {
        return false;
      }
    }

    return true;
  });
  const activeFilterLabels = [
    locationQuery
      ? `${pickLocalized(locale, "Konum", "Location")}: ${locationQuery}`
      : null,
    guestCount
      ? `${pickLocalized(locale, "Misafir", "Guests")}: ${guestCount}+`
      : null,
    hasValidDateRange
      ? `${pickLocalized(locale, "Tarih", "Dates")}: ${formatShortDate(
          checkIn,
          locale,
        )} - ${formatShortDate(checkOut, locale)}`
      : null,
  ].filter((label): label is string => Boolean(label));
  const hasActiveFilters = activeFilterLabels.length > 0 || hasInvalidDateRange;

  const villaListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${company.shortName} Villa Koleksiyonu`,
    itemListElement: filteredVillaCatalog.map((villa, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: villa.title,
      url: `https://villaweb.example/villalar/${villa.slug}`,
      description: villa.seoDescription,
    })),
  };

  const districtChips = Array.from(new Set(villaCatalog.map((villa) => villa.district))).slice(0, 6);
  const categoryChips = Array.from(new Set(villaCatalog.map((villa) => villa.category))).slice(0, 4);
  const heroImage = getCompanyHeroImage(company.slug, villaCatalog[0]?.coverImageUrl);

  return (
    <Container className="py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(villaListJsonLd) }}
      />

      <PublicPageHero
        eyebrow={pickLocalized(locale, "Villa Koleksiyonu", "Villa Collection")}
        title={pickLocalized(
          locale,
          `${company.shortName} icin secili villa portfoyu`,
          `Selected villa portfolio for ${company.shortName}`,
        )}
        description={pickLocalized(
          locale,
          "Lokasyon, kapasite ve tatil tipine gore daha hizli karar verilebilen, sade ve guven veren bir listeleme deneyimi.",
          "A simpler, more reassuring listing experience where decisions can be made faster by location, capacity and holiday type.",
        )}
        backgroundImage={heroImage}
        actions={[
          {
            href: getDemoCompanySiteHref(company.slug, "/talep"),
            label: pickLocalized(locale, "Talep akisina git", "Go to inquiry flow"),
          },
          {
            href: getDemoCompanySiteHref(company.slug, "/iletisim"),
            label: pickLocalized(locale, "Danisman ile gorus", "Talk to an advisor"),
            variant: "secondary",
          },
        ]}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-wrap gap-3">
            {districtChips.map((chip) => (
              <span
                key={chip}
                className="rounded-[999px] border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur"
              >
                {chip}
              </span>
            ))}
            {categoryChips.map((chip) => (
              <span
                key={chip}
                className="rounded-[999px] border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [pickLocalized(locale, "Sonuc", "Results"), `${filteredVillaCatalog.length} ${pickLocalized(locale, "villa", "villas")}`],
              [
                pickLocalized(locale, "Model", "Model"),
                hasValidDateRange
                  ? pickLocalized(locale, `${nightCount} gece uygunluk`, `${nightCount} nights checked`)
                  : pickLocalized(locale, "Tarih secimi aktif", "Date search ready"),
              ],
              [pickLocalized(locale, "Akis", "Flow"), pickLocalized(locale, "Talep odakli devam", "Inquiry-led journey")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[12px] border border-white/14 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicPageHero>

      {hasActiveFilters ? (
        <section className="mt-8 rounded-[14px] border border-[#dfe5ea] bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2f6eb1]">
                {pickLocalized(locale, "Arama Sonuclari", "Search Results")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                {pickLocalized(
                  locale,
                  `${filteredVillaCatalog.length} villa kriterlere uyuyor`,
                  `${filteredVillaCatalog.length} villas match your criteria`,
                )}
              </h2>
            </div>
            <Link
              href={buildCompanyListingHref(company.slug)}
              className="inline-flex rounded-[10px] border border-[#c9d5e2] px-4 py-2 text-sm font-semibold text-[#26486b] transition hover:border-[#8eb2d4] hover:text-[#1f3f61]"
            >
              {pickLocalized(locale, "Filtreleri Temizle", "Clear Filters")}
            </Link>
          </div>

          {activeFilterLabels.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-[999px] bg-[#eef5fb] px-4 py-2 text-sm font-semibold text-[#26486b]"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {hasInvalidDateRange ? (
            <p className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {pickLocalized(
                locale,
                "Tarih filtresi uygulanmadi. Uygunluk kontrolu icin giris ve cikis tarihini dogru sirayla secmelisin.",
                "Date filtering was not applied. Select a valid check-in and check-out order to check availability.",
              )}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredVillaCatalog.map((villa) => (
          <PublicVillaCard key={villa.id} villa={villa} compact locale={locale} />
        ))}
      </section>

      {filteredVillaCatalog.length === 0 ? (
        <section className="mt-10 rounded-[14px] border border-dashed border-[#c9d5e2] bg-[#fbfcfd] p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            {pickLocalized(locale, "Bu kriterlere uygun villa bulunamadi", "No villas match these criteria")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {pickLocalized(
              locale,
              "Konumu genisletmeyi, misafir sayisini azaltmayi ya da farkli tarih araligi denemeyi dusunebilirsin.",
              "Try broadening the location, lowering the guest count or choosing a different date range.",
            )}
          </p>
          <Link
            href={buildCompanyListingHref(company.slug)}
            className="mt-6 inline-flex rounded-[10px] bg-[#2f6eb1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#275f9a]"
          >
            {pickLocalized(locale, "Tum Villalari Goster", "Show All Villas")}
          </Link>
        </section>
      ) : null}

      <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[14px] border border-black/6 bg-white p-8 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
          <SectionHeading
            eyebrow={pickLocalized(locale, "Listeleme SEO Alani", "Listing SEO Layer")}
            title={pickLocalized(
              locale,
              "Liste sayfasi sadece kartlardan olusmaz; arama niyetini de tasir",
              "A listing page is not only cards; it also carries search intent",
            )}
            description={pickLocalized(
              locale,
              "Lokasyon ve kategori bazli arayan kullanicilar, kartlarin altinda dogru baglamsal metinleri ve ic linkleri de gormelidir.",
              "Users searching by location or category should also see the right contextual content and internal links beneath the cards.",
            )}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <p className="text-sm leading-8 text-slate-600">
              {pickLocalized(
                locale,
                "Villa listeleme sayfasi; Kalkan villa kiralama, Fethiye aile villasi veya Bodrum luks villa gibi arama niyetlerini destekleyen metin alanlariyla guclendirilir. Bu alanlar sayfaya daha derin bir SEO tabani kazandirir.",
                "The villa listing page is strengthened with content blocks that support search intent such as Kalkan villa rental, family villas in Fethiye or luxury villas in Bodrum. These sections create a deeper SEO foundation for the page.",
              )}
            </p>
            <p className="text-sm leading-8 text-slate-600">
              {pickLocalized(
                locale,
                "Her villa kendi detay sayfasina baglanir; detay sayfasi ise takvim, talep akisi, fiyat, galeri ve yapilandirilmis veri ile derinlesir. Boylece listeleme sadece gecis noktasi degil, guclu bir landing sayfasina donusur.",
                "Each villa links to its own detail page, where calendar, inquiry flow, pricing, gallery and structured data create more depth. This turns the listing into more than a transition point; it becomes a strong landing page.",
              )}
            </p>
          </div>
        </div>

        <div className="rounded-[14px] bg-slate-900 p-8 text-white shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
            {pickLocalized(locale, "Ozel danisman", "Private advisor")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-balance">
            {pickLocalized(locale, "Uygun villayi birlikte daha hizli netlestirebiliriz.", "We can shortlist the right villa together, much faster.")}
          </h2>
          <p className="mt-5 text-sm leading-8 text-white/72">
            {pickLocalized(
              locale,
              "Balayi, cekirdek aile, genis grup ya da uzun donem konaklama. Listeleme mantigi bu niyeti gostermeye yardim eder; danisman akisi kalan soru isaretlerini kapatir.",
              "Honeymoon, nuclear family, large group or long stay. The listing logic helps reveal this intent, while the advisory flow clears the remaining questions.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/iletisim"
              className="rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              {pickLocalized(locale, "Danisman ile gorus", "Talk to an advisor")}
            </Link>
            <Link
              href="/kampanyalar"
              className="rounded-[10px] border border-white/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/28"
            >
              {pickLocalized(locale, "Kampanyalari gor", "View campaigns")}
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
