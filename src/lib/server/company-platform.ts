import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_PACKAGE, parsePackage, type PlatformConfig, type PackageModule } from "@/lib/platform-features";
import { PanelAccessError } from "@/lib/auth/access-error";
import type { SessionUser } from "@/lib/auth/session";
import { assertPanelCompanyAccess, assertSuperAdminPanelAccess } from "@/lib/server/demo-company-context";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { getFallbackVillas, getFallbackTeamUsers } from "@/lib/server/development-fallback-data";
import { mutatePlatformLocal, readPlatformLocal } from "@/lib/server/platform-local";
import { PanelRecordError } from "@/lib/panel-record-tools";

function defaults(companyId: string): PlatformConfig { return { companyId, package: DEFAULT_PACKAGE, siteDraft: null, sitePublished: null, version: 0 }; }
// Internal access only. Public callers must resolve companyId from the current host.
export async function readPlatformConfig(companyId: string, tx?: Prisma.TransactionClient): Promise<PlatformConfig> {
  return withDevelopmentFallback(async () => {
    const row = await (tx ?? db).companyPlatformConfig.findUnique({ where: { companyId } });
    return row ? { ...row, package: row.package ? parsePackage(row.package) : DEFAULT_PACKAGE,
      siteDraft: row.siteDraft as unknown as PlatformConfig["siteDraft"], sitePublished: row.sitePublished as unknown as PlatformConfig["sitePublished"] } : defaults(companyId);
  }, async () => (await readPlatformLocal<PlatformConfig>("platform-config")).find(row => row.companyId === companyId) ?? defaults(companyId));
}
export async function changePlatformConfig(companyId: string, version: number, change: (current: PlatformConfig, tx?: Prisma.TransactionClient) => Promise<PlatformConfig>) {
  await assertPanelCompanyAccess(companyId);
  function check(current: PlatformConfig) { if (!Number.isInteger(version) || current.version !== version) throw new PanelRecordError("Ayarlar değişmiş. Sayfayı yenileyin.", 409); }
  return withDevelopmentFallback(() => db.$transaction(async tx => {
    await lockCompany(tx, companyId); const current = await readPlatformConfig(companyId, tx); check(current);
    const next = await change(current, tx);
    const data = { package: next.package as unknown as Prisma.InputJsonObject,
      ...(next.siteDraft ? { siteDraft: next.siteDraft as unknown as Prisma.InputJsonObject } : {}),
      ...(next.sitePublished ? { sitePublished: next.sitePublished as unknown as Prisma.InputJsonObject } : {}), version: current.version + 1 };
    await tx.companyPlatformConfig.upsert({ where: { companyId }, create: { companyId, ...data }, update: data });
    return { ...next, version: data.version };
  }), () => mutatePlatformLocal<PlatformConfig, PlatformConfig>("platform-config", async rows => {
    const index = rows.findIndex(row => row.companyId === companyId); const current = rows[index] ?? defaults(companyId); check(current);
    const next = { ...await change(current), version: current.version + 1 }; if (index < 0) rows.push(next); else rows[index] = next; return next;
  }));
}
export async function lockCompany(tx: Prisma.TransactionClient, companyId: string) {
  await tx.$queryRaw`SELECT id FROM "Company" WHERE id = ${companyId} FOR UPDATE`;
}
export async function assertCompanyModule(actor: SessionUser, permission: string) {
  if (actor.role === "SUPER_ADMIN" || !actor.companyId) return;
  const modules = (await readPlatformConfig(actor.companyId)).package.modules;
  if ((DEFAULT_PACKAGE.modules as string[]).includes(permission) && !modules.includes(permission as PackageModule)) throw new PanelAccessError("Bu modül firma paketinde etkin değil.");
}
export async function companyUsage(companyId: string, tx?: Prisma.TransactionClient) {
  return withDevelopmentFallback(async () => ({ users: await (tx ?? db).companyMembership.count({ where: { companyId, status: { not: "SUSPENDED" } } }),
    activeVillas: await (tx ?? db).villa.count({ where: { companyId, status: "ACTIVE" } }) }), async () => ({
    users: (await getFallbackTeamUsers(companyId)).filter(user => user.status !== "PASSIVE").length,
    activeVillas: (await getFallbackVillas(companyId)).filter(villa => villa.status === "ACTIVE").length,
  }));
}
export async function assertCompanyCapacity(companyId: string, resource: "users" | "activeVillas", tx?: Prisma.TransactionClient) {
  if (tx) await lockCompany(tx, companyId);
  const config = await readPlatformConfig(companyId, tx); const limit = config.package[resource];
  if (limit !== null && (await companyUsage(companyId, tx))[resource] >= limit) throw new PanelAccessError(resource === "users" ? "Firma kullanıcı limitine ulaşıldı." : "Firma aktif villa limitine ulaşıldı. Önce bir villayı pasife alın veya paketi yükseltin.");
}
export async function saveCompanyPackage(companyId: string, version: number, value: unknown) {
  await assertSuperAdminPanelAccess(); const next = parsePackage(value);
  return changePlatformConfig(companyId, version, async (current, tx) => {
    const usage = await companyUsage(companyId, tx);
    if ((next.users !== null && next.users < usage.users) || (next.activeVillas !== null && next.activeVillas < usage.activeVillas)) throw new PanelRecordError("Paket limiti mevcut kullanımın altına indirilemez.");
    return { ...current, package: next };
  });
}
