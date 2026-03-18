import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { formatCurrency } from "@/lib/villa-catalog";
import { VillaAvailabilityCard } from "@/components/villas/villa-availability-card";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { getDemoVillaBySlug, getDemoVillas } from "@/lib/server/demo-villa-store";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const villa = await getDemoVillaBySlug(slug);

  if (!villa) {
    return {
      title: "Villa Bulunamadi",
    };
  }

  return {
    title: villa.seoTitle,
    description: villa.seoDescription,
    keywords: [villa.focusKeyword, villa.city, villa.district, "villa kiralama"],
    alternates: {
      canonical: `/villalar/${villa.slug}`,
    },
    openGraph: {
      title: villa.seoTitle,
      description: villa.seoDescription,
      images: villa.coverImageUrl ? [{ url: villa.coverImageUrl }] : undefined,
      type: "article",
    },
  };
}

export default async function VillaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const villa = await getDemoVillaBySlug(slug);

  if (!villa) {
    notFound();
  }

  const allVillas = await getDemoVillas();
  const relatedVillas = allVillas
    .filter((item) => item.slug !== villa.slug && item.city === villa.city)
    .slice(0, 3);

  const galleryImages =
    villa.imageUrls.length > 0 ? villa.imageUrls : villa.coverImageUrl ? [villa.coverImageUrl] : [];
  const primaryImage = galleryImages[0];
  const secondaryImages = galleryImages.slice(1, 5);

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

  return (
    <Container className="py-12 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link href="/" className="transition hover:text-[var(--color-teal)]">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link href="/villalar" className="transition hover:text-[var(--color-teal)]">
            Villalar
          </Link>
          <span>/</span>
          <span className="text-slate-700">{villa.title}</span>
        </div>

        <section className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                  {villa.badge}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {villa.category}
                </span>
                {villa.featured ? (
                  <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                    One Cikan Villa
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {villa.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span>{villa.locationLabel}</span>
                <span>{villa.capacity} misafir</span>
                <span>{villa.bedroomCount} oda</span>
                <span>{villa.bathroomCount} banyo</span>
                <span>{villa.poolType}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/villalar"
                className="rounded-full border border-black/8 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Tum Villalar
              </Link>
              <Link
                href={villa.availabilityRanges.length > 0 ? `/talep?villa=${villa.slug}` : "/talep"}
                className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Talep Olustur
              </Link>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
            {primaryImage ? (
              <div className="overflow-hidden rounded-[2rem]">
                <Image
                  src={primaryImage}
                  alt={villa.coverAlt}
                  width={1600}
                  height={1000}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className={`h-[420px] rounded-[2rem] bg-gradient-to-br ${villa.coverGradient}`} />
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {secondaryImages.length > 0 ? (
                secondaryImages.map((imageUrl, index) => (
                  <div key={imageUrl} className="overflow-hidden rounded-[2rem]">
                    <Image
                      src={imageUrl}
                      alt={`${villa.coverAlt} galeri gorseli ${index + 2}`}
                      width={1200}
                      height={750}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="rounded-[2rem] border border-black/6 bg-white p-8 text-sm leading-7 text-slate-600 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                  Bu villa icin galeri, tarih secimi ve talep akisi birlikte tasarlandi. Panelden
                  eklenen her gorsel burada modern bir vitrin duzeniyle yansitilir.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Villa Ozeti
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">
                Premium detaylar, sade bir karar deneyimi ile sunuluyor
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600">{villa.description}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[
                  ["Kapasite", `${villa.capacity} kisilik konaklama`],
                  ["Oda Plani", `${villa.bedroomCount} oda, ${villa.bathroomCount} banyo`],
                  ["Havuz Tipi", villa.poolType],
                  ["Talep Yogunlugu", `${villa.requestCount} talep / ${villa.viewCount} goruntulenme`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.4rem] border border-slate-100 bg-[var(--color-slate-soft)] p-5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Takvim Kontrollu Talep",
                  text: "Panelden eklenen doluluk bloklari popup takvimde secilemez sekilde yansir.",
                },
                {
                  title: "Esnek Fiyat Yonetimi",
                  text: "Indirimli fiyat, kampanya ve kupon yapisi public tarafta net bicimde gorunur.",
                },
                {
                  title: "SEO Hazirligi",
                  text: "Slug, meta aciklama, odak kelime ve schema yapisi bu detay sayfasina dahildir.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.7rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                SEO Ozeti
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">{villa.seoTitle}</h2>
              <p className="mt-4 text-sm leading-8 text-slate-600">{villa.seoDescription}</p>
              <p className="mt-4 text-sm font-medium text-slate-500">
                Odak anahtar kelime: {villa.focusKeyword}
              </p>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-28">
            <div className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  {villa.activeDiscountTitle ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                      {villa.activeDiscountTitle}
                    </p>
                  ) : null}
                  {villa.discountedNightlyPrice ? (
                    <p className="text-sm text-slate-400 line-through">
                      {formatCurrency(villa.nightlyPrice)}
                    </p>
                  ) : null}
                  <p className="mt-1 text-3xl font-semibold text-slate-900">
                    {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
                  </p>
                </div>
                <p className="pb-1 text-sm text-slate-500">gecelik baslayan fiyat</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm">
                  <span className="block text-slate-500">Minimum gece</span>
                  <span className="mt-1 block font-semibold text-slate-900">
                    {villa.minNightCount ?? 1} gece
                  </span>
                </div>
                <div className="rounded-[1rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm">
                  <span className="block text-slate-500">Temizlik</span>
                  <span className="mt-1 block font-semibold text-slate-900">
                    {formatCurrency(villa.cleaningFee ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <VillaAvailabilityCard villa={villa} />

            <div className="rounded-[1.8rem] border border-black/6 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Hizli Bilgiler
              </p>
              <div className="mt-4 space-y-3">
                {[
                  ["Konum", villa.locationLabel],
                  ["Gelir Verisi", villa.revenueLabel],
                  ["Gorsel Sayisi", `${villa.imageCount} gorsel`],
                  ["Odak Kelime", villa.focusKeyword],
                  ["Min. gece", `${villa.minNightCount ?? 1} gece`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[1rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              Villa Hakkinda
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              Bolge aramalarini karsilayan, guclu karar metinleriyle desteklenen detay alani
            </h2>
            <p className="mt-5 text-sm leading-8 text-slate-600">{villa.description}</p>
            <p className="mt-5 text-sm leading-8 text-slate-600">
              {villa.title}, {villa.district} bolgesinde {villa.focusKeyword} arayan kullanicilar
              icin hazirlanan premium bir sayfa kurgusuna sahiptir. Bu detay sayfasi hem talep
              donusumunu hem de arama motoru gorunurlugunu destekleyecek sekilde buyutulebilir.
            </p>
          </div>

          <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              Karar Destek Bilgileri
            </p>
            <div className="mt-6 space-y-4">
              {[
                ["Konum", villa.locationLabel],
                ["Kategori", villa.category],
                ["Gorsel sayisi", `${villa.imageCount}`],
                ["Talep ilgisi", `${villa.requestCount} talep`],
                ["Gelir verisi", villa.revenueLabel],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[1.25rem] bg-[var(--color-slate-soft)] px-4 py-4 text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {relatedVillas.length > 0 ? (
          <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                  Benzer Villalar
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                  Ayni bolgeden diger secenekleri de inceleyebilirsin
                </h2>
              </div>
              <Link href="/villalar" className="text-sm font-semibold text-slate-900">
                Tum Villalar
              </Link>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {relatedVillas.map((item) => (
                <PublicVillaCard key={item.id} villa={item} compact />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
