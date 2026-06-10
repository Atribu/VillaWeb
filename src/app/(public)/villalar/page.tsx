import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PublicVillaCard } from "@/components/villas/public-villa-card";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCompanyHeroImage } from "@/lib/public-gallery";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

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

export default async function VillasPage() {
  const locale = await getCurrentLocale();
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
  const heroImage = getCompanyHeroImage(company.slug, villaCatalog[0]?.coverImageUrl);

  return (
    <Container className="py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(villaListJsonLd) }}
      />

      <PublicPageHero
        eyebrow={pickLocalized(locale, "Villa Koleksiyonu", "Villa Collection")}
        title={pickLocalized(
          locale,
          `${company.shortName} icin secili villa portfoyu`,
          `Selected villa portfolio for ${company.shortName}`,
        )}
        description={pickLocalized(
          locale,
          "Lokasyon, kapasite ve tatil tipine gore daha hizli karar verilebilen, sade ve guven veren bir listeleme deneyimi.",
          "A simpler, more reassuring listing experience where decisions can be made faster by location, capacity and holiday type.",
        )}
        backgroundImage={heroImage}
        actions={[
          {
            href: getDemoCompanySiteHref(company.slug, "/talep"),
            label: pickLocalized(locale, "Talep akisina git", "Go to inquiry flow"),
          },
          {
            href: getDemoCompanySiteHref(company.slug, "/iletisim"),
            label: pickLocalized(locale, "Danisman ile gorus", "Talk to an advisor"),
            variant: "secondary",
          },
        ]}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-wrap gap-3">
            {districtChips.map((chip) => (
              <span
                key={chip}
                className="rounded-[999px] border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur"
              >
                {chip}
              </span>
            ))}
            {categoryChips.map((chip) => (
              <span
                key={chip}
                className="rounded-[999px] border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [pickLocalized(locale, "Sonuc", "Results"), `${villaCatalog.length} ${pickLocalized(locale, "villa", "villas")}`],
              [
                pickLocalized(locale, "Model", "Model"),
                pickLocalized(locale, "Tarih secimi detay sayfasinda", "Date selection on the detail page"),
              ],
              [pickLocalized(locale, "Akis", "Flow"), pickLocalized(locale, "Talep odakli devam", "Inquiry-led journey")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[12px] border border-white/14 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicPageHero>

      <section className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {villaCatalog.map((villa) => (
          <PublicVillaCard key={villa.id} villa={villa} compact locale={locale} />
        ))}
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[14px] border border-black/6 bg-white p-8 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
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
            <p className="text-sm leading-8 text-slate-600">
              {pickLocalized(
                locale,
                "Villa listeleme sayfasi; Kalkan villa kiralama, Fethiye aile villasi veya Bodrum luks villa gibi arama niyetlerini destekleyen metin alanlariyla guclendirilir. Bu alanlar sayfaya daha derin bir SEO tabani kazandirir.",
                "The villa listing page is strengthened with content blocks that support search intent such as Kalkan villa rental, family villas in Fethiye or luxury villas in Bodrum. These sections create a deeper SEO foundation for the page.",
              )}
            </p>
            <p className="text-sm leading-8 text-slate-600">
              {pickLocalized(
                locale,
                "Her villa kendi detay sayfasina baglanir; detay sayfasi ise takvim, talep akisi, fiyat, galeri ve yapilandirilmis veri ile derinlesir. Boylece listeleme sadece gecis noktasi degil, guclu bir landing sayfasina donusur.",
                "Each villa links to its own detail page, where calendar, inquiry flow, pricing, gallery and structured data create more depth. This turns the listing into more than a transition point; it becomes a strong landing page.",
              )}
            </p>
          </div>
        </div>

        <div className="rounded-[14px] bg-slate-900 p-8 text-white shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-coral)]">
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
              className="rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
            >
              {pickLocalized(locale, "Danisman ile gorus", "Talk to an advisor")}
            </Link>
            <Link
              href="/kampanyalar"
              className="rounded-[10px] border border-white/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/28"
            >
              {pickLocalized(locale, "Kampanyalari gor", "View campaigns")}
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
