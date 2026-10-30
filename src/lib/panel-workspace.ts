import { isDateKey, shiftDateKey } from "@/lib/booking-dates";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { PanelRecordError } from "@/lib/panel-record-tools";

export type WorkKind = "TASK" | "FOLLOWUP" | "OWNER_ACCESS" | "OWNER_REQUEST" | "READ" | "PUBLISH_RULES";
export type WorkRecord = { id: string; companyId: string; kind: WorkKind; subjectId: string; userId: string | null;
  data: Record<string, unknown>; version: number; createdAt: string; updatedAt: string };
export type TeamOption = { id: string; companyId: string; name: string; role: string };
export type PanelNotice = { key: string; companyId: string; title: string; detail: string; href: string; category: string; urgent: boolean; read: boolean };
export const PUBLICATION_CHECKS = [
  { key: "photos", label: "En az bir fotoğraf", required: true },
  { key: "price", label: "Geçerli gecelik fiyat", required: true },
  { key: "location", label: "Lokasyon ve bölge", required: true },
  { key: "license", label: "Turizm belge numarası", required: false },
  { key: "licensePdf", label: "Turizm belgesi PDF", required: false },
  { key: "english", label: "İngilizce başlık ve açıklama", required: false },
] as const;
export type PublicationKey = typeof PUBLICATION_CHECKS[number]["key"];
export function publicationChecks(villa: Pick<CatalogVilla, "imageCount" | "nightlyPrice" | "city" | "district" | "tourismLicenseNumber" | "tourismLicensePdfUrl" | "titleEn" | "descriptionEn">, required: string[]) {
  const values = { photos: villa.imageCount > 0, price: Number.isFinite(villa.nightlyPrice) && villa.nightlyPrice > 0,
    location: Boolean(villa.city?.trim() && villa.district?.trim()), license: Boolean(villa.tourismLicenseNumber?.trim()),
    licensePdf: Boolean(villa.tourismLicensePdfUrl), english: Boolean(villa.titleEn?.trim() && villa.descriptionEn?.trim()) };
  return PUBLICATION_CHECKS.map(item => ({ ...item, required: item.required || required.includes(item.key), passed: values[item.key] }));
}
export function requiredText(value: unknown, label: string, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new PanelRecordError(`${label}: 1-${max} karakter girin.`);
  return value.trim();
}
export function optionalText(value: unknown, max = 2000) {
  if (value === undefined || value === null || value === "") return "";
  return requiredText(value, "Metin", max);
}
export function validDateTime(value: unknown, required = false) {
  if (!value && !required) return "";
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) || !isDateKey(value.slice(0, 10)) || !Number.isFinite(Date.parse(value))) {
    throw new PanelRecordError("Saat dilimi içeren geçerli bir tarih ve saat seçin.");
  }
  return new Date(value).toISOString();
}
export function validStay(start: unknown, end: unknown) {
  if (typeof start !== "string" || typeof end !== "string" || !isDateKey(start) || !isDateKey(end) || start >= end) {
    throw new PanelRecordError("Bitiş tarihi başlangıçtan sonra olmalı. Bitiş günü müsait kabul edilir.");
  }
  return { startDate: start, endDate: end };
}
export function calendarDays(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month) || !isDateKey(`${month}-01`)) throw new PanelRecordError("Geçersiz ay.");
  const result: string[] = [];
  for (let day = `${month}-01`; day.startsWith(month); day = shiftDateKey(day, 1)) result.push(day);
  return result;
}
export function isOverdue(value: unknown, now = Date.now()) { return typeof value === "string" && Boolean(value) && Date.parse(value) < now; }
