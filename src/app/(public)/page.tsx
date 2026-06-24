import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { getFaqItems, getHomeTestimonials } from "@/lib/site-data";
import { formatCurrency } from "@/lib/villa-catalog";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCompanyHeroImage, getRegionPresentationImage } from "@/lib/public-gallery";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "Ana Sayfa", en: "Home" },
    description: {
      tr: "Buyuk hero, arama odakli giris ve bolge bazli kesif akisi ile hazirlanan villa kiralama ana sayfasi.",
      en: "A villa rental homepage built with a bold hero, search-led entry and destination-based discovery flow.",
    },
    keywords: {
      tr: [
        "villa kiralama",
        "ozel havuzlu villa",
        "kas villa",
        "kalkan villa",
        "fethiye villa",
        "bodrum villa",
      ],
      en: [
        "villa rental",
        "private pool villa",
        "kas villa",
        "kalkan villa",
        "fethiye villa",
        "bodrum villa",
      ],
    },
    canonical: "/",
    openGraphTitle: { tr: "VillaVera | Villa Kiralama", en: "VillaVera | Villa Rentals" },
    openGraphDescription: {
      tr: "Premium villalari, populer bolgeleri ve tarih kontrollu talep akisiyla kesfet.",
      en: "Discover premium villas, popular destinations and a date-controlled inquiry flow.",
    },
  });
}

export const dynamic = "force-dynamic";

function buildLocationCollections(villas: Awaited<ReturnType<typeof getDemoVillas>>) {
  const grouped = new Map<string, typeof villas>();

  villas.forEach((villa) => {
    const existing = grouped.get(villa.district) ?? [];
    existing.push(villa);
    grouped.set(villa.district, existing);
  });

  return Array.from(grouped.entries())
    .map(([district, items]) => ({
      district,
      city: items[0]?.city ?? "",
      image: items[0]?.coverImageUrl,
      villas: items,
      averagePrice: Math.round(
        items.reduce((sum, item) => sum + (item.discountedNightlyPrice ?? item.nightlyPrice), 0) /
          items.length,
      ),
    }))
    .slice(0, 4);
}

function buildCompanyListingHref(companySlug: string, filters?: { location?: string }) {
  const params = new URLSearchParams({ company: companySlug });

  if (filters?.location) {
    params.set("location", filters.location);
  }

  return `/villalar?${params.toString()}`;
}

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const villas = await getDemoVillas({
    companyId: company.id,
    includeMetrics: false,
    includeInactive: false,
  });
  const heroVilla = villas[0] ?? null;
  const locationCollections = buildLocationCollections(villas);
  const showcaseVillas = villas.slice(0, 8);
  const heroImage = getCompanyHeroImage(company.slug, heroVilla?.coverImageUrl);
  const faqItems = getFaqItems(locale);
  const testimonials = getHomeTestimonials(locale);
  const todayKey = new Date().toISOString().slice(0, 10);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="relative min-h-[82vh] overflow-hidden bg-[var(--serene-primary)]">
        {heroImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001b3c]/78 via-[#001b3c]/44 to-[#1a365d]/22" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,27,60,0.18),rgba(0,27,60,0.5))]" />

        <Container className="relative flex min-h-[82vh] flex-col justify-center pb-24 pt-36">
          <div className="max-w-3xl text-white">
            <h1 className="max-w-2xl font-display text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.6rem]">
              {pickLocalized(locale, "Kusursuz kacamaginizi kesfedin", "Discover your perfect escape")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/84">
              {pickLocalized(
                locale,
                "Ozel havuzlu, deniz manzarali ve secili detaylarla one cikan villalarda unutulmaz bir tatil deneyimi yasayin.",
                "Enjoy an unforgettable holiday in standout villas with private pools, sea views and carefully selected details.",
              )}
            </p>
          </div>

          <form
            action="/villalar"
            method="get"
            className="mt-12 max-w-5xl rounded-[24px] border border-white/30 bg-white p-2 shadow-[0_24px_54px_rgba(0,32,69,0.24)]"
          >
            <input type="hidden" name="company" value={company.slug} />
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-1 px-6 py-4 text-left md:border-r md:border-[var(--serene-outline-variant)]">
                <label htmlFor="home-location" className="text-sm font-semibold text-[var(--serene-on-surface)]">
                  {pickLocalized(locale, "Konum", "Location")}
                </label>
                <input
                  id="home-location"
                  name="location"
                  list="home-location-options"
                  placeholder={pickLocalized(
                    locale,
                    "Nereye gitmek isteriniz?",
                    "Where would you like to go?",
                  )}
                  className="mt-1 w-full bg-transparent text-base text-[var(--serene-on-surface-variant)] outline-none placeholder:text-[var(--serene-outline)]"
                />
                <datalist id="home-location-options">
                  {locationCollections.map((collection) => (
                    <option key={collection.district} value={collection.district} />
                  ))}
                </datalist>
              </div>

              <div className="flex-[1.25] px-6 py-4 text-left md:border-r md:border-[var(--serene-outline-variant)]">
                <p className="text-sm font-semibold text-[var(--serene-on-surface)]">
                  {pickLocalized(locale, "Giris - Cikis", "Check-in / Check-out")}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    aria-label={pickLocalized(locale, "Giris tarihi", "Check-in date")}
                    name="checkIn"
                    type="date"
                    min={todayKey}
                    className="w-full rounded-[8px] bg-[var(--serene-surface-low)] px-3 py-2 text-sm text-[var(--serene-on-surface-variant)] outline-none transition focus:ring-2 focus:ring-[var(--serene-primary-muted)]"
                  />
                  <input
                    aria-label={pickLocalized(locale, "Cikis tarihi", "Check-out date")}
                    name="checkOut"
                    type="date"
                    min={todayKey}
                    className="w-full rounded-[8px] bg-[var(--serene-surface-low)] px-3 py-2 text-sm text-[var(--serene-on-surface-variant)] outline-none transition focus:ring-2 focus:ring-[var(--serene-primary-muted)]"
                  />
                </div>
              </div>

              <div className="flex-1 px-6 py-4 text-left">
                <label htmlFor="home-guests" className="text-sm font-semibold text-[var(--serene-on-surface)]">
                  {pickLocalized(locale, "Misafir", "Guests")}
                </label>
                <input
                  id="home-guests"
                  name="guests"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder={pickLocalized(locale, "Kisi sayisi", "Guest count")}
                  className="mt-1 w-full bg-transparent text-base text-[var(--serene-on-surface-variant)] outline-none placeholder:text-[var(--serene-outline)]"
                />
              </div>

              <div className="px-2 pb-2 pt-0 md:pb-0 md:pt-0">
                <button
                  type="submit"
                  className="serene-button-primary inline-flex h-[58px] min-w-[170px] items-center justify-center px-8 text-lg font-semibold"
                >
                  {pickLocalized(locale, "Ara", "Search")}
                </button>
              </div>
            </div>
          </form>
        </Container>
      </section>

      <section className="pt-[120px]">
        <Container>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "Populer Bolgeler", "Popular Destinations")}
            </h2>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {locationCollections.map((collection) => (
              <Link
                key={collection.district}
                href={buildCompanyListingHref(company.slug, { location: collection.district })}
                className="serene-card group relative overflow-hidden"
              >
                <div
                  className="h-[220px] bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                  style={{
                    backgroundImage: getRegionPresentationImage(collection.district, collection.image)
                      ? `linear-gradient(rgba(15,23,42,0.1), rgba(15,23,42,0.28)), url(${getRegionPresentationImage(collection.district, collection.image)})`
                      : undefined,
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {collection.city}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                    {collection.district}
                  </h3>
                  <p className="mt-2 text-sm text-white/82">
                    {pickLocalized(locale, "Ortalama fiyat", "Average price")}{" "}
                    {formatCurrency(collection.averagePrice, locale)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-[120px]">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--serene-on-surface)]">
                {pickLocalized(locale, "One Cikan Villalar", "Featured Villas")}
              </h2>
              <p className="mt-2 text-sm text-[var(--serene-on-surface-variant)]">
                {pickLocalized(
                  locale,
                  "En cok ilgi goren ve ilk bakista dikkat ceken secili konaklama secenekleri",
                  "Selected stays that attract the most attention at first glance",
                )}
              </p>
            </div>
            <Link
              href={getDemoCompanySiteHref(company.slug, "/villalar")}
              className="hidden text-sm font-semibold text-[var(--serene-primary)] transition hover:text-[var(--serene-primary-container)] md:inline-flex"
            >
              {pickLocalized(locale, "Tumunu gor", "View all")}
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {showcaseVillas.map((villa) => (
              <PublicVillaCard key={villa.id} villa={villa} compact locale={locale} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-[120px]">
        <Container>
          <div className="serene-card p-8 sm:p-10">
            <h2 className="text-center font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--serene-on-surface)]">
              {pickLocalized(locale, "Musteri Yorumlari", "Guest Reviews")}
            </h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.name}
                  className="rounded-[14px] border border-[var(--color-border-soft)] bg-[var(--serene-surface)] p-6"
                >
                  <p className="text-sm leading-7 text-[var(--serene-on-surface-variant)]">{item.text}</p>
                  <p className="mt-5 text-sm font-semibold text-[var(--serene-on-surface)]">{item.name}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
