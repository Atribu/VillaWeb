import type { AppLocale } from "@/lib/i18n";

export const DEMO_COMPANY_COOKIE_NAME = "villaweb_public_company";

export type DemoCompanyStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

export type DemoCompanyRecord = {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  shortName: string;
  panelLabel: string;
  status: DemoCompanyStatus;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  primaryDomain: string;
  address: string;
  taxNumber: string;
  supportHours: string;
  accentLabel: string;
  heroTitle: string;
  heroDescription: string;
};

export const demoCompanies: DemoCompanyRecord[] = [
  {
    id: "seed-company-villavera",
    slug: "villavera",
    name: "VillaVera Collection",
    legalName: "VillaVera Turizm ve Dijital Hizmetler A.S.",
    shortName: "VillaVera",
    panelLabel: "VillaVera Backoffice",
    status: "ACTIVE",
    tagline: "Premium villa koleksiyonu",
    phone: "+90 850 000 00 00",
    whatsapp: "+90 555 000 00 00",
    email: "merhaba@villavera.com",
    primaryDomain: "villavera.demo",
    address: "Kalkan Mahallesi, Antalya",
    taxNumber: "3456789012",
    supportHours: "Her gun 09:00 - 22:00",
    accentLabel: "Deniz manzarali ve balayi odakli seckiler",
    heroTitle: "Deniz manzarali, premium ve donusum odakli villa vitrini.",
    heroDescription:
      "VillaVera; Kalkan ve Kas odakli premium seckileri, balayi segmenti ve SEO guclu landing kurgusuyla talep toplar.",
  },
  {
    id: "seed-company-sahil",
    slug: "sahil-collection",
    name: "Sahil Collection Villas",
    legalName: "Sahil Collection Tatil Teknolojileri Ltd. Sti.",
    shortName: "Sahil Collection",
    panelLabel: "Sahil Collection Panel",
    status: "ACTIVE",
    tagline: "Aile ve grup villalari",
    phone: "+90 850 222 11 22",
    whatsapp: "+90 554 222 11 22",
    email: "rezervasyon@sahilcollection.com",
    primaryDomain: "sahilcollection.demo",
    address: "Fethiye Marina Bolgesi, Mugla",
    taxNumber: "4567890123",
    supportHours: "Hafta ici 09:00 - 20:00",
    accentLabel: "Aile ve grup konaklamalarinda operasyon agirlikli portfoy",
    heroTitle: "Aileler ve kalabalik gruplar icin kurumsal villa vitrini.",
    heroDescription:
      "Sahil Collection; Fethiye ve Bodrum odakli genis kapasite villalari, kampanya kurgusu ve operasyon takibiyle satisa hazir durur.",
  },
];

const fallbackCompanyByVillaSlug: Record<string, string> = {
  "kalkan-deniz-manzarali-luks-villa-soleia-lagoon": "seed-company-villavera",
  "kas-balayi-icin-muhafazakar-villa-verde-cove": "seed-company-villavera",
  "fethiye-ozel-havuzlu-aile-villasi-palm-serenity": "seed-company-sahil",
  "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand": "seed-company-sahil",
};

export function getDemoCompanies() {
  return demoCompanies;
}

export function getDefaultDemoCompany() {
  return demoCompanies[0];
}

export function getDemoCompanyById(companyId?: string | null) {
  if (!companyId) {
    return null;
  }

  return demoCompanies.find((company) => company.id === companyId) ?? null;
}

export function getDemoCompanyBySlug(companySlug?: string | null) {
  if (!companySlug) {
    return null;
  }

  const normalizedSlug = companySlug.trim().toLowerCase();
  return demoCompanies.find((company) => company.slug === normalizedSlug) ?? null;
}

export function getFallbackCompanyIdForVillaSlug(villaSlug: string) {
  return fallbackCompanyByVillaSlug[villaSlug] ?? getDefaultDemoCompany().id;
}

export function getDemoCompanySiteHref(companySlug: string, pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${normalizedPath}?company=${companySlug}`;
}

const localizedCompanyContent: Record<
  string,
  Partial<Record<keyof Pick<DemoCompanyRecord, "tagline" | "supportHours" | "accentLabel" | "heroTitle" | "heroDescription">, string>>
> = {
  villavera: {
    tagline: "Premium villa collection",
    supportHours: "Daily 09:00 - 22:00",
    accentLabel: "Sea-view and honeymoon-focused selections",
    heroTitle: "A sea-view, premium and conversion-focused villa showcase.",
    heroDescription:
      "VillaVera captures demand with premium selections focused on Kalkan and Kas, a honeymoon segment and strong SEO landing structures.",
  },
  "sahil-collection": {
    tagline: "Family and group villas",
    supportHours: "Weekdays 09:00 - 20:00",
    accentLabel: "Operations-led portfolio for family and group stays",
    heroTitle: "A corporate villa showcase for families and large groups.",
    heroDescription:
      "Sahil Collection is ready for sales with high-capacity villas in Fethiye and Bodrum, campaign structure and operations tracking.",
  },
};

export function getLocalizedDemoCompanyRecord(
  company: DemoCompanyRecord,
  locale: AppLocale,
): DemoCompanyRecord {
  if (locale === "tr") {
    return company;
  }

  const localized = localizedCompanyContent[company.slug];

  if (!localized) {
    return company;
  }

  return {
    ...company,
    tagline: localized.tagline ?? company.tagline,
    supportHours: localized.supportHours ?? company.supportHours,
    accentLabel: localized.accentLabel ?? company.accentLabel,
    heroTitle: localized.heroTitle ?? company.heroTitle,
    heroDescription: localized.heroDescription ?? company.heroDescription,
  };
}
