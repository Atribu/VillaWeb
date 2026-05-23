export type DemoCurrencyRateStatus = "LIVE" | "MANUAL" | "STALE";
export type DemoPaymentMethodStatus = "ACTIVE" | "PASSIVE";
export type DemoCacheGroupStatus = "HEALTHY" | "WARMING" | "STALE";
export type DemoDocumentStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type DemoCurrencyRateRecord = {
  id: string;
  code: string;
  label: string;
  buyRate: number;
  sellRate: number;
  sourceLabel: string;
  status: DemoCurrencyRateStatus;
  updatedAt: string;
};

export type DemoPaymentMethodRecord = {
  id: string;
  label: string;
  provider: string;
  feePercent: number;
  settlementDays: number;
  status: DemoPaymentMethodStatus;
  supportsInstallment: boolean;
  note: string;
  updatedAt: string;
};

export type DemoCacheGroupRecord = {
  id: string;
  label: string;
  target: string;
  status: DemoCacheGroupStatus;
  ttlMinutes: number;
  warmIntervalMinutes: number;
  lastWarmedAt: string;
  note: string;
};

export type DemoSystemDefaults = {
  leadResponseMinutes: number;
  defaultMinNightCount: number;
  defaultCleaningLeadHours: number;
  supportPhone: string;
  supportEmail: string;
  defaultCurrency: string;
  requestReminderHours: number;
  updatedAt: string;
};

export type DemoDocumentRecord = {
  id: string;
  title: string;
  category: string;
  audience: string;
  status: DemoDocumentStatus;
  fileUrl: string;
  updatedAt: string;
};

export const seedDemoCurrencyRates: DemoCurrencyRateRecord[] = [
  {
    id: "currency-eur",
    code: "EUR",
    label: "Euro",
    buyRate: 53.08,
    sellRate: 53.23,
    sourceLabel: "TCMB Referans + Manuel Marj",
    status: "LIVE",
    updatedAt: "2026-05-18T08:05:00.000Z",
  },
  {
    id: "currency-usd",
    code: "USD",
    label: "Amerikan Dolari",
    buyRate: 48.42,
    sellRate: 48.56,
    sourceLabel: "TCMB Referans + Manuel Marj",
    status: "LIVE",
    updatedAt: "2026-05-18T08:05:00.000Z",
  },
  {
    id: "currency-gbp",
    code: "GBP",
    label: "Sterlin",
    buyRate: 61.15,
    sellRate: 61.42,
    sourceLabel: "Operasyon El Guncellemesi",
    status: "MANUAL",
    updatedAt: "2026-05-17T17:20:00.000Z",
  },
];

export const seedDemoPaymentMethods: DemoPaymentMethodRecord[] = [
  {
    id: "payment-card-link",
    label: "Kredi Karti Linki",
    provider: "PayTR Demo",
    feePercent: 3.4,
    settlementDays: 2,
    status: "ACTIVE",
    supportsInstallment: true,
    note: "Kalan odeme tahsilatlarinda varsayilan kanal olarak kullanilir.",
    updatedAt: "2026-05-16T12:00:00.000Z",
  },
  {
    id: "payment-bank-transfer",
    label: "Banka Havalesi",
    provider: "Banka Hesabi",
    feePercent: 0,
    settlementDays: 0,
    status: "ACTIVE",
    supportsInstallment: false,
    note: "Kapora ve partner acenta tahsilatlarinda sik kullanilir.",
    updatedAt: "2026-05-16T12:05:00.000Z",
  },
  {
    id: "payment-pos-office",
    label: "Ofis POS Tahsilati",
    provider: "Yapi POS",
    feePercent: 2.1,
    settlementDays: 1,
    status: "PASSIVE",
    supportsInstallment: true,
    note: "Su an ofis disi operasyonlarda kapali tutuluyor.",
    updatedAt: "2026-05-15T14:45:00.000Z",
  },
];

export const seedDemoCacheGroups: DemoCacheGroupRecord[] = [
  {
    id: "cache-public-home",
    label: "Public Ana Sayfa",
    target: "/",
    status: "HEALTHY",
    ttlMinutes: 30,
    warmIntervalMinutes: 15,
    lastWarmedAt: "2026-05-18T08:40:00.000Z",
    note: "Hero ve one cikan villalar bolumu bu gruptan besleniyor.",
  },
  {
    id: "cache-villa-detail",
    label: "Villa Detay Sayfalari",
    target: "/villalar/[slug]",
    status: "WARMING",
    ttlMinutes: 20,
    warmIntervalMinutes: 10,
    lastWarmedAt: "2026-05-18T08:32:00.000Z",
    note: "Uygunluk degisikligi oldugunda yeniden isitma tetiklenir.",
  },
  {
    id: "cache-blog-seo",
    label: "Blog ve SEO Icerikleri",
    target: "/blog/*",
    status: "STALE",
    ttlMinutes: 60,
    warmIntervalMinutes: 45,
    lastWarmedAt: "2026-05-17T21:10:00.000Z",
    note: "Son SEO icerik guncellemesinden sonra yeniden warm bekliyor.",
  },
];

export const seedDemoSystemDefaults: DemoSystemDefaults = {
  leadResponseMinutes: 20,
  defaultMinNightCount: 3,
  defaultCleaningLeadHours: 6,
  supportPhone: "+90 850 850 20 20",
  supportEmail: "operasyon@villaview.local",
  defaultCurrency: "TRY",
  requestReminderHours: 12,
  updatedAt: "2026-05-17T18:00:00.000Z",
};

export const seedDemoDocuments: DemoDocumentRecord[] = [
  {
    id: "doc-cleaning-checklist",
    title: "Temizlik Kontrol Listesi",
    category: "Operasyon",
    audience: "Saha Ekibi",
    status: "ACTIVE",
    fileUrl: "/docs/temizlik-kontrol-listesi.pdf",
    updatedAt: "2026-05-14T10:00:00.000Z",
  },
  {
    id: "doc-payment-procedure",
    title: "Tahsilat ve Iade Proseduru",
    category: "Muhasebe",
    audience: "Muhasebe + Rezervasyon",
    status: "ACTIVE",
    fileUrl: "/docs/tahsilat-iade-proseduru.pdf",
    updatedAt: "2026-05-12T15:30:00.000Z",
  },
  {
    id: "doc-brand-tone",
    title: "Yayin Dili ve Marka Rehberi",
    category: "Icerik",
    audience: "Web + CRM",
    status: "DRAFT",
    fileUrl: "/docs/marka-rehberi.pdf",
    updatedAt: "2026-05-10T09:25:00.000Z",
  },
];

export function getCurrencyRateStatusLabel(status: DemoCurrencyRateStatus) {
  switch (status) {
    case "LIVE":
      return "Canli";
    case "MANUAL":
      return "Manuel";
    case "STALE":
      return "Guncel Degil";
    default:
      return status;
  }
}

export function getCurrencyRateStatusTone(status: DemoCurrencyRateStatus) {
  switch (status) {
    case "LIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "MANUAL":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function getPaymentMethodStatusLabel(status: DemoPaymentMethodStatus) {
  return status === "ACTIVE" ? "Aktif" : "Pasif";
}

export function getPaymentMethodStatusTone(status: DemoPaymentMethodStatus) {
  return status === "ACTIVE"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

export function getCacheGroupStatusLabel(status: DemoCacheGroupStatus) {
  switch (status) {
    case "HEALTHY":
      return "Saglikli";
    case "WARMING":
      return "Isitiliyor";
    case "STALE":
      return "Bayat";
    default:
      return status;
  }
}

export function getCacheGroupStatusTone(status: DemoCacheGroupStatus) {
  switch (status) {
    case "HEALTHY":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "WARMING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function getDocumentStatusLabel(status: DemoDocumentStatus) {
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "DRAFT":
      return "Taslak";
    case "ARCHIVED":
      return "Arsiv";
    default:
      return status;
  }
}

export function getDocumentStatusTone(status: DemoDocumentStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "DRAFT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}
