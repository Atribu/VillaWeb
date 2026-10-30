import type { CatalogVilla } from "@/lib/villa-catalog";

export const PANEL_VILLA_PAGE_SIZE = 12;

export function getVillaPublicationWarnings(villa: CatalogVilla) {
  return [
    !villa.imageCount && "Fotograf",
    !(villa.nightlyPrice > 0) && "Gecelik fiyat",
    (!villa.titleEn?.trim() || !villa.descriptionEn?.trim()) && "Ingilizce icerik",
    !villa.tourismLicenseNumber?.trim() && "Belge numarasi",
  ].filter((value): value is string => Boolean(value));
}

export function selectPanelVillas(villas: CatalogVilla[], filters: {
  q?: string; location?: string; status?: string; sort?: string; page?: string; review?: string;
}) {
  const query = filters.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const matches = villas.filter((villa) => {
    const text = [villa.shortCode, villa.title, villa.ownerVillaName, villa.city, villa.district, villa.locationLabel]
      .filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
    return (!query || text.includes(query))
      && (!filters.location || villa.city === filters.location || villa.district === filters.location)
      && (!filters.status || villa.status === filters.status)
      && (filters.review !== "1" || getVillaPublicationWarnings(villa).length > 0);
  });
  if (filters.sort === "title") matches.sort((a, b) => a.title.localeCompare(b.title, "tr"));
  if (filters.sort === "price-asc") matches.sort((a, b) => (a.discountedNightlyPrice ?? a.nightlyPrice) - (b.discountedNightlyPrice ?? b.nightlyPrice));
  if (filters.sort === "price-desc") matches.sort((a, b) => (b.discountedNightlyPrice ?? b.nightlyPrice) - (a.discountedNightlyPrice ?? a.nightlyPrice));
  const pageCount = Math.max(1, Math.ceil(matches.length / PANEL_VILLA_PAGE_SIZE));
  const requested = Number(filters.page);
  const page = Number.isFinite(requested) ? Math.min(pageCount, Math.max(1, Math.floor(requested))) : 1;
  return { total: matches.length, page, pageCount, visible: matches.slice((page - 1) * PANEL_VILLA_PAGE_SIZE, page * PANEL_VILLA_PAGE_SIZE) };
}
