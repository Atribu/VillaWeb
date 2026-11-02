import { isDateKey } from "@/lib/booking-dates";
import type { VillaPricingPeriod } from "@/lib/villa-catalog";

export type PricingPeriodInput = Omit<VillaPricingPeriod, "id" | "active"> & {
  id?: string;
  active?: boolean;
};

export function validatePricingPeriod(input: PricingPeriodInput, periods: VillaPricingPeriod[]) {
  if (!Number.isFinite(input.weekendPercent ?? 0) || (input.weekendPercent ?? 0) < -90 || (input.weekendPercent ?? 0) > 500
    || !Number.isInteger(input.earlyBookingDays ?? 0) || (input.earlyBookingDays ?? 0) < 0 || (input.earlyBookingDays ?? 0) > 730
    || !Number.isFinite(input.earlyBookingPercent ?? 0) || (input.earlyBookingPercent ?? 0) < 0 || (input.earlyBookingPercent ?? 0) > 90
    || ((input.earlyBookingPercent ?? 0) > 0 && !(input.earlyBookingDays ?? 0))) throw new Error("Hafta sonu farkı veya erken rezervasyon kuralı geçersiz.");
  if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 180) throw new Error("Fiyat donemi adi zorunludur ve en fazla 180 karakter olabilir.");
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

export function nightlyPeriodPrice(period: VillaPricingPeriod | undefined, basePrice: number, date: string, checkIn: string, bookingDate: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const weekend = day === 5 || day === 6;
  const leadDays = Math.floor((Date.parse(`${checkIn}T00:00:00Z`) - Date.parse(`${bookingDate}T00:00:00Z`)) / 86400000);
  const early = period && (period.earlyBookingDays ?? 0) > 0 && leadDays >= period.earlyBookingDays!;
  const regular = Math.round((period?.nightlyPrice ?? basePrice) * (1 + (weekend ? period?.weekendPercent ?? 0 : 0) / 100) * 100) / 100;
  const price = Math.round(regular * (1 - (early ? period?.earlyBookingPercent ?? 0 : 0) / 100) * 100) / 100;
  return { regular, price };
}
