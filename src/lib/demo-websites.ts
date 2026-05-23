export type DemoWebsiteStatus = "LIVE" | "STAGING" | "PAUSED";
export type DemoLandingStatus = "LIVE" | "DRAFT" | "REVISION";
export type DemoSeoContentStatus = "PLANNED" | "IN_PROGRESS" | "PUBLISHED";

export type DemoWebsiteRecord = {
  id: string;
  name: string;
  domain: string;
  locale: string;
  status: DemoWebsiteStatus;
  primaryChannel: string;
  default: boolean;
  updatedAt: string;
};

export type DemoLandingPageRecord = {
  id: string;
  title: string;
  slug: string;
  targetRegion: string;
  focusKeyword: string;
  status: DemoLandingStatus;
  leadCount: number;
  updatedAt: string;
};

export type DemoSeoContentRecord = {
  id: string;
  title: string;
  contentType: "BLOG" | "LANDING" | "CATEGORY";
  targetUrl: string;
  primaryKeyword: string;
  status: DemoSeoContentStatus;
  seoScore: number;
  updatedAt: string;
};

export const seedDemoWebsites: DemoWebsiteRecord[] = [
  {
    id: "site-villa-main",
    name: "VillaView Ana Site",
    domain: "villaview.com",
    locale: "tr-TR",
    status: "LIVE",
    primaryChannel: "SEO + Direkt Talep",
    default: true,
    updatedAt: "2026-05-18T08:00:00.000Z",
  },
  {
    id: "site-balayi-micro",
    name: "Balayi Mikro Site",
    domain: "balayi.villaview.com",
    locale: "tr-TR",
    status: "STAGING",
    primaryChannel: "Landing Funnel",
    default: false,
    updatedAt: "2026-05-17T15:10:00.000Z",
  },
  {
    id: "site-intl-preview",
    name: "International Preview",
    domain: "preview.villaview.com",
    locale: "en-GB",
    status: "PAUSED",
    primaryChannel: "Organic Test",
    default: false,
    updatedAt: "2026-05-15T11:25:00.000Z",
  },
];

export const seedDemoLandingPages: DemoLandingPageRecord[] = [
  {
    id: "landing-kalkan-villa",
    title: "Kalkan Villa Kiralama",
    slug: "kalkan-villa-kiralama",
    targetRegion: "Kalkan",
    focusKeyword: "kalkan villa kiralama",
    status: "LIVE",
    leadCount: 28,
    updatedAt: "2026-05-18T07:50:00.000Z",
  },
  {
    id: "landing-balayi-villa",
    title: "Balayi Icin Ozel Villa",
    slug: "balayi-icin-ozel-villa",
    targetRegion: "Kas",
    focusKeyword: "balayi villasi",
    status: "REVISION",
    leadCount: 11,
    updatedAt: "2026-05-17T16:20:00.000Z",
  },
  {
    id: "landing-fethiye-aile",
    title: "Fethiye Aile Villalari",
    slug: "fethiye-aile-villalari",
    targetRegion: "Fethiye",
    focusKeyword: "fethiye aile villasi",
    status: "DRAFT",
    leadCount: 0,
    updatedAt: "2026-05-16T10:40:00.000Z",
  },
];

export const seedDemoSeoContents: DemoSeoContentRecord[] = [
  {
    id: "seo-kalkan-rehber",
    title: "Kalkan'da Villa Kiralarken Nelere Dikkat Edilmeli",
    contentType: "BLOG",
    targetUrl: "/blog/kalkanda-villa-kiralama-rehberi",
    primaryKeyword: "kalkan villa kiralama rehberi",
    status: "PUBLISHED",
    seoScore: 88,
    updatedAt: "2026-05-18T06:30:00.000Z",
  },
  {
    id: "seo-muhafazakar-kategori",
    title: "Muhafazakar Villalar Kategori Icerigi",
    contentType: "CATEGORY",
    targetUrl: "/villalar?tema=muhafazakar",
    primaryKeyword: "muhafazakar villa",
    status: "IN_PROGRESS",
    seoScore: 71,
    updatedAt: "2026-05-17T12:40:00.000Z",
  },
  {
    id: "seo-bodrum-landing",
    title: "Bodrum Kalabalik Gruplar Icin Villa Landing",
    contentType: "LANDING",
    targetUrl: "/bodrum-kalabalik-gruplar-icin-villa",
    primaryKeyword: "bodrum grup villasi",
    status: "PLANNED",
    seoScore: 62,
    updatedAt: "2026-05-16T09:15:00.000Z",
  },
];

export function getWebsiteStatusLabel(status: DemoWebsiteStatus) {
  switch (status) {
    case "LIVE":
      return "Yayinda";
    case "STAGING":
      return "Hazirlikta";
    case "PAUSED":
      return "Duraklatildi";
    default:
      return status;
  }
}

export function getWebsiteStatusTone(status: DemoWebsiteStatus) {
  switch (status) {
    case "LIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "STAGING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getLandingStatusLabel(status: DemoLandingStatus) {
  switch (status) {
    case "LIVE":
      return "Yayinda";
    case "DRAFT":
      return "Taslak";
    case "REVISION":
      return "Revizyonda";
    default:
      return status;
  }
}

export function getLandingStatusTone(status: DemoLandingStatus) {
  switch (status) {
    case "LIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REVISION":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

export function getSeoContentStatusLabel(status: DemoSeoContentStatus) {
  switch (status) {
    case "PLANNED":
      return "Planlandi";
    case "IN_PROGRESS":
      return "Hazirlaniyor";
    case "PUBLISHED":
      return "Yayinda";
    default:
      return status;
  }
}

export function getSeoContentStatusTone(status: DemoSeoContentStatus) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}
