import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getLocalizedReviewLabel, getLocalizedVilla } from "@/lib/villa-content-i18n";
import { formatCurrency } from "@/lib/villa-catalog";
import { VillaAvailabilityCard } from "@/components/villas/villa-availability-card";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillaBySlug, getDemoVillas } from "@/lib/server/demo-villa-store";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getCurrentLocale();
  const villa = await getDemoVillaBySlug(slug, { includeMetrics: false, includeInactive: false });

  if (!villa) {
    return {
      title: pickLocalized(locale, "Villa Bulunamadi", "Villa Not Found"),
    };
  }

  const localizedVilla = getLocalizedVilla(villa, locale);

  return {
    title: localizedVilla.seoTitle,
    description: localizedVilla.seoDescription,
    keywords: [
      localizedVilla.focusKeyword,
      localizedVilla.city,
      localizedVilla.district,
      pickLocalized(locale, "villa kiralama", "villa rental"),
    ],
    alternates: {
      canonical: `/villalar/${localizedVilla.slug}`,
    },
    openGraph: {
      title: localizedVilla.seoTitle,
      description: localizedVilla.seoDescription,
      images: localizedVilla.coverImageUrl ? [{ url: localizedVilla.coverImageUrl }] : undefined,
      type: "article",
    },
  };
}

export default async function VillaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const rawVilla = await getDemoVillaBySlug(slug, {
    companyId: company.id,
    includeMetrics: false,
    includeInactive: false,
  });

  if (!rawVilla) {
    notFound();
  }

  const villa = getLocalizedVilla(rawVilla, locale);

  const allVillas = await getDemoVillas({
    companyId: company.id,
    includeMetrics: false,
    includeInactive: false,
  });
  const relatedVillas = allVillas
    .filter((item) => item.slug !== villa.slug && item.city === villa.city)
    .slice(0, 3);

  const galleryImages =
    villa.imageUrls.length > 0 ? villa.imageUrls : villa.coverImageUrl ? [villa.coverImageUrl] : [];
  const galleryTiles = galleryImages.slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: villa.title,
    description: villa.seoDescription,
    url: `https://villaweb.example/villalar/${villa.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: villa.district,
      addressRegion: villa.city,
      addressCountry: "TR",
    },
    numberOfRooms: villa.bedroomCount,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: villa.capacity,
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: villa.poolType, value: true },
      { "@type": "LocationFeatureSpecification", name: `${villa.bathroomCount} banyo`, value: true },
    ],
  };

  const reviewLabel =
    typeof villa.rating === "number"
      ? getLocalizedReviewLabel(villa, locale)
      : pickLocalized(locale, "Yeni portfoy", "New listing");

  return (
    <Container className="py-12 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="transition hover:text-[var(--color-teal)]">
            {pickLocalized(locale, "Ana Sayfa", "Home")}
          </Link>
          <span>/</span>
          <Link href="/villalar" className="transition hover:text-[var(--color-teal)]">
            {pickLocalized(locale, "Villalar", "Villas")}
          </Link>
          <span>/</span>
          <span className="text-slate-700">{villa.title}</span>
        </div>

        <section className="surface-luxe overflow-hidden rounded-[14px] p-5 sm:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-dark rounded-[12px] px-7 py-8 text-white sm:px-8 sm:py-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/84 ring-1 ring-white/14">
                  {villa.badge}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/84 ring-1 ring-white/14">
                  {villa.category}
                </span>
                {villa.featured ? (
                  <span className="rounded-full bg-[var(--color-coral)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                    {pickLocalized(locale, "Editor secimi", "Editor's choice")}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
                {villa.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/72">
                <span>{villa.locationLabel}</span>
                <span>{reviewLabel}</span>
                <span>
                  {villa.requestCount} {pickLocalized(locale, "talep", "inquiries")}
                </span>
              </div>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/74">
                {villa.description}
              </p>

              <div className="mt-8 grid gap-3 rounded-[12px] border border-white/10 bg-white/8 p-3 sm:grid-cols-3">
                {[
                  [
                    pickLocalized(locale, "Misafir", "Guests"),
                    pickLocalized(locale, `${villa.capacity} kisilik`, `Up to ${villa.capacity} guests`),
                  ],
                  [
                    pickLocalized(locale, "Yatak odasi", "Bedrooms"),
                    pickLocalized(locale, `${villa.bedroomCount} oda`, `${villa.bedroomCount} rooms`),
                  ],
                  [pickLocalized(locale, "Havuz", "Pool"), villa.poolType],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[10px] bg-white/8 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={villa.availabilityRanges.length > 0 ? `/talep?villa=${villa.slug}` : "/talep"}
                  className="rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                >
                  {pickLocalized(locale, "Talep olustur", "Create Inquiry")}
                </Link>
                <Link
                  href="/villalar"
                  className="rounded-[10px] border border-white/14 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30"
                >
                  {pickLocalized(locale, "Tum villalar", "All villas")}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              {galleryTiles[0] ? (
                <div className="overflow-hidden rounded-[12px]">
                  <Image
                    src={galleryTiles[0]}
                    alt={villa.coverAlt}
                    width={1600}
                    height={1100}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className={`rounded-[12px] bg-gradient-to-br ${villa.coverGradient}`} />
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {galleryTiles.slice(1).map((imageUrl, index) => (
                  <div key={imageUrl} className="overflow-hidden rounded-[12px]">
                    <Image
                      src={imageUrl}
                      alt={pickLocalized(
                        locale,
                        `${villa.coverAlt} galeri gorseli ${index + 2}`,
                        `${villa.coverAlt} gallery image ${index + 2}`,
                      )}
                      width={1200}
                      height={850}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}

                <div className="rounded-[12px] border border-black/6 bg-[var(--color-coral-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                    {pickLocalized(locale, "Fiyat bilgisi", "Pricing")}
                  </p>
                  {villa.discountedNightlyPrice ? (
                    <p className="mt-4 text-sm text-slate-400 line-through">
                      {formatCurrency(villa.nightlyPrice, locale)}
                    </p>
                  ) : null}
                  <p className="mt-1 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice, locale)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {pickLocalized(locale, "gecelik baslayan fiyat", "starting nightly rate")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
          <div className="space-y-6">
            <div className="rounded-[14px] border border-black/6 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                {pickLocalized(locale, "Villa ozeti", "Villa overview")}
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {pickLocalized(
                  locale,
                  "Premium detaylari sade bir karar deneyimiyle birlestiriyoruz",
                  "We combine premium details with a clearer booking decision experience",
                )}
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600">{villa.description}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[
                  [
                    pickLocalized(locale, "Kapasite", "Capacity"),
                    pickLocalized(
                      locale,
                      `${villa.capacity} kisilik konaklama`,
                      `Stay for up to ${villa.capacity} guests`,
                    ),
                  ],
                  [
                    pickLocalized(locale, "Oda plani", "Room plan"),
                    pickLocalized(
                      locale,
                      `${villa.bedroomCount} oda, ${villa.bathroomCount} banyo`,
                      `${villa.bedroomCount} bedrooms, ${villa.bathroomCount} bathrooms`,
                    ),
                  ],
                  [
                    pickLocalized(locale, "Talep yogunlugu", "Inquiry volume"),
                    pickLocalized(
                      locale,
                      `${villa.requestCount} talep / ${villa.viewCount} goruntulenme`,
                      `${villa.requestCount} inquiries / ${villa.viewCount} views`,
                    ),
                  ],
                  [
                    pickLocalized(locale, "Min. konaklama", "Minimum stay"),
                    pickLocalized(locale, `${villa.minNightCount ?? 1} gece`, `${villa.minNightCount ?? 1} nights`),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[10px] bg-[var(--color-slate-soft)] px-5 py-5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: pickLocalized(locale, "Takvim kontrollu secim", "Calendar-controlled selection"),
                  text: pickLocalized(
                    locale,
                    "Panelde kapali veya dolu olarak isaretlenen gunler misafir tarafinda secilemez.",
                    "Dates marked as blocked or reserved in the panel cannot be selected by guests.",
                  ),
                },
                {
                  title: pickLocalized(locale, "Kampanya uyumlu fiyatlama", "Campaign-aware pricing"),
                  text: pickLocalized(
                    locale,
                    "Aktif indirim, eski fiyat ve kupon mantigi talep akisi boyunca tutarli gorunur.",
                    "Active discounts, strike-through pricing and coupon logic stay consistent throughout the inquiry flow.",
                  ),
                },
                {
                  title: pickLocalized(locale, "Arama motoru gucu", "Search visibility"),
                  text: pickLocalized(
                    locale,
                    "Slug, meta aciklama, odak kelime ve schema bilgileri sayfanin omurgasina dahildir.",
                    "Slug, meta description, focus keyword and schema details are built into the page structure.",
                  ),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[12px] border border-black/6 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
                >
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[14px] border border-black/6 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                  {pickLocalized(locale, "Villa hakkinda", "About the villa")}
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  {pickLocalized(
                    locale,
                    "Lokasyon aramalarini da karsilayan daha guclu anlatim alani",
                    "A stronger editorial section that also supports destination search intent",
                  )}
                </h2>
                <p className="mt-5 text-sm leading-8 text-slate-600">
                  {pickLocalized(
                    locale,
                    `${villa.title}, ${villa.district} bolgesinde ${villa.focusKeyword} arayan kullanicilar icin hazirlanan premium bir sayfa kurgusuna sahiptir. Karar asamasi ile SEO katmanini ayni yerde bulusturur.`,
                    `${villa.title} is designed as a premium villa page for guests searching ${villa.focusKeyword} in ${villa.district}. It brings booking intent and SEO structure together in the same place.`,
                  )}
                </p>
                <p className="mt-5 text-sm leading-8 text-slate-600">
                  {pickLocalized(
                    locale,
                    "Buradaki dil; gorsel kaliteyi, kapasiteyi, manzarayi, yuzme deneyimini ve lokasyon avantajini ayni anda anlatabilecek kadar editoryal, ama yine de sade kalabilecek kadar kontrollu olmalidir.",
                    "The editorial tone here should describe visual quality, capacity, views, pool experience and location advantages clearly, while still feeling calm and refined.",
                  )}
                </p>
              </div>

              <div className="rounded-[14px] border border-black/6 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                  {pickLocalized(locale, "Karar destek bilgileri", "Decision support details")}
                </p>
                <div className="mt-6 space-y-4">
                  {[
                    [pickLocalized(locale, "Konum", "Location"), villa.locationLabel],
                    [pickLocalized(locale, "Gelir verisi", "Revenue data"), villa.revenueLabel],
                    [
                      pickLocalized(locale, "Gorsel sayisi", "Image count"),
                      pickLocalized(locale, `${villa.imageCount} gorsel`, `${villa.imageCount} images`),
                    ],
                    [pickLocalized(locale, "Odak kelime", "Focus keyword"), villa.focusKeyword],
                    [pickLocalized(locale, "Temizlik", "Cleaning"), formatCurrency(villa.cleaningFee ?? 0, locale)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[10px] bg-[var(--color-slate-soft)] px-4 py-4 text-sm"
                    >
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-950">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-28">
            <div className="rounded-[14px] border border-black/6 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {pickLocalized(locale, "Gecelik baslayan fiyat", "Starting nightly rate")}
                  </p>
                  {villa.discountedNightlyPrice ? (
                    <p className="mt-2 text-sm text-slate-400 line-through">
                      {formatCurrency(villa.nightlyPrice, locale)}
                    </p>
                  ) : null}
                  <p className="mt-1 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice, locale)}
                  </p>
                </div>
                <p className="pb-1 text-sm text-slate-500">
                  {pickLocalized(locale, "gecelik", "per night")}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] bg-[var(--color-slate-soft)] px-4 py-3 text-sm">
                  <span className="block text-slate-500">
                    {pickLocalized(locale, "Minimum gece", "Minimum nights")}
                  </span>
                  <span className="mt-1 block font-semibold text-slate-950">
                    {villa.minNightCount ?? 1} {pickLocalized(locale, "gece", "nights")}
                  </span>
                </div>
                <div className="rounded-[10px] bg-[var(--color-slate-soft)] px-4 py-3 text-sm">
                  <span className="block text-slate-500">
                    {pickLocalized(locale, "Temizlik", "Cleaning")}
                  </span>
                  <span className="mt-1 block font-semibold text-slate-950">
                    {formatCurrency(villa.cleaningFee ?? 0, locale)}
                  </span>
                </div>
              </div>
            </div>

            <VillaAvailabilityCard villa={villa} locale={locale} />

            <div className="surface-dark rounded-[14px] px-5 py-6 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                {pickLocalized(locale, "Hizli bilgiler", "Quick details")}
              </p>
              <div className="mt-4 space-y-3">
                {[
                  [pickLocalized(locale, "Konum", "Location"), villa.locationLabel],
                  [pickLocalized(locale, "Kategori", "Category"), villa.category],
                  [
                    pickLocalized(locale, "Min. gece", "Minimum stay"),
                    pickLocalized(locale, `${villa.minNightCount ?? 1} gece`, `${villa.minNightCount ?? 1} nights`),
                  ],
                  [pickLocalized(locale, "Portfoy notu", "Listing badge"), villa.badge],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[10px] bg-white/8 px-4 py-3 text-sm"
                  >
                    <span className="text-white/62">{label}</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {relatedVillas.length > 0 ? (
          <section className="rounded-[14px] border border-black/6 bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                  {pickLocalized(locale, "Benzer villalar", "Similar villas")}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                  {pickLocalized(locale, "Ayni bolgedeki diger secenekleri de gor", "See more villas in the same destination")}
                </h2>
              </div>
              <Link href="/villalar" className="text-sm font-semibold text-slate-950">
                {pickLocalized(locale, "Tum villalar", "All villas")}
              </Link>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {relatedVillas.map((item) => (
                <PublicVillaCard key={item.id} villa={item} compact locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
