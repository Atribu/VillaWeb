export type VillaDraft = { version: 1; savedAt: number; baseline: string; fields: Record<string, string[]>; hasFiles: boolean };
export const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;
export function villaDraftKey(userId: string, companyId: string, villaId: string) {
  return `booktovilla:villa-draft:${JSON.stringify([userId, companyId, villaId])}`;
}
export function parseVillaDraft(raw: string | null, now = Date.now()): VillaDraft | null {
  try {
    const draft = JSON.parse(raw ?? "null");
    if (!draft || draft.version !== 1 || !Number.isFinite(draft.savedAt) || draft.savedAt > now || now - draft.savedAt > DRAFT_TTL
      || typeof draft.baseline !== "string" || !draft.fields || typeof draft.fields !== "object" || Array.isArray(draft.fields)
      || Object.values(draft.fields).some(values => !Array.isArray(values) || values.some(value => typeof value !== "string"))) return null;
    return draft;
  } catch { return null; }
}
