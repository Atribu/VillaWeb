import "server-only";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { isDevelopmentEnvironment, writeDevelopmentDataFile } from "@/lib/server/development-fallback";

export async function mutateFallbackRecord<T extends { id: string; companyId?: string | null }>(
  fileName: string, read: () => Promise<T[]>, id: string, update: (record: T) => T | null,
) {
  if (!isDevelopmentEnvironment()) throw new Error("Local writes are disabled in production.");
  const records = await read();
  const current = records.find((record) => record.id === id);
  if (!current) throw new Error("Kayit bulunamadi.");
  await assertPanelCompanyAccess(current.companyId);
  const result = update(current);
  const updated = result ? { ...current, ...Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined)) } as T : null;
  await writeDevelopmentDataFile(fileName, records.flatMap((record) => record.id === id ? updated ? [updated] : [] : [record]));
  return updated;
}
