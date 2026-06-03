import "server-only";

import {
  getDefaultDemoCompany,
  getDemoCompanies,
} from "@/lib/demo-companies";
import {
  seedDemoIcalSources,
  seedDemoChannelMappings,
  seedDemoSyncLogs,
  type DemoChannelMappingRecord,
  type DemoIcalSourceRecord,
  type DemoSyncLogRecord,
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
  type DemoTeamUserRecord,
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
} from "@/lib/server/development-fallback";

const companies = getDemoCompanies();
const defaultCompany = getDefaultDemoCompany();
const villaveraCompanyId = companies[0]?.id ?? defaultCompany.id;
const sahilCompanyId = companies[1]?.id ?? defaultCompany.id;

function clone<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}

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

export async function getFallbackCompanyRecords() {
  return clone(getDemoCompanies());
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
  return clone(getDefaultDemoCompany());
}

export async function getFallbackDefaultCompanyId() {
  return getDefaultDemoCompany().id;
}

export async function getFallbackVillas(companyId?: string | null) {
  const fileData = await readDevelopmentDataFile("demo-villas.json", seedVillaCatalog);
  const normalized = fileData.map((record) =>
    normalizeVillaRecord(record as CatalogVilla),
  );

  return filterDevelopmentRecordsByCompany(normalized, companyId, (record) => record.companyId);
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
  const normalized = (fileData as DemoPaymentMethodRecord[]).map((record) => ({
    ...record,
    companyId: inferCompanyIdFromText(
      record.label.includes("POS") ? "sahil" : "villavera",
      record.label,
      record.provider,
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
