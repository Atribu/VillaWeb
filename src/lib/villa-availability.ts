import type { AvailabilityRange } from "@/lib/villa-catalog";

export function normalizeDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getNightCount(checkIn: string, checkOut: string) {
  const start = normalizeDateKey(checkIn).getTime();
  const end = normalizeDateKey(checkOut).getTime();
  const diff = end - start;

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function isBlockedStayDate(dateKey: string, ranges: AvailabilityRange[]) {
  const date = normalizeDateKey(dateKey);

  return ranges.some((range) => {
    const rangeStart = normalizeDateKey(range.startDate);
    const rangeEnd = normalizeDateKey(range.endDate);

    return date >= rangeStart && date < rangeEnd;
  });
}

export function findBlockedRange(
  checkIn: string,
  checkOut: string,
  ranges: AvailabilityRange[],
) {
  if (!checkIn || !checkOut) {
    return null;
  }

  const checkInDate = normalizeDateKey(checkIn);
  const checkOutDate = normalizeDateKey(checkOut);

  return (
    ranges.find((range) => {
      const rangeStart = normalizeDateKey(range.startDate);
      const rangeEnd = normalizeDateKey(range.endDate);

      return checkInDate < rangeEnd && checkOutDate > rangeStart;
    }) ?? null
  );
}

export function isBookableRange(
  checkIn: string,
  checkOut: string,
  ranges: AvailabilityRange[],
) {
  return getNightCount(checkIn, checkOut) > 0 && !findBlockedRange(checkIn, checkOut, ranges);
}
