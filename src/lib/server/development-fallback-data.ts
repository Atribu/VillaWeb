import "server-only";

import { randomUUID } from "node:crypto";
import {
  getDefaultDemoCompany,
  getDemoCompanies,
  type DemoCompanyRecord,
  type DemoCompanyStatus,
} from "@/lib/demo-companies";
import {
  seedDemoIcalSources,
  seedDemoChannelMappings,
  seedDemoSyncLogs,
  type DemoCalendarSourceStatus,
  type DemoChannelMappingRecord,
  type DemoIcalSourceRecord,
  type DemoSyncMode,
  type DemoSyncLogRecord,
  type DemoSyncOutcome,
} from "@/lib/demo-calendar-sync";
import {
  seedDemoRegionAirportRecords,
  seedDemoParameterGroups,
  type DemoParameterGroupRecord,
  type DemoRegionAirportRecord,
} from "@/lib/demo-definitions";
import {
  seedDemoDocumentLinks,
  seedDemoExternalServices,
  seedDemoShortcuts,
  type DemoDocumentLinkRecord,
  type DemoExternalServiceRecord,
  type DemoShortcutRecord,
} from "@/lib/demo-external-links";
import {
  type DemoCashEntry,
  type DemoInvoiceRecord,
  type DemoPaymentRecord,
} from "@/lib/demo-finance";
import {
  buildOperationTasksForApprovedRequest,
  type DemoOperationTask,
} from "@/lib/demo-operations-workflow";
import {
  buildSeedRequestEvents,
  seedDemoCoupons,
  seedDemoDiscountCampaigns,
  seedDemoPricingRecords,
  seedDemoRequests,
  type DemoCoupon,
  type DemoDiscountCampaign,
  type DemoPricingRecord,
  type DemoRequest,
  type DemoRequestEvent,
} from "@/lib/demo-operations";
import {
  seedDemoCacheGroups,
  seedDemoCurrencyRates,
  seedDemoDocuments,
  seedDemoPaymentMethods,
  seedDemoSystemDefaults,
  type DemoCacheGroupRecord,
  type DemoCurrencyRateRecord,
  type DemoDocumentRecord,
  type DemoPaymentMethodStatus,
  type DemoPaymentMethodRecord,
} from "@/lib/demo-settings";
import {
  seedDemoAgencies,
  seedDemoBranches,
  seedDemoCommissionRates,
  seedDemoInternalMessages,
  seedDemoTeamUsers,
  type DemoAgencyRecord,
  type DemoBranchRecord,
  type DemoCommissionRateRecord,
  type DemoInternalMessageRecord,
  type DemoRoleId,
  type DemoTeamUserRecord,
  type DemoTeamUserStatus,
} from "@/lib/demo-users-messages";
import {
  seedDemoLandingPages,
  seedDemoSeoContents,
  seedDemoWebsites,
  type DemoLandingPageRecord,
  type DemoSeoContentRecord,
  type DemoWebsiteRecord,
} from "@/lib/demo-websites";
import { seedVillaCatalog, type CatalogVilla } from "@/lib/villa-catalog";
import { seedDemoReviews, type DemoReviewRecord } from "@/lib/demo-crm";
import {
  filterDevelopmentRecordsByCompany,
  normalizeDevelopmentCompanyId,
  readDevelopmentDataFile,
  writeDevelopmentDataFile,
} from "@/lib/server/development-fallback";

const companies = getDemoCompanies();
const defaultCompany = getDefaultDemoCompany();
const villaveraCompanyId = companies[0]?.id ?? defaultCompany.id;
const sahilCompanyId = companies[1]?.id ?? defaultCompany.id;

function clone<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}

type PaymentMethodWithCompany = DemoPaymentMethodRecord & { companyId?: string };

function inferCompanyIdFromText(...parts: Array<string | null | undefined>) {
  const text = parts
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();

  if (!text) {
    return defaultCompany.id;
  }

  if (
    ["kalkan", "kas", "balayi", "villavera", "verde", "soleia"].some((keyword) =>
      text.includes(keyword),
    )
  ) {
    return villaveraCompanyId;
  }

  if (
    ["fethiye", "bodrum", "sahil", "palm", "marea", "group", "aile"].some((keyword) =>
      text.includes(keyword),
    )
  ) {
    return sahilCompanyId;
  }

  return defaultCompany.id;
}

function normalizeVillaRecord(record: CatalogVilla) {
  return {
    ...record,
    companyId: normalizeDevelopmentCompanyId(record.companyId, record.slug),
  } satisfies CatalogVilla;
}

function normalizeRequestRecord(record: DemoRequest): DemoRequest {
  return {
    ...record,
    companyId: normalizeDevelopmentCompanyId(record.companyId, record.villaSlug),
  };
}

function normalizeRequestEvent(record: DemoRequestEvent): DemoRequestEvent {
  return {
    ...record,
    companyId: normalizeDevelopmentCompanyId(record.companyId, record.villaSlug),
  };
}

function normalizeOperationTask(record: DemoOperationTask): DemoOperationTask {
  return {
    ...record,
    companyId: normalizeDevelopmentCompanyId(record.companyId, record.villaSlug),
  };
}

function normalizeFallbackCompanyRecord(record: DemoCompanyRecord): DemoCompanyRecord {
  const name = record.name?.trim() || "Demo Firma";

  return {
    id: record.id,
    slug: record.slug?.trim().toLowerCase() || `firma-${randomUUID().slice(0, 6)}`,
    name,
    legalName: record.legalName?.trim() || name,
    shortName: record.shortName?.trim() || name,
    panelLabel: record.panelLabel?.trim() || `${name} Panel`,
    status: (record.status ?? "ACTIVE") satisfies DemoCompanyStatus,
    tagline: record.tagline?.trim() || "Villa platformu",
    phone: record.phone?.trim() || "",
    whatsapp: record.whatsapp?.trim() || record.phone?.trim() || "",
    email: record.email?.trim() || "",
    primaryDomain: record.primaryDomain?.trim().toLowerCase() || "",
    address: record.address?.trim() || "",
    taxNumber: record.taxNumber?.trim() || "",
    supportHours: record.supportHours?.trim() || "",
    accentLabel: record.accentLabel?.trim() || "Firma bazli villa platformu",
    heroTitle: record.heroTitle?.trim() || name,
    heroDescription:
      record.heroDescription?.trim() ||
      "Villa vitrini, panel yonetimi ve operasyon akislarini tek merkezden yonetin.",
  };
}

export async function getFallbackCompanyRecords() {
  const fileData = await readDevelopmentDataFile("demo-companies.json", getDemoCompanies());
  return fileData.map((record) =>
    normalizeFallbackCompanyRecord(record as DemoCompanyRecord),
  );
}

export async function getFallbackCompanyRecordById(companyId?: string | null) {
  const normalized = companyId ? normalizeDevelopmentCompanyId(companyId) : null;
  return (await getFallbackCompanyRecords()).find((company) => company.id === normalized) ?? null;
}

export async function getFallbackCompanyRecordBySlug(companySlug?: string | null) {
  if (!companySlug) {
    return null;
  }

  const normalized = companySlug.trim().toLowerCase();
  return (await getFallbackCompanyRecords()).find((company) => company.slug === normalized) ?? null;
}

export async function getFallbackDefaultCompanyRecord() {
  return (await getFallbackCompanyRecords())[0] ?? clone(getDefaultDemoCompany());
}

export async function getFallbackDefaultCompanyId() {
  return (await getFallbackDefaultCompanyRecord())?.id ?? getDefaultDemoCompany().id;
}

export async function getFallbackVillas(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-villas.json", seedVillaCatalog);
  const normalized = fileData.map((record) =>
    normalizeVillaRecord(record as CatalogVilla),
  );

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function saveFallbackVilla(record: CatalogVilla) {
  const fileData = await readDevelopmentDataFile("demo-villas.json", seedVillaCatalog);
  const existingRecords = fileData as CatalogVilla[];
  const normalizedRecord = normalizeVillaRecord(record);
  const nextRecords = [
    normalizedRecord,
    ...existingRecords.filter(
      (villa) =>
        !(
          normalizeDevelopmentCompanyId(villa.companyId, villa.slug) ===
            normalizeDevelopmentCompanyId(normalizedRecord.companyId) &&
          villa.slug === normalizedRecord.slug
        ),
    ),
  ];

  await writeDevelopmentDataFile("demo-villas.json", nextRecords);

  return normalizedRecord;
}

export async function getFallbackPricingRecords(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-pricing.json", seedDemoPricingRecords);
  const normalized = fileData.map((record) => ({
    ...record,
    companyId: normalizeDevelopmentCompanyId(
      (record as DemoPricingRecord).companyId,
      record.villaSlug,
    ),
  })) satisfies DemoPricingRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackDiscountCampaigns(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-discounts.json", seedDemoDiscountCampaigns);
  const normalized = fileData.map((record) => ({
    ...record,
    companyId: normalizeDevelopmentCompanyId(
      (record as DemoDiscountCampaign).companyId,
      record.villaScope === "ALL" ? undefined : record.villaScope,
    ),
  })) satisfies DemoDiscountCampaign[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackCoupons(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-coupons.json", seedDemoCoupons);
  const normalized = fileData.map((record) => ({
    ...record,
    companyId: normalizeDevelopmentCompanyId(
      (record as DemoCoupon).companyId,
      record.villaScope === "ALL" ? undefined : record.villaScope,
    ),
  })) satisfies DemoCoupon[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackRequests(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-requests.json", seedDemoRequests);
  const normalized = fileData.map((record) =>
    normalizeRequestRecord(record as DemoRequest),
  );

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId).sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt),
  );
}

export async function getFallbackRequestEvents(companyId?: string | null) {
  const defaultEvents = buildSeedRequestEvents(await getFallbackRequests());
  const fileData = await readDevelopmentDataFile("demo-request-events.json", defaultEvents);
  const normalized = fileData.map((record) =>
    normalizeRequestEvent({
      ...(record as DemoRequestEvent),
      companyId: (record as DemoRequestEvent).companyId ?? undefined,
    }),
  );

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId).sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt),
  );
}

export async function getFallbackOperationTasks(companyId?: string | null) {
  const requests = await getFallbackRequests();
  const defaultTasks = requests
    .filter((request) => request.status === "APPROVED")
    .flatMap((request) => buildOperationTasksForApprovedRequest(request));
  const fileData = await readDevelopmentDataFile("demo-operation-tasks.json", defaultTasks);
  const normalized = fileData.map((record) =>
    normalizeOperationTask({
      ...(record as DemoOperationTask),
      companyId:
        (record as DemoOperationTask).companyId ??
        normalizeDevelopmentCompanyId(undefined, record.villaSlug),
    }),
  );

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId).sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt),
  );
}

export async function getFallbackInvoices(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile<DemoInvoiceRecord[]>("demo-invoices.json", []);
  const normalized = fileData.map((record) => ({
    ...record,
    companyId: normalizeDevelopmentCompanyId(record.companyId, record.villaSlug),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackPayments(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile<DemoPaymentRecord[]>("demo-payments.json", []);
  const normalized = fileData.map((record) => ({
    ...record,
    companyId: normalizeDevelopmentCompanyId(record.companyId, record.villaSlug),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackCashEntries(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile<DemoCashEntry[]>("demo-cashbook.json", []);
  const normalized = fileData.map((record) => ({
    ...record,
    companyId: normalizeDevelopmentCompanyId(record.companyId, record.villaSlug),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackReviews(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-reviews.json", seedDemoReviews);
  const normalized = fileData.map((record) => ({
    ...(record as DemoReviewRecord),
    companyId: normalizeDevelopmentCompanyId(
      (record as DemoReviewRecord).companyId,
      record.villaSlug,
    ),
  })) satisfies DemoReviewRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

function inferWebsiteCompanyId(record: DemoWebsiteRecord) {
  return normalizeDevelopmentCompanyId(
    record.companyId,
    undefined,
  ) ?? inferCompanyIdFromText(record.name, record.domain, record.primaryChannel);
}

export async function getFallbackWebsites(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-websites.json", seedDemoWebsites);
  const normalized = fileData.map((record) => ({
    ...(record as DemoWebsiteRecord),
    companyId:
      (record as DemoWebsiteRecord).companyId ??
      inferCompanyIdFromText(record.name, record.domain, record.primaryChannel),
  })) satisfies DemoWebsiteRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, inferWebsiteCompanyId);
}

export async function getFallbackPrimaryWebsiteIdForCompany(companyId: string) {
  const websites = await getFallbackWebsites(companyId);
  return websites.find((website) => website.default)?.id ?? websites[0]?.id ?? null;
}

export async function getFallbackLandingPages(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-landing-pages.json", seedDemoLandingPages);
  const normalized = fileData.map((record) => ({
    ...(record as DemoLandingPageRecord),
    companyId:
      (record as DemoLandingPageRecord).companyId ??
      inferCompanyIdFromText(record.title, record.slug, record.targetRegion, record.focusKeyword),
  })) satisfies DemoLandingPageRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackSeoContents(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-seo-contents.json", seedDemoSeoContents);
  const normalized = fileData.map((record) => ({
    ...(record as DemoSeoContentRecord),
    companyId:
      (record as DemoSeoContentRecord).companyId ??
      inferCompanyIdFromText(record.title, record.targetUrl, record.primaryKeyword),
  })) satisfies DemoSeoContentRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackAgencies(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-agencies.json", seedDemoAgencies);
  const normalized = fileData.map((record) => ({
    ...(record as DemoAgencyRecord),
    companyId: normalizeDevelopmentCompanyId(
      (record as DemoAgencyRecord).companyId ??
        inferCompanyIdFromText(record.name, record.city, record.note),
    ),
  })) satisfies DemoAgencyRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackBranches(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-branches.json", seedDemoBranches);
  const normalized = fileData.map((record) => ({
    ...(record as DemoBranchRecord),
    companyId: normalizeDevelopmentCompanyId(
      (record as DemoBranchRecord).companyId ??
        inferCompanyIdFromText(record.name, record.city, record.agencyName),
    ),
  })) satisfies DemoBranchRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackTeamUsers(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-team-users.json", seedDemoTeamUsers);
  const normalized = fileData.map((record) => ({
    ...(record as DemoTeamUserRecord),
    companyId:
      (record as DemoTeamUserRecord).companyId ??
      inferCompanyIdFromText(record.username, record.agencyName, record.branchName, record.responsibility),
  })) satisfies DemoTeamUserRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackInternalMessages(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-internal-messages.json",
    seedDemoInternalMessages,
  );
  const normalized = fileData.map((record) => ({
    ...(record as DemoInternalMessageRecord),
    companyId:
      (record as DemoInternalMessageRecord).companyId ??
      inferCompanyIdFromText(record.senderName, record.subject, record.relatedModule),
  })) satisfies DemoInternalMessageRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackCommissionRates(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-commission-rates.json",
    seedDemoCommissionRates,
  );
  const normalized = fileData.map((record) => ({
    ...(record as DemoCommissionRateRecord),
    companyId:
      (record as DemoCommissionRateRecord).companyId ??
      inferCompanyIdFromText(record.scopeLabel, record.scopeType),
  })) satisfies DemoCommissionRateRecord[];

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackCurrencyRates(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-currency-rates.json", seedDemoCurrencyRates);
  const normalized = (fileData as DemoCurrencyRateRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(record.code === "GBP" ? "sahil" : "villavera", record.label),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackPaymentMethods(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-payment-methods.json",
    seedDemoPaymentMethods,
  );
  const normalized = (fileData as PaymentMethodWithCompany[]).map((record) => ({
    ...record,
    companyId: normalizeDevelopmentCompanyId(
      record.companyId ??
        inferCompanyIdFromText(
          record.label.includes("POS") ? "sahil" : "villavera",
          record.label,
          record.provider,
        ),
    ),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackCacheGroups(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-cache-groups.json", seedDemoCacheGroups);
  const normalized = (fileData as DemoCacheGroupRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(
      record.label.includes("SEO") ? "sahil" : "villavera",
      record.label,
      record.target,
    ),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackSystemDefaults(_inputCompanyId?: string | null) {
  void _inputCompanyId;
  return clone(seedDemoSystemDefaults);
}

export async function getFallbackDocuments(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-documents.json", seedDemoDocuments);
  const normalized = (fileData as DemoDocumentRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(
      record.title.includes("Marka") ? "sahil" : "villavera",
      record.title,
      record.category,
    ),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackRegionAirportRecords(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-region-airports.json",
    seedDemoRegionAirportRecords,
  );
  const normalized = (fileData as DemoRegionAirportRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(record.regionLabel, record.city, record.airportCode),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackParameterGroups(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-parameter-groups.json",
    seedDemoParameterGroups,
  );
  const normalized = (fileData as DemoParameterGroupRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(
      record.label.includes("Servis") ? "sahil" : "villavera",
      record.label,
      record.scope,
    ),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackShortcuts(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-shortcuts.json", seedDemoShortcuts);
  const normalized = (fileData as DemoShortcutRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(
      record.category === "Muhasebe" ? "sahil" : "villavera",
      record.title,
      record.category,
    ),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackExternalServices(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-external-services.json",
    seedDemoExternalServices,
  );
  const normalized = (fileData as DemoExternalServiceRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(
      record.category === "Iletisim" ? "sahil" : "villavera",
      record.name,
      record.category,
    ),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackDocumentLinks(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-document-links.json",
    seedDemoDocumentLinks,
  );
  const normalized = (fileData as DemoDocumentLinkRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(
      record.category === "Icerik" ? "sahil" : "villavera",
      record.title,
      record.category,
    ),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackIcalSources(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-ical-sources.json", seedDemoIcalSources);
  const normalized = (fileData as DemoIcalSourceRecord[]).map((record) => ({
    ...record,
    companyId:
      record.companyId ?? normalizeDevelopmentCompanyId(undefined, record.villaSlug),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackChannelMappings(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile(
    "demo-channel-mappings.json",
    seedDemoChannelMappings,
  );
  const normalized = (fileData as DemoChannelMappingRecord[]).map((record) => ({
    ...record,
    companyId:
      record.companyId ?? normalizeDevelopmentCompanyId(undefined, record.villaSlug),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

export async function getFallbackSyncLogs(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-sync-logs.json", seedDemoSyncLogs);
  const normalized = (fileData as DemoSyncLogRecord[]).map((record) => ({
    ...record,
    companyId:
      record.companyId ?? normalizeDevelopmentCompanyId(undefined, record.villaSlug),
  }));

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
}

async function saveFallbackTeamUsers(records: DemoTeamUserRecord[]) {
  await writeDevelopmentDataFile("demo-team-users.json", records);
}

async function saveFallbackCompanyRecords(records: DemoCompanyRecord[]) {
  await writeDevelopmentDataFile("demo-companies.json", records);
}

async function saveFallbackWebsites(records: DemoWebsiteRecord[]) {
  await writeDevelopmentDataFile("demo-websites.json", records);
}

async function saveFallbackAgencies(records: DemoAgencyRecord[]) {
  await writeDevelopmentDataFile("demo-agencies.json", records);
}

async function saveFallbackBranches(records: DemoBranchRecord[]) {
  await writeDevelopmentDataFile("demo-branches.json", records);
}

async function saveFallbackPaymentMethods(records: PaymentMethodWithCompany[]) {
  await writeDevelopmentDataFile("demo-payment-methods.json", records);
}

async function saveFallbackIcalSources(records: DemoIcalSourceRecord[]) {
  await writeDevelopmentDataFile("demo-ical-sources.json", records);
}

async function saveFallbackChannelMappings(records: DemoChannelMappingRecord[]) {
  await writeDevelopmentDataFile("demo-channel-mappings.json", records);
}

async function saveFallbackSyncLogs(records: DemoSyncLogRecord[]) {
  await writeDevelopmentDataFile("demo-sync-logs.json", records);
}

export async function createFallbackTeamUser(input: {
  companyId?: string | null;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  roleId: DemoRoleId;
  status: DemoTeamUserStatus;
  branchId: string;
  responsibility: string;
}) {
  const [users, branches] = await Promise.all([getFallbackTeamUsers(), getFallbackBranches()]);
  const branch = branches.find((item) => item.id === input.branchId);

  if (!branch) {
    throw new Error("Kullanici icin gecerli bir sube secilmelidir.");
  }

  if (
    users.some(
      (user) => user.username === input.username || user.email.toLowerCase() === input.email.toLowerCase(),
    )
  ) {
    throw new Error("Bu kullanici adi veya e-posta zaten kullanimda.");
  }

  const companyId = normalizeDevelopmentCompanyId(input.companyId ?? branch.companyId);
  const now = new Date().toISOString();
  const nextUser: DemoTeamUserRecord = {
    id: `team-user-${randomUUID().slice(0, 8)}`,
    companyId,
    fullName: input.fullName,
    username: input.username,
    email: input.email,
    phone: input.phone,
    roleId: input.roleId,
    status: input.status,
    agencyId: branch.agencyId,
    agencyName: branch.agencyName,
    branchId: branch.id,
    branchName: branch.name,
    responsibility: input.responsibility || "Rol bazli erisim",
    lastActiveAt: input.status === "ACTIVE" ? now : "",
  };

  await saveFallbackTeamUsers([...users, nextUser]);
  return nextUser;
}

export async function createFallbackCompany(input: {
  publicName: string;
  legalName: string;
  shortName: string;
  panelName: string;
  status: DemoCompanyStatus;
  primaryEmail: string;
  primaryPhone: string;
  whatsappNumber: string;
  primaryDomain: string;
  address: string;
  taxNumber: string;
  supportHours: string;
  accentLabel: string;
  heroTitle: string;
  heroDescription: string;
  slug: string;
}) {
  const companies = await getFallbackCompanyRecords();

  const nextCompany: DemoCompanyRecord = normalizeFallbackCompanyRecord({
    id: `company-${randomUUID().slice(0, 8)}`,
    slug: input.slug,
    name: input.publicName,
    legalName: input.legalName,
    shortName: input.shortName,
    panelLabel: input.panelName,
    status: input.status,
    tagline: input.accentLabel,
    phone: input.primaryPhone,
    whatsapp: input.whatsappNumber || input.primaryPhone,
    email: input.primaryEmail,
    primaryDomain: input.primaryDomain,
    address: input.address,
    taxNumber: input.taxNumber,
    supportHours: input.supportHours,
    accentLabel: input.accentLabel,
    heroTitle: input.heroTitle,
    heroDescription: input.heroDescription,
  });

  await saveFallbackCompanyRecords([...companies, nextCompany]);

  const [websites, agencies, branches] = await Promise.all([
    getFallbackWebsites(),
    getFallbackAgencies(),
    getFallbackBranches(),
  ]);

  const now = new Date().toISOString();
  const nextAgency: DemoAgencyRecord = {
    id: `agency-${randomUUID().slice(0, 8)}`,
    companyId: nextCompany.id,
    name: "Merkez Operasyon",
    kind: "INTERNAL",
    ownerName: "Super Admin",
    city: nextCompany.address || "Turkiye",
    status: "ACTIVE",
    requestCount: 0,
    approvedRevenue: 0,
    openPipeline: 0,
    note: "Yeni firma ile birlikte olusan varsayilan merkez operasyon kaydi.",
  };
  const nextBranch: DemoBranchRecord = {
    id: `branch-${randomUUID().slice(0, 8)}`,
    companyId: nextCompany.id,
    agencyId: nextAgency.id,
    agencyName: nextAgency.name,
    name: "Ana Sube",
    city: nextCompany.address || "Turkiye",
    phone: nextCompany.phone,
    status: "ACTIVE",
    userCount: 0,
    requestCount: 0,
    approvedRevenue: 0,
  };
  const nextWebsite: DemoWebsiteRecord = {
    id: `site-${randomUUID().slice(0, 8)}`,
    companyId: nextCompany.id,
    name: `${nextCompany.name} Ana Site`,
    domain: nextCompany.primaryDomain,
    locale: "tr-TR",
    status: "STAGING",
    primaryChannel: "Direkt Talep",
    default: true,
    updatedAt: now,
  };

  await Promise.all([
    saveFallbackAgencies([...agencies, nextAgency]),
    saveFallbackBranches([...branches, nextBranch]),
    saveFallbackWebsites([...websites, nextWebsite]),
  ]);

  return nextCompany;
}

export async function updateFallbackCompany(
  companyId: string,
  input: {
    publicName: string;
    legalName: string;
    shortName: string;
    panelName: string;
    status: DemoCompanyStatus;
    primaryEmail: string;
    primaryPhone: string;
    whatsappNumber: string;
    primaryDomain: string;
    address: string;
    taxNumber: string;
    supportHours: string;
    accentLabel: string;
    heroTitle: string;
    heroDescription: string;
  },
) {
  const companies = await getFallbackCompanyRecords();
  const index = companies.findIndex((company) => company.id === companyId);

  if (index === -1) {
    throw new Error("Firma bulunamadi.");
  }

  const current = companies[index]!;
  const updated = normalizeFallbackCompanyRecord({
    ...current,
    name: input.publicName,
    legalName: input.legalName,
    shortName: input.shortName,
    panelLabel: input.panelName,
    status: input.status,
    phone: input.primaryPhone,
    whatsapp: input.whatsappNumber || input.primaryPhone,
    email: input.primaryEmail,
    primaryDomain: input.primaryDomain,
    address: input.address,
    taxNumber: input.taxNumber,
    supportHours: input.supportHours,
    accentLabel: input.accentLabel,
    heroTitle: input.heroTitle,
    heroDescription: input.heroDescription,
  });

  const nextCompanies = [...companies];
  nextCompanies[index] = updated;
  await saveFallbackCompanyRecords(nextCompanies);

  const websites = await getFallbackWebsites();
  const websiteIndex = websites.findIndex(
    (website) => website.companyId === companyId && website.default,
  );

  if (websiteIndex !== -1) {
    const nextWebsites = [...websites];
    nextWebsites[websiteIndex] = {
      ...nextWebsites[websiteIndex]!,
      domain: updated.primaryDomain,
      updatedAt: new Date().toISOString(),
    };
    await saveFallbackWebsites(nextWebsites);
  }

  return updated;
}

export async function updateFallbackTeamUser(
  userId: string,
  input: {
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
    status?: DemoTeamUserStatus;
    roleId?: DemoRoleId;
    branchId?: string | null;
    responsibility?: string;
  },
) {
  const users = await getFallbackTeamUsers();
  const index = users.findIndex((item) => item.id === userId);

  if (index === -1) {
    throw new Error("Kullanici bulunamadi.");
  }

  const current = users[index]!;
  let nextBranch = null as DemoBranchRecord | null;
  const nextUsername = input.username?.trim() ?? current.username;
  const nextEmail = input.email?.trim().toLowerCase() ?? current.email.toLowerCase();

  if (
    users.some(
      (user) =>
        user.id !== userId &&
        (user.username.toLowerCase() === nextUsername.toLowerCase() ||
          user.email.toLowerCase() === nextEmail),
    )
  ) {
    throw new Error("Bu kullanici adi veya e-posta zaten kullanimda.");
  }

  if (input.branchId !== undefined && input.branchId !== "") {
    const branches = await getFallbackBranches();
    nextBranch = branches.find((item) => item.id === input.branchId) ?? null;

    if (!nextBranch) {
      throw new Error("Secilen sube bulunamadi.");
    }

    if (normalizeDevelopmentCompanyId(nextBranch.companyId) !== normalizeDevelopmentCompanyId(current.companyId)) {
      throw new Error("Kullanici farkli bir firmanin subesine atanamaz.");
    }
  }

  const nextStatus = input.status ?? current.status;
  const updated = {
    ...current,
    companyId: normalizeDevelopmentCompanyId(current.companyId),
    fullName: input.fullName?.trim() || current.fullName,
    username: nextUsername,
    email: nextEmail,
    phone: input.phone?.trim() || current.phone,
    roleId: input.roleId ?? current.roleId,
    status: nextStatus,
    responsibility:
      input.responsibility !== undefined
        ? input.responsibility.trim() || "Rol bazli erisim"
        : current.responsibility,
    ...(input.branchId === ""
      ? {
          agencyId: "",
          agencyName: "Bagimsiz",
          branchId: "",
          branchName: "Atanmamis",
        }
      : nextBranch
        ? {
            agencyId: nextBranch.agencyId,
            agencyName: nextBranch.agencyName,
            branchId: nextBranch.id,
            branchName: nextBranch.name,
          }
        : {}),
    ...(nextStatus === "ACTIVE" ? { lastActiveAt: new Date().toISOString() } : {}),
  } satisfies DemoTeamUserRecord & { companyId: string };

  const nextUsers = [...users];
  nextUsers[index] = updated;
  await saveFallbackTeamUsers(nextUsers);
  return updated;
}

export async function createFallbackPaymentMethod(input: {
  companyId: string;
  label: string;
  provider: string;
  feePercent: number;
  settlementDays: number;
  status: DemoPaymentMethodStatus;
  supportsInstallment: boolean;
  note: string;
}) {
  const methods = await getFallbackPaymentMethods();
  const normalizedCompanyId = normalizeDevelopmentCompanyId(input.companyId);

  if (
    methods.some(
      (method) =>
        normalizeDevelopmentCompanyId(method.companyId) === normalizedCompanyId && method.label === input.label,
    )
  ) {
    throw new Error("Bu firma icin ayni isimde bir odeme yontemi zaten var.");
  }

  const nextMethod: PaymentMethodWithCompany = {
    id: `payment-${randomUUID().slice(0, 8)}`,
    companyId: normalizedCompanyId,
    label: input.label,
    provider: input.provider,
    feePercent: input.feePercent,
    settlementDays: input.settlementDays,
    status: input.status,
    supportsInstallment: input.supportsInstallment,
    note: input.note,
    updatedAt: new Date().toISOString(),
  };

  await saveFallbackPaymentMethods([...methods, nextMethod]);
  return nextMethod;
}

export async function updateFallbackPaymentMethod(
  paymentMethodId: string,
  input: {
    label?: string;
    provider?: string;
    status?: DemoPaymentMethodStatus;
    feePercent?: number;
    settlementDays?: number;
    supportsInstallment?: boolean;
    note?: string;
  },
) {
  const methods = await getFallbackPaymentMethods();
  const index = methods.findIndex((item) => item.id === paymentMethodId);

  if (index === -1) {
    throw new Error("Odeme yontemi bulunamadi.");
  }

  const current = methods[index]!;
  const nextLabel = input.label?.trim();

  if (
    nextLabel &&
    methods.some(
      (method) =>
        method.id !== paymentMethodId &&
        normalizeDevelopmentCompanyId(method.companyId) === normalizeDevelopmentCompanyId(current.companyId) &&
        method.label === nextLabel,
    )
  ) {
    throw new Error("Bu firma icin ayni isimde bir odeme yontemi zaten var.");
  }

  const updated = {
    ...current,
    companyId: normalizeDevelopmentCompanyId(current.companyId),
    ...(nextLabel !== undefined ? { label: nextLabel } : {}),
    ...(input.provider !== undefined ? { provider: input.provider.trim() } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.feePercent !== undefined ? { feePercent: input.feePercent } : {}),
    ...(input.settlementDays !== undefined ? { settlementDays: input.settlementDays } : {}),
    ...(input.supportsInstallment !== undefined
      ? { supportsInstallment: input.supportsInstallment }
      : {}),
    ...(input.note !== undefined ? { note: input.note.trim() } : {}),
    updatedAt: new Date().toISOString(),
  } satisfies PaymentMethodWithCompany & { companyId: string };

  const nextMethods = [...methods];
  nextMethods[index] = updated;
  await saveFallbackPaymentMethods(nextMethods);
  return updated;
}

export async function createFallbackIcalSource(input: {
  villaId: string;
  channelName: string;
  sourceUrl: string;
  direction: "IMPORT" | "EXPORT";
}) {
  const [villas, sources] = await Promise.all([getFallbackVillas(), getFallbackIcalSources()]);
  const villa = villas.find((item) => item.id === input.villaId);

  if (!villa) {
    throw new Error("Takvim kaynagi icin secilen villa bulunamadi.");
  }

  if (
    sources.some(
      (source) =>
        normalizeDevelopmentCompanyId(source.companyId) === normalizeDevelopmentCompanyId(villa.companyId) &&
        source.villaSlug === villa.slug &&
        source.channelName === input.channelName &&
        source.direction === input.direction,
    )
  ) {
    throw new Error("Bu villa ve kanal icin ayni yonlu bir iCal kaynagi zaten var.");
  }

  const nextSource: DemoIcalSourceRecord = {
    id: `ical-${randomUUID().slice(0, 8)}`,
    companyId: normalizeDevelopmentCompanyId(villa.companyId, villa.slug),
    villaSlug: villa.slug,
    villaTitle: villa.title,
    channelName: input.channelName,
    sourceUrl: input.sourceUrl,
    direction: input.direction,
    active: true,
    status: "HEALTHY",
    lastSyncedAt: "",
  };

  await saveFallbackIcalSources([...sources, nextSource]);
  return nextSource;
}

export async function updateFallbackIcalSource(
  sourceId: string,
  input: {
    active?: boolean;
    status?: DemoCalendarSourceStatus;
    sourceUrl?: string;
  },
) {
  const sources = await getFallbackIcalSources();
  const index = sources.findIndex((item) => item.id === sourceId);

  if (index === -1) {
    throw new Error("iCal kaynagi bulunamadi.");
  }

  const updated = {
    ...sources[index]!,
    companyId: normalizeDevelopmentCompanyId(sources[index]!.companyId),
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
  } satisfies DemoIcalSourceRecord & { companyId: string };

  const nextSources = [...sources];
  nextSources[index] = updated;
  await saveFallbackIcalSources(nextSources);
  return updated;
}

export async function runFallbackCalendarSync(sourceId: string) {
  const [sources, logs] = await Promise.all([getFallbackIcalSources(), getFallbackSyncLogs()]);
  const index = sources.findIndex((item) => item.id === sourceId);

  if (index === -1) {
    throw new Error("Senkron baslatilacak kaynak bulunamadi.");
  }

  const current = sources[index]!;
  const createdAt = new Date().toISOString();
  const outcome: DemoSyncOutcome = current.status === "ERROR" ? "WARNING" : "SUCCESS";
  const nextStatus: DemoCalendarSourceStatus = outcome === "SUCCESS" ? "HEALTHY" : "WARNING";
  const eventCount = current.direction === "IMPORT" ? 2 : 1;
  const message =
    current.direction === "IMPORT"
      ? "Kanal takvimindeki yeni bloklar iceri aktariildi ve kontrol tamamlandi."
      : "Dis kanal icin guncel export linki tekrar yayinlandi.";

  const updatedSource = {
    ...current,
    companyId: normalizeDevelopmentCompanyId(current.companyId, current.villaSlug),
    status: nextStatus,
    lastSyncedAt: createdAt,
  } satisfies DemoIcalSourceRecord & { companyId: string };
  const log = {
    id: `sync-log-${randomUUID().slice(0, 8)}`,
    companyId: normalizeDevelopmentCompanyId(current.companyId, current.villaSlug),
    sourceId: current.id,
    villaSlug: current.villaSlug,
    villaTitle: current.villaTitle,
    channelName: current.channelName,
    outcome,
    eventCount,
    message,
    createdAt,
  } satisfies DemoSyncLogRecord & { companyId: string };

  const nextSources = [...sources];
  nextSources[index] = updatedSource;
  await Promise.all([saveFallbackIcalSources(nextSources), saveFallbackSyncLogs([log, ...logs])]);

  return {
    source: updatedSource,
    log,
  };
}

export async function createFallbackChannelMapping(input: {
  villaId: string;
  channelName: string;
  remoteCalendarName: string;
  syncMode: DemoSyncMode;
}) {
  const [villas, mappings] = await Promise.all([getFallbackVillas(), getFallbackChannelMappings()]);
  const villa = villas.find((item) => item.id === input.villaId);

  if (!villa) {
    throw new Error("Eslestirme icin secilen villa bulunamadi.");
  }

  if (
    mappings.some(
      (mapping) =>
        normalizeDevelopmentCompanyId(mapping.companyId) === normalizeDevelopmentCompanyId(villa.companyId) &&
        mapping.villaSlug === villa.slug &&
        mapping.channelName === input.channelName,
    )
  ) {
    throw new Error("Bu villa ve kanal icin eslestirme zaten tanimli.");
  }

  const nextMapping: DemoChannelMappingRecord = {
    id: `mapping-${randomUUID().slice(0, 8)}`,
    companyId: normalizeDevelopmentCompanyId(villa.companyId, villa.slug),
    villaSlug: villa.slug,
    villaTitle: villa.title,
    channelName: input.channelName,
    remoteCalendarName: input.remoteCalendarName,
    syncMode: input.syncMode,
    active: true,
    updatedAt: new Date().toISOString(),
  };

  await saveFallbackChannelMappings([...mappings, nextMapping]);
  return nextMapping;
}

export async function updateFallbackChannelMapping(
  mappingId: string,
  input: {
    active?: boolean;
    syncMode?: DemoSyncMode;
    remoteCalendarName?: string;
  },
) {
  const mappings = await getFallbackChannelMappings();
  const index = mappings.findIndex((item) => item.id === mappingId);

  if (index === -1) {
    throw new Error("Kanal eslestirmesi bulunamadi.");
  }

  const updated = {
    ...mappings[index]!,
    companyId: normalizeDevelopmentCompanyId(mappings[index]!.companyId, mappings[index]!.villaSlug),
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.syncMode !== undefined ? { syncMode: input.syncMode } : {}),
    ...(input.remoteCalendarName !== undefined
      ? { remoteCalendarName: input.remoteCalendarName }
      : {}),
    updatedAt: new Date().toISOString(),
  } satisfies DemoChannelMappingRecord & { companyId: string };

  const nextMappings = [...mappings];
  nextMappings[index] = updated;
  await saveFallbackChannelMappings(nextMappings);
  return updated;
}
