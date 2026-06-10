import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCampaignCards } from "@/lib/site-data";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCompanyHeroImage } from "@/lib/public-gallery";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "Kampanyalar", en: "Campaigns" },
    description: {
      tr: "Secili villalara uygulanan zaman bazli indirimleri, kampanyalari ve kupon kurgularini inceleyin.",
      en: "Review time-based discounts, campaigns and coupon logic applied to selected villas.",
    },
    canonical: "/kampanyalar",
  });
}

export default async function CampaignsPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const heroImage = getCompanyHeroImage(company.slug);
  const campaignCards = getCampaignCards(locale);

  return (
    <Container className="py-14 sm:py-16">
      <PublicPageHero
        eyebrow={pickLocalized(locale, "Aktif Kampanyalar", "Active Campaigns")}
        title={pickLocalized(
          locale,
          "Eski fiyat, yeni fiyat ve kampanya avantaji ayni vitrinde net sekilde gorunur",
          "Original price, current price and campaign advantage are shown together with clarity",
        )}
        description={pickLocalized(
          locale,
          "Indirimli fiyatlar, kupon kodlari ve donemsel avantajlar kullanicinin karar hizini artiracak sekilde acik ve guven veren bir dille sunulur.",
          "Discounted pricing, coupon codes and seasonal advantages are presented in a clear, confidence-building way that speeds up decisions.",
        )}
        backgroundImage={heroImage}
        actions={[
          {
            href: getDemoCompanySiteHref(company.slug, "/villalar"),
            label: pickLocalized(locale, "Villalari incele", "Browse villas"),
          },
          {
            href: getDemoCompanySiteHref(company.slug, "/talep"),
            label: pickLocalized(locale, "Talep olustur", "Create inquiry"),
            variant: "secondary",
          },
        ]}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {campaignCards.map((item) => (
          <div
            key={item.title}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              {item.value}
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[16px] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow={pickLocalized(locale, "SEO ve Donusum", "SEO & Conversion")}
          title={pickLocalized(
            locale,
            "Kampanya sayfasi sadece fiyat avantaji gostermek icin degil, organik trafik toplamak icin de kullanilir",
            "A campaign page is not only for pricing advantage, it also helps capture organic traffic",
          )}
          description={pickLocalized(
            locale,
            "Mevsimsel indirimler, uzun konaklama firsatlari ve kupon sayfalari dogru baslik ve icerik yapisiyla organik aramalarda guclu landing sayfalarina donusebilir.",
            "Seasonal discounts, long-stay opportunities and coupon pages can become strong landing pages in organic search with the right headings and content structure.",
          )}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <p className="text-sm leading-8 text-slate-600">
            {pickLocalized(
              locale,
              "Erken rezervasyon, uzun konaklama ve kupon kampanyalari kullanicinin kararini hizlandirir. Fiyat avantajlari public tarafta net sekilde gorundugunde, kullanici guvenli hissettigi bir secim ortaminda ilerler.",
              "Early booking, long-stay and coupon campaigns accelerate user decisions. When pricing advantages are clearly shown on the public side, users move forward in a more confident decision environment.",
            )}
          </p>
          <p className="text-sm leading-8 text-slate-600">
            {pickLocalized(
              locale,
              "Kampanya icerikleri SEO icin de degerlidir. “Kalkan erken rezervasyon villa indirimi” gibi niyet bazli aramalar icin bu sayfa zamanla daha da guclu bir giris noktasi haline gelebilir.",
              "Campaign content is valuable for SEO as well. For intent-based searches such as 'Kalkan early booking villa discount', this page can become an even stronger entry point over time.",
            )}
          </p>
        </div>
      </div>
    </Container>
  );
}
