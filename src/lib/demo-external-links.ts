export type DemoShortcutStatus = "ACTIVE" | "HIDDEN";
export type DemoExternalServiceStatus = "ACTIVE" | "WARNING" | "OFFLINE";
export type DemoDocumentLinkStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type DemoShortcutRecord = {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  status: DemoShortcutStatus;
  updatedAt: string;
};

export type DemoExternalServiceRecord = {
  id: string;
  name: string;
  url: string;
  ownerLabel: string;
  category: string;
  status: DemoExternalServiceStatus;
  note: string;
  updatedAt: string;
};

export type DemoDocumentLinkRecord = {
  id: string;
  title: string;
  url: string;
  category: string;
  status: DemoDocumentLinkStatus;
  updatedAt: string;
};

export const seedDemoShortcuts: DemoShortcutRecord[] = [
  {
    id: "shortcut-panel-home",
    title: "Backoffice Ana Sayfa",
    url: "/panel",
    category: "Panel",
    description: "Operasyon ekibinin gunluk olarak en sik kullandigi dashboard girisi.",
    status: "ACTIVE",
    updatedAt: "2026-05-18T08:10:00.000Z",
  },
  {
    id: "shortcut-public-villas",
    title: "Canli Villa Listeleme",
    url: "/villalar",
    category: "Public",
    description: "Vitrin tarafindaki canli listeleme sayfasini hizli acmak icin kullanilir.",
    status: "ACTIVE",
    updatedAt: "2026-05-18T08:12:00.000Z",
  },
  {
    id: "shortcut-finance-overview",
    title: "Muhasebe Genel Bakis",
    url: "/panel/muhasebe",
    category: "Muhasebe",
    description: "Tahsilat ve bakiye akislarini hizli kontrol etmek icin ayri kisayol.",
    status: "HIDDEN",
    updatedAt: "2026-05-17T15:00:00.000Z",
  },
];

export const seedDemoExternalServices: DemoExternalServiceRecord[] = [
  {
    id: "service-search-console",
    name: "Google Search Console",
    url: "https://search.google.com/search-console",
    ownerLabel: "SEO Ekibi",
    category: "SEO",
    status: "ACTIVE",
    note: "Organik sorgu ve indeksleme takibi icin kullaniliyor.",
    updatedAt: "2026-05-18T07:35:00.000Z",
  },
  {
    id: "service-analytics",
    name: "Google Analytics",
    url: "https://analytics.google.com/",
    ownerLabel: "Pazarlama Ekibi",
    category: "Analitik",
    status: "WARNING",
    note: "Son event naming revizyonundan sonra panel tarafinda kontrol isteniyor.",
    updatedAt: "2026-05-17T17:20:00.000Z",
  },
  {
    id: "service-mail-provider",
    name: "Mail Provider",
    url: "https://mail.provider.demo",
    ownerLabel: "CRM Ekibi",
    category: "Iletisim",
    status: "OFFLINE",
    note: "SMTP limit uyarisi nedeniyle gecici olarak devre disi.",
    updatedAt: "2026-05-16T14:45:00.000Z",
  },
];

export const seedDemoDocumentLinks: DemoDocumentLinkRecord[] = [
  {
    id: "doclink-kvkk",
    title: "KVKK Metin Paketi",
    url: "/kvkk",
    category: "Yasal",
    status: "ACTIVE",
    updatedAt: "2026-05-18T08:05:00.000Z",
  },
  {
    id: "doclink-tahsilat",
    title: "Tahsilat Proseduru Notlari",
    url: "/docs/tahsilat-iade-proseduru.pdf",
    category: "Muhasebe",
    status: "ACTIVE",
    updatedAt: "2026-05-16T09:30:00.000Z",
  },
  {
    id: "doclink-seo-plan",
    title: "SEO Icerik Takvimi",
    url: "/docs/seo-icerik-takvimi.xlsx",
    category: "Icerik",
    status: "DRAFT",
    updatedAt: "2026-05-15T11:40:00.000Z",
  },
];

export function getShortcutStatusLabel(status: DemoShortcutStatus) {
  return status === "ACTIVE" ? "Aktif" : "Gizli";
}

export function getShortcutStatusTone(status: DemoShortcutStatus) {
  return status === "ACTIVE"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

export function getExternalServiceStatusLabel(status: DemoExternalServiceStatus) {
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "WARNING":
      return "Uyari";
    case "OFFLINE":
      return "Erisilemiyor";
    default:
      return status;
  }
}

export function getExternalServiceStatusTone(status: DemoExternalServiceStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "WARNING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export function getDocumentLinkStatusLabel(status: DemoDocumentLinkStatus) {
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

export function getDocumentLinkStatusTone(status: DemoDocumentLinkStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "DRAFT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}
