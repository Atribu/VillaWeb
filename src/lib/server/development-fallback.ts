import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDefaultDemoCompany, getFallbackCompanyIdForVillaSlug } from "@/lib/demo-companies";

const truthyValues = new Set(["1", "true", "yes", "on"]);

const legacyCompanyIdMap: Record<string, string> = {
  "company-villavera": "seed-company-villavera",
  "company-sahil-collection": "seed-company-sahil",
  "seed-company-villavera": "seed-company-villavera",
  "seed-company-sahil": "seed-company-sahil",
};

export function isDevelopmentEnvironment() {
  return process.env.NODE_ENV !== "production";
}

export function isDevelopmentFallbackForced() {
  if (!isDevelopmentEnvironment()) {
    return false;
  }

  const value = (process.env.DEV_FALLBACK_MODE ?? "").trim().toLowerCase();
  return truthyValues.has(value);
}

export function isPrismaConnectionError(error: unknown) {
  if (!isDevelopmentEnvironment()) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  const name =
    typeof error === "object" && error && "name" in error ? String(error.name) : "";
  const code =
    typeof error === "object" && error && "code" in error ? String(error.code) : "";

  return (
    name.includes("PrismaClientInitializationError") ||
    code === "P1000" ||
    code === "P1001" ||
    message.includes("Can't reach database server") ||
    message.includes("Environment variable not found: DATABASE_URL") ||
    message.includes("PrismaClientInitializationError")
  );
}

export async function withDevelopmentFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T,
) {
  if (isDevelopmentFallbackForced()) {
    return await fallback();
  }

  try {
    return await primary();
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return await fallback();
    }

    throw error;
  }
}

export function cloneDevelopmentValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export async function readDevelopmentDataFile<T>(fileName: string, fallbackValue: T): Promise<T> {
  const targetPath = path.join(process.cwd(), "data", fileName);

  try {
    const raw = await readFile(targetPath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return cloneDevelopmentValue(fallbackValue);
  }
}

export function normalizeDevelopmentCompanyId(
  companyId?: string | null,
  villaSlug?: string | null,
) {
  const normalized = (companyId ?? "").trim();

  if (normalized && legacyCompanyIdMap[normalized]) {
    return legacyCompanyIdMap[normalized];
  }

  if (normalized) {
    return normalized;
  }

  if (villaSlug) {
    return getFallbackCompanyIdForVillaSlug(villaSlug);
  }

  return getDefaultDemoCompany().id;
}

export function filterDevelopmentRecordsByCompany<T>(
  records: T[],
  companyId: string | null | undefined,
  resolveCompanyId: (record: T) => string | null | undefined,
) {
  const normalizedFilter = companyId ? normalizeDevelopmentCompanyId(companyId) : null;

  if (!normalizedFilter) {
    return records;
  }

  return records.filter(
    (record) => normalizeDevelopmentCompanyId(resolveCompanyId(record)) === normalizedFilter,
  );
}

export function createDevelopmentWriteErrorMessage(moduleLabel: string) {
  return `${moduleLabel} icin development fallback aktif. Yazma islemleri localde PostgreSQL olmadan kapali tutuluyor.`;
}
