import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { blogPreview, campaignCards, faqItems } from "@/lib/site-data";
import { formatCurrency, getFeaturedVillaCatalog } from "@/lib/villa-catalog";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const metadata: Metadata = {
  title: "Ana Sayfa",
  description:
    "Kategori, lokasyon ve quick search odakli villa kiralama vitrini. Secili villalari inceleyin ve talep olusturun.",
  keywords: [
    "villa kiralama",
    "ozel havuzlu villa",
    "balayi villasi",
    "kalkan villa kiralama",
    "bodrum villa",
    "fethiye villa",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VillaVera | Villa Kiralama Koleksiyonu",
    description:
      "Quick search, kategori bazli kesif ve lokasyon landing mantigi ile hazirlanan villa kiralama vitrini.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

const holidayTypes = [
  {
    title: "Balayi Villalari",
    text: "Romantik, daha sakin ve daha ozel bir tatil arayan ciftler icin hazirlandi.",
    accent: "Balayi",
  },
  {
    title: "Merkeze Yakin Villalar",
    text: "Arabasiz hareket etmek isteyenler icin sahile ve merkeze daha yakin secenekler.",
    accent: "Merkezi Konum",
  },
  {
    title: "Denize Yakin Villalar",
    text: "Yazlik ritmini daha hizli yasamak isteyenler icin denize kolay ulasimli villalar.",
    accent: "Denize Yakin",
  },
  {
    title: "Deniz Manzarali Villalar",
    text: "Kahvaltidan gun batimina kadar manzarayi tatilin merkezine koyan secimler.",
    accent: "Deniz Manzarali",
  },
  {
    title: "Ozel Havuzlu Villalar",
    text: "Kalabaliklardan uzak, havuz deneyimini tamamen kendine ait yasamak isteyenler icin.",
    accent: "Ozel Havuz",
  },
  {
    title: "Korunakli Villalar",
    text: "Mahremiyet ve daha kontrollu bir konaklama deneyimi arayan misafirler icin.",
    accent: "Korunakli",
  },
  {
    title: "Servisli Villalar",
    text: "Temizlik, destek ve daha konforlu uzun konaklama akislari isteyenlere uygun.",
    accent: "Servisli",
  },
  {
    title: "Jakuzili Villalar",
    text: "Daha keyifli, daha ozel ve daha premium bir deneyim isteyenler icin secildi.",
    accent: "Jakuzili",
  },
];

function buildLocationCollections(villas: Awaited<ReturnType<typeof getDemoVillas>>) {
  const grouped = new Map<string, typeof villas>();

  villas.forEach((villa) => {
    const key = villa.district;
    const list = grouped.get(key) ?? [];
    list.push(villa);
    grouped.set(key, list);
  });

  return Array.from(grouped.entries())
    .map(([district, items]) => ({
      district,
      city: items[0]?.city ?? "",
      averagePrice: formatCurrency(
        Math.round(
          items.reduce((sum, item) => sum + (item.discountedNightlyPrice ?? item.nightlyPrice), 0) /
            items.length,
        ),
      ),
      villas: items.slice(0, 3),
    }))
    .slice(0, 3);
}

export default async function HomePage() {
  const company = await getCurrentPublicCompany();
  const villas = await getDemoVillas({ companyId: company.id });
  const featuredVillas = getFeaturedVillaCatalog(villas);
  const heroVilla = featuredVillas[0] ?? villas[0];
  const secondaryVillas = (featuredVillas.length > 0 ? featuredVillas : villas).slice(1, 4);
  const locationCollections = buildLocationCollections(villas);
  const exclusiveVillas = villas.filter((villa) => villa.featured).slice(0, 6);
  const longStayVillas = [...villas]
    .sort((a, b) => (a.minNightCount ?? 0) - (b.minNightCount ?? 0))
    .slice(0, 3);

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

      <section className="pt-10 sm:pt-12">
        <Container>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-black/6 bg-slate-900 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-35"
                style={{
                  backgroundImage: heroVilla?.coverImageUrl ? `url(${heroVilla.coverImageUrl})` : undefined,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
              <div className="relative z-10 px-7 py-8 sm:px-9 sm:py-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-coral)]">
                  {company.shortName} Exclusive Villas
                </p>
                <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
                  Ayricalikli villa deneyimi secili koleksiyonlarla burada.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/74">
                  {company.heroDescription} Kategori mantigi, lokasyon odagi ve panel destekli
                  fiyat akisi sayesinde hem guven hem de kesif hissi bir arada ilerler.
                </p>

                {heroVilla ? (
                  <div className="mt-8 max-w-md rounded-[1.4rem] bg-white/10 p-5 backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                      One cikan villa
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">
                      {heroVilla.title}
                    </h2>
                    <p className="mt-2 text-sm text-white/72">{heroVilla.locationLabel}</p>
                    <p className="mt-4 text-sm leading-7 text-white/74">{heroVilla.shortDescription}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/villalar/${heroVilla.slug}`}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                      >
                        Detaylari incele
                      </Link>
                      <Link
                        href="/villalar"
                        className="rounded-full border border-white/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/28"
                      >
                        Tum villalar
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-coral)]">
                  Quick Search
                </p>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Villa tipi", "Villa", "bg-white"],
                    ["Nereye", "Ulke / Bolge / Tatil beldesi", "bg-[var(--color-slate-soft)]"],
                    ["Giris tarihi", "Tarih sec", "bg-[var(--color-slate-soft)]"],
                    ["Cikis tarihi", "Tarih sec", "bg-[var(--color-slate-soft)]"],
                    ["Misafir", "Kisi sayisi", "bg-[var(--color-slate-soft)]"],
                  ].map(([label, value, surface]) => (
                    <div key={label} className={`rounded-[1rem] border border-black/6 px-4 py-3 ${surface}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}

                  <Link
                    href="/villalar"
                    className="inline-flex items-center justify-center rounded-[1rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Search
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {secondaryVillas.map((villa) => (
                  <Link
                    key={villa.id}
                    href={`/villalar/${villa.slug}`}
                    className="overflow-hidden rounded-[1.6rem] border border-black/6 bg-white shadow-[0_14px_28px_rgba(15,23,42,0.05)]"
                  >
                    <div
                      className="aspect-[1.2/0.92] bg-cover bg-center"
                      style={{
                        backgroundImage: villa.coverImageUrl ? `url(${villa.coverImageUrl})` : undefined,
                      }}
                    />
                    <div className="p-4">
                      <p className="text-sm font-semibold text-slate-950">{villa.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{villa.locationLabel}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-18">
        <Container>
          <SectionHeading
            eyebrow="Tatil Tarzin Hangisi?"
            title="Kategori bazli secimle dogru villaya daha hizli ulasilir"
            description="Bu alan daha katalog mantikli sitelerde kullanicinin niyetini hizla anlamaya yardim eder. Biz de ayni mantigi daha temiz bir grid duzeniyle kuruyoruz."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {holidayTypes.map((item) => (
              <Link
                key={item.title}
                href="/villalar"
                className="rounded-[1.7rem] border border-black/6 bg-white p-6 shadow-[0_14px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                  {item.accent}
                </p>
                <h3 className="mt-4 font-display text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          {locationCollections.map((collection) => (
            <div key={collection.district} className="mb-16 last:mb-0">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                    Popular {collection.district} Homes
                  </p>
                  <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {collection.city} / {collection.district}
                  </h2>
                  <p className="mt-3 text-sm text-slate-600">
                    Ortalama fiyat {collection.averagePrice} · panelden yonetilen secili portfoy
                  </p>
                </div>
                <Link href="/villalar" className="text-sm font-semibold text-slate-950">
                  Tumunu incele
                </Link>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {collection.villas.map((villa) => (
                  <PublicVillaCard key={villa.id} villa={villa} compact />
                ))}
              </div>
            </div>
          ))}
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                {company.shortName} Exclusive
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                Ozel olarak one cikarilan villalar
              </h2>
            </div>
            <Link href="/villalar" className="text-sm font-semibold text-slate-950">
              Tum portfoy
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {exclusiveVillas.map((villa) => (
              <PublicVillaCard key={villa.id} villa={villa} compact />
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
              <SectionHeading
                eyebrow="Uzun Donem Konaklamalar"
                title="Aylik ya da sezonluk kiralama dusunenler icin secili villalar"
                description="Daha sakin, daha planli ve daha operasyon odakli konaklama arayanlar icin bu blok landing mantigini destekler."
              />

              <div className="mt-8 grid gap-4">
                {longStayVillas.map((villa) => (
                  <Link
                    key={villa.id}
                    href={`/villalar/${villa.slug}`}
                    className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-4 transition hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{villa.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{villa.locationLabel}</p>
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-950">
                          {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
                        </span>{" "}
                        / gece
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
              <SectionHeading
                eyebrow="Kampanyalar"
                title="Panelde tanimlanan firsatlar vitrinde net sekilde gorunur"
                description="Eski fiyat ustu cizili, yeni fiyat vurgulu. Kupon ve donemsel kampanya mantigi ilk bakista anlasilir."
              />

              <div className="mt-8 grid gap-4">
                {campaignCards.map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] bg-[var(--color-coral-soft)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                      {item.value}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
              <SectionHeading
                eyebrow="Sik Sorulan Sorular"
                title="Guven katmani ve SEO destegi"
                description="Bilgi veren, guven olusturan ve arama niyetini karsilayan bir soru-cevap yapisi."
              />

              <div className="mt-8 space-y-4">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-[1.3rem] bg-[var(--color-slate-soft)] p-5">
                    <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
              <SectionHeading
                eyebrow="Blog ve Rehber"
                title="Reklam olmadan buyume icin icerik merkezi"
                description="Bolge, kategori ve tatil tipine gore uretilecek icerikler listeleme ve detay sayfalarini destekler."
              />

              <div className="mt-8 space-y-4">
                {blogPreview.map((post) => (
                  <div key={post.title} className="rounded-[1.3rem] border border-black/6 bg-white p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                      {post.category}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-950">{post.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Kategori sayfalari ve lokasyon landing bloklariyla birlikte organik kesfi
                      guclendiren editoryal alan.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
