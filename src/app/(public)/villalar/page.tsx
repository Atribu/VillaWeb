import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const metadata: Metadata = {
  title: "Villalar",
  description:
    "Bolge, fiyat, kapasite ve havuz tipine gore modern kart yapisiyla listelenen premium villa koleksiyonunu inceleyin.",
  keywords: [
    "villa kiralama",
    "kalkan villa",
    "fethiye villa",
    "bodrum villa",
    "ozel havuzlu villa",
  ],
  alternates: {
    canonical: "/villalar",
  },
};

export const dynamic = "force-dynamic";

export default async function VillasPage() {
  const villaCatalog = await getDemoVillas();

  const villaListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "VillaVera Villa Koleksiyonu",
    itemListElement: villaCatalog.map((villa, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: villa.title,
      url: `https://villaweb.example/villalar/${villa.slug}`,
      description: villa.seoDescription,
    })),
  };

  const districtChips = Array.from(new Set(villaCatalog.map((villa) => villa.district))).slice(0, 6);
  const categoryChips = Array.from(new Set(villaCatalog.map((villa) => villa.category))).slice(0, 4);

  return (
    <Container className="py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(villaListJsonLd) }}
      />

      <div className="rounded-[2.3rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <SectionHeading
          eyebrow="Villa Koleksiyonu"
          title="Temiz listeleme, SEO destekli guclu detay yapisi"
          description="Filtre hissi veren chip alanlari, premium kart tasarimi ve konuma gore karar vermeyi kolaylastiran kurgu ile modern bir listeleme deneyimi."
        />

        <div className="mt-8 rounded-[1.6rem] border border-black/6 bg-[var(--color-slate-soft)] p-4">
          <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_auto]">
            <div className="rounded-[1.1rem] bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Arama Onerisi
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Bolge ve tarih secimi villa detay sayfasinda, takvim destekli olarak tamamlanir.
              </p>
            </div>
            <div className="rounded-[1.1rem] bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Sonuc
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {villaCatalog.length} villa listeleniyor
              </p>
            </div>
            <Link
              href="/talep"
              className="inline-flex items-center justify-center rounded-[1.1rem] bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Talep Akisina Git
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {districtChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              {chip}
            </span>
          ))}
          {categoryChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-[var(--color-coral-soft)] px-4 py-2 text-sm font-medium text-[var(--color-coral)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {villaCatalog.map((villa) => (
          <PublicVillaCard key={villa.id} villa={villa} compact />
        ))}
      </div>

      <div className="mt-14 rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow="Listeleme SEO Alani"
          title="Liste sayfasi sadece kartlardan olusmaz; arama niyetini karsilayan icerik de tasir"
          description="Bolge bazli villa arayan kullanicilar, kartlarin altinda lokasyon aciklamalari, kategori metinleri ve detay sayfalarina uzanan ic linklerle daha guclu bir deneyim yasar."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <p className="text-sm leading-8 text-slate-600">
            Villa listeleme sayfasi; Kalkan villa kiralama, Fethiye aile villasi, Bodrum luks villa
            gibi arama niyetlerini destekleyen metin alanlariyla guclendirilir. Bu alanlar sayesinde
            sayfa hem modern bir katalog gibi gorunur hem de organik trafikten pay alir.
          </p>
          <p className="text-sm leading-8 text-slate-600">
            Her villa kendi detay sayfasina baglanir; detay sayfalari ise takvim, talep akisi,
            fiyat, galeri ve yapilandirilmis veri ile donatilir. Boylece listeleme yalnizca gecis
            noktasi degil, ayni zamanda organik performansi yuksek bir landing sayfasi olur.
          </p>
        </div>
      </div>
    </Container>
  );
}
