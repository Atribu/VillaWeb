export type DemoDefinitionStatus = "ACTIVE" | "DRAFT" | "PASSIVE";

export type DemoRegionAirportRecord = {
  id: string;
  regionLabel: string;
  city: string;
  districtScope: string[];
  airportCode: string;
  airportName: string;
  driveMinutes: number;
  status: DemoDefinitionStatus;
  villaCount: number;
  updatedAt: string;
};

export type DemoParameterGroupRecord = {
  id: string;
  label: string;
  scope: string;
  itemCount: number;
  sampleItems: string[];
  status: DemoDefinitionStatus;
  note: string;
  updatedAt: string;
};

export const seedDemoRegionAirportRecords: DemoRegionAirportRecord[] = [
  {
    id: "region-kalkan-kas",
    regionLabel: "Kalkan & Kas Hatti",
    city: "Antalya",
    districtScope: ["Kalkan", "Kas"],
    airportCode: "DLM",
    airportName: "Dalaman Havalimani",
    driveMinutes: 135,
    status: "ACTIVE",
    villaCount: 0,
    updatedAt: "2026-05-18T08:10:00.000Z",
  },
  {
    id: "region-fethiye-oludeniz",
    regionLabel: "Fethiye & Oludeniz",
    city: "Mugla",
    districtScope: ["Fethiye"],
    airportCode: "DLM",
    airportName: "Dalaman Havalimani",
    driveMinutes: 55,
    status: "ACTIVE",
    villaCount: 0,
    updatedAt: "2026-05-18T08:10:00.000Z",
  },
  {
    id: "region-bodrum-yalikavak",
    regionLabel: "Bodrum & Yalikavak",
    city: "Mugla",
    districtScope: ["Bodrum"],
    airportCode: "BJV",
    airportName: "Milas Bodrum Havalimani",
    driveMinutes: 48,
    status: "DRAFT",
    villaCount: 0,
    updatedAt: "2026-05-17T15:20:00.000Z",
  },
];

export const seedDemoParameterGroups: DemoParameterGroupRecord[] = [
  {
    id: "param-villa-temalari",
    label: "Villa Temalari",
    scope: "Vitrin filtreleri",
    itemCount: 6,
    sampleItems: ["Balayi", "Muhafazakar", "Deniz Manzarali"],
    status: "ACTIVE",
    note: "Listeleme ve landing iceriklerinde kategori segmentini sabitler.",
    updatedAt: "2026-05-18T07:40:00.000Z",
  },
  {
    id: "param-havuz-tipleri",
    label: "Havuz Tipleri",
    scope: "Villa detay kartlari",
    itemCount: 4,
    sampleItems: ["Izole Havuz", "Sonsuzluk Havuzu", "Cocuk Havuzu"],
    status: "ACTIVE",
    note: "Villa formundaki havuz tipi secimlerini normalize eder.",
    updatedAt: "2026-05-17T13:35:00.000Z",
  },
  {
    id: "param-servis-paketleri",
    label: "Servis Paketleri",
    scope: "Ek hizmet teklifleri",
    itemCount: 5,
    sampleItems: ["Transfer", "Erken Giris", "Balayi Susleme"],
    status: "DRAFT",
    note: "Rezervasyon teklif adiminda ek hizmet paketleri icin kullanilacak.",
    updatedAt: "2026-05-16T10:50:00.000Z",
  },
];

export function getDefinitionStatusLabel(status: DemoDefinitionStatus) {
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "DRAFT":
      return "Taslak";
    case "PASSIVE":
      return "Pasif";
    default:
      return status;
  }
}

export function getDefinitionStatusTone(status: DemoDefinitionStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "DRAFT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}
