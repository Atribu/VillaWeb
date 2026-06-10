import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBlogPreview } from "@/lib/site-data";
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
    title: { tr: "Blog", en: "Blog" },
    description: {
      tr: "Bolge rehberleri, villa secim ipuclari ve organik buyume odakli tatil icerikleri.",
      en: "Destination guides, villa selection tips and travel content built for organic growth.",
    },
    canonical: "/blog",
  });
}

export default async function BlogPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const heroImage = getCompanyHeroImage(company.slug);
  const blogPreview = getBlogPreview(locale);

  return (
    <Container className="py-14 sm:py-16">
      <PublicPageHero
        eyebrow={pickLocalized(locale, "Blog ve Rehber", "Blog & Guides")}
        title={pickLocalized(
          locale,
          "Organik trafik ureten, guven ve karar kalitesini artiran icerik merkezi",
          "A content hub that drives organic traffic and improves trust and decision quality",
        )}
        description={pickLocalized(
          locale,
          "Blog modulu; bolge rehberleri, tatil planlama icerikleri ve villa secim tavsiyeleriyle sitenin SEO omurgasini besleyen ana alanlardan biridir.",
          "The blog module is one of the main areas that feeds the SEO foundation of the site with destination guides, travel planning content and villa selection advice.",
        )}
        backgroundImage={heroImage}
        actions={[
          { href: getDemoCompanySiteHref(company.slug, "/villalar"), label: pickLocalized(locale, "Villalari incele", "Browse villas") },
          { href: getDemoCompanySiteHref(company.slug, "/kampanyalar"), label: pickLocalized(locale, "Kampanyalari gor", "View campaigns"), variant: "secondary" },
        ]}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {blogPreview.map((post) => (
          <article
            key={post.title}
            className="rounded-[16px] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              {post.category}
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-slate-900">{post.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {pickLocalized(
                locale,
                "Arama motorlarindan trafik cekecek, detay sayfalarina ic link verecek ve kullaniciyi karar asamasina tasiyacak uzun formlu rehber icerik iskeleti.",
                "A long-form guide content structure designed to attract search traffic, connect to detail pages and move the user toward a decision.",
              )}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-[16px] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <SectionHeading
          eyebrow={pickLocalized(locale, "Editoryal Omurga", "Editorial Structure")}
          title={pickLocalized(
            locale,
            "Her yazı bir sonraki sayfaya trafik tasiyacak sekilde planlanir",
            "Every article is planned to pass traffic to the next relevant page",
          )}
          description={pickLocalized(
            locale,
            "Blog icerikleri; bolge sayfalari, villa detaylari ve kampanya sayfalariyla birbirine baglanarak sitede guclu bir ic link yapisi kurar.",
            "Blog content links region pages, villa details and campaign pages together to create a strong internal linking structure.",
          )}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            pickLocalized(locale, "Bolge rehberleri", "Destination guides"),
            pickLocalized(locale, "Villa secim kilavuzlari", "Villa selection guides"),
            pickLocalized(locale, "Mevsimsel tatil icerikleri", "Seasonal travel content"),
          ].map((item) => (
            <div key={item} className="rounded-[1.3rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
