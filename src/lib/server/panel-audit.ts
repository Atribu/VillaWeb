import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/auth/server-session";
import { PanelAccessError } from "@/lib/auth/access-error";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { readDevelopmentDataFile, writeDevelopmentDataFile, withDevelopmentFallback } from "@/lib/server/development-fallback";
import type { PanelActivity } from "@/lib/panel-record-tools";

export type AuditInput = { companyId: string; entityType: "VILLA" | "REQUEST"; entityId: string; action: string; summary: string };
type LocalAudit = AuditInput & PanelActivity;
let queue: Promise<unknown> = Promise.resolve();

export async function auditData(input: AuditInput) {
  const actor = await getUserSession();
  if (!actor) throw new PanelAccessError("Oturum bulunamadı.");
  await assertPanelCompanyAccess(input.companyId);
  return { ...input, actorUserId: actor.id, metadata: { actorName: actor.displayName } };
}

export async function writePanelAudit(input: AuditInput, tx?: Prisma.TransactionClient) {
  const data = await auditData(input);
  if (tx) { await tx.auditLog.create({ data }); return; }
  await withDevelopmentFallback(() => db.auditLog.create({ data }), async () => {
    const pending = queue.then(async () => {
      const records = await readDevelopmentDataFile<LocalAudit[]>("panel-audit.json", []);
      await writeDevelopmentDataFile("panel-audit.json", [...records, { ...input, id: randomUUID(), actor: data.metadata.actorName, createdAt: new Date().toISOString() }]);
    });
    queue = pending.catch(() => {});
    await pending;
    return null;
  });
}

// Callers must resolve the entity and authorize its company before requesting its history.
export async function readPanelAudit(input: Pick<AuditInput, "companyId" | "entityType" | "entityId">): Promise<PanelActivity[]> {
  await assertPanelCompanyAccess(input.companyId);
  return withDevelopmentFallback(async () => {
    const rows = await db.auditLog.findMany({ where: input, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 200,
      include: { actorUser: { select: { name: true } } } });
    return rows.map(row => ({ id: row.id, action: row.action, summary: row.summary, createdAt: row.createdAt.toISOString(),
      actor: (row.metadata as { actorName?: string } | null)?.actorName ?? row.actorUser?.name ?? "Sistem" }));
  }, async () => (await readDevelopmentDataFile<LocalAudit[]>("panel-audit.json", []))
    .filter(row => row.companyId === input.companyId && row.entityType === input.entityType && row.entityId === input.entityId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200)
    .map(({ id, action, summary, actor, createdAt }) => ({ id, action, summary, actor, createdAt })));
}
