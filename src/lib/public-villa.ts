import type { CatalogVilla } from "@/lib/villa-catalog";

export function toPublicVilla(villa: CatalogVilla): CatalogVilla {
  const publicVilla = { ...villa };
  delete publicVilla.ownerVillaName;
  delete publicVilla.supplierName;
  delete publicVilla.supplierPhone;
  delete publicVilla.supplierEmail;
  delete publicVilla.supplierNotes;
  return {
    ...publicVilla,
    viewCount: 0,
    requestCount: 0,
    revenueLabel: "",
    availabilityRanges: villa.availabilityRanges.map((range) => ({
      id: range.id,
      startDate: range.startDate,
      endDate: range.endDate,
      status: range.status,
      label: range.status === "RESERVED" ? "Dolu" : "Kapali",
    })),
  };
}
