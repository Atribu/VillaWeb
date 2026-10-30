import "server-only";
import { publicationChecks, PUBLICATION_CHECKS } from "@/lib/panel-workspace";
import { listWorkRecords, changeWorkRecord, requirePanelPermission } from "@/lib/server/panel-work-records";
import { PanelRecordError } from "@/lib/panel-record-tools";

export async function getPublicationPolicy(companyId: string) {
  const row = (await listWorkRecords("PUBLISH_RULES", companyId))[0];
  return { required: Array.isArray(row?.data.required) ? row.data.required as string[] : [], version: row?.version ?? 0 };
}
export async function savePublicationPolicy(companyId: string, required: unknown, version: number) {
  await requirePanelPermission("settings");
  if (!Array.isArray(required) || required.some(key => !PUBLICATION_CHECKS.some(check => check.key === key))) throw new PanelRecordError("Geçersiz yayın kuralı.");
  return changeWorkRecord({ kind: "PUBLISH_RULES", companyId, subjectId: "policy", version }, async () => ({ data: { required: [...new Set(required)] } }));
}
export async function assertPublicationReady(companyId: string, villa: Parameters<typeof publicationChecks>[0]) {
  const policy = await getPublicationPolicy(companyId);
  const missing = publicationChecks(villa, policy.required).filter(check => check.required && !check.passed);
  if (missing.length) throw new PanelRecordError(`Yayınlanamadı. Eksik alanlar: ${missing.map(check => check.label).join(", ")}. Taslak olarak kaydedebilirsiniz.`);
}
