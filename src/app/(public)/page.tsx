import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { blogPreview, campaignCards, categoryHighlights, faqItems } from "@/lib/site-data";
import {
  formatCurrency,
  getFeaturedVillaCatalog,
  getVillaQuickStats,
} from "@/lib/villa-catalog";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const metadata: Metadata = {
  title: "Ana Sayfa",
  description:
    "Modern, SEO odakli villa kiralama vitrini. Tarih secin, premium villalari inceleyin ve talep olusturun.",
  keywords: [
    "villa kiralama",
    "luks villa",
    "kalkan villa kiralama",
    "fethiye villa",
    "bodrum villa",
    "tatil villasi",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VillaVera | Modern Villa Kiralama Deneyimi",
    description:
      "Modern tasarim, SEO odakli icerik ve panel destekli talep akisiyla premium villa vitrini.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const villas = await getDemoVillas();
  const featuredVillas = getFeaturedVillaCatalog(villas);
  const quickStats = getVillaQuickStats(villas);

  const destinationHighlights = Array.from(
    villas.reduce((map, villa) => {
      const key = `${villa.district}-${villa.city}`;
      const current = map.get(key) ?? {
        district: villa.district,
        city: villa.city,
        villaCount: 0,
        totalPrice: 0,
      };

      current.villaCount += 1;
      current.totalPrice += villa.discountedNightlyPrice ?? villa.nightlyPrice;
      map.set(key, current);

      return map;
    }, new Map<string, { district: string; city: string; villaCount: number; totalPrice: number }>()),
  )
    .map(([, item]) => ({
      ...item,
      averagePrice: formatCurrency(Math.round(item.totalPrice / item.villaCount)),
    }))
    .slice(0, 4);

  const heroVillas = featuredVillas.slice(0, 3);

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

      <section className="pt-10 sm:pt-14">
        <Container>
          <div className="overflow-hidden rounded-[2.5rem] border border-black/6 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-coral)]">
                  SEO Odakli Villa Koleksiyonu
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Akici ve modern bir arayuzle, kurumsal guven veren villa kiralama deneyimi.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  VillaVera; premium vitrin, tarih secimli talep akisi ve panel destekli fiyat
                  yonetimiyle reklam olmadan buyumeye uygun, modern bir villa kiralama deneyimi
                  sunar.
                </p>

                <div className="mt-8 rounded-[1.8rem] border border-black/6 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                    {[
                      ["Bolge", "Kalkan, Fethiye, Bodrum"],
                      ["Tarih", "Giris ve cikis sec"],
                      ["Misafir", "2 kisiden 12 kisiye"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[1.25rem] border border-slate-100 bg-[var(--color-slate-soft)] px-4 py-4"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}

                    <Link
                      href="/villalar"
                      className="inline-flex items-center justify-center rounded-[1.25rem] bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Villalari Kesfet
                    </Link>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {quickStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-full border border-black/6 bg-[var(--color-slate-soft)] px-4 py-2.5"
                    >
                      <span className="text-sm font-semibold text-slate-900">{stat.value}</span>
                      <span className="ml-2 text-sm text-slate-500">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-[2rem] bg-slate-100">
                  <div
                    className="aspect-[0.92/1] h-full w-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${heroVillas[0]?.coverImageUrl ?? ""})`,
                    }}
                  />
                </div>

                <div className="grid gap-4">
                  {heroVillas.slice(1).map((villa) => (
                    <div key={villa.id} className="overflow-hidden rounded-[2rem] bg-slate-100">
                      <div
                        className="aspect-[1.05/0.92] h-full w-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${villa.coverImageUrl ?? ""})`,
                        }}
                      />
                    </div>
                  ))}

                  <div className="rounded-[2rem] bg-[var(--color-coral-soft)] p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
                      Talep Odakli Deneyim
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">
                      Kullanici once villayi inceler, sonra tarihe gore talep gonderir.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Rezervasyon penceresi, panelde yonetilen doluluk takvimi ve kampanya mantigi
                      ile birlikte calisir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <SectionHeading
            eyebrow="One Cikan Villalar"
            title="Misafir kararini hizlandiran modern villa kartlari"
            description="Lokasyon, fiyat, kapasite ve guven olusturan detaylar ayni kartta sunulur. Her kart SEO destekli detay sayfasina baglanir."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredVillas.map((villa) => (
              <PublicVillaCard key={villa.id} villa={villa} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <SectionHeading
            eyebrow="Populer Bolgeler"
            title="Konuma gore kesfedilen, organik trafik ureten landing yapisi"
            description="Bolgeler, hem kullanicinin aradigi villaya hizla ulasmasini hem de arama motorlarinda lokasyon bazli gorunurluk kazanmayi destekler."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {destinationHighlights.map((item) => (
              <div
                key={`${item.district}-${item.city}`}
                className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                  {item.city}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">{item.district}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.villaCount} aktif villa, ortalama {item.averagePrice} gecelik fiyat
                  araligiyla kesfediliyor.
                </p>
                <Link
                  href="/villalar"
                  className="mt-5 inline-flex text-sm font-semibold text-slate-900 transition hover:text-[var(--color-coral)]"
                >
                  Bu bolgedeki villalari incele
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-200">
                Neden VillaVera
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight">
                Modern tasarim sadeligini, kurumsal operasyon gucuyle birlestiren sistem.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Personel panelden villa ekler, admin fiyat ve uygunlugu yonetir, public taraf ise
                sade ama ikna edici bir deneyim sunar.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {categoryHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                >
                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <SectionHeading
                eyebrow="Kampanyalar"
                title="Panelde tanimlanan indirimler vitrinde net sekilde gorunur"
                description="Eski fiyat ustu cizili, yeni fiyat vurgulu. Kupon ve donemsel kampanya mantigi ilk bakista anlatilir."
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {campaignCards.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                    {item.value}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <SectionHeading
                eyebrow="Sik Sorulan Sorular"
                title="SEO'yu destekleyen guven katmani"
                description="Sadece bilgi vermek icin degil, kullanici niyetini ve Google aramalarini karsilamak icin hazirlanan SSS alanlari."
              />

              <div className="mt-8 space-y-4">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-[1.3rem] bg-[var(--color-slate-soft)] p-5">
                    <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <SectionHeading
                eyebrow="Blog ve Rehber"
                title="Reklam olmadan buyumeyi destekleyen icerik merkezi"
                description="Bolge ve tatil odakli icerikler, siteyi sadece vitrinden cikartip organik bir trafik makinesine donusturur."
              />

              <div className="mt-8 space-y-4">
                {blogPreview.map((post) => (
                  <div key={post.title} className="rounded-[1.3rem] border border-black/6 bg-white p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                      {post.category}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{post.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Blog yazilari, bolge sayfalari ve villa detaylariyla birbirine baglanarak
                      kullaniciyi uzun sure sitede tutar.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pt-20">
        <Container>
          <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <SectionHeading
              eyebrow="SEO Editoryal Alan"
              title="Her sayfanin altinda arama niyetini karsilayan guclu bir icerik katmani olacak"
              description="Modern tasarim ile SEO arasinda tercih yapmiyoruz. Ustte hizli karar verdiren kartlar, altta ise detayli metin, bolge anlatimi ve ic linkleme bulunuyor."
            />

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <p className="text-sm leading-8 text-slate-600">
                VillaVera; Kalkan, Fethiye, Kas ve Bodrum gibi lokasyonlarda ozel havuzlu,
                muhafazakar, balayi ve genis aile villalarini tek vitrinde toplar. Her detay
                sayfasinda benzersiz baslik, meta aciklama, odak anahtar kelime, gorsel alt metni
                ve yapilandirilmis veri kullanilir.
              </p>
              <p className="text-sm leading-8 text-slate-600">
                Boylece site yalnizca guzel gorunen bir katalog olmaz; ayni zamanda organik
                aramalarda bulunabilir, guven veren ve donusum uretebilen bir kiralama platformuna
                donusur. Panel tarafinda yapilan fiyat, kupon ve doluluk degisiklikleri de bu
                vitrinin kalbini besler.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
