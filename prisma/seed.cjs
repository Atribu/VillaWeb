/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, Prisma } = require("@prisma/client");
const { scryptSync } = require("node:crypto");
const demoVillas = require("../data/demo-villas.json");

const prisma = new PrismaClient();

function money(value) {
  return new Prisma.Decimal(String(value));
}

function at(value) {
  return new Date(value);
}

function hashPassword(password, salt) {
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const env = {
  superAdminUsername: process.env.SEED_SUPER_ADMIN_USERNAME ?? "super-admin",
  superAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL ?? "owner@villaweb.local",
  superAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD ?? "VillaSuper2026!",
  platformAdminUsername: process.env.SEED_PLATFORM_ADMIN_USERNAME ?? "platform-admin",
  platformAdminEmail: process.env.SEED_PLATFORM_ADMIN_EMAIL ?? "ops@villaweb.local",
  platformAdminPassword: process.env.SEED_PLATFORM_ADMIN_PASSWORD ?? "VillaOps2026!",
  villaveraAdminUsername: process.env.SEED_VILLAVERA_ADMIN_USERNAME ?? "villavera-admin",
  villaveraAdminEmail: process.env.SEED_VILLAVERA_ADMIN_EMAIL ?? "admin@villavera.com",
  villaveraAdminPassword: process.env.SEED_VILLAVERA_ADMIN_PASSWORD ?? "VillaAdmin2026!",
  villaveraStaffUsername:
    process.env.SEED_VILLAVERA_STAFF_USERNAME ?? "villavera-personel",
  villaveraStaffEmail:
    process.env.SEED_VILLAVERA_STAFF_EMAIL ?? "operasyon@villavera.com",
  villaveraStaffPassword:
    process.env.SEED_VILLAVERA_STAFF_PASSWORD ?? "VillaStaff2026!",
  sahilAdminUsername: process.env.SEED_SAHIL_ADMIN_USERNAME ?? "sahil-admin",
  sahilAdminEmail: process.env.SEED_SAHIL_ADMIN_EMAIL ?? "admin@sahilcollection.com",
  sahilAdminPassword: process.env.SEED_SAHIL_ADMIN_PASSWORD ?? "SahilAdmin2026!",
  sahilFinanceUsername: process.env.SEED_SAHIL_FINANCE_USERNAME ?? "sahil-finance",
  sahilFinanceEmail:
    process.env.SEED_SAHIL_FINANCE_EMAIL ?? "finans@sahilcollection.com",
  sahilFinancePassword:
    process.env.SEED_SAHIL_FINANCE_PASSWORD ?? "SahilFinans2026!",
};

const ids = {
  platformSetting: "seed-platform-setting-1",
  companyVillavera: "seed-company-villavera",
  companySahil: "seed-company-sahil",
  userSuperAdmin: "seed-user-super-admin",
  userPlatformAdmin: "seed-user-platform-admin",
  userVillaveraAdmin: "seed-user-villavera-admin",
  userVillaveraStaff: "seed-user-villavera-staff",
  userSahilAdmin: "seed-user-sahil-admin",
  userSahilFinance: "seed-user-sahil-finance",
  companySettingVillavera: "seed-company-setting-villavera",
  companySettingSahil: "seed-company-setting-sahil",
  websiteVillavera: "seed-website-villavera-main",
  websiteSahil: "seed-website-sahil-main",
  regionKalkan: "seed-region-kalkan",
  regionKas: "seed-region-kas",
  regionFethiye: "seed-region-fethiye",
  regionBodrum: "seed-region-bodrum",
  airportDLM: "seed-airport-dlm",
  airportAYT: "seed-airport-ayt",
  amenitySeaView: "seed-amenity-sea-view",
  amenityInfinityPool: "seed-amenity-infinity-pool",
  amenityIsolatedPool: "seed-amenity-isolated-pool",
  amenityFamilyPool: "seed-amenity-family-pool",
  amenityJacuzzi: "seed-amenity-jacuzzi",
  amenityBarbecue: "seed-amenity-barbecue",
  amenityWifi: "seed-amenity-wifi",
  amenityGarden: "seed-amenity-garden",
  campaignSoleia: "seed-campaign-soleia-spring",
  campaignPalm: "seed-campaign-palm-april",
  campaignMarea: "seed-campaign-marea-groups",
  couponSummer: "seed-coupon-yazbasliyor",
  couponHoneymoon: "seed-coupon-balayi",
  requestMert: "seed-request-mert",
  requestSeda: "seed-request-seda",
  requestElif: "seed-request-elif",
  invoiceElif: "seed-invoice-elif",
  paymentElifDeposit: "seed-payment-elif-deposit",
  paymentElifBalance: "seed-payment-elif-balance",
  cashElifDeposit: "seed-cash-elif-deposit",
  cashElifBalance: "seed-cash-elif-balance",
  reviewElif: "seed-review-elif",
  agencyVillavera: "seed-agency-villavera-direct",
  agencySahil: "seed-agency-sahil-partner",
  branchVillavera: "seed-branch-villavera-main",
  branchSahil: "seed-branch-sahil-bodrum",
  messageVillavera: "seed-message-villavera-1",
  messageSahil: "seed-message-sahil-1",
  commissionVillavera: "seed-commission-villavera-direct",
  commissionSahil: "seed-commission-sahil-partner",
  landingVillavera: "seed-landing-villavera-kalkan",
  landingSahil: "seed-landing-sahil-bodrum",
  seoVillavera: "seed-seo-villavera-kalkan",
  seoSahil: "seed-seo-sahil-bodrum",
  blogVillavera: "seed-blog-villavera-kalkan-guide",
  blogSahil: "seed-blog-sahil-fethiye-guide",
  syncSourceSoleia: "seed-sync-source-soleia-airbnb",
  syncSourcePalm: "seed-sync-source-palm-booking",
  syncMappingSoleia: "seed-sync-mapping-soleia-airbnb",
  syncMappingPalm: "seed-sync-mapping-palm-booking",
  syncLogSoleia: "seed-sync-log-soleia-1",
  syncLogPalm: "seed-sync-log-palm-1",
  currencyEurVillavera: "seed-currency-eur-villavera",
  currencyUsdVillavera: "seed-currency-usd-villavera",
  currencyGbpSahil: "seed-currency-gbp-sahil",
  paymentCardLinkVillavera: "seed-payment-method-card-villavera",
  paymentBankVillavera: "seed-payment-method-bank-villavera",
  paymentPosSahil: "seed-payment-method-pos-sahil",
  cacheHomeVillavera: "seed-cache-home-villavera",
  cacheVillaVillavera: "seed-cache-villa-villavera",
  cacheSeoSahil: "seed-cache-seo-sahil",
  documentCleaningVillavera: "seed-document-cleaning-villavera",
  documentFinanceVillavera: "seed-document-finance-villavera",
  documentBrandSahil: "seed-document-brand-sahil",
  shortcutPanelVillavera: "seed-shortcut-panel-villavera",
  shortcutPublicVillavera: "seed-shortcut-public-villavera",
  shortcutFinanceSahil: "seed-shortcut-finance-sahil",
  externalSearchConsoleVillavera: "seed-service-search-console-villavera",
  externalAnalyticsVillavera: "seed-service-analytics-villavera",
  externalMailSahil: "seed-service-mail-sahil",
  docLinkKvkkVillavera: "seed-doclink-kvkk-villavera",
  docLinkFinanceVillavera: "seed-doclink-finance-villavera",
  docLinkSeoSahil: "seed-doclink-seo-sahil",
  parameterThemesVillavera: "seed-parameter-themes-villavera",
  parameterPoolsVillavera: "seed-parameter-pools-villavera",
  parameterServicesSahil: "seed-parameter-services-sahil",
  auditCompanyCreate: "seed-audit-company-create",
  auditRequestApprove: "seed-audit-request-approve",
  auditCouponSeed: "seed-audit-coupon-seed",
};

const companies = {
  villavera: {
    id: ids.companyVillavera,
    slug: "villavera",
    legalName: "VillaVera Turizm ve Dijital Hizmetler A.S.",
    publicName: "VillaVera Collection",
    shortName: "VillaVera",
    panelName: "VillaVera Backoffice",
    primaryEmail: "merhaba@villavera.com",
    primaryPhone: "+90 850 000 00 00",
    whatsappNumber: "+90 555 000 00 00",
    supportHours: "Her gun 09:00 - 22:00",
    primaryDomain: "villavera.demo",
    heroTitle: "Deniz manzarali, premium ve donusum odakli villa vitrini.",
    heroDescription:
      "VillaVera; Kalkan ve Kas odakli premium seckileri, balayi segmenti ve SEO guclu landing kurgusuyla talep toplar.",
  },
  sahil: {
    id: ids.companySahil,
    slug: "sahil-collection",
    legalName: "Sahil Collection Tatil Teknolojileri Ltd. Sti.",
    publicName: "Sahil Collection Villas",
    shortName: "Sahil Collection",
    panelName: "Sahil Collection Panel",
    primaryEmail: "rezervasyon@sahilcollection.com",
    primaryPhone: "+90 850 222 11 22",
    whatsappNumber: "+90 554 222 11 22",
    supportHours: "Hafta ici 09:00 - 20:00",
    primaryDomain: "sahilcollection.demo",
    heroTitle: "Aileler ve kalabalik gruplar icin kurumsal villa vitrini.",
    heroDescription:
      "Sahil Collection; Fethiye ve Bodrum odakli genis kapasite villalari, kampanya kurgusu ve operasyon takibiyle satisa hazir durur.",
  },
};

const pricingBySlug = {
  "kalkan-deniz-manzarali-luks-villa-soleia-lagoon": { cleaningFee: 3000, minNightCount: 3 },
  "fethiye-ozel-havuzlu-aile-villasi-palm-serenity": { cleaningFee: 4500, minNightCount: 4 },
  "kas-balayi-icin-muhafazakar-villa-verde-cove": { cleaningFee: 1800, minNightCount: 3 },
  "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand": { cleaningFee: 4500, minNightCount: 4 },
};

const villaTranslationsBySlug = {
  "kalkan-deniz-manzarali-luks-villa-soleia-lagoon": {
    titleEn: "Villa Soleia Lagoon",
    badgeEn: "Sea view",
    categoryEn: "Luxury with a view",
    shortDescriptionEn:
      "Panoramic sea views, an infinity pool and a premium living setup for up to 8 guests.",
    descriptionEn:
      "Located close to the heart of Kalkan, Villa Soleia Lagoon offers a spacious and refined holiday setting for large families and guests looking for a premium stay.",
    poolTypeEn: "Infinity pool",
    coverAltEn: "Pool and terrace view of Villa Soleia Lagoon with panoramic sea views in Kalkan",
    seoTitleEn: "Luxury sea-view villa in Kalkan | Villa Soleia Lagoon",
    seoDescriptionEn:
      "A premium 8-guest villa in Kalkan with sea views and a private pool. Discover a calm and luxurious holiday at Villa Soleia Lagoon.",
    focusKeywordEn: "sea-view villa in Kalkan",
  },
  "fethiye-ozel-havuzlu-aile-villasi-palm-serenity": {
    titleEn: "Villa Palm Serenity",
    badgeEn: "Family friendly",
    categoryEn: "Large family",
    shortDescriptionEn:
      "Private garden use, a children's pool and a layout designed for family holidays up to 10 guests.",
    descriptionEn:
      "Surrounded by nature, Villa Palm Serenity is designed to give families a relaxed stay with its spacious kitchen and open-air lounge areas.",
    poolTypeEn: "Private pool + kids' pool",
    coverAltEn: "Large garden and pool area of Villa Palm Serenity in Fethiye",
    seoTitleEn: "Private pool family villa in Fethiye | Villa Palm Serenity",
    seoDescriptionEn:
      "A premium family villa in Fethiye with a private pool, spacious garden and comfortable layout for larger groups.",
    focusKeywordEn: "family villa in Fethiye",
  },
  "kas-balayi-icin-muhafazakar-villa-verde-cove": {
    titleEn: "Villa Verde Cove",
    badgeEn: "Honeymoon choice",
    categoryEn: "Honeymoon",
    shortDescriptionEn:
      "A private concept for two with an isolated pool and a sunset terrace for a peaceful getaway.",
    descriptionEn:
      "Villa Verde Cove blends the natural character of Kas with a calm luxury experience and was designed for honeymoon couples seeking privacy.",
    poolTypeEn: "Secluded pool",
    coverAltEn: "Private hideaway pool terrace of Villa Verde Cove in Kas",
    seoTitleEn: "Private honeymoon villa in Kas | Villa Verde Cove",
    seoDescriptionEn:
      "A secluded honeymoon villa in Kas with a sheltered pool, privacy-focused layout and romantic sunset atmosphere.",
    focusKeywordEn: "private honeymoon villa in Kas",
  },
  "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand": {
    titleEn: "Villa Marea Grand",
    badgeEn: "Large group stay",
    categoryEn: "Luxury with a view",
    shortDescriptionEn:
      "Designed for larger groups with generous outdoor living areas, a broad pool deck and premium entertaining spaces.",
    descriptionEn:
      "Villa Marea Grand in Bodrum is positioned for larger group holidays, combining scale, comfort and a luxury coastal atmosphere in one stay.",
    poolTypeEn: "Temperature-controlled pool",
    coverAltEn: "Grand exterior and pool deck of Villa Marea Grand in Bodrum",
    seoTitleEn: "Luxury group villa in Bodrum | Villa Marea Grand",
    seoDescriptionEn:
      "A spacious luxury villa in Bodrum for large groups, with a temperature-controlled pool and premium social areas.",
    focusKeywordEn: "luxury group villa in Bodrum",
  },
};

const villaPresentationBySlug = {
  "kalkan-deniz-manzarali-luks-villa-soleia-lagoon": {
    averageRating: 4.94,
    reviewCount: 267,
    isSuperhost: true,
  },
  "fethiye-ozel-havuzlu-aile-villasi-palm-serenity": {
    averageRating: 4.88,
    reviewCount: 183,
    isSuperhost: false,
  },
  "kas-balayi-icin-muhafazakar-villa-verde-cove": {
    averageRating: 4.97,
    reviewCount: 142,
    isSuperhost: true,
  },
  "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand": {
    averageRating: 4.91,
    reviewCount: 214,
    isSuperhost: true,
  },
};

const villaMetaBySlug = {
  "kalkan-deniz-manzarali-luks-villa-soleia-lagoon": {
    id: "seed-villa-soleia",
    companyId: ids.companyVillavera,
    websiteId: ids.websiteVillavera,
    regionId: ids.regionKalkan,
    createdByUserId: ids.userVillaveraAdmin,
    amenityIds: [
      ids.amenitySeaView,
      ids.amenityInfinityPool,
      ids.amenityJacuzzi,
      ids.amenityWifi,
      ids.amenityBarbecue,
    ],
  },
  "kas-balayi-icin-muhafazakar-villa-verde-cove": {
    id: "seed-villa-verde",
    companyId: ids.companyVillavera,
    websiteId: ids.websiteVillavera,
    regionId: ids.regionKas,
    createdByUserId: ids.userVillaveraAdmin,
    amenityIds: [
      ids.amenityIsolatedPool,
      ids.amenitySeaView,
      ids.amenityJacuzzi,
      ids.amenityWifi,
    ],
  },
  "fethiye-ozel-havuzlu-aile-villasi-palm-serenity": {
    id: "seed-villa-palm",
    companyId: ids.companySahil,
    websiteId: ids.websiteSahil,
    regionId: ids.regionFethiye,
    createdByUserId: ids.userSahilAdmin,
    amenityIds: [
      ids.amenityFamilyPool,
      ids.amenityGarden,
      ids.amenityWifi,
      ids.amenityBarbecue,
    ],
  },
  "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand": {
    id: "seed-villa-marea",
    companyId: ids.companySahil,
    websiteId: ids.websiteSahil,
    regionId: ids.regionBodrum,
    createdByUserId: ids.userSahilAdmin,
    amenityIds: [
      ids.amenitySeaView,
      ids.amenityInfinityPool,
      ids.amenityWifi,
      ids.amenityGarden,
    ],
  },
};

async function upsertById(delegate, record) {
  const { id, ...data } = record;
  return delegate.upsert({
    where: { id },
    update: data,
    create: { id, ...data },
  });
}

async function seedPlatform() {
  await upsertById(prisma.platformSetting, {
    id: ids.platformSetting,
    platformName: "VillaWeb",
    defaultCurrency: "TRY",
    defaultLocale: "tr-TR",
    defaultTimezone: "Europe/Istanbul",
    supportEmail: "destek@villaweb.local",
    supportPhone: "+90 850 111 11 11",
  });
}

async function seedCompanies() {
  const companyRecords = [companies.villavera, companies.sahil];

  for (const company of companyRecords) {
    await upsertById(prisma.company, {
      id: company.id,
      slug: company.slug,
      legalName: company.legalName,
      publicName: company.publicName,
      shortName: company.shortName,
      panelName: company.panelName,
      status: "ACTIVE",
      primaryEmail: company.primaryEmail,
      primaryPhone: company.primaryPhone,
      whatsappNumber: company.whatsappNumber,
      supportHours: company.supportHours,
      primaryDomain: company.primaryDomain,
      timezone: "Europe/Istanbul",
      locale: "tr-TR",
      currency: "TRY",
    });
  }

  await upsertById(prisma.companySetting, {
    id: ids.companySettingVillavera,
    companyId: ids.companyVillavera,
    siteName: companies.villavera.publicName,
    defaultTitle: "Kalkan ve Kas premium villa koleksiyonu",
    defaultDescription:
      "Deniz manzarali, balayi odakli ve donusum guclu VillaVera vitrini.",
    primaryPhone: companies.villavera.primaryPhone,
    primaryEmail: companies.villavera.primaryEmail,
    address: "Kalkan Mahallesi, Antalya",
    whatsappNumber: companies.villavera.whatsappNumber,
    accentLabel: "Deniz manzarali ve balayi odakli seckiler",
    heroTitle: companies.villavera.heroTitle,
    heroDescription: companies.villavera.heroDescription,
    instagramUrl: "https://instagram.com/villavera",
    facebookUrl: "https://facebook.com/villavera",
    seoIndexable: true,
    allowCoupons: true,
    allowManualQuotes: true,
    leadResponseMinutes: 20,
    defaultMinNightCount: 3,
    defaultCleaningLeadHours: 6,
    requestReminderHours: 12,
  });

  await upsertById(prisma.companySetting, {
    id: ids.companySettingSahil,
    companyId: ids.companySahil,
    siteName: companies.sahil.publicName,
    defaultTitle: "Fethiye ve Bodrum aile villalari",
    defaultDescription:
      "Aile ve grup odakli, operasyonu guclu Sahil Collection vitrini.",
    primaryPhone: companies.sahil.primaryPhone,
    primaryEmail: companies.sahil.primaryEmail,
    address: "Fethiye Marina Bolgesi, Mugla",
    whatsappNumber: companies.sahil.whatsappNumber,
    accentLabel: "Aile ve grup konaklamalarinda operasyon agirlikli portfoy",
    heroTitle: companies.sahil.heroTitle,
    heroDescription: companies.sahil.heroDescription,
    instagramUrl: "https://instagram.com/sahilcollection",
    facebookUrl: "https://facebook.com/sahilcollection",
    seoIndexable: true,
    allowCoupons: true,
    allowManualQuotes: true,
    leadResponseMinutes: 25,
    defaultMinNightCount: 4,
    defaultCleaningLeadHours: 8,
    requestReminderHours: 12,
  });

  await upsertById(prisma.companyWebsite, {
    id: ids.websiteVillavera,
    companyId: ids.companyVillavera,
    name: "VillaVera Ana Site",
    slug: "ana-site",
    domain: "villavera.demo",
    locale: "tr-TR",
    isPrimary: true,
    status: "LIVE",
    primaryChannel: "SEO + Organik Landing",
    brandHeadline: companies.villavera.heroTitle,
    metaTitle: "VillaVera | Premium villa koleksiyonu",
    metaDescription: companies.villavera.heroDescription,
    themeKey: "coastal-premium",
    logoUrl: "/brand/villavera-logo.svg",
    faviconUrl: "/brand/villavera-favicon.ico",
    analyticsKey: "G-DEMO-VILLAVERA",
  });

  await upsertById(prisma.companyWebsite, {
    id: ids.websiteSahil,
    companyId: ids.companySahil,
    name: "Sahil Collection Ana Site",
    slug: "ana-site",
    domain: "sahilcollection.demo",
    locale: "tr-TR",
    isPrimary: true,
    status: "LIVE",
    primaryChannel: "Partner + Aile Kampanyalari",
    brandHeadline: companies.sahil.heroTitle,
    metaTitle: "Sahil Collection | Aile ve grup villalari",
    metaDescription: companies.sahil.heroDescription,
    themeKey: "family-summer",
    logoUrl: "/brand/sahil-logo.svg",
    faviconUrl: "/brand/sahil-favicon.ico",
    analyticsKey: "G-DEMO-SAHIL",
  });
}

async function seedUsers() {
  const users = [
    {
      id: ids.userSuperAdmin,
      username: env.superAdminUsername,
      email: env.superAdminEmail,
      name: "Platform Super Admin",
      phone: "+90 532 000 00 90",
      passwordHash: hashPassword(env.superAdminPassword, "villaweb-super-admin"),
      platformRole: "PLATFORM_OWNER",
      isActive: true,
      lastLoginAt: at("2026-06-01T08:15:00.000Z"),
    },
    {
      id: ids.userPlatformAdmin,
      username: env.platformAdminUsername,
      email: env.platformAdminEmail,
      name: "Platform Operations Admin",
      phone: "+90 532 000 00 91",
      passwordHash: hashPassword(env.platformAdminPassword, "villaweb-platform-admin"),
      platformRole: "PLATFORM_ADMIN",
      isActive: true,
      lastLoginAt: at("2026-06-01T08:30:00.000Z"),
    },
    {
      id: ids.userVillaveraAdmin,
      username: env.villaveraAdminUsername,
      email: env.villaveraAdminEmail,
      name: "VillaVera Firma Admini",
      phone: "+90 532 000 00 01",
      passwordHash: hashPassword(env.villaveraAdminPassword, "villavera-admin"),
      platformRole: "COMPANY_USER",
      isActive: true,
      lastLoginAt: at("2026-06-01T09:00:00.000Z"),
    },
    {
      id: ids.userVillaveraStaff,
      username: env.villaveraStaffUsername,
      email: env.villaveraStaffEmail,
      name: "VillaVera Operasyon Personeli",
      phone: "+90 532 000 00 02",
      passwordHash: hashPassword(env.villaveraStaffPassword, "villavera-staff"),
      platformRole: "COMPANY_USER",
      isActive: true,
      lastLoginAt: at("2026-06-01T09:05:00.000Z"),
    },
    {
      id: ids.userSahilAdmin,
      username: env.sahilAdminUsername,
      email: env.sahilAdminEmail,
      name: "Sahil Collection Admin",
      phone: "+90 533 120 11 11",
      passwordHash: hashPassword(env.sahilAdminPassword, "sahil-admin"),
      platformRole: "COMPANY_USER",
      isActive: true,
      lastLoginAt: at("2026-06-01T09:10:00.000Z"),
    },
    {
      id: ids.userSahilFinance,
      username: env.sahilFinanceUsername,
      email: env.sahilFinanceEmail,
      name: "Sahil Collection Finans Sorumlusu",
      phone: "+90 539 340 33 33",
      passwordHash: hashPassword(env.sahilFinancePassword, "sahil-finance"),
      platformRole: "COMPANY_USER",
      isActive: true,
      lastLoginAt: at("2026-06-01T09:20:00.000Z"),
    },
  ];

  for (const user of users) {
    await upsertById(prisma.user, user);
  }

  const memberships = [
    {
      id: "seed-membership-villavera-admin",
      companyId: ids.companyVillavera,
      userId: ids.userVillaveraAdmin,
      role: "COMPANY_ADMIN",
      status: "ACTIVE",
      isPrimary: true,
      responsibility: "Tum panel, fiyat ve operasyon akislarinin genel yonetimi",
      lastActiveAt: at("2026-06-01T09:00:00.000Z"),
      invitedAt: at("2026-03-01T08:00:00.000Z"),
      acceptedAt: at("2026-03-01T08:05:00.000Z"),
    },
    {
      id: "seed-membership-villavera-staff",
      companyId: ids.companyVillavera,
      userId: ids.userVillaveraStaff,
      role: "OPERATIONS",
      status: "ACTIVE",
      isPrimary: true,
      responsibility: "Temizlik, karsilama ve saha operasyonlarini yonetme",
      lastActiveAt: at("2026-06-01T09:05:00.000Z"),
      invitedAt: at("2026-03-02T08:00:00.000Z"),
      acceptedAt: at("2026-03-02T08:05:00.000Z"),
    },
    {
      id: "seed-membership-sahil-admin",
      companyId: ids.companySahil,
      userId: ids.userSahilAdmin,
      role: "COMPANY_ADMIN",
      status: "ACTIVE",
      isPrimary: true,
      responsibility: "Sahil Collection panel ve fiyat operasyonlarinin yonetimi",
      lastActiveAt: at("2026-06-01T09:10:00.000Z"),
      invitedAt: at("2026-03-03T08:00:00.000Z"),
      acceptedAt: at("2026-03-03T08:05:00.000Z"),
    },
    {
      id: "seed-membership-sahil-finance",
      companyId: ids.companySahil,
      userId: ids.userSahilFinance,
      role: "FINANCE",
      status: "ACTIVE",
      isPrimary: true,
      responsibility: "Tahsilat, fatura ve kasa akislarini yonetme",
      lastActiveAt: at("2026-06-01T09:20:00.000Z"),
      invitedAt: at("2026-03-04T08:00:00.000Z"),
      acceptedAt: at("2026-03-04T08:05:00.000Z"),
    },
  ];

  for (const membership of memberships) {
    await upsertById(prisma.companyMembership, membership);
  }
}

async function seedDefinitions() {
  const regions = [
    {
      id: ids.regionKalkan,
      companyId: ids.companyVillavera,
      name: "Kalkan",
      city: "Antalya",
      districtScope: ["Kalkan"],
      status: "ACTIVE",
      countryCode: "TR",
      latitude: money(36.2666667),
      longitude: money(29.4166667),
    },
    {
      id: ids.regionKas,
      companyId: ids.companyVillavera,
      name: "Kas",
      city: "Antalya",
      districtScope: ["Kas"],
      status: "ACTIVE",
      countryCode: "TR",
      latitude: money(36.2),
      longitude: money(29.6333333),
    },
    {
      id: ids.regionFethiye,
      companyId: ids.companySahil,
      name: "Fethiye",
      city: "Mugla",
      districtScope: ["Fethiye"],
      status: "ACTIVE",
      countryCode: "TR",
      latitude: money(36.6211111),
      longitude: money(29.1155556),
    },
    {
      id: ids.regionBodrum,
      companyId: ids.companySahil,
      name: "Bodrum",
      city: "Mugla",
      districtScope: ["Bodrum", "Yalikavak"],
      status: "DRAFT",
      countryCode: "TR",
      latitude: money(37.0344444),
      longitude: money(27.4305556),
    },
  ];

  for (const region of regions) {
    await upsertById(prisma.region, region);
  }

  await upsertById(prisma.airport, {
    id: ids.airportDLM,
    regionId: ids.regionFethiye,
    name: "Dalaman Havalimani",
    code: "DLM",
    city: "Mugla",
    driveMinutes: 55,
  });

  await upsertById(prisma.airport, {
    id: ids.airportAYT,
    regionId: ids.regionKalkan,
    name: "Antalya Havalimani",
    code: "AYT",
    city: "Antalya",
    driveMinutes: 135,
  });

  const amenities = [
    { id: ids.amenitySeaView, key: "sea-view", label: "Deniz Manzarasi", icon: "waves", category: "manzara" },
    { id: ids.amenityInfinityPool, key: "infinity-pool", label: "Sonsuzluk Havuzu", icon: "pool", category: "havuz" },
    { id: ids.amenityIsolatedPool, key: "isolated-pool", label: "Izole Havuz", icon: "shield", category: "mahremiyet" },
    { id: ids.amenityFamilyPool, key: "family-pool", label: "Aile Havuzu", icon: "users", category: "aile" },
    { id: ids.amenityJacuzzi, key: "jacuzzi", label: "Jakuzi", icon: "sparkles", category: "konfor" },
    { id: ids.amenityBarbecue, key: "barbecue", label: "Barbeku", icon: "flame", category: "dis mekan" },
    { id: ids.amenityWifi, key: "wifi", label: "Yuksek Hizli Wifi", icon: "wifi", category: "genel" },
    { id: ids.amenityGarden, key: "garden", label: "Genis Bahce", icon: "tree-palm", category: "dis mekan" },
  ];

  for (const amenity of amenities) {
    await upsertById(prisma.amenity, amenity);
  }
}

async function seedVillas() {
  for (const demoVilla of demoVillas) {
    const meta = villaMetaBySlug[demoVilla.slug];
    const pricing = pricingBySlug[demoVilla.slug];
    const presentation = villaPresentationBySlug[demoVilla.slug];
    const translation = villaTranslationsBySlug[demoVilla.slug] ?? {};

    await upsertById(prisma.villa, {
      id: meta.id,
      companyId: meta.companyId,
      websiteId: meta.websiteId,
      regionId: meta.regionId,
      createdByUserId: meta.createdByUserId,
      title: demoVilla.title,
      titleEn: translation.titleEn ?? null,
      slug: demoVilla.slug,
      badge: demoVilla.badge ?? null,
      badgeEn: translation.badgeEn ?? null,
      category: demoVilla.category ?? null,
      categoryEn: translation.categoryEn ?? null,
      shortDescription: demoVilla.shortDescription,
      shortDescriptionEn: translation.shortDescriptionEn ?? null,
      description: demoVilla.description,
      descriptionEn: translation.descriptionEn ?? null,
      city: demoVilla.city,
      district: demoVilla.district ?? null,
      address: demoVilla.locationLabel,
      capacity: demoVilla.capacity,
      bedroomCount: demoVilla.bedroomCount,
      bathroomCount: demoVilla.bathroomCount,
      poolType: demoVilla.poolType ?? null,
      poolTypeEn: translation.poolTypeEn ?? null,
      nightlyBasePrice: money(demoVilla.nightlyPrice),
      cleaningFee: money(pricing.cleaningFee),
      minNightCount: pricing.minNightCount,
      currency: "TRY",
      status: demoVilla.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
      featured: Boolean(demoVilla.featured),
      averageRating: money(presentation.averageRating),
      reviewCount: presentation.reviewCount,
      isSuperhost: presentation.isSuperhost,
      coverImageUrl: demoVilla.coverImageUrl,
      coverAlt: demoVilla.coverAlt ?? null,
      coverAltEn: translation.coverAltEn ?? null,
      seoTitle: demoVilla.seoTitle ?? null,
      seoTitleEn: translation.seoTitleEn ?? null,
      seoDescription: demoVilla.seoDescription ?? null,
      seoDescriptionEn: translation.seoDescriptionEn ?? null,
      focusKeyword: demoVilla.focusKeyword ?? null,
      focusKeywordEn: translation.focusKeywordEn ?? null,
      createdAt: at(demoVilla.createdAt),
    });

    for (const [index, imageUrl] of demoVilla.imageUrls.entries()) {
      await upsertById(prisma.villaImage, {
        id: `${meta.id}-image-${index + 1}`,
        villaId: meta.id,
        url: imageUrl,
        storageKey: imageUrl.replace("/uploads/villas/", ""),
        altText:
          index === 0
            ? demoVilla.coverAlt ?? demoVilla.title
            : `${demoVilla.title} galeri gorseli ${index + 1}`,
        sortOrder: index + 1,
        isCover: imageUrl === demoVilla.coverImageUrl,
      });
    }

    for (const amenityId of meta.amenityIds) {
      await upsertById(prisma.villaAmenity, {
        id: `${meta.id}-${amenityId}`,
        villaId: meta.id,
        amenityId,
      });
    }

    for (const [index, block] of demoVilla.availabilityRanges.entries()) {
      await upsertById(prisma.villaAvailabilityBlock, {
        id: `${meta.id}-availability-${index + 1}`,
        villaId: meta.id,
        createdByUserId: meta.createdByUserId,
        startsAt: at(`${block.startDate}T00:00:00.000Z`),
        endsAt: at(`${block.endDate}T23:59:59.999Z`),
        blockType:
          block.status === "RESERVED"
            ? "RESERVED"
            : block.status === "MAINTENANCE"
              ? "MAINTENANCE"
              : "UNAVAILABLE",
        note: block.label,
      });
    }
  }

  const pricingRules = [
    {
      id: "seed-pricing-soleia-summer",
      villaId: "seed-villa-soleia",
      title: "Yuksek sezon temel fiyat",
      ruleType: "SEASONAL",
      startsAt: at("2026-06-01T00:00:00.000Z"),
      endsAt: at("2026-09-15T23:59:59.999Z"),
      nightlyPrice: money(21500),
      cleaningFee: money(3000),
      minNightCount: 4,
      isActive: true,
    },
    {
      id: "seed-pricing-verde-summer",
      villaId: "seed-villa-verde",
      title: "Balayi sezonu",
      ruleType: "SEASONAL",
      startsAt: at("2026-06-01T00:00:00.000Z"),
      endsAt: at("2026-08-31T23:59:59.999Z"),
      nightlyPrice: money(18900),
      cleaningFee: money(1800),
      minNightCount: 3,
      isActive: true,
    },
    {
      id: "seed-pricing-palm-summer",
      villaId: "seed-villa-palm",
      title: "Aile yaz sezonu",
      ruleType: "SEASONAL",
      startsAt: at("2026-06-01T00:00:00.000Z"),
      endsAt: at("2026-09-30T23:59:59.999Z"),
      nightlyPrice: money(16900),
      cleaningFee: money(4500),
      minNightCount: 4,
      isActive: true,
    },
    {
      id: "seed-pricing-marea-summer",
      villaId: "seed-villa-marea",
      title: "Grup yaz sezonu",
      ruleType: "SEASONAL",
      startsAt: at("2026-06-15T00:00:00.000Z"),
      endsAt: at("2026-09-30T23:59:59.999Z"),
      nightlyPrice: money(27900),
      cleaningFee: money(4500),
      minNightCount: 4,
      isActive: true,
    },
  ];

  for (const rule of pricingRules) {
    await upsertById(prisma.villaPricingRule, rule);
  }
}

async function seedCommerce() {
  const campaigns = [
    {
      id: ids.campaignSoleia,
      companyId: ids.companyVillavera,
      websiteId: ids.websiteVillavera,
      createdByUserId: ids.userVillaveraAdmin,
      name: "Ilkbahar Deniz Manzarasi Kampanyasi",
      slug: "ilkbahar-deniz-manzarasi-kampanyasi",
      status: "ACTIVE",
      discountMethod: "PERCENTAGE",
      discountValue: money(14),
      startsAt: at("2026-03-01T00:00:00.000Z"),
      endsAt: at("2026-04-15T23:59:59.999Z"),
      bannerLabel: "Erken Sezon %14",
      note: "Erken sezon doluluk hizlandirma kampanyasi.",
    },
    {
      id: ids.campaignPalm,
      companyId: ids.companySahil,
      websiteId: ids.websiteSahil,
      createdByUserId: ids.userSahilAdmin,
      name: "Ailelere Ozel Nisan Avantaji",
      slug: "ailelere-ozel-nisan-avantaji",
      status: "ACTIVE",
      discountMethod: "PERCENTAGE",
      discountValue: money(11),
      startsAt: at("2026-03-15T00:00:00.000Z"),
      endsAt: at("2026-04-20T23:59:59.999Z"),
      bannerLabel: "Ailelere %11",
      note: "Aile segmentinde talep toplamaya yonelik donemsel indirim.",
    },
    {
      id: ids.campaignMarea,
      companyId: ids.companySahil,
      websiteId: ids.websiteSahil,
      createdByUserId: ids.userSahilAdmin,
      name: "Grup Rezervasyon Yaz Oncesi",
      slug: "grup-rezervasyon-yaz-oncesi",
      status: "ACTIVE",
      discountMethod: "PERCENTAGE",
      discountValue: money(12),
      startsAt: at("2026-04-01T00:00:00.000Z"),
      endsAt: at("2026-05-20T23:59:59.999Z"),
      bannerLabel: "Grup icin %12",
      note: "Kalabalik grup taleplerini erkenden toplamak icin olusturuldu.",
    },
  ];

  for (const campaign of campaigns) {
    await upsertById(prisma.campaign, campaign);
  }

  for (const link of [
    { id: "seed-campaign-link-soleia", campaignId: ids.campaignSoleia, villaId: "seed-villa-soleia" },
    { id: "seed-campaign-link-palm", campaignId: ids.campaignPalm, villaId: "seed-villa-palm" },
    { id: "seed-campaign-link-marea", campaignId: ids.campaignMarea, villaId: "seed-villa-marea" },
  ]) {
    await upsertById(prisma.campaignVilla, link);
  }

  for (const coupon of [
    {
      id: ids.couponSummer,
      companyId: ids.companyVillavera,
      websiteId: ids.websiteVillavera,
      createdByUserId: ids.userVillaveraAdmin,
      code: "YAZBASLIYOR10",
      title: "Yaz Basliyor Kuponu",
      description: "Web talebinde kullanilan genel talep toplama kuponu.",
      status: "ACTIVE",
      discountMethod: "PERCENTAGE",
      discountValue: money(10),
      startsAt: at("2026-03-01T00:00:00.000Z"),
      endsAt: at("2026-05-31T23:59:59.999Z"),
      usageLimit: 25,
      usedCount: 3,
      minimumStayNights: 3,
      minimumOrderAmount: money(40000),
      isPublic: true,
    },
    {
      id: ids.couponHoneymoon,
      companyId: ids.companyVillavera,
      websiteId: ids.websiteVillavera,
      createdByUserId: ids.userVillaveraAdmin,
      code: "BALAYI7",
      title: "Balayi Ozel Kod",
      description: "Balayi segmenti icin villa bazli kupon.",
      status: "ACTIVE",
      discountMethod: "PERCENTAGE",
      discountValue: money(7),
      startsAt: at("2026-03-10T00:00:00.000Z"),
      endsAt: at("2026-06-30T23:59:59.999Z"),
      usageLimit: 12,
      usedCount: 1,
      minimumStayNights: 3,
      minimumOrderAmount: money(30000),
      isPublic: true,
    },
  ]) {
    await upsertById(prisma.coupon, coupon);
  }

  await upsertById(prisma.couponVilla, {
    id: "seed-coupon-link-honeymoon",
    couponId: ids.couponHoneymoon,
    villaId: "seed-villa-verde",
  });
}

async function seedReservations() {
  const requests = [
    {
      id: ids.requestMert,
      companyId: ids.companyVillavera,
      websiteId: ids.websiteVillavera,
      villaId: "seed-villa-soleia",
      assignedToUserId: ids.userVillaveraAdmin,
      status: "OFFER_SENT",
      source: "WEB",
      fullName: "Mert Yildiz",
      phone: "+90 532 100 10 10",
      email: "mert@example.com",
      guestCount: 6,
      checkIn: at("2026-04-22T15:00:00.000Z"),
      checkOut: at("2026-04-27T10:00:00.000Z"),
      message:
        "Havalimanindan transfer ve cocuk yatagi bilgisini de iletmenizi rica ederim.",
      couponCodeText: "YAZBASLIYOR10",
      quotedBaseAmount: money(92500),
      quotedDiscountAmount: money(20905),
      quotedCleaningFee: money(3000),
      quotedTotalAmount: money(74695),
      createdAt: at("2026-03-16T10:20:00.000Z"),
    },
    {
      id: ids.requestSeda,
      companyId: ids.companySahil,
      websiteId: ids.websiteSahil,
      villaId: "seed-villa-palm",
      assignedToUserId: ids.userSahilAdmin,
      status: "NEW",
      source: "WEB",
      fullName: "Seda Karaca",
      phone: "+90 530 222 22 22",
      email: "seda@example.com",
      guestCount: 8,
      checkIn: at("2026-04-18T15:00:00.000Z"),
      checkOut: at("2026-04-24T10:00:00.000Z"),
      message: "Bebek sandalyesi ve erken giris imkani hakkinda bilgi rica ederim.",
      quotedBaseAmount: money(89400),
      quotedDiscountAmount: money(9834),
      quotedCleaningFee: money(3000),
      quotedTotalAmount: money(82566),
      createdAt: at("2026-03-17T13:15:00.000Z"),
    },
    {
      id: ids.requestElif,
      companyId: ids.companyVillavera,
      websiteId: ids.websiteVillavera,
      villaId: "seed-villa-verde",
      assignedToUserId: ids.userVillaveraStaff,
      status: "APPROVED",
      source: "WEB",
      fullName: "Elif Demir",
      phone: "+90 542 333 33 33",
      email: "elif@example.com",
      guestCount: 2,
      checkIn: at("2026-05-10T15:00:00.000Z"),
      checkOut: at("2026-05-14T10:00:00.000Z"),
      message: "Balayi paketi ve oda susleme seceneklerini ogrenmek istiyorum.",
      couponCodeText: "BALAYI7",
      quotedBaseAmount: money(69000),
      quotedDiscountAmount: money(4830),
      quotedCleaningFee: money(1800),
      quotedTotalAmount: money(65970),
      createdAt: at("2026-03-15T16:45:00.000Z"),
    },
  ];

  for (const request of requests) {
    await upsertById(prisma.bookingRequest, request);
  }

  const histories = [
    {
      id: "seed-history-mert-1",
      bookingRequestId: ids.requestMert,
      oldStatus: null,
      newStatus: "NEW",
      changedByUserId: ids.userVillaveraAdmin,
      note: "Web formundan gelen yeni talep.",
      createdAt: at("2026-03-16T10:20:00.000Z"),
    },
    {
      id: "seed-history-mert-2",
      bookingRequestId: ids.requestMert,
      oldStatus: "NEW",
      newStatus: "OFFER_SENT",
      changedByUserId: ids.userVillaveraAdmin,
      note: "Fiyat teklifi ve transfer notlari iletildi.",
      createdAt: at("2026-03-16T12:10:00.000Z"),
    },
    {
      id: "seed-history-seda-1",
      bookingRequestId: ids.requestSeda,
      oldStatus: null,
      newStatus: "NEW",
      changedByUserId: ids.userSahilAdmin,
      note: "Aile segmentinden gelen taze lead.",
      createdAt: at("2026-03-17T13:15:00.000Z"),
    },
    {
      id: "seed-history-elif-1",
      bookingRequestId: ids.requestElif,
      oldStatus: null,
      newStatus: "NEW",
      changedByUserId: ids.userVillaveraAdmin,
      note: "Balayi talebi olusturuldu.",
      createdAt: at("2026-03-15T16:45:00.000Z"),
    },
    {
      id: "seed-history-elif-2",
      bookingRequestId: ids.requestElif,
      oldStatus: "NEW",
      newStatus: "APPROVED",
      changedByUserId: ids.userVillaveraAdmin,
      note: "On odeme alindi ve rezervasyon onaylandi.",
      createdAt: at("2026-03-18T09:30:00.000Z"),
    },
  ];

  for (const history of histories) {
    await upsertById(prisma.bookingRequestStatusHistory, history);
  }

  await upsertById(prisma.couponRedemption, {
    id: "seed-redemption-mert",
    couponId: ids.couponSummer,
    bookingRequestId: ids.requestMert,
    discountAmount: money(7955),
  });

  await upsertById(prisma.couponRedemption, {
    id: "seed-redemption-elif",
    couponId: ids.couponHoneymoon,
    bookingRequestId: ids.requestElif,
    discountAmount: money(4830),
  });

  const tasks = [
    {
      id: "seed-task-elif-01",
      companyId: ids.companyVillavera,
      bookingRequestId: ids.requestElif,
      villaId: "seed-villa-verde",
      assigneeUserId: ids.userVillaveraAdmin,
      taskType: "RESERVATION_TRACK",
      status: "DONE",
      priority: "HIGH",
      title: "Rezervasyon takip dosyasini ac",
      detail: "Elif Demir kaydi icin operasyon evragi ve villa ozetini kontrol et.",
      scheduledAt: at("2026-03-15T17:00:00.000Z"),
      scheduledTimeLabel: "17:00",
      assigneeLabel: "VillaVera Admin",
      sourceLabel: "AUTO_RESERVATION",
    },
    {
      id: "seed-task-elif-02",
      companyId: ids.companyVillavera,
      bookingRequestId: ids.requestElif,
      villaId: "seed-villa-verde",
      assigneeUserId: ids.userVillaveraStaff,
      taskType: "SUPPLIER_APPROVAL",
      status: "DONE",
      priority: "MEDIUM",
      title: "Tedarikci ve hazirlik onaylarini tamamla",
      detail: "Villa Verde Cove icin temizlik, havuz ve sarf kontrollerini dogrula.",
      scheduledAt: at("2026-05-08T10:00:00.000Z"),
      scheduledTimeLabel: "10:00",
      assigneeLabel: "Operasyon Personeli",
      supplierName: "Villa Hazirlik Ekibi",
      sourceLabel: "AUTO_RESERVATION",
    },
    {
      id: "seed-task-elif-03",
      companyId: ids.companyVillavera,
      bookingRequestId: ids.requestElif,
      villaId: "seed-villa-verde",
      assigneeUserId: ids.userVillaveraStaff,
      taskType: "REMINDER",
      status: "DONE",
      priority: "MEDIUM",
      title: "Misafir on bilgilendirme hatirlatmasi",
      detail: "Elif Demir ile giris saati, konum ve erisim notlarini teyit et.",
      scheduledAt: at("2026-05-09T18:00:00.000Z"),
      scheduledTimeLabel: "18:00",
      assigneeLabel: "Operasyon Personeli",
      sourceLabel: "AUTO_RESERVATION",
    },
    {
      id: "seed-task-elif-04",
      companyId: ids.companyVillavera,
      bookingRequestId: ids.requestElif,
      villaId: "seed-villa-verde",
      assigneeUserId: ids.userVillaveraStaff,
      taskType: "CHECK_IN",
      status: "DONE",
      priority: "HIGH",
      title: "Karsilama operasyonunu tamamla",
      detail: "Elif Demir icin giris gunu karsilama ve anahtar teslimini yonet.",
      scheduledAt: at("2026-05-10T15:00:00.000Z"),
      scheduledTimeLabel: "15:00",
      assigneeLabel: "Operasyon Personeli",
      sourceLabel: "AUTO_RESERVATION",
    },
    {
      id: "seed-task-elif-05",
      companyId: ids.companyVillavera,
      bookingRequestId: ids.requestElif,
      villaId: "seed-villa-verde",
      assigneeUserId: ids.userVillaveraStaff,
      taskType: "CHECK_OUT",
      status: "DONE",
      priority: "MEDIUM",
      title: "Cikis operasyonunu planla",
      detail: "Elif Demir ayrilisi sonrasi anahtar, depozito ve hasar kontrolunu kaydet.",
      scheduledAt: at("2026-05-14T10:00:00.000Z"),
      scheduledTimeLabel: "10:00",
      assigneeLabel: "Operasyon Personeli",
      sourceLabel: "AUTO_RESERVATION",
    },
    {
      id: "seed-task-elif-06",
      companyId: ids.companyVillavera,
      bookingRequestId: ids.requestElif,
      villaId: "seed-villa-verde",
      assigneeUserId: ids.userVillaveraStaff,
      taskType: "CLEANING",
      status: "DONE",
      priority: "HIGH",
      title: "Cikis sonrasi temizlik gorevini kapat",
      detail: "Villa Verde Cove icin bir sonraki konaklama oncesi detayli temizlik ve kontrol yap.",
      scheduledAt: at("2026-05-14T11:30:00.000Z"),
      scheduledTimeLabel: "11:30",
      assigneeLabel: "Operasyon Personeli",
      supplierName: "Housekeeping Partner",
      sourceLabel: "AUTO_RESERVATION",
    },
  ];

  for (const task of tasks) {
    await upsertById(prisma.operationTask, task);
  }

  await upsertById(prisma.invoice, {
    id: ids.invoiceElif,
    companyId: ids.companyVillavera,
    bookingRequestId: ids.requestElif,
    invoiceNumber: "VV-2026-0001",
    status: "PAID",
    issueDate: at("2026-03-18T09:30:00.000Z"),
    dueDate: at("2026-05-08T23:59:59.999Z"),
    subtotal: money(69000),
    discountTotal: money(4830),
    taxTotal: money(0),
    cleaningFee: money(1800),
    totalAmount: money(65970),
    paidTotal: money(65970),
    currency: "TRY",
  });

  const payments = [
    {
      id: ids.paymentElifDeposit,
      companyId: ids.companyVillavera,
      invoiceId: ids.invoiceElif,
      bookingRequestId: ids.requestElif,
      paymentType: "DEPOSIT",
      status: "PAID",
      title: "Kapora Tahsilati",
      method: "Banka Havalesi",
      amount: money(25000),
      currency: "TRY",
      dueDate: at("2026-03-20T23:59:59.999Z"),
      paidAt: at("2026-03-19T10:00:00.000Z"),
      externalReference: "VV-DEP-2026-001",
    },
    {
      id: ids.paymentElifBalance,
      companyId: ids.companyVillavera,
      invoiceId: ids.invoiceElif,
      bookingRequestId: ids.requestElif,
      paymentType: "BALANCE",
      status: "PAID",
      title: "Bakiye Tahsilati",
      method: "Kredi Karti Linki",
      amount: money(40970),
      currency: "TRY",
      dueDate: at("2026-05-08T23:59:59.999Z"),
      paidAt: at("2026-05-08T12:00:00.000Z"),
      externalReference: "VV-BAL-2026-001",
    },
  ];

  for (const payment of payments) {
    await upsertById(prisma.payment, payment);
  }

  const cashEntries = [
    {
      id: ids.cashElifDeposit,
      companyId: ids.companyVillavera,
      paymentId: ids.paymentElifDeposit,
      invoiceId: ids.invoiceElif,
      bookingRequestId: ids.requestElif,
      createdByUserId: ids.userVillaveraAdmin,
      direction: "INCOME",
      category: "On Odeme",
      title: "Elif Demir rezervasyon on odemesi",
      note: "Balayi paketi dahil ilk tahsilat.",
      amount: money(25000),
      currency: "TRY",
      entryDate: at("2026-03-19T10:00:00.000Z"),
      source: "AUTO_PAYMENT",
    },
    {
      id: ids.cashElifBalance,
      companyId: ids.companyVillavera,
      paymentId: ids.paymentElifBalance,
      invoiceId: ids.invoiceElif,
      bookingRequestId: ids.requestElif,
      createdByUserId: ids.userVillaveraAdmin,
      direction: "INCOME",
      category: "Bakiye Tahsilati",
      title: "Elif Demir rezervasyon bakiye tahsilati",
      note: "Check-in oncesi bakiye kapama odemesi.",
      amount: money(40970),
      currency: "TRY",
      entryDate: at("2026-05-08T12:00:00.000Z"),
      source: "AUTO_PAYMENT",
    },
  ];

  for (const entry of cashEntries) {
    await upsertById(prisma.cashLedgerEntry, entry);
  }

  await upsertById(prisma.guestReview, {
    id: ids.reviewElif,
    companyId: ids.companyVillavera,
    villaId: "seed-villa-verde",
    bookingRequestId: ids.requestElif,
    guestName: "Elif Demir",
    rating: 5,
    source: "DIRECT",
    status: "PUBLISHED",
    comment: "Mahremiyet, temizlik ve gun batimi atmosferi tam beklentimizi karsiladi.",
    staffNote: "Balayi segmenti icin referans yorum olarak one cikarilabilir.",
  });
}

async function seedAnalytics() {
  for (const event of [
    {
      id: "seed-view-soleia-1",
      villaId: "seed-villa-soleia",
      sessionId: "sess-soleia-001",
      userAgent: "Mozilla/5.0 Demo Browser",
      referer: "https://google.com",
      createdAt: at("2026-03-16T10:00:00.000Z"),
    },
    {
      id: "seed-view-palm-1",
      villaId: "seed-villa-palm",
      sessionId: "sess-palm-001",
      userAgent: "Mozilla/5.0 Demo Browser",
      referer: "https://instagram.com",
      createdAt: at("2026-03-17T13:00:00.000Z"),
    },
  ]) {
    await upsertById(prisma.villaViewEvent, event);
  }

  for (const session of [
    {
      id: "seed-live-soleia-1",
      villaId: "seed-villa-soleia",
      sessionId: "live-soleia-001",
      lastSeenAt: at("2026-06-01T09:00:00.000Z"),
    },
    {
      id: "seed-live-marea-1",
      villaId: "seed-villa-marea",
      sessionId: "live-marea-001",
      lastSeenAt: at("2026-06-01T09:05:00.000Z"),
    },
  ]) {
    await upsertById(prisma.villaLiveSession, session);
  }

  for (const metric of [
    {
      id: "seed-metric-soleia-2026-03-16",
      villaId: "seed-villa-soleia",
      metricDate: at("2026-03-16T00:00:00.000Z"),
      viewCount: 128,
      requestCount: 4,
      approvedCount: 1,
      couponUsageCount: 1,
      revenueTotal: money(0),
    },
    {
      id: "seed-metric-verde-2026-03-18",
      villaId: "seed-villa-verde",
      metricDate: at("2026-03-18T00:00:00.000Z"),
      viewCount: 94,
      requestCount: 2,
      approvedCount: 1,
      couponUsageCount: 1,
      revenueTotal: money(65970),
    },
    {
      id: "seed-metric-palm-2026-03-17",
      villaId: "seed-villa-palm",
      metricDate: at("2026-03-17T00:00:00.000Z"),
      viewCount: 88,
      requestCount: 1,
      approvedCount: 0,
      couponUsageCount: 0,
      revenueTotal: money(0),
    },
  ]) {
    await upsertById(prisma.villaDailyMetric, metric);
  }
}

async function seedCompanyOps() {
  await upsertById(prisma.agency, {
    id: ids.agencyVillavera,
    companyId: ids.companyVillavera,
    name: "VillaVera Direct Web",
    kind: "DIRECT_WEB",
    ownerName: "Growth Team",
    city: "Antalya",
    status: "ACTIVE",
    note: "Organik SEO ve landing bazli lead toplama kanali.",
    approvedRevenue: money(65970),
    openPipeline: money(74695),
  });

  await upsertById(prisma.agency, {
    id: ids.agencySahil,
    companyId: ids.companySahil,
    name: "Sahil Partner Network",
    kind: "PARTNER",
    ownerName: "Partner Sales",
    city: "Mugla",
    status: "ACTIVE",
    note: "Grup ve aile odakli partner acenta havuzu.",
    approvedRevenue: money(0),
    openPipeline: money(82566),
  });

  await upsertById(prisma.branch, {
    id: ids.branchVillavera,
    companyId: ids.companyVillavera,
    agencyId: ids.agencyVillavera,
    name: "VillaVera Kalkan Operasyon",
    city: "Antalya",
    phone: "+90 850 000 00 01",
    status: "ACTIVE",
  });

  await upsertById(prisma.branch, {
    id: ids.branchSahil,
    companyId: ids.companySahil,
    agencyId: ids.agencySahil,
    name: "Sahil Bodrum Saha Ekibi",
    city: "Mugla",
    phone: "+90 850 222 11 23",
    status: "ACTIVE",
  });

  await upsertById(prisma.internalMessage, {
    id: ids.messageVillavera,
    companyId: ids.companyVillavera,
    senderUserId: ids.userVillaveraAdmin,
    recipientLabel: "Operasyon Ekibi",
    subject: "Balayi paketi stok kontrolu",
    body: "Verde Cove icin 10 Mayis girisi oncesi balayi paketi detaylarini teyit edelim.",
    status: "RESOLVED",
    priority: "MEDIUM",
    relatedModule: "CRM",
    resolvedAt: at("2026-05-09T10:00:00.000Z"),
  });

  await upsertById(prisma.internalMessage, {
    id: ids.messageSahil,
    companyId: ids.companySahil,
    senderUserId: ids.userSahilAdmin,
    recipientLabel: "Finans",
    subject: "Palm Serenity aile paketi fiyat revizyonu",
    body: "Nisan kampanyasi sonrasi yeni fiyat tablosunu muhasebe tarafina gecelim.",
    status: "NEW",
    priority: "HIGH",
    relatedModule: "MUHASEBE",
  });

  await upsertById(prisma.commissionRule, {
    id: ids.commissionVillavera,
    companyId: ids.companyVillavera,
    scopeType: "WEB_DIRECT",
    scopeRefId: null,
    scopeLabel: "Web direct lead",
    percent: money(0),
    payoutRule: "Organik direct lead icin komisyon yok.",
    active: true,
  });

  await upsertById(prisma.commissionRule, {
    id: ids.commissionSahil,
    companyId: ids.companySahil,
    scopeType: "AGENCY",
    scopeRefId: ids.agencySahil,
    scopeLabel: "Partner Network",
    percent: money(8.5),
    payoutRule: "Tahsilat tamamlandiginda aylik mutabakat ile odeme.",
    active: true,
  });

  await prisma.companyMembership.update({
    where: { id: "seed-membership-villavera-admin" },
    data: { branchId: ids.branchVillavera },
  });

  await prisma.companyMembership.update({
    where: { id: "seed-membership-villavera-staff" },
    data: { branchId: ids.branchVillavera },
  });

  await prisma.companyMembership.update({
    where: { id: "seed-membership-sahil-admin" },
    data: { branchId: ids.branchSahil },
  });

  await prisma.companyMembership.update({
    where: { id: "seed-membership-sahil-finance" },
    data: { branchId: ids.branchSahil },
  });
}

async function seedSettingsAndResources() {
  const currencyRates = [
    {
      id: ids.currencyEurVillavera,
      companyId: ids.companyVillavera,
      code: "EUR",
      label: "Euro",
      buyRate: money(53.08),
      sellRate: money(53.23),
      sourceLabel: "TCMB Referans + Manuel Marj",
      status: "LIVE",
    },
    {
      id: ids.currencyUsdVillavera,
      companyId: ids.companyVillavera,
      code: "USD",
      label: "Amerikan Dolari",
      buyRate: money(48.42),
      sellRate: money(48.56),
      sourceLabel: "TCMB Referans + Manuel Marj",
      status: "LIVE",
    },
    {
      id: ids.currencyGbpSahil,
      companyId: ids.companySahil,
      code: "GBP",
      label: "Sterlin",
      buyRate: money(61.15),
      sellRate: money(61.42),
      sourceLabel: "Operasyon El Guncellemesi",
      status: "MANUAL",
    },
  ];

  for (const rate of currencyRates) {
    await upsertById(prisma.currencyRate, rate);
  }

  const paymentMethods = [
    {
      id: ids.paymentCardLinkVillavera,
      companyId: ids.companyVillavera,
      label: "Kredi Karti Linki",
      provider: "PayTR Demo",
      feePercent: money(3.4),
      settlementDays: 2,
      status: "ACTIVE",
      supportsInstallment: true,
      note: "Kalan odeme tahsilatlarinda varsayilan kanal olarak kullanilir.",
    },
    {
      id: ids.paymentBankVillavera,
      companyId: ids.companyVillavera,
      label: "Banka Havalesi",
      provider: "Banka Hesabi",
      feePercent: money(0),
      settlementDays: 0,
      status: "ACTIVE",
      supportsInstallment: false,
      note: "Kapora ve partner acenta tahsilatlarinda sik kullanilir.",
    },
    {
      id: ids.paymentPosSahil,
      companyId: ids.companySahil,
      label: "Ofis POS Tahsilati",
      provider: "Yapi POS",
      feePercent: money(2.1),
      settlementDays: 1,
      status: "PASSIVE",
      supportsInstallment: true,
      note: "Su an ofis disi operasyonlarda kapali tutuluyor.",
    },
  ];

  for (const method of paymentMethods) {
    await upsertById(prisma.paymentMethod, method);
  }

  const cacheGroups = [
    {
      id: ids.cacheHomeVillavera,
      companyId: ids.companyVillavera,
      label: "Public Ana Sayfa",
      target: "/",
      status: "HEALTHY",
      ttlMinutes: 30,
      warmIntervalMinutes: 15,
      lastWarmedAt: at("2026-05-18T08:40:00.000Z"),
      note: "Hero ve one cikan villalar bolumu bu gruptan besleniyor.",
    },
    {
      id: ids.cacheVillaVillavera,
      companyId: ids.companyVillavera,
      label: "Villa Detay Sayfalari",
      target: "/villalar/[slug]",
      status: "WARMING",
      ttlMinutes: 20,
      warmIntervalMinutes: 10,
      lastWarmedAt: at("2026-05-18T08:32:00.000Z"),
      note: "Uygunluk degisikligi oldugunda yeniden isitma tetiklenir.",
    },
    {
      id: ids.cacheSeoSahil,
      companyId: ids.companySahil,
      label: "Blog ve SEO Icerikleri",
      target: "/blog/*",
      status: "STALE",
      ttlMinutes: 60,
      warmIntervalMinutes: 45,
      lastWarmedAt: at("2026-05-17T21:10:00.000Z"),
      note: "Son SEO icerik guncellemesinden sonra yeniden warm bekliyor.",
    },
  ];

  for (const group of cacheGroups) {
    await upsertById(prisma.cacheGroup, group);
  }

  const documents = [
    {
      id: ids.documentCleaningVillavera,
      companyId: ids.companyVillavera,
      title: "Temizlik Kontrol Listesi",
      category: "Operasyon",
      audience: "Saha Ekibi",
      status: "ACTIVE",
      fileUrl: "/docs/temizlik-kontrol-listesi.pdf",
    },
    {
      id: ids.documentFinanceVillavera,
      companyId: ids.companyVillavera,
      title: "Tahsilat ve Iade Proseduru",
      category: "Muhasebe",
      audience: "Muhasebe + Rezervasyon",
      status: "ACTIVE",
      fileUrl: "/docs/tahsilat-iade-proseduru.pdf",
    },
    {
      id: ids.documentBrandSahil,
      companyId: ids.companySahil,
      title: "Yayin Dili ve Marka Rehberi",
      category: "Icerik",
      audience: "Web + CRM",
      status: "DRAFT",
      fileUrl: "/docs/marka-rehberi.pdf",
    },
  ];

  for (const document of documents) {
    await upsertById(prisma.documentAsset, document);
  }

  const shortcuts = [
    {
      id: ids.shortcutPanelVillavera,
      companyId: ids.companyVillavera,
      title: "Backoffice Ana Sayfa",
      url: "/panel",
      category: "Panel",
      description: "Operasyon ekibinin gunluk olarak en sik kullandigi dashboard girisi.",
      status: "ACTIVE",
    },
    {
      id: ids.shortcutPublicVillavera,
      companyId: ids.companyVillavera,
      title: "Canli Villa Listeleme",
      url: "/villalar",
      category: "Public",
      description: "Vitrin tarafindaki canli listeleme sayfasini hizli acmak icin kullanilir.",
      status: "ACTIVE",
    },
    {
      id: ids.shortcutFinanceSahil,
      companyId: ids.companySahil,
      title: "Muhasebe Genel Bakis",
      url: "/panel/muhasebe",
      category: "Muhasebe",
      description: "Tahsilat ve bakiye akislarini hizli kontrol etmek icin ayri kisayol.",
      status: "HIDDEN",
    },
  ];

  for (const shortcut of shortcuts) {
    await upsertById(prisma.shortcutLink, shortcut);
  }

  const externalServices = [
    {
      id: ids.externalSearchConsoleVillavera,
      companyId: ids.companyVillavera,
      name: "Google Search Console",
      url: "https://search.google.com/search-console",
      ownerLabel: "SEO Ekibi",
      category: "SEO",
      status: "ACTIVE",
      note: "Organik sorgu ve indeksleme takibi icin kullaniliyor.",
    },
    {
      id: ids.externalAnalyticsVillavera,
      companyId: ids.companyVillavera,
      name: "Google Analytics",
      url: "https://analytics.google.com/",
      ownerLabel: "Pazarlama Ekibi",
      category: "Analitik",
      status: "WARNING",
      note: "Son event naming revizyonundan sonra panel tarafinda kontrol isteniyor.",
    },
    {
      id: ids.externalMailSahil,
      companyId: ids.companySahil,
      name: "Mail Provider",
      url: "https://mail.provider.demo",
      ownerLabel: "CRM Ekibi",
      category: "Iletisim",
      status: "OFFLINE",
      note: "SMTP limit uyarisi nedeniyle gecici olarak devre disi.",
    },
  ];

  for (const service of externalServices) {
    await upsertById(prisma.externalService, service);
  }

  const documentLinks = [
    {
      id: ids.docLinkKvkkVillavera,
      companyId: ids.companyVillavera,
      title: "KVKK Metin Paketi",
      url: "/kvkk",
      category: "Yasal",
      status: "ACTIVE",
    },
    {
      id: ids.docLinkFinanceVillavera,
      companyId: ids.companyVillavera,
      title: "Tahsilat Proseduru Notlari",
      url: "/docs/tahsilat-iade-proseduru.pdf",
      category: "Muhasebe",
      status: "ACTIVE",
    },
    {
      id: ids.docLinkSeoSahil,
      companyId: ids.companySahil,
      title: "SEO Icerik Takvimi",
      url: "/docs/seo-icerik-takvimi.xlsx",
      category: "Icerik",
      status: "DRAFT",
    },
  ];

  for (const link of documentLinks) {
    await upsertById(prisma.documentLink, link);
  }

  const parameterGroups = [
    {
      id: ids.parameterThemesVillavera,
      companyId: ids.companyVillavera,
      label: "Villa Temalari",
      scope: "Vitrin filtreleri",
      itemCount: 6,
      sampleItems: ["Balayi", "Muhafazakar", "Deniz Manzarali"],
      status: "ACTIVE",
      note: "Listeleme ve landing iceriklerinde kategori segmentini sabitler.",
    },
    {
      id: ids.parameterPoolsVillavera,
      companyId: ids.companyVillavera,
      label: "Havuz Tipleri",
      scope: "Villa detay kartlari",
      itemCount: 4,
      sampleItems: ["Izole Havuz", "Sonsuzluk Havuzu", "Cocuk Havuzu"],
      status: "ACTIVE",
      note: "Villa formundaki havuz tipi secimlerini normalize eder.",
    },
    {
      id: ids.parameterServicesSahil,
      companyId: ids.companySahil,
      label: "Servis Paketleri",
      scope: "Ek hizmet teklifleri",
      itemCount: 5,
      sampleItems: ["Transfer", "Erken Giris", "Balayi Susleme"],
      status: "DRAFT",
      note: "Rezervasyon teklif adiminda ek hizmet paketleri icin kullanilacak.",
    },
  ];

  for (const group of parameterGroups) {
    await upsertById(prisma.parameterGroup, group);
  }
}

async function seedMarketing() {
  const items = [
    {
      type: "landing",
      record: {
        id: ids.landingVillavera,
        companyId: ids.companyVillavera,
        websiteId: ids.websiteVillavera,
        title: "Kalkan deniz manzarali villa koleksiyonu",
        slug: "kalkan-deniz-manzarali-villalar",
        targetRegion: "Kalkan",
        focusKeyword: "kalkan deniz manzarali villa",
        status: "LIVE",
        heroText: "Kalkan bolgesinde premium deniz manzarali secimler.",
        leadCount: 24,
      },
    },
    {
      type: "landing",
      record: {
        id: ids.landingSahil,
        companyId: ids.companySahil,
        websiteId: ids.websiteSahil,
        title: "Bodrum kalabalik grup villalari",
        slug: "bodrum-kalabalik-grup-villalari",
        targetRegion: "Bodrum",
        focusKeyword: "bodrum grup villasi",
        status: "LIVE",
        heroText: "Bodrum ve Fethiye ekseninde aile ve grup odakli secimler.",
        leadCount: 16,
      },
    },
  ];

  for (const item of items) {
    await upsertById(prisma.landingPage, item.record);
  }

  await upsertById(prisma.seoContent, {
    id: ids.seoVillavera,
    companyId: ids.companyVillavera,
    websiteId: ids.websiteVillavera,
    title: "Kalkan deniz manzarali villa landing SEO plani",
    contentType: "LANDING",
    targetUrl: "/villalar/kalkan-deniz-manzarali-villalar",
    primaryKeyword: "kalkan deniz manzarali villa",
    status: "PUBLISHED",
    seoScore: 91,
  });

  await upsertById(prisma.seoContent, {
    id: ids.seoSahil,
    companyId: ids.companySahil,
    websiteId: ids.websiteSahil,
    title: "Bodrum grup villa landing SEO plani",
    contentType: "LANDING",
    targetUrl: "/villalar/bodrum-kalabalik-grup-villalari",
    primaryKeyword: "bodrum grup villasi",
    status: "IN_PROGRESS",
    seoScore: 74,
  });

  await upsertById(prisma.blogPost, {
    id: ids.blogVillavera,
    companyId: ids.companyVillavera,
    websiteId: ids.websiteVillavera,
    title: "Kalkan'da deniz manzarali villa secimi icin 7 ipucu",
    slug: "kalkanda-deniz-manzarali-villa-secimi-icin-7-ipucu",
    excerpt: "Premium segmentte talebi etkileyen konum, manzara ve mahremiyet kriterleri.",
    content:
      "Kalkan bolgesinde premium villa seciminde yalnizca manzara degil, operasyon kolayligi ve transfer akisi da donusumu belirler.",
    coverImageUrl: "/uploads/blog/villavera-kalkan-guide.webp",
    seoTitle: "Kalkan'da deniz manzarali villa secimi rehberi",
    seoDescription:
      "Kalkan'da premium villa arayan misafirler icin lokasyon, manzara ve sezon fiyatlamasi rehberi.",
    status: "PUBLISHED",
    publishedAt: at("2026-03-20T09:00:00.000Z"),
  });

  await upsertById(prisma.blogPost, {
    id: ids.blogSahil,
    companyId: ids.companySahil,
    websiteId: ids.websiteSahil,
    title: "Fethiye ve Bodrum'da aile villasi secerken dikkat edilmesi gerekenler",
    slug: "fethiye-ve-bodrumda-aile-villasi-secerken-dikkat-edilmesi-gerekenler",
    excerpt: "Kalabalik aile segmentinde bahce, guvenlik ve operasyon detaylari.",
    content:
      "Aile segmentinde yalnizca kapasite degil, bahce kullanimi, transfer mesafesi ve check-in operasyonu da belirleyici olur.",
    coverImageUrl: "/uploads/blog/sahil-family-guide.webp",
    seoTitle: "Fethiye ve Bodrum aile villasi rehberi",
    seoDescription:
      "Fethiye ve Bodrum'da aile odakli villa secerken kapasite, bahce ve operasyon kontrol listesi.",
    status: "PUBLISHED",
    publishedAt: at("2026-03-21T09:00:00.000Z"),
  });
}

async function seedCalendarSync() {
  const sources = [
    {
      id: ids.syncSourceSoleia,
      companyId: ids.companyVillavera,
      villaId: "seed-villa-soleia",
      channelName: "Airbnb Export",
      sourceUrl: "https://ical.example.com/soleia-airbnb.ics",
      direction: "EXPORT",
      active: true,
      status: "HEALTHY",
      lastSyncedAt: at("2026-06-01T07:45:00.000Z"),
    },
    {
      id: ids.syncSourcePalm,
      companyId: ids.companySahil,
      villaId: "seed-villa-palm",
      channelName: "Booking Import",
      sourceUrl: "https://ical.example.com/palm-booking.ics",
      direction: "IMPORT",
      active: true,
      status: "WARNING",
      lastSyncedAt: at("2026-06-01T07:40:00.000Z"),
    },
  ];

  for (const source of sources) {
    await upsertById(prisma.calendarSyncSource, source);
  }

  for (const mapping of [
    {
      id: ids.syncMappingSoleia,
      companyId: ids.companyVillavera,
      villaId: "seed-villa-soleia",
      channelName: "Airbnb Export",
      remoteCalendarName: "Villa Soleia Lagoon",
      syncMode: "TWO_WAY",
      active: true,
    },
    {
      id: ids.syncMappingPalm,
      companyId: ids.companySahil,
      villaId: "seed-villa-palm",
      channelName: "Booking Import",
      remoteCalendarName: "Palm Serenity Family Villa",
      syncMode: "IMPORT_ONLY",
      active: true,
    },
  ]) {
    await upsertById(prisma.calendarSyncMapping, mapping);
  }

  for (const log of [
    {
      id: ids.syncLogSoleia,
      companyId: ids.companyVillavera,
      sourceId: ids.syncSourceSoleia,
      villaId: "seed-villa-soleia",
      channelName: "Airbnb Export",
      outcome: "SUCCESS",
      eventCount: 4,
      message: "Takvim bloklari karsilikli senkronize edildi.",
      createdAt: at("2026-06-01T07:45:00.000Z"),
    },
    {
      id: ids.syncLogPalm,
      companyId: ids.companySahil,
      sourceId: ids.syncSourcePalm,
      villaId: "seed-villa-palm",
      channelName: "Booking Import",
      outcome: "WARNING",
      eventCount: 2,
      message: "Iki olay akti, bir rezervasyonun cikis tarihi manuel kontrol bekliyor.",
      createdAt: at("2026-06-01T07:40:00.000Z"),
    },
  ]) {
    await upsertById(prisma.calendarSyncLog, log);
  }
}

async function seedAudit() {
  const logs = [
    {
      id: ids.auditCompanyCreate,
      companyId: null,
      actorUserId: ids.userSuperAdmin,
      action: "company.seeded",
      entityType: "Company",
      entityId: ids.companyVillavera,
      summary: "VillaVera demo tenant'i olusturuldu.",
      metadata: { companySlug: "villavera", source: "prisma-seed" },
      ipAddress: "127.0.0.1",
    },
    {
      id: ids.auditRequestApprove,
      companyId: ids.companyVillavera,
      actorUserId: ids.userVillaveraAdmin,
      action: "booking_request.approved",
      entityType: "BookingRequest",
      entityId: ids.requestElif,
      summary: "Elif Demir rezervasyonu onaylandi ve operasyon akisi olusturuldu.",
      metadata: { invoiceId: ids.invoiceElif, taskCount: 6 },
      ipAddress: "127.0.0.1",
    },
    {
      id: ids.auditCouponSeed,
      companyId: ids.companyVillavera,
      actorUserId: ids.userVillaveraAdmin,
      action: "coupon.seeded",
      entityType: "Coupon",
      entityId: ids.couponHoneymoon,
      summary: "Balayi kuponu baslangic verisi olarak eklendi.",
      metadata: { code: "BALAYI7" },
      ipAddress: "127.0.0.1",
    },
  ];

  for (const log of logs) {
    await upsertById(prisma.auditLog, log);
  }
}

async function main() {
  await seedPlatform();
  await seedCompanies();
  await seedUsers();
  await seedDefinitions();
  await seedVillas();
  await seedCommerce();
  await seedReservations();
  await seedAnalytics();
  await seedCompanyOps();
  await seedSettingsAndResources();
  await seedMarketing();
  await seedCalendarSync();
  await seedAudit();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Prisma seed tamamlandi.");
  })
  .catch(async (error) => {
    console.error("Prisma seed sirasinda hata olustu.");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
