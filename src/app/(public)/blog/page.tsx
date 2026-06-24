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
            className="serene-card p-6"
          >
            <p className="serene-eyebrow">
              {post.category}
            </p>
            <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-[var(--serene-on-surface)]">{post.title}</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--serene-on-surface-variant)]">
              {pickLocalized(
                locale,
                "Arama motorlarindan trafik cekecek, detay sayfalarina ic link verecek ve kullaniciyi karar asamasina tasiyacak uzun formlu rehber icerik iskeleti.",
                "A long-form guide content structure designed to attract search traffic, connect to detail pages and move the user toward a decision.",
              )}
            </p>
          </article>
        ))}
      </div>

      <div className="serene-card mt-10 p-8">
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
            <div key={item} className="rounded-[16px] border border-[var(--serene-outline-variant)]/60 bg-[var(--serene-surface-low)] px-5 py-5 text-sm font-semibold text-[var(--serene-on-surface)]">
              {item}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
