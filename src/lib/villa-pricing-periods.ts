import { isDateKey } from "@/lib/booking-dates";
import type { VillaPricingPeriod } from "@/lib/villa-catalog";

export type PricingPeriodInput = Omit<VillaPricingPeriod, "id" | "active"> & {
  id?: string;
  active?: boolean;
};

export function validatePricingPeriod(input: PricingPeriodInput, periods: VillaPricingPeriod[]) {
  if (!input.title.trim()) throw new Error("Fiyat donemi adi zorunludur.");
  if (!isDateKey(input.startDate) || !isDateKey(input.endDate) || input.endDate < input.startDate) {
    throw new Error("Fiyat donemi tarih araligi gecerli degil.");
  }
  if (!Number.isFinite(input.nightlyPrice) || input.nightlyPrice <= 0) {
    throw new Error("Gecelik fiyat sifirdan buyuk olmalidir.");
  }
  if (input.cleaningFee !== undefined && (!Number.isFinite(input.cleaningFee) || input.cleaningFee < 0)) {
    throw new Error("Temizlik ucreti sifir veya daha buyuk olmalidir.");
  }
  if (input.minNightCount !== undefined && (!Number.isInteger(input.minNightCount) || input.minNightCount < 1)) {
    throw new Error("Minimum gece pozitif bir tam sayi olmalidir.");
  }
  if (input.id && !periods.some((period) => period.id === input.id)) {
    throw new Error("Duzenlenecek fiyat donemi bulunamadi.");
  }
  const overlap = periods.find((period) =>
    period.id !== input.id && period.active && input.active !== false &&
    input.startDate <= period.endDate && input.endDate >= period.startDate,
  );
  if (overlap) throw new Error(`${overlap.title} ile tarih cakismasi var. Once mevcut donemi duzenleyin.`);
}
