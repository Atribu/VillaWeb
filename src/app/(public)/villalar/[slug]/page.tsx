import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
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
  const company = await getCurrentPublicCompany();
  const villa = await getDemoVillaBySlug(slug, { companyId: company.id });

  if (!villa) {
    notFound();
  }

  const allVillas = await getDemoVillas({ companyId: company.id });
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
      ? `${villa.rating.toFixed(2)} puan${villa.reviewCount ? ` / ${villa.reviewCount} yorum` : ""}`
      : "Yeni portfoy";

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

        <section className="surface-luxe overflow-hidden rounded-[2.6rem] p-5 sm:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-dark rounded-[2.2rem] px-7 py-8 text-white sm:px-8 sm:py-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/84 ring-1 ring-white/14">
                  {villa.badge}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/84 ring-1 ring-white/14">
                  {villa.category}
                </span>
                {villa.featured ? (
                  <span className="rounded-full bg-[var(--color-coral)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                    Editor secimi
                  </span>
                ) : null}
              </div>

              <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
                {villa.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/72">
                <span>{villa.locationLabel}</span>
                <span>{reviewLabel}</span>
                <span>{villa.requestCount} talep</span>
              </div>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/74">
                {villa.description}
              </p>

              <div className="mt-8 grid gap-3 rounded-[2rem] border border-white/10 bg-white/8 p-3 sm:grid-cols-3">
                {[
                  ["Misafir", `${villa.capacity} kisilik`],
                  ["Yatak odasi", `${villa.bedroomCount} oda`],
                  ["Havuz", villa.poolType],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[1.2rem] bg-white/8 px-4 py-4">
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
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                >
                  Talep olustur
                </Link>
                <Link
                  href="/villalar"
                  className="rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30"
                >
                  Tum villalar
                </Link>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              {galleryTiles[0] ? (
                <div className="overflow-hidden rounded-[2rem]">
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
                <div className={`rounded-[2rem] bg-gradient-to-br ${villa.coverGradient}`} />
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {galleryTiles.slice(1).map((imageUrl, index) => (
                  <div key={imageUrl} className="overflow-hidden rounded-[2rem]">
                    <Image
                      src={imageUrl}
                      alt={`${villa.coverAlt} galeri gorseli ${index + 2}`}
                      width={1200}
                      height={850}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}

                <div className="rounded-[2rem] border border-black/6 bg-[var(--color-coral-soft)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                    Fiyat bilgisi
                  </p>
                  {villa.discountedNightlyPrice ? (
                    <p className="mt-4 text-sm text-slate-400 line-through">
                      {formatCurrency(villa.nightlyPrice)}
                    </p>
                  ) : null}
                  <p className="mt-1 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">gecelik baslayan fiyat</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
          <div className="space-y-6">
            <div className="rounded-[2.1rem] border border-black/6 bg-white p-8 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                Villa ozeti
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                Premium detaylari sade bir karar deneyimiyle birlestiriyoruz
              </h2>
              <p className="mt-5 text-sm leading-8 text-slate-600">{villa.description}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[
                  ["Kapasite", `${villa.capacity} kisilik konaklama`],
                  ["Oda plani", `${villa.bedroomCount} oda, ${villa.bathroomCount} banyo`],
                  ["Talep yogunlugu", `${villa.requestCount} talep / ${villa.viewCount} goruntulenme`],
                  ["Min. konaklama", `${villa.minNightCount ?? 1} gece`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.5rem] bg-[var(--color-slate-soft)] px-5 py-5"
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
                  title: "Takvim kontrollu secim",
                  text: "Panelde kapali veya dolu olarak isaretlenen gunler misafir tarafinda secilemez.",
                },
                {
                  title: "Kampanya uyumlu fiyatlama",
                  text: "Aktif indirim, eski fiyat ve kupon mantigi talep akisi boyunca tutarli gorunur.",
                },
                {
                  title: "Arama motoru gucu",
                  text: "Slug, meta aciklama, odak kelime ve schema bilgileri sayfanin omurgasina dahildir.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.06)]"
                >
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[2.1rem] border border-black/6 bg-white p-8 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                  Villa hakkinda
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Lokasyon aramalarini da karsilayan daha guclu anlatim alani
                </h2>
                <p className="mt-5 text-sm leading-8 text-slate-600">
                  {villa.title}, {villa.district} bolgesinde {villa.focusKeyword} arayan
                  kullanicilar icin hazirlanan premium bir sayfa kurgusuna sahiptir. Karar asamasi
                  ile SEO katmanini ayni yerde bulusturur.
                </p>
                <p className="mt-5 text-sm leading-8 text-slate-600">
                  Buradaki dil; gorsel kaliteyi, kapasiteyi, manzarayi, yuzme deneyimini ve
                  lokasyon avantajini ayni anda anlatabilecek kadar editoryal, ama yine de sade
                  kalabilecek kadar kontrollu olmalidir.
                </p>
              </div>

              <div className="rounded-[2.1rem] border border-black/6 bg-white p-8 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                  Karar destek bilgileri
                </p>
                <div className="mt-6 space-y-4">
                  {[
                    ["Konum", villa.locationLabel],
                    ["Gelir verisi", villa.revenueLabel],
                    ["Gorsel sayisi", `${villa.imageCount} gorsel`],
                    ["Odak kelime", villa.focusKeyword],
                    ["Temizlik", formatCurrency(villa.cleaningFee ?? 0)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[1.3rem] bg-[var(--color-slate-soft)] px-4 py-4 text-sm"
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
            <div className="rounded-[2rem] border border-black/6 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Gecelik baslayan fiyat
                  </p>
                  {villa.discountedNightlyPrice ? (
                    <p className="mt-2 text-sm text-slate-400 line-through">
                      {formatCurrency(villa.nightlyPrice)}
                    </p>
                  ) : null}
                  <p className="mt-1 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
                  </p>
                </div>
                <p className="pb-1 text-sm text-slate-500">gecelik</p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm">
                  <span className="block text-slate-500">Minimum gece</span>
                  <span className="mt-1 block font-semibold text-slate-950">
                    {villa.minNightCount ?? 1} gece
                  </span>
                </div>
                <div className="rounded-[1.2rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm">
                  <span className="block text-slate-500">Temizlik</span>
                  <span className="mt-1 block font-semibold text-slate-950">
                    {formatCurrency(villa.cleaningFee ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <VillaAvailabilityCard villa={villa} />

            <div className="surface-dark rounded-[2rem] px-5 py-6 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Hizli bilgiler
              </p>
              <div className="mt-4 space-y-3">
                {[
                  ["Konum", villa.locationLabel],
                  ["Kategori", villa.category],
                  ["Min. gece", `${villa.minNightCount ?? 1} gece`],
                  ["Portfoy notu", villa.badge],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-[1.1rem] bg-white/8 px-4 py-3 text-sm"
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
          <section className="rounded-[2.2rem] border border-black/6 bg-white p-8 shadow-[0_16px_42px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                  Benzer villalar
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                  Ayni bolgedeki diger secenekleri de gor
                </h2>
              </div>
              <Link href="/villalar" className="text-sm font-semibold text-slate-950">
                Tum villalar
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
