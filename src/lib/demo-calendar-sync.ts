import { seedVillaCatalog } from "@/lib/villa-catalog";

export type DemoCalendarSourceStatus = "HEALTHY" | "WARNING" | "ERROR";
export type DemoSyncMode = "IMPORT_ONLY" | "TWO_WAY";
export type DemoSyncOutcome = "SUCCESS" | "WARNING" | "ERROR";

export type DemoIcalSourceRecord = {
  id: string;
  companyId?: string;
  villaSlug: string;
  villaTitle: string;
  channelName: string;
  sourceUrl: string;
  direction: "IMPORT" | "EXPORT";
  active: boolean;
  status: DemoCalendarSourceStatus;
  lastSyncedAt: string;
};

export type DemoChannelMappingRecord = {
  id: string;
  companyId?: string;
  villaSlug: string;
  villaTitle: string;
  channelName: string;
  remoteCalendarName: string;
  syncMode: DemoSyncMode;
  active: boolean;
  updatedAt: string;
};

export type DemoSyncLogRecord = {
  id: string;
  companyId?: string;
  sourceId: string;
  villaSlug: string;
  villaTitle: string;
  channelName: string;
  outcome: DemoSyncOutcome;
  eventCount: number;
  message: string;
  createdAt: string;
};

export const seedDemoIcalSources: DemoIcalSourceRecord[] = [
  {
    id: "ical-soleia-air",
    villaSlug: seedVillaCatalog[0].slug,
    villaTitle: seedVillaCatalog[0].title,
    channelName: "Airbnb Mirror",
    sourceUrl: "https://channels.demo/soleia/airbnb.ics",
    direction: "IMPORT",
    active: true,
    status: "HEALTHY",
    lastSyncedAt: "2026-05-18T08:15:00.000Z",
  },
  {
    id: "ical-palm-booking",
    villaSlug: seedVillaCatalog[1].slug,
    villaTitle: seedVillaCatalog[1].title,
    channelName: "Booking Feed",
    sourceUrl: "https://channels.demo/palm/booking.ics",
    direction: "IMPORT",
    active: true,
    status: "WARNING",
    lastSyncedAt: "2026-05-18T07:55:00.000Z",
  },
  {
    id: "ical-verde-export",
    villaSlug: seedVillaCatalog[2].slug,
    villaTitle: seedVillaCatalog[2].title,
    channelName: "Direct Export",
    sourceUrl: "https://villaweb.local/ical/verde-cove.ics",
    direction: "EXPORT",
    active: true,
    status: "HEALTHY",
    lastSyncedAt: "2026-05-18T06:40:00.000Z",
  },
];

export const seedDemoChannelMappings: DemoChannelMappingRecord[] = [
  {
    id: "mapping-soleia-air",
    villaSlug: seedVillaCatalog[0].slug,
    villaTitle: seedVillaCatalog[0].title,
    channelName: "Airbnb Mirror",
    remoteCalendarName: "Soleia Lagoon Master Calendar",
    syncMode: "TWO_WAY",
    active: true,
    updatedAt: "2026-05-17T14:30:00.000Z",
  },
  {
    id: "mapping-palm-booking",
    villaSlug: seedVillaCatalog[1].slug,
    villaTitle: seedVillaCatalog[1].title,
    channelName: "Booking Feed",
    remoteCalendarName: "Palm Serenity Booking Channel",
    syncMode: "IMPORT_ONLY",
    active: true,
    updatedAt: "2026-05-17T13:45:00.000Z",
  },
  {
    id: "mapping-verde-export",
    villaSlug: seedVillaCatalog[2].slug,
    villaTitle: seedVillaCatalog[2].title,
    channelName: "Direct Export",
    remoteCalendarName: "Verde Cove Public Export",
    syncMode: "TWO_WAY",
    active: false,
    updatedAt: "2026-05-16T10:20:00.000Z",
  },
];

export const seedDemoSyncLogs: DemoSyncLogRecord[] = [
  {
    id: "sync-log-001",
    sourceId: "ical-soleia-air",
    villaSlug: seedVillaCatalog[0].slug,
    villaTitle: seedVillaCatalog[0].title,
    channelName: "Airbnb Mirror",
    outcome: "SUCCESS",
    eventCount: 3,
    message: "Takvim bloklari cakismaz sekilde iceri alindi.",
    createdAt: "2026-05-18T08:15:00.000Z",
  },
  {
    id: "sync-log-002",
    sourceId: "ical-palm-booking",
    villaSlug: seedVillaCatalog[1].slug,
    villaTitle: seedVillaCatalog[1].title,
    channelName: "Booking Feed",
    outcome: "WARNING",
    eventCount: 1,
    message: "Tek bir tarih blogunda fark bulundu, manuel kontrol onerildi.",
    createdAt: "2026-05-18T07:55:00.000Z",
  },
  {
    id: "sync-log-003",
    sourceId: "ical-verde-export",
    villaSlug: seedVillaCatalog[2].slug,
    villaTitle: seedVillaCatalog[2].title,
    channelName: "Direct Export",
    outcome: "SUCCESS",
    eventCount: 2,
    message: "Dis kanal icin export takvimi yenilendi.",
    createdAt: "2026-05-18T06:40:00.000Z",
  },
];

export function getCalendarSourceStatusLabel(status: DemoCalendarSourceStatus) {
  switch (status) {
    case "HEALTHY":
      return "Saglikli";
    case "WARNING":
      return "Uyari";
    case "ERROR":
      return "Hata";
    default:
      return status;
  }
}

export function getCalendarSourceStatusTone(status: DemoCalendarSourceStatus) {
  switch (status) {
    case "HEALTHY":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "WARNING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export function getSyncModeLabel(mode: DemoSyncMode) {
  return mode === "TWO_WAY" ? "Cift Yonlu" : "Sadece Ice Aktar";
}

export function getSyncOutcomeLabel(outcome: DemoSyncOutcome) {
  switch (outcome) {
    case "SUCCESS":
      return "Basarili";
    case "WARNING":
      return "Uyari";
    case "ERROR":
      return "Hata";
    default:
      return outcome;
  }
}

export function getSyncOutcomeTone(outcome: DemoSyncOutcome) {
  switch (outcome) {
    case "SUCCESS":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "WARNING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}
