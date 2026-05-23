import "server-only";

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedDemoCacheGroups,
  seedDemoCurrencyRates,
  seedDemoDocuments,
  seedDemoPaymentMethods,
  seedDemoSystemDefaults,
  type DemoCacheGroupStatus,
  type DemoCurrencyRateStatus,
  type DemoDocumentStatus,
  type DemoPaymentMethodStatus,
  type DemoSystemDefaults,
} from "@/lib/demo-settings";

const demoDataDirectory = path.join(process.cwd(), "data");
const currencyFilePath = path.join(demoDataDirectory, "demo-currency-rates.json");
const paymentMethodsFilePath = path.join(demoDataDirectory, "demo-payment-methods.json");
const cacheGroupsFilePath = path.join(demoDataDirectory, "demo-cache-groups.json");
const systemDefaultsFilePath = path.join(demoDataDirectory, "demo-system-defaults.json");
const documentsFilePath = path.join(demoDataDirectory, "demo-documents.json");

export class DemoSettingsStoreError extends Error {}

async function ensureJsonFile<T>(filePath: string, seedData: T) {
  await mkdir(demoDataDirectory, { recursive: true });

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(seedData, null, 2), "utf8");
  }
}

async function readJsonFile<T>(filePath: string, seedData: T): Promise<T> {
  await ensureJsonFile(filePath, seedData);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function getDemoCurrencyRates() {
  const currencies = await readJsonFile(currencyFilePath, seedDemoCurrencyRates);
  return currencies.sort((left, right) => left.code.localeCompare(right.code));
}

export async function getDemoPaymentMethods() {
  const methods = await readJsonFile(paymentMethodsFilePath, seedDemoPaymentMethods);
  return methods.sort((left, right) => left.label.localeCompare(right.label));
}

export async function getDemoCacheGroups() {
  const groups = await readJsonFile(cacheGroupsFilePath, seedDemoCacheGroups);
  return groups.sort((left, right) => left.label.localeCompare(right.label));
}

export async function getDemoSystemDefaults() {
  return readJsonFile(systemDefaultsFilePath, seedDemoSystemDefaults);
}

export async function getDemoDocuments() {
  const documents = await readJsonFile(documentsFilePath, seedDemoDocuments);
  return documents.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function updateDemoCurrencyRate(
  currencyId: string,
  input: {
    buyRate?: number;
    sellRate?: number;
    status?: DemoCurrencyRateStatus;
  },
) {
  const currencies = await getDemoCurrencyRates();
  const currencyIndex = currencies.findIndex((currency) => currency.id === currencyId);

  if (currencyIndex === -1) {
    throw new DemoSettingsStoreError("Kur kaydi bulunamadi.");
  }

  if (input.buyRate !== undefined && input.buyRate <= 0) {
    throw new DemoSettingsStoreError("Alis kuru sifirdan buyuk olmalidir.");
  }

  if (input.sellRate !== undefined && input.sellRate <= 0) {
    throw new DemoSettingsStoreError("Satis kuru sifirdan buyuk olmalidir.");
  }

  currencies[currencyIndex] = {
    ...currencies[currencyIndex],
    ...(input.buyRate !== undefined ? { buyRate: input.buyRate } : {}),
    ...(input.sellRate !== undefined ? { sellRate: input.sellRate } : {}),
    ...(input.status ? { status: input.status } : {}),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(currencyFilePath, currencies);
  return currencies[currencyIndex];
}

export async function updateDemoPaymentMethod(
  paymentMethodId: string,
  input: {
    status?: DemoPaymentMethodStatus;
    feePercent?: number;
  },
) {
  const methods = await getDemoPaymentMethods();
  const methodIndex = methods.findIndex((method) => method.id === paymentMethodId);

  if (methodIndex === -1) {
    throw new DemoSettingsStoreError("Odeme yontemi bulunamadi.");
  }

  if (input.feePercent !== undefined && input.feePercent < 0) {
    throw new DemoSettingsStoreError("Komisyon orani negatif olamaz.");
  }

  methods[methodIndex] = {
    ...methods[methodIndex],
    ...(input.status ? { status: input.status } : {}),
    ...(input.feePercent !== undefined ? { feePercent: input.feePercent } : {}),
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(paymentMethodsFilePath, methods);
  return methods[methodIndex];
}

export async function updateDemoCacheGroup(
  cacheGroupId: string,
  input: {
    status?: DemoCacheGroupStatus;
    ttlMinutes?: number;
    warmNow?: boolean;
  },
) {
  const groups = await getDemoCacheGroups();
  const groupIndex = groups.findIndex((group) => group.id === cacheGroupId);

  if (groupIndex === -1) {
    throw new DemoSettingsStoreError("Cache grubu bulunamadi.");
  }

  if (input.ttlMinutes !== undefined && input.ttlMinutes <= 0) {
    throw new DemoSettingsStoreError("TTL sifirdan buyuk olmalidir.");
  }

  groups[groupIndex] = {
    ...groups[groupIndex],
    ...(input.status ? { status: input.status } : {}),
    ...(input.ttlMinutes !== undefined ? { ttlMinutes: input.ttlMinutes } : {}),
    ...(input.warmNow
      ? {
          status: "HEALTHY" as const,
          lastWarmedAt: new Date().toISOString(),
        }
      : {}),
  };

  await writeJsonFile(cacheGroupsFilePath, groups);
  return groups[groupIndex];
}

export async function updateDemoSystemDefaults(input: Partial<DemoSystemDefaults>) {
  const current = await getDemoSystemDefaults();

  if (input.leadResponseMinutes !== undefined && input.leadResponseMinutes <= 0) {
    throw new DemoSettingsStoreError("Talep geri donus suresi sifirdan buyuk olmalidir.");
  }

  if (input.defaultMinNightCount !== undefined && input.defaultMinNightCount <= 0) {
    throw new DemoSettingsStoreError("Minimum gece en az 1 olmalidir.");
  }

  const nextValue: DemoSystemDefaults = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(systemDefaultsFilePath, nextValue);
  return nextValue;
}

export async function updateDemoDocumentStatus(documentId: string, status: DemoDocumentStatus) {
  const documents = await getDemoDocuments();
  const documentIndex = documents.findIndex((document) => document.id === documentId);

  if (documentIndex === -1) {
    throw new DemoSettingsStoreError("Dokuman bulunamadi.");
  }

  documents[documentIndex] = {
    ...documents[documentIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(documentsFilePath, documents);
  return documents[documentIndex];
}
