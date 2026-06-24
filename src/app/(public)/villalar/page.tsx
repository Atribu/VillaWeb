import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { isBookableRange, getNightCount } from "@/lib/villa-availability";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

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
  const poolChips = Array.from(new Set(villaCatalog.map((villa) => villa.poolType))).slice(0, 4);
  const featuredCount = villaCatalog.filter((villa) => villa.featured).length;
  const averageNightlyPrice =
    villaCatalog.length > 0
      ? Math.round(
          villaCatalog.reduce(
            (sum, villa) => sum + (villa.discountedNightlyPrice ?? villa.nightlyPrice),
            0,
          ) / villaCatalog.length,
        )
      : 0;

  function buildFilterHref(updates: {
    location?: string | null;
    guests?: string | null;
    checkIn?: string | null;
    checkOut?: string | null;
  }) {
    const nextParams = new URLSearchParams({ company: company.slug });
    const nextLocation = updates.location === undefined ? locationQuery : updates.location;
    const nextGuests =
      updates.guests === undefined ? (guestCount ? String(guestCount) : "") : updates.guests;
    const nextCheckIn = updates.checkIn === undefined ? checkIn : updates.checkIn;
    const nextCheckOut = updates.checkOut === undefined ? checkOut : updates.checkOut;

    if (nextLocation) {
      nextParams.set("location", nextLocation);
    }

    if (nextGuests) {
      nextParams.set("guests", nextGuests);
    }

    if (nextCheckIn) {
      nextParams.set("checkIn", nextCheckIn);
    }

    if (nextCheckOut) {
      nextParams.set("checkOut", nextCheckOut);
    }

    return `/villalar?${nextParams.toString()}`;
  }

  return (
    <Container className="py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(villaListJsonLd) }}
      />

      <header className="border-b border-[var(--serene-outline-variant)] pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="serene-eyebrow">
              {pickLocalized(locale, "Villa Koleksiyonu", "Villa Collection")}
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.055em] text-[var(--serene-primary)] text-balance sm:text-6xl lg:text-[4.5rem]">
              {pickLocalized(locale, "Secili Villalar", "Exclusive Villas")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--serene-on-surface-variant)]">
              {pickLocalized(
                locale,
                "Lokasyon, kapasite ve tarih uygunluguna gore sakin, net ve premium bir katalog deneyimi.",
                "A calm, clear and premium catalog experience by location, capacity and date availability.",
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--serene-outline-variant)] bg-white px-5 py-3 text-sm font-semibold text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "Onerilen", "Recommended")}
            </span>
            <Link
              href={getDemoCompanySiteHref(company.slug, "/iletisim")}
              className="rounded-full bg-[var(--serene-secondary-container)] px-5 py-3 text-sm font-semibold text-[var(--serene-on-surface-variant)] transition hover:text-[var(--serene-primary)]"
            >
              {pickLocalized(locale, "Danismana Sor", "Ask Advisor")}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            [pickLocalized(locale, "Sonuc", "Results"), `${filteredVillaCatalog.length} ${pickLocalized(locale, "villa", "villas")}`],
            [pickLocalized(locale, "Ortalama", "Average"), formatCurrency(averageNightlyPrice, locale)],
            [pickLocalized(locale, "One cikan", "Featured"), `${featuredCount} ${pickLocalized(locale, "villa", "villas")}`],
          ].map(([label, value]) => (
            <div key={label} className="serene-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--serene-outline)]">
                {label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--serene-primary)]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </header>

      <section className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-8 border-r border-transparent lg:pr-6">
            <div className="border-b border-[var(--serene-outline-variant)] pb-6">
              <h2 className="font-display text-2xl font-semibold text-[var(--serene-primary)]">
                {pickLocalized(locale, "Filtreler", "Filters")}
              </h2>
              <p className="mt-2 text-sm text-[var(--serene-on-surface-variant)]">
                {pickLocalized(locale, "Katalogu hizli daralt.", "Narrow the catalog quickly.")}
              </p>
            </div>

            <div className="border-b border-[var(--serene-outline-variant)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--serene-primary)]">
                {pickLocalized(locale, "Bolge", "Destination")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {districtChips.map((chip) => {
                  const isActive = normalizeForSearch(chip) === normalizedLocationQuery;

                  return (
                    <Link
                      key={chip}
                      href={buildFilterHref({ location: isActive ? null : chip })}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-[var(--serene-primary)] bg-[var(--serene-primary-soft)] text-[var(--serene-primary)]"
                          : "border-[var(--serene-outline-variant)] text-[var(--serene-on-surface-variant)] hover:border-[var(--serene-primary)] hover:text-[var(--serene-primary)]"
                      }`}
                    >
                      {chip}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-[var(--serene-outline-variant)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--serene-primary)]">
                {pickLocalized(locale, "Misafir", "Guests")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["2", "4", "6", "8"].map((count) => {
                  const isActive = guestCount === Number(count);

                  return (
                    <Link
                      key={count}
                      href={buildFilterHref({ guests: isActive ? null : count })}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                        isActive
                          ? "border-[var(--serene-primary)] bg-[var(--serene-primary-soft)] text-[var(--serene-primary)]"
                          : "border-[var(--serene-outline-variant)] text-[var(--serene-on-surface-variant)] hover:border-[var(--serene-primary)] hover:text-[var(--serene-primary)]"
                      }`}
                    >
                      {count}+
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-[var(--serene-outline-variant)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--serene-primary)]">
                {pickLocalized(locale, "Havuz Tipi", "Pool Type")}
              </p>
              <div className="mt-4 space-y-3">
                {poolChips.map((pool) => (
                  <div key={pool} className="flex items-center gap-3 text-sm text-[var(--serene-on-surface)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-[var(--serene-primary)] bg-[var(--serene-primary)] text-[10px] text-white">
                      ✓
                    </span>
                    {pool}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--serene-primary)]">
                {pickLocalized(locale, "Kategori", "Category")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {categoryChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-[var(--serene-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--serene-primary)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href={buildCompanyListingHref(company.slug)}
              className="serene-button-secondary inline-flex w-full justify-center px-5 py-3 text-sm font-semibold"
            >
              {pickLocalized(locale, "Filtreleri Temizle", "Clear Filters")}
            </Link>
          </div>
        </aside>

        <div>
          {hasActiveFilters ? (
            <section className="serene-card mb-6 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="serene-eyebrow">
                    {pickLocalized(locale, "Arama Sonuclari", "Search Results")}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--serene-on-surface)]">
                    {pickLocalized(
                      locale,
                      `${filteredVillaCatalog.length} villa kriterlere uyuyor`,
                      `${filteredVillaCatalog.length} villas match your criteria`,
                    )}
                  </h2>
                </div>
                <Link
                  href={buildCompanyListingHref(company.slug)}
                  className="serene-button-secondary inline-flex px-4 py-2 text-sm font-semibold"
                >
                  {pickLocalized(locale, "Temizle", "Clear")}
                </Link>
              </div>

              {activeFilterLabels.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeFilterLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-[999px] bg-[var(--serene-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--serene-primary)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}

              {hasInvalidDateRange ? (
                <p className="mt-4 rounded-[8px] border border-[var(--serene-tertiary-soft)] bg-[#fff8ea] px-4 py-3 text-sm leading-6 text-[var(--serene-tertiary-deep)]">
                  {pickLocalized(
                    locale,
                    "Tarih filtresi uygulanmadi. Uygunluk kontrolu icin giris ve cikis tarihini dogru sirayla secmelisin.",
                    "Date filtering was not applied. Select a valid check-in and check-out order to check availability.",
                  )}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-2">
            {filteredVillaCatalog.map((villa) => (
              <PublicVillaCard key={villa.id} villa={villa} locale={locale} />
            ))}
          </section>
        </div>
      </section>

      {filteredVillaCatalog.length === 0 ? (
        <section className="mt-10 rounded-[16px] border border-dashed border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] p-8 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--serene-on-surface)]">
            {pickLocalized(locale, "Bu kriterlere uygun villa bulunamadi", "No villas match these criteria")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--serene-on-surface-variant)]">
            {pickLocalized(
              locale,
              "Konumu genisletmeyi, misafir sayisini azaltmayi ya da farkli tarih araligi denemeyi dusunebilirsin.",
              "Try broadening the location, lowering the guest count or choosing a different date range.",
            )}
          </p>
          <Link
            href={buildCompanyListingHref(company.slug)}
            className="serene-button-primary mt-6 inline-flex px-5 py-2.5 text-sm font-semibold"
          >
            {pickLocalized(locale, "Tum Villalari Goster", "Show All Villas")}
          </Link>
        </section>
      ) : null}

      <section className="mt-24 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="serene-card p-8">
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
            <p className="text-sm leading-8 text-[var(--serene-on-surface-variant)]">
              {pickLocalized(
                locale,
                "Villa listeleme sayfasi; Kalkan villa kiralama, Fethiye aile villasi veya Bodrum luks villa gibi arama niyetlerini destekleyen metin alanlariyla guclendirilir. Bu alanlar sayfaya daha derin bir SEO tabani kazandirir.",
                "The villa listing page is strengthened with content blocks that support search intent such as Kalkan villa rental, family villas in Fethiye or luxury villas in Bodrum. These sections create a deeper SEO foundation for the page.",
              )}
            </p>
            <p className="text-sm leading-8 text-[var(--serene-on-surface-variant)]">
              {pickLocalized(
                locale,
                "Her villa kendi detay sayfasina baglanir; detay sayfasi ise takvim, talep akisi, fiyat, galeri ve yapilandirilmis veri ile derinlesir. Boylece listeleme sadece gecis noktasi degil, guclu bir landing sayfasina donusur.",
                "Each villa links to its own detail page, where calendar, inquiry flow, pricing, gallery and structured data create more depth. This turns the listing into more than a transition point; it becomes a strong landing page.",
              )}
            </p>
          </div>
        </div>

        <div className="rounded-[16px] bg-ocean-panel p-8 text-white shadow-[0_14px_32px_rgba(26,54,93,0.16)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--serene-tertiary-soft)]">
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
              className="rounded-[8px] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--serene-primary)] transition hover:bg-[var(--serene-primary-soft)]"
            >
              {pickLocalized(locale, "Danisman ile gorus", "Talk to an advisor")}
            </Link>
            <Link
              href="/kampanyalar"
              className="rounded-[8px] border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--serene-tertiary-soft)]"
            >
              {pickLocalized(locale, "Kampanyalari gor", "View campaigns")}
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
