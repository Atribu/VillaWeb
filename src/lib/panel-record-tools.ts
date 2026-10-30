export class PanelRecordError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export type GalleryState = { urls: string[]; cover: string | null };
export function galleryVersion(state: GalleryState) {
  return JSON.stringify([state.urls, state.cover]);
}

export function validateGalleryChange(current: GalleryState, input: unknown): GalleryState {
  const value = input as { urls?: unknown; cover?: unknown; version?: unknown } | null;
  const ownedUrls = new Set(current.urls);
  if (!value || value.version !== galleryVersion(current)) {
    throw new PanelRecordError("Galeri değişmiş. Sayfayı yenileyip tekrar deneyin.", 409);
  }
  if (!Array.isArray(value.urls) || !value.urls.length || value.urls.some(url => typeof url !== "string" || !ownedUrls.has(url))
    || new Set(value.urls).size !== value.urls.length || typeof value.cover !== "string" || !value.urls.includes(value.cover)) {
    throw new PanelRecordError("En az bir mevcut fotoğraf ve geçerli bir kapak seçin.");
  }
  return { urls: value.urls as string[], cover: value.cover };
}

export type BulkVillaSelection = { id: string; status: string };
export function validateBulkSelection(input: unknown) {
  const value = input as { selection?: unknown; status?: unknown } | null;
  if (!value || !["PAUSED", "ARCHIVED"].includes(String(value.status)) || !Array.isArray(value.selection)
    || !value.selection.length || value.selection.length > 100 || value.selection.some(item => !item || typeof item.id !== "string" || !item.id || typeof item.status !== "string")
    || new Set(value.selection.map(item => item.id)).size !== value.selection.length) {
    throw new PanelRecordError("Pasife alma veya arşivleme için 1-100 villa seçin.");
  }
  return { selection: value.selection as BulkVillaSelection[], status: value.status as "PAUSED" | "ARCHIVED" };
}

export function moveItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export type PanelActivity = { id: string; action: string; summary: string; actor: string; createdAt: string };
