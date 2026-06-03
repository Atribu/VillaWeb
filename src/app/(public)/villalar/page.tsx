import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const metadata: Metadata = {
  title: "Villalar",
  description:
    "Lokasyon, kategori ve tatil tipine gore kesfedilebilen villa koleksiyonunu inceleyin.",
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
  const company = await getCurrentPublicCompany();
  const villaCatalog = await getDemoVillas({ companyId: company.id });

  const villaListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${company.shortName} Villa Koleksiyonu`,
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

      <section className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_14px_28px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[1.7rem] bg-slate-900 px-6 py-7 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-coral)]">
              Villa Koleksiyonu
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.05em] text-balance">
              {company.shortName} icin secili villa portfoyu
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-white/72">
              Bu sayfa kategori hissi veren chip yapisi, yogun katalog duzeni ve detay sayfasina
              hizli gecis mantigiyla daha fazla secenek gostermeye odaklanir.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Sonuc", `${villaCatalog.length} villa`],
                ["Model", "Tarih secimi detay sayfasinda"],
                ["Akis", "Talep odakli devam"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.1rem] bg-white/8 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.6rem] border border-black/6 bg-[var(--color-slate-soft)] p-4">
              <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
                <div className="rounded-[1rem] bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Arama Onerisi
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Villa tipi, lokasyon ve tarih bilgisiyle detay sayfasina hizla yonlen.
                  </p>
                </div>
                <div className="rounded-[1rem] bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Sonuc
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {villaCatalog.length} villa listeleniyor
                  </p>
                </div>
                <Link
                  href="/talep"
                  className="inline-flex items-center justify-center rounded-[1rem] bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Talep Akisina Git
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
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
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {villaCatalog.map((villa) => (
          <PublicVillaCard key={villa.id} villa={villa} compact />
        ))}
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
          <SectionHeading
            eyebrow="Listeleme SEO Alani"
            title="Liste sayfasi sadece kartlardan olusmaz; arama niyetini de tasir"
            description="Lokasyon ve kategori bazli arayan kullanicilar, kartlarin altinda dogru baglamsal metinleri ve ic linkleri de gormelidir."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <p className="text-sm leading-8 text-slate-600">
              Villa listeleme sayfasi; Kalkan villa kiralama, Fethiye aile villasi veya Bodrum
              luks villa gibi arama niyetlerini destekleyen metin alanlariyla guclendirilir. Bu
              alanlar sayfaya daha derin bir SEO tabani kazandirir.
            </p>
            <p className="text-sm leading-8 text-slate-600">
              Her villa kendi detay sayfasina baglanir; detay sayfasi ise takvim, talep akisi,
              fiyat, galeri ve yapilandirilmis veri ile derinlesir. Boylece listeleme sadece
              gecis noktasi degil, guclu bir landing sayfasina donusur.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
            Ozel danisman
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-balance">
            Uygun villayi birlikte daha hizli netlestirebiliriz.
          </h2>
          <p className="mt-5 text-sm leading-8 text-white/72">
            Balayi, cekirdek aile, genis grup ya da uzun donem konaklama. Listeleme mantigi bu
            niyeti gostermeye yardim eder; danisman akisi kalan soru isaretlerini kapatir.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/iletisim"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              Danisman ile gorus
            </Link>
            <Link
              href="/kampanyalar"
              className="rounded-full border border-white/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/28"
            >
              Kampanyalari gor
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
