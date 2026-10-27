import type { CatalogVilla } from "@/lib/villa-catalog";
import { getMinimumNightCountForStay } from "@/lib/demo-operations";
import { getNightCount, isBookableRange } from "@/lib/villa-availability";
import { validSearchStay } from "@/lib/public-search";

export type VillaFilters = { location: string; checkIn: string; checkOut: string; guests: string; pool: string; category: string; minPrice: string; maxPrice: string; sort: string };
export const FILTER_KEYS = ["location", "checkIn", "checkOut", "guests", "pool", "category", "minPrice", "maxPrice", "sort"] as const;
export function normalizeVillaSearch(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");
}
export function readVillaFilters(params: Record<string, string | string[] | undefined>): VillaFilters {
  const result = Object.fromEntries(FILTER_KEYS.map((key) => [key, (Array.isArray(params[key]) ? params[key][0] : params[key])?.trim() ?? ""])) as VillaFilters;
  result.guests = /^\d+$/.test(result.guests) && Number(result.guests) > 0 ? result.guests : "";
  for (const key of ["minPrice", "maxPrice"] as const) result[key] = /^\d+(\.\d{1,2})?$/.test(result[key]) && Number.isFinite(Number(result[key])) ? result[key] : "";
  if (!["recommended", "price-asc", "price-desc", "capacity"].includes(result.sort)) result.sort = "recommended";
  return result;
}
export function villaFilterHref(company: string, filters: VillaFilters, remove: (keyof VillaFilters)[] = []) {
  const params = new URLSearchParams({ company });
  for (const key of FILTER_KEYS) if (filters[key] && !remove.includes(key) && !(key === "sort" && filters[key] === "recommended")) params.set(key, filters[key]);
  return `/villalar?${params}`;
}
export function filterVillas(villas: CatalogVilla[], filters: VillaFilters, today: string) {
  const invalidDates = !validSearchStay(filters.checkIn, filters.checkOut, today);
  const invalidBudget = Boolean(filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice));
  if (invalidDates || invalidBudget) return { villas: [] as CatalogVilla[], invalidDates, invalidBudget };
  const location = normalizeVillaSearch(filters.location);
  const nightly = (villa: CatalogVilla) => villa.discountedNightlyPrice ?? villa.nightlyPrice;
  const results = villas.filter((villa) => {
    const haystack = [villa.title, villa.titleEn, villa.shortCode, villa.city, villa.district, villa.locationLabel, villa.category, villa.categoryEn, villa.badge, villa.badgeEn].filter(Boolean).join(" ");
    if (location && !normalizeVillaSearch(haystack).includes(location)) return false;
    if (filters.guests && villa.capacity < Number(filters.guests)) return false;
    if (filters.pool && ![villa.poolType, villa.poolTypeEn].some((value) => value && normalizeVillaSearch(value) === normalizeVillaSearch(filters.pool))) return false;
    if (filters.category && ![villa.category, villa.categoryEn].some((value) => value && normalizeVillaSearch(value) === normalizeVillaSearch(filters.category))) return false;
    if (filters.minPrice && nightly(villa) < Number(filters.minPrice)) return false;
    if (filters.maxPrice && nightly(villa) > Number(filters.maxPrice)) return false;
    return !filters.checkIn || (getNightCount(filters.checkIn, filters.checkOut) >= getMinimumNightCountForStay(villa, filters.checkIn, filters.checkOut) && isBookableRange(filters.checkIn, filters.checkOut, villa.availabilityRanges));
  });
  results.sort((a, b) => filters.sort === "price-asc" ? nightly(a) - nightly(b) : filters.sort === "price-desc" ? nightly(b) - nightly(a) : filters.sort === "capacity" ? b.capacity - a.capacity : Number(b.featured) - Number(a.featured));
  return { villas: results, invalidDates, invalidBudget };
}
