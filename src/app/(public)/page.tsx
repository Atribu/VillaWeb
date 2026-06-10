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

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const villas = await getDemoVillas({ companyId: company.id });
  const heroVilla = villas[0] ?? null;
  const locationCollections = buildLocationCollections(villas);
  const showcaseVillas = villas.slice(0, 8);
  const heroImage = getCompanyHeroImage(company.slug, heroVilla?.coverImageUrl);
  const faqItems = getFaqItems(locale);
  const testimonials = getHomeTestimonials(locale);

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

      <section className="relative min-h-[82vh] overflow-hidden bg-slate-950">
        {heroImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/72 via-slate-950/40 to-slate-950/24" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.24),rgba(15,23,42,0.44))]" />

        <Container className="relative flex min-h-[82vh] flex-col justify-center pb-24 pt-36">
          <div className="max-w-3xl text-white">
            <h1 className="max-w-2xl font-sans text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.6rem]">
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

          <div className="mt-12 max-w-5xl rounded-[999px] bg-white p-2 shadow-[0_24px_54px_rgba(15,23,42,0.22)]">
            <div className="flex flex-col md:flex-row md:items-center">
              {[
                [
                  pickLocalized(locale, "Konum", "Location"),
                  pickLocalized(locale, "Nereye gitmek isteriniz?", "Where would you like to go?"),
                ],
                [
                  pickLocalized(locale, "Giris - Cikis", "Check-in / Check-out"),
                  pickLocalized(locale, "Tarih secin", "Choose your dates"),
                ],
                [
                  pickLocalized(locale, "Misafir", "Guests"),
                  pickLocalized(locale, "Kisi sayisi", "Guest count"),
                ],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`flex-1 px-6 py-4 text-left ${index < 2 ? "md:border-r md:border-slate-200" : ""}`}
                >
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="mt-1 text-base text-slate-500">{value}</p>
                </div>
              ))}
              <div className="px-2 pb-2 pt-0 md:pb-0 md:pt-0">
                <Link
                  href={getDemoCompanySiteHref(company.slug, "/villalar")}
                  className="inline-flex h-[58px] min-w-[170px] items-center justify-center rounded-[999px] bg-[#2f6eb1] px-8 text-lg font-semibold text-white transition hover:bg-[#275f9a]"
                >
                  {pickLocalized(locale, "Ara", "Search")}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-12">
        <Container>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {pickLocalized(locale, "Populer Bolgeler", "Popular Destinations")}
            </h2>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {locationCollections.map((collection) => (
              <Link
                key={collection.district}
                href={getDemoCompanySiteHref(company.slug, "/villalar")}
                className="group relative overflow-hidden rounded-[16px] border border-[#dfe5ea] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)]"
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

      <section className="pt-16">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {pickLocalized(locale, "One Cikan Villalar", "Featured Villas")}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {pickLocalized(
                  locale,
                  "En cok ilgi goren ve ilk bakista dikkat ceken secili konaklama secenekleri",
                  "Selected stays that attract the most attention at first glance",
                )}
              </p>
            </div>
            <Link
              href={getDemoCompanySiteHref(company.slug, "/villalar")}
              className="hidden text-sm font-semibold text-[#2f6eb1] transition hover:text-[#224d7d] md:inline-flex"
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

      <section className="pt-16">
        <Container>
          <div className="rounded-[18px] border border-[#e5eaef] bg-white p-8 shadow-[0_12px_28px_rgba(15,23,42,0.05)] sm:p-10">
            <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {pickLocalized(locale, "Musteri Yorumlari", "Guest Reviews")}
            </h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.name}
                  className="rounded-[14px] border border-[#e8edf2] bg-[#fbfcfd] p-6"
                >
                  <p className="text-sm leading-7 text-slate-600">{item.text}</p>
                  <p className="mt-5 text-sm font-semibold text-slate-900">{item.name}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
