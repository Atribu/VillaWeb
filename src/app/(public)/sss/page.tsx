import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getFaqItems } from "@/lib/site-data";
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
    title: { tr: "SSS", en: "FAQ" },
    description: {
      tr: "Villa kiralama sureci, kampanyalar ve talep yonetimi hakkinda sik sorulan sorular.",
      en: "Frequently asked questions about the villa rental flow, campaigns and inquiry management.",
    },
    canonical: "/sss",
  });
}

export default async function FaqPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const heroImage = getCompanyHeroImage(company.slug);
  const faqItems = getFaqItems(locale);

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
    <Container className="py-14 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PublicPageHero
        eyebrow={pickLocalized(locale, "Sik Sorulan Sorular", "Frequently Asked Questions")}
        title={pickLocalized(
          locale,
          "Donusumu artiran ve SEO'yu destekleyen guven merkezi",
          "A trust center that increases conversions and supports SEO",
        )}
        description={pickLocalized(
          locale,
          "Bu sayfa kullanicinin aklindaki kritik sorulari hizli sekilde cevaplar. Ayni zamanda yapilandirilmis veriyle arama motorlarina da guclu sinyal gonderir.",
          "This page answers key questions quickly and also sends a strong signal to search engines through structured data.",
        )}
        backgroundImage={heroImage}
        actions={[
          { href: getDemoCompanySiteHref(company.slug, "/talep"), label: pickLocalized(locale, "Talep olustur", "Create inquiry") },
          { href: getDemoCompanySiteHref(company.slug, "/iletisim"), label: pickLocalized(locale, "Iletisime gec", "Get in touch"), variant: "secondary" },
        ]}
      />

      <div className="mt-10 space-y-4">
        {faqItems.map((item) => (
          <article
            key={item.question}
            className="rounded-[16px] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-xl font-semibold text-slate-900">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-[16px] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow={pickLocalized(locale, "SSS ve SEO", "FAQ & SEO")}
          title={pickLocalized(
            locale,
            "Bu alan sadece bilgilendirme degil, organik gorunurluk icin de kritik",
            "This area is not only informative; it is also critical for organic visibility",
          )}
          description={pickLocalized(
            locale,
            "Kullanici niyeti yuksek sorularin duzenli sekilde yanitlanmasi; hem destek yuku azaltir hem de sayfalarin arama sonuclarinda daha anlamli gorunmesini saglar.",
            "Answering high-intent questions consistently reduces support load and helps pages appear more meaningfully in search results.",
          )}
        />
      </div>
    </Container>
  );
}
