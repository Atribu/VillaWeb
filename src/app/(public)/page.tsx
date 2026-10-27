import type { Metadata } from "next";
import { TemplateHome } from "@/components/site-templates/template-home";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicSiteTemplate } from "@/lib/server/public-site-template";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const { company } = await getCurrentPublicSiteTemplate();
  return buildPublicMetadata({
    locale,
    title: { tr: `${company.shortName} | Villa Kiralama`, en: `${company.shortName} | Villa Rentals` },
    description: {
      tr: `${company.shortName} villa koleksiyonunu keşfedin. Konum, misafir sayısı ve tarihlerinize göre villaları inceleyin, tatilinizi planlayın.`,
      en: `Explore the ${company.shortName} villa collection. Find a villa by destination, guest count and your travel dates, and plan your next stay.`,
    },
    keywords: { tr: ["villa kiralama", "özel havuzlu villa", "tatil villası"], en: ["villa rental", "private pool villa", "holiday villas"] },
    canonical: "/",
    openGraphTitle: { tr: `${company.shortName} | Villa Kiralama`, en: `${company.shortName} | Villa Rentals` },
  });
}

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const { company, themeKey } = await getCurrentPublicSiteTemplate();
  const villas = await getDemoVillas({ companyId: company.id, includeMetrics: false, includeInactive: false });
  return <TemplateHome company={company} villas={villas} theme={themeKey} locale={locale} />;
}
