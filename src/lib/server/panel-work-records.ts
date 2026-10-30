import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { readFile } from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/auth/server-session";
import { hasPermission, type PanelPermission } from "@/lib/auth/permissions";
import { PanelAccessError } from "@/lib/auth/access-error";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { PanelRecordError } from "@/lib/panel-record-tools";
import type { WorkKind, WorkRecord } from "@/lib/panel-workspace";

export async function requirePanelPermission(permission: PanelPermission) {
  const session = await getUserSession();
  if (!session || !hasPermission(session.role, permission)) throw new PanelAccessError();
  return session;
}
function localPath() {
  if (process.env.NODE_ENV === "production") throw new Error("Local panel storage disabled.");
  return path.join(process.env.DEV_DATA_DIRECTORY || path.join(process.cwd(), "data"), "panel-work-records.json");
}
async function readLocal(): Promise<WorkRecord[]> {
  let rows: WorkRecord[] = [];
  // Keep raw multi-tenant JSON out of Next.js development promise traces.
  await new Promise<void>((resolve, reject) => readFile(localPath(), "utf8", (error, content) => {
    if (error) { if (error.code === "ENOENT") resolve(); else reject(error); return; }
    try { rows = JSON.parse(content); resolve(); } catch (error) { reject(error); }
  }));
  return rows;
}
function serialize(row: { createdAt: Date; updatedAt: Date; data: unknown; kind: string; id: string; companyId: string; subjectId: string; userId: string | null; version: number }): WorkRecord {
  return { ...row, kind: row.kind as WorkKind, data: row.data as Record<string, unknown>, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
// Internal repository: callers must also authorize the module and any entity/user references.
export async function listWorkRecords(kind: WorkKind, companyId?: string, userId?: string) {
  const actor = await getUserSession();
  if (!actor) throw new PanelAccessError();
  const scope = actor.role === "SUPER_ADMIN" ? companyId : actor.companyId;
  if (companyId) await assertPanelCompanyAccess(companyId);
  if (actor.role !== "SUPER_ADMIN" && !scope) throw new PanelAccessError();
  return withDevelopmentFallback(async () => (await db.panelWorkRecord.findMany({
    where: { kind, ...(scope ? { companyId: scope } : {}), ...(userId ? { userId } : {}) }, orderBy: { updatedAt: "desc" },
  })).map(serialize), async () => (await readLocal()).filter(row => row.kind === kind && (!scope || row.companyId === scope) && (!userId || row.userId === userId)));
}
let queue: Promise<unknown> = Promise.resolve();
export async function changeWorkRecord(input: { kind: WorkKind; companyId: string; subjectId: string; version?: number },
  change: (current: WorkRecord | null, tx?: Prisma.TransactionClient) => Promise<{ data: Record<string, unknown>; userId?: string | null }>) {
  await assertPanelCompanyAccess(input.companyId);
  return withDevelopmentFallback(async () => db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`panel:${input.companyId}:${input.kind}:${input.subjectId}`}))`;
    const row = await tx.panelWorkRecord.findUnique({ where: { companyId_kind_subjectId: { companyId: input.companyId, kind: input.kind, subjectId: input.subjectId } } });
    const current = row ? serialize(row) : null;
    checkVersion(current, input.version);
    const result = await change(current, tx);
    const data = result.data as Prisma.InputJsonObject;
    return serialize(await tx.panelWorkRecord.upsert({ where: { companyId_kind_subjectId: { companyId: input.companyId, kind: input.kind, subjectId: input.subjectId } },
      create: { companyId: input.companyId, kind: input.kind, subjectId: input.subjectId, data, userId: result.userId },
      update: { data, userId: result.userId, version: { increment: 1 } } }));
  }, { isolationLevel: "Serializable", timeout: 15000 }), async () => {
    const operation = queue.then(async () => {
      const rows = await readLocal();
      const index = rows.findIndex(row => row.kind === input.kind && row.companyId === input.companyId && row.subjectId === input.subjectId);
      const current = rows[index] ?? null;
      checkVersion(current, input.version);
      const result = await change(current);
      const next: WorkRecord = { id: current?.id ?? randomUUID(), ...input, data: result.data, userId: result.userId === undefined ? current?.userId ?? null : result.userId,
        version: (current?.version ?? 0) + 1, createdAt: current?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (index < 0) rows.push(next); else rows[index] = next;
      const target = localPath(); const temp = `${target}.${randomUUID()}.tmp`;
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(temp, JSON.stringify(rows), { mode: 0o600 }); await rename(temp, target);
      return next;
    });
    queue = operation.catch(() => {}); return operation;
  });
}
function checkVersion(current: WorkRecord | null, expected?: number) {
  if (expected !== undefined && (!Number.isInteger(expected) || (current?.version ?? 0) !== expected)) throw new PanelRecordError("Kayıt değişmiş. Sayfayı yenileyip tekrar deneyin.", 409);
}
