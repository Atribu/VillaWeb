import "server-only";

import { db } from "@/lib/db";
import type {
  DemoCacheGroupStatus,
  DemoCurrencyRateStatus,
  DemoDocumentStatus,
  DemoPaymentMethodStatus,
  DemoSystemDefaults,
} from "@/lib/demo-settings";
import { resolvePanelCompanyId, assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { decimalToNumber, getDefaultCompanyId, iso } from "@/lib/server/prisma-demo-shared";

export class DemoSettingsStoreError extends Error {}

async function resolveSettingsCompanyId() {
  return (await resolvePanelCompanyId()) ?? (await getDefaultCompanyId());
}

export async function getDemoCurrencyRates() {
  const companyId = await resolveSettingsCompanyId();

  if (!companyId) {
    return [];
  }

  const currencies = await db.currencyRate.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });

  return currencies.map((currency) => ({
    id: currency.id,
    code: currency.code,
    label: currency.label,
    buyRate: decimalToNumber(currency.buyRate),
    sellRate: decimalToNumber(currency.sellRate),
    sourceLabel: currency.sourceLabel,
    status: currency.status satisfies DemoCurrencyRateStatus,
    updatedAt: iso(currency.updatedAt),
  }));
}

export async function getDemoPaymentMethods() {
  const companyId = await resolveSettingsCompanyId();

  if (!companyId) {
    return [];
  }

  const methods = await db.paymentMethod.findMany({
    where: { companyId },
    orderBy: { label: "asc" },
  });

  return methods.map((method) => ({
    id: method.id,
    label: method.label,
    provider: method.provider,
    feePercent: decimalToNumber(method.feePercent),
    settlementDays: method.settlementDays,
    status: method.status satisfies DemoPaymentMethodStatus,
    supportsInstallment: method.supportsInstallment,
    note: method.note ?? "",
    updatedAt: iso(method.updatedAt),
  }));
}

export async function getDemoCacheGroups() {
  const companyId = await resolveSettingsCompanyId();

  if (!companyId) {
    return [];
  }

  const groups = await db.cacheGroup.findMany({
    where: { companyId },
    orderBy: { label: "asc" },
  });

  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    target: group.target,
    status: group.status satisfies DemoCacheGroupStatus,
    ttlMinutes: group.ttlMinutes,
    warmIntervalMinutes: group.warmIntervalMinutes,
    lastWarmedAt: iso(group.lastWarmedAt),
    note: group.note ?? "",
  }));
}

export async function getDemoSystemDefaults() {
  const companyId = await resolveSettingsCompanyId();

  if (!companyId) {
    throw new DemoSettingsStoreError("Varsayilanlar icin aktif firma bulunamadi.");
  }

  const [company, settings] = await Promise.all([
    db.company.findUnique({
      where: { id: companyId },
      select: { currency: true },
    }),
    db.companySetting.findUnique({
      where: { companyId },
    }),
  ]);

  if (!settings) {
    throw new DemoSettingsStoreError("Firma ayarlari bulunamadi.");
  }

  return {
    leadResponseMinutes: settings.leadResponseMinutes,
    defaultMinNightCount: settings.defaultMinNightCount,
    defaultCleaningLeadHours: settings.defaultCleaningLeadHours,
    supportPhone: settings.primaryPhone ?? "",
    supportEmail: settings.primaryEmail ?? "",
    defaultCurrency: company?.currency ?? "TRY",
    requestReminderHours: settings.requestReminderHours,
    updatedAt: iso(settings.updatedAt),
  } satisfies DemoSystemDefaults;
}

export async function getDemoDocuments() {
  const companyId = await resolveSettingsCompanyId();

  if (!companyId) {
    return [];
  }

  const documents = await db.documentAsset.findMany({
    where: { companyId },
    orderBy: { updatedAt: "desc" },
  });

  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    category: document.category,
    audience: document.audience,
    status: document.status satisfies DemoDocumentStatus,
    fileUrl: document.fileUrl,
    updatedAt: iso(document.updatedAt),
  }));
}

export async function updateDemoCurrencyRate(
  currencyId: string,
  input: {
    buyRate?: number;
    sellRate?: number;
    status?: DemoCurrencyRateStatus;
  },
) {
  const current = await db.currencyRate.findUnique({
    where: { id: currencyId },
  });

  if (!current) {
    throw new DemoSettingsStoreError("Kur kaydi bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  if (input.buyRate !== undefined && input.buyRate <= 0) {
    throw new DemoSettingsStoreError("Alis kuru sifirdan buyuk olmalidir.");
  }

  if (input.sellRate !== undefined && input.sellRate <= 0) {
    throw new DemoSettingsStoreError("Satis kuru sifirdan buyuk olmalidir.");
  }

  const currency = await db.currencyRate.update({
    where: { id: currencyId },
    data: {
      ...(input.buyRate !== undefined ? { buyRate: input.buyRate } : {}),
      ...(input.sellRate !== undefined ? { sellRate: input.sellRate } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
  });

  return {
    id: currency.id,
    code: currency.code,
    label: currency.label,
    buyRate: decimalToNumber(currency.buyRate),
    sellRate: decimalToNumber(currency.sellRate),
    sourceLabel: currency.sourceLabel,
    status: currency.status satisfies DemoCurrencyRateStatus,
    updatedAt: iso(currency.updatedAt),
  };
}

export async function updateDemoPaymentMethod(
  paymentMethodId: string,
  input: {
    status?: DemoPaymentMethodStatus;
    feePercent?: number;
  },
) {
  const current = await db.paymentMethod.findUnique({
    where: { id: paymentMethodId },
  });

  if (!current) {
    throw new DemoSettingsStoreError("Odeme yontemi bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  if (input.feePercent !== undefined && input.feePercent < 0) {
    throw new DemoSettingsStoreError("Komisyon orani negatif olamaz.");
  }

  const method = await db.paymentMethod.update({
    where: { id: paymentMethodId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.feePercent !== undefined ? { feePercent: input.feePercent } : {}),
    },
  });

  return {
    id: method.id,
    label: method.label,
    provider: method.provider,
    feePercent: decimalToNumber(method.feePercent),
    settlementDays: method.settlementDays,
    status: method.status satisfies DemoPaymentMethodStatus,
    supportsInstallment: method.supportsInstallment,
    note: method.note ?? "",
    updatedAt: iso(method.updatedAt),
  };
}

export async function updateDemoCacheGroup(
  cacheGroupId: string,
  input: {
    status?: DemoCacheGroupStatus;
    ttlMinutes?: number;
    warmNow?: boolean;
  },
) {
  const current = await db.cacheGroup.findUnique({
    where: { id: cacheGroupId },
  });

  if (!current) {
    throw new DemoSettingsStoreError("Cache grubu bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  if (input.ttlMinutes !== undefined && input.ttlMinutes <= 0) {
    throw new DemoSettingsStoreError("TTL sifirdan buyuk olmalidir.");
  }

  const group = await db.cacheGroup.update({
    where: { id: cacheGroupId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.ttlMinutes !== undefined ? { ttlMinutes: input.ttlMinutes } : {}),
      ...(input.warmNow
        ? {
            status: "HEALTHY",
            lastWarmedAt: new Date(),
          }
        : {}),
    },
  });

  return {
    id: group.id,
    label: group.label,
    target: group.target,
    status: group.status satisfies DemoCacheGroupStatus,
    ttlMinutes: group.ttlMinutes,
    warmIntervalMinutes: group.warmIntervalMinutes,
    lastWarmedAt: iso(group.lastWarmedAt),
    note: group.note ?? "",
  };
}

export async function updateDemoSystemDefaults(input: Partial<DemoSystemDefaults>) {
  const companyId = await resolveSettingsCompanyId();

  if (!companyId) {
    throw new DemoSettingsStoreError("Varsayilanlar icin aktif firma bulunamadi.");
  }

  if (input.leadResponseMinutes !== undefined && input.leadResponseMinutes <= 0) {
    throw new DemoSettingsStoreError("Talep geri donus suresi sifirdan buyuk olmalidir.");
  }

  if (input.defaultMinNightCount !== undefined && input.defaultMinNightCount <= 0) {
    throw new DemoSettingsStoreError("Minimum gece en az 1 olmalidir.");
  }

  await db.company.update({
    where: { id: companyId },
    data: {
      ...(input.defaultCurrency ? { currency: input.defaultCurrency } : {}),
    },
  });

  const settings = await db.companySetting.upsert({
    where: { companyId },
    update: {
      ...(input.leadResponseMinutes !== undefined
        ? { leadResponseMinutes: input.leadResponseMinutes }
        : {}),
      ...(input.defaultMinNightCount !== undefined
        ? { defaultMinNightCount: input.defaultMinNightCount }
        : {}),
      ...(input.defaultCleaningLeadHours !== undefined
        ? { defaultCleaningLeadHours: input.defaultCleaningLeadHours }
        : {}),
      ...(input.requestReminderHours !== undefined
        ? { requestReminderHours: input.requestReminderHours }
        : {}),
      ...(input.supportPhone !== undefined ? { primaryPhone: input.supportPhone } : {}),
      ...(input.supportEmail !== undefined ? { primaryEmail: input.supportEmail } : {}),
    },
    create: {
      companyId,
      siteName: "Panel Varsayilanlari",
      leadResponseMinutes: input.leadResponseMinutes ?? 20,
      defaultMinNightCount: input.defaultMinNightCount ?? 3,
      defaultCleaningLeadHours: input.defaultCleaningLeadHours ?? 6,
      requestReminderHours: input.requestReminderHours ?? 12,
      primaryPhone: input.supportPhone ?? "",
      primaryEmail: input.supportEmail ?? "",
    },
  });

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { currency: true },
  });

  return {
    leadResponseMinutes: settings.leadResponseMinutes,
    defaultMinNightCount: settings.defaultMinNightCount,
    defaultCleaningLeadHours: settings.defaultCleaningLeadHours,
    supportPhone: settings.primaryPhone ?? "",
    supportEmail: settings.primaryEmail ?? "",
    defaultCurrency: company?.currency ?? input.defaultCurrency ?? "TRY",
    requestReminderHours: settings.requestReminderHours,
    updatedAt: iso(settings.updatedAt),
  } satisfies DemoSystemDefaults;
}

export async function updateDemoDocumentStatus(documentId: string, status: DemoDocumentStatus) {
  const current = await db.documentAsset.findUnique({
    where: { id: documentId },
  });

  if (!current) {
    throw new DemoSettingsStoreError("Dokuman bulunamadi.");
  }

  await assertPanelCompanyAccess(current.companyId);

  const document = await db.documentAsset.update({
    where: { id: documentId },
    data: { status },
  });

  return {
    id: document.id,
    title: document.title,
    category: document.category,
    audience: document.audience,
    status: document.status satisfies DemoDocumentStatus,
    fileUrl: document.fileUrl,
    updatedAt: iso(document.updatedAt),
  };
}
