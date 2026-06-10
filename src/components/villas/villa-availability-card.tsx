"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import {
  getLocalizedAvailabilityLabel,
  getLocalizedVilla,
} from "@/lib/villa-content-i18n";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";
import {
  findBlockedRange,
  getNightCount,
  isBlockedStayDate,
  isBookableRange,
  toDateKey,
} from "@/lib/villa-availability";

type AvailabilityCardProps = {
  villa: CatalogVilla;
  locale?: AppLocale;
};

type AvailabilityRange = CatalogVilla["availabilityRanges"][number];

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMonthLabel(date: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getMonthDays(date: Date) {
  const monthStart = getStartOfMonth(date);
  const firstWeekdayIndex = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < firstWeekdayIndex; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(date.getFullYear(), date.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getSelectionStep(checkIn: string, checkOut: string, locale: AppLocale) {
  if (!checkIn) {
    return pickLocalized(locale, "1. adim: Giris tarihini sec", "Step 1: Select check-in");
  }

  if (!checkOut) {
    return pickLocalized(locale, "2. adim: Cikis tarihini sec", "Step 2: Select check-out");
  }

  return pickLocalized(locale, "Secim tamamlandi", "Selection complete");
}

function getModalHeading(
  availability: {
    status: "idle" | "invalid" | "blocked" | "available";
    nightCount: number;
  },
  checkIn: string,
  checkOut: string,
  locale: AppLocale,
) {
  if (availability.status === "available") {
    return pickLocalized(locale, `${availability.nightCount} gece`, `${availability.nightCount} nights`);
  }

  if (checkIn && !checkOut) {
    return pickLocalized(locale, "Cikis tarihini sec", "Select check-out");
  }

  return pickLocalized(locale, "Tarih sec", "Select dates");
}

export function VillaAvailabilityCard({
  villa,
  locale = "tr",
}: AvailabilityCardProps) {
  const localizedVilla = useMemo(() => getLocalizedVilla(villa, locale), [locale, villa]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => getStartOfMonth(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const today = useMemo(() => toDateKey(new Date()), []);
  const currentMonth = useMemo(() => getStartOfMonth(new Date()), []);
  const visibleMonths = useMemo(
    () => [visibleMonth, addMonths(visibleMonth, 1)],
    [visibleMonth],
  );
  const weekdayLabels = useMemo(
    () =>
      locale === "en"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"],
    [locale],
  );

  function canSelectCheckIn(dateKey: string) {
    return dateKey >= today && !isBlockedStayDate(dateKey, localizedVilla.availabilityRanges);
  }

  function canSelectCheckOut(dateKey: string) {
    return (
      Boolean(checkIn) &&
      dateKey > checkIn &&
      isBookableRange(checkIn, dateKey, localizedVilla.availabilityRanges)
    );
  }

  function clearAll() {
    setCheckIn("");
    setCheckOut("");
  }

  function clearCheckIn() {
    setCheckIn("");
    setCheckOut("");
  }

  function clearCheckOut() {
    setCheckOut("");
  }

  function handleDateSelection(dateKey: string) {
    if (!checkIn || checkOut) {
      if (canSelectCheckIn(dateKey)) {
        setCheckIn(dateKey);
        setCheckOut("");
      }

      return;
    }

    if (dateKey <= checkIn) {
      if (canSelectCheckIn(dateKey)) {
        setCheckIn(dateKey);
        setCheckOut("");
      }

      return;
    }

    if (canSelectCheckOut(dateKey)) {
      setCheckOut(dateKey);
    }
  }

  const availability = useMemo(() => {
    if (!checkIn || !checkOut) {
      return {
        status: "idle" as const,
        message: pickLocalized(
          locale,
          "Takvimden once giris, sonra cikis tarihini sec. Dolu veya kapali gunler secilemez.",
          "Select check-in first, then check-out. Reserved or unavailable days cannot be selected.",
        ),
        blockedRange: null as AvailabilityRange | null,
        nightCount: 0,
      };
    }

    const nightCount = getNightCount(checkIn, checkOut);

    if (nightCount <= 0) {
      return {
        status: "invalid" as const,
        message: pickLocalized(
          locale,
          "Cikis tarihi, giris tarihinden sonra olmalidir.",
          "Check-out must be after check-in.",
        ),
        blockedRange: null,
        nightCount: 0,
      };
    }

    const blockedRange = findBlockedRange(checkIn, checkOut, localizedVilla.availabilityRanges);

    if (blockedRange) {
      return {
        status: "blocked" as const,
        message: pickLocalized(
          locale,
          `${formatShortDate(blockedRange.startDate, locale)} - ${formatShortDate(
            blockedRange.endDate,
            locale,
          )} araliginda ${getLocalizedAvailabilityLabel(blockedRange, locale).toLowerCase()} bulunuyor.`,
          `${getLocalizedAvailabilityLabel(blockedRange, locale)} exists between ${formatShortDate(
            blockedRange.startDate,
            locale,
          )} and ${formatShortDate(blockedRange.endDate, locale)}.`,
        ),
        blockedRange,
        nightCount,
      };
    }

    return {
      status: "available" as const,
      message: pickLocalized(
        locale,
        `${nightCount} gecelik secim icin villa uygun gorunuyor.`,
        `The villa appears available for a ${nightCount}-night stay.`,
      ),
      blockedRange: null,
      nightCount,
    };
  }, [checkIn, checkOut, locale, localizedVilla.availabilityRanges]);

  const statusClasses =
    availability.status === "available"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : availability.status === "blocked" || availability.status === "invalid"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-slate-200 bg-white text-slate-600";

  const requestHref =
    availability.status === "available"
      ? `/talep?villa=${localizedVilla.slug}&checkIn=${checkIn}&checkOut=${checkOut}`
      : null;

  const selectionStep = getSelectionStep(checkIn, checkOut, locale);
  const modalHeading = getModalHeading(availability, checkIn, checkOut, locale);

  return (
    <>
      <div className="rounded-[14px] border border-black/6 bg-white p-5 text-[var(--color-ink)] shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {pickLocalized(locale, "Rezervasyon Takvimi", "Reservation Calendar")}
            </p>
            <p className="mt-2 font-display text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">
              {pickLocalized(locale, "Tarih secerek devam et", "Continue by selecting dates")}
            </p>
          </div>
          {availability.nightCount > 0 ? (
            <span className="rounded-[8px] bg-[var(--color-coral-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-coral)]">
              {availability.nightCount} {pickLocalized(locale, "gece", "nights")}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className={`rounded-[1rem] border px-4 py-3 text-left transition ${
              checkIn ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {pickLocalized(locale, "Giris", "Check-in")}
            </span>
            <span className="mt-2 block text-base font-semibold text-slate-900">
              {checkIn
                ? formatShortDate(checkIn, locale)
                : pickLocalized(locale, "Tarih sec", "Select date")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className={`rounded-[1rem] border px-4 py-3 text-left transition ${
              checkOut ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {pickLocalized(locale, "Cikis", "Check-out")}
            </span>
            <span className="mt-2 block text-base font-semibold text-slate-900">
              {checkOut
                ? formatShortDate(checkOut, locale)
                : pickLocalized(locale, "Tarih sec", "Select date")}
            </span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="inline-flex rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {pickLocalized(locale, "Takvimi Ac", "Open Calendar")}
          </button>
          <span className="rounded-[8px] bg-[var(--color-slate-soft)] px-3 py-1.5 text-xs font-semibold text-slate-600">
            {selectionStep}
          </span>
          {(checkIn || checkOut) && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
            >
              {pickLocalized(locale, "Tarihleri temizle", "Clear dates")}
            </button>
          )}
        </div>

        <div className={`mt-4 rounded-[1.1rem] border px-4 py-3 text-sm leading-6 ${statusClasses}`}>
          {availability.message}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.2rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm text-slate-600">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {pickLocalized(locale, "Minimum gece", "Minimum nights")}
            </span>
            <span className="mt-2 block font-semibold text-slate-900">
              {localizedVilla.minNightCount ?? 1} {pickLocalized(locale, "gece", "nights")}
            </span>
          </div>
          <div className="rounded-[1.2rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm text-slate-600">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {pickLocalized(locale, "Temizlik", "Cleaning")}
            </span>
            <span className="mt-2 block font-semibold text-slate-900">
              {formatCurrency(localizedVilla.cleaningFee ?? 0, locale)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {requestHref ? (
            <Link
              href={requestHref}
              className="rounded-[10px] bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-teal)]"
            >
              {pickLocalized(locale, "Bu Tarihler Icin Talep Gonder", "Send Inquiry for These Dates")}
            </Link>
          ) : (
            <span className="rounded-[10px] bg-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600">
              {pickLocalized(
                locale,
                "Uygun Giris ve Cikis Tarihi Sec",
                "Select Valid Check-in and Check-out Dates",
              )}
            </span>
          )}
          <Link
            href="/iletisim"
            className="rounded-[10px] border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {pickLocalized(locale, "Destek Al", "Get Support")}
          </Link>
        </div>
      </div>

      {isCalendarOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/55 p-4 backdrop-blur-[3px] sm:p-6"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="w-full max-w-5xl rounded-[14px] border border-black/6 bg-white p-5 shadow-2xl shadow-slate-950/25 sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                    {modalHeading}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {checkIn
                      ? formatShortDate(checkIn, locale)
                      : pickLocalized(locale, "Giris", "Check-in")}{" "}
                    {checkOut ? `- ${formatShortDate(checkOut, locale)}` : ""}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                  <div
                    className={`rounded-[1rem] border px-4 py-3 ${
                      checkIn ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {pickLocalized(locale, "Giris", "Check-in")}
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {checkIn
                            ? formatShortDate(checkIn, locale)
                            : pickLocalized(locale, "Tarih sec", "Select date")}
                        </p>
                      </div>
                      {checkIn ? (
                        <button
                          type="button"
                          onClick={clearCheckIn}
                          className="rounded-[8px] px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className={`rounded-[1rem] border px-4 py-3 ${
                      checkOut ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {pickLocalized(locale, "Cikis", "Check-out")}
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {checkOut
                            ? formatShortDate(checkOut, locale)
                            : pickLocalized(locale, "Tarih sec", "Select date")}
                        </p>
                      </div>
                      {checkOut ? (
                        <button
                          type="button"
                          onClick={clearCheckOut}
                          className="rounded-[8px] px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={visibleMonth <= currentMonth}
                  onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                  className="rounded-[10px] border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  {pickLocalized(locale, "Geri", "Back")}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                  className="rounded-[10px] border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
                >
                  {pickLocalized(locale, "Ileri", "Next")}
                </button>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                {visibleMonths.map((monthDate) => (
                  <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
                    <p className="text-center text-2xl font-semibold text-slate-900">
                      {getMonthLabel(monthDate, locale)}
                    </p>

                    <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
                      {weekdayLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-7 gap-2">
                      {getMonthDays(monthDate).map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="h-11 rounded-full" />;
                        }

                        const dateKey = toDateKey(day);
                        const dayNumber = day.getDate();
                        const isSelectedStart = dateKey === checkIn;
                        const isSelectedEnd = dateKey === checkOut;
                        const isInRange = Boolean(
                          checkIn && checkOut && dateKey > checkIn && dateKey < checkOut,
                        );
                        const isBlocked = isBlockedStayDate(
                          dateKey,
                          localizedVilla.availabilityRanges,
                        );
                        const isDisabled =
                          !checkIn || checkOut
                            ? !canSelectCheckIn(dateKey)
                            : dateKey <= checkIn
                              ? !canSelectCheckIn(dateKey)
                              : !canSelectCheckOut(dateKey);
                        const isVisuallyBlocked =
                          isBlocked &&
                          (!checkIn ||
                            Boolean(checkOut) ||
                            dateKey <= checkIn ||
                            !canSelectCheckOut(dateKey));

                        const dayClasses =
                          isSelectedStart || isSelectedEnd
                            ? "border-slate-900 bg-slate-900 text-white"
                            : isInRange
                              ? "border-slate-100 bg-slate-100 text-slate-900"
                              : isVisuallyBlocked
                                ? "border-transparent bg-white text-slate-300 line-through"
                                : isDisabled
                                  ? "border-transparent bg-white text-slate-300"
                                  : "border-transparent bg-white text-slate-900 hover:bg-slate-100";

                        const title = isSelectedStart
                          ? pickLocalized(locale, "Secilen giris tarihi", "Selected check-in date")
                          : isSelectedEnd
                            ? pickLocalized(locale, "Secilen cikis tarihi", "Selected check-out date")
                            : isVisuallyBlocked
                              ? pickLocalized(locale, "Bu gun dolu veya kapali", "This day is reserved or unavailable")
                              : isDisabled && checkIn && !checkOut && dateKey > checkIn
                                ? pickLocalized(
                                    locale,
                                    "Bu cikis tarihi secilen aralikta uygun degil",
                                    "This check-out date is not valid for the selected range",
                                  )
                                : pickLocalized(locale, "Bu tarihi sec", "Select this date");

                        return (
                          <button
                            key={dateKey}
                            type="button"
                            disabled={isDisabled}
                            title={title}
                            onClick={() => handleDateSelection(dateKey)}
                            className={`h-11 rounded-full border text-sm font-semibold transition ${dayClasses}`}
                          >
                            {dayNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[3px] bg-slate-900" />
                    {pickLocalized(locale, "Secilen gun", "Selected day")}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[3px] bg-slate-100" />
                    {pickLocalized(locale, "Secilen aralik", "Selected range")}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[3px] border border-slate-300 bg-white" />
                    {pickLocalized(locale, "Uygun gun", "Available day")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
                  >
                    {pickLocalized(locale, "Tarihleri temizle", "Clear dates")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="rounded-[10px] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {pickLocalized(locale, "Kapat", "Close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
