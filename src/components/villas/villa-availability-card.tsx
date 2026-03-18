"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
};

type AvailabilityRange = CatalogVilla["availabilityRanges"][number];

const weekdayLabels = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
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

function getSelectionStep(checkIn: string, checkOut: string) {
  if (!checkIn) {
    return "1. adim: Giris tarihini sec";
  }

  if (!checkOut) {
    return "2. adim: Cikis tarihini sec";
  }

  return "Secim tamamlandi";
}

function getModalHeading(
  availability: {
    status: "idle" | "invalid" | "blocked" | "available";
    nightCount: number;
  },
  checkIn: string,
  checkOut: string,
) {
  if (availability.status === "available") {
    return `${availability.nightCount} gece`;
  }

  if (checkIn && !checkOut) {
    return "Cikis tarihini sec";
  }

  return "Tarih sec";
}

export function VillaAvailabilityCard({ villa }: AvailabilityCardProps) {
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

  function canSelectCheckIn(dateKey: string) {
    return dateKey >= today && !isBlockedStayDate(dateKey, villa.availabilityRanges);
  }

  function canSelectCheckOut(dateKey: string) {
    return (
      Boolean(checkIn) &&
      dateKey > checkIn &&
      isBookableRange(checkIn, dateKey, villa.availabilityRanges)
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
        message:
          "Takvimden once giris, sonra cikis tarihini sec. Dolu veya kapali gunler secilemez.",
        blockedRange: null as AvailabilityRange | null,
        nightCount: 0,
      };
    }

    const nightCount = getNightCount(checkIn, checkOut);

    if (nightCount <= 0) {
      return {
        status: "invalid" as const,
        message: "Cikis tarihi, giris tarihinden sonra olmalidir.",
        blockedRange: null,
        nightCount: 0,
      };
    }

    const blockedRange = findBlockedRange(checkIn, checkOut, villa.availabilityRanges);

    if (blockedRange) {
      return {
        status: "blocked" as const,
        message: `${formatShortDate(blockedRange.startDate)} - ${formatShortDate(
          blockedRange.endDate,
        )} araliginda ${blockedRange.label.toLowerCase()} bulunuyor.`,
        blockedRange,
        nightCount,
      };
    }

    return {
      status: "available" as const,
      message: `${nightCount} gecelik secim icin villa uygun gorunuyor.`,
      blockedRange: null,
      nightCount,
    };
  }, [checkIn, checkOut, villa.availabilityRanges]);

  const statusClasses =
    availability.status === "available"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : availability.status === "blocked" || availability.status === "invalid"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-slate-200 bg-white text-slate-600";

  const requestHref =
    availability.status === "available"
      ? `/talep?villa=${villa.slug}&checkIn=${checkIn}&checkOut=${checkOut}`
      : null;

  const selectionStep = getSelectionStep(checkIn, checkOut);
  const modalHeading = getModalHeading(availability, checkIn, checkOut);

  return (
    <>
      <div className="rounded-[1.6rem] bg-white p-4 text-[var(--color-ink)] shadow-xl shadow-teal-950/12 ring-1 ring-black/6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Rezervasyon Takvimi
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Tarih secerek devam et</p>
          </div>
          {availability.nightCount > 0 ? (
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {availability.nightCount} gece
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className={`rounded-[1rem] border px-4 py-3 text-left transition ${
              checkIn ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"
            }`}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Giris
            </span>
            <span className="mt-2 block text-base font-semibold text-slate-900">
              {checkIn ? formatShortDate(checkIn) : "Tarih sec"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className={`rounded-[1rem] border px-4 py-3 text-left transition ${
              checkOut ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"
            }`}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Cikis
            </span>
            <span className="mt-2 block text-base font-semibold text-slate-900">
              {checkOut ? formatShortDate(checkOut) : "Tarih sec"}
            </span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Takvimi Ac
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {selectionStep}
          </span>
          {(checkIn || checkOut) && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
            >
              Tarihleri temizle
            </button>
          )}
        </div>

        <div className={`mt-4 rounded-[1rem] border px-4 py-3 text-sm leading-6 ${statusClasses}`}>
          {availability.message}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm text-slate-600">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Minimum gece
            </span>
            <span className="mt-2 block font-semibold text-slate-900">
              {villa.minNightCount ?? 1} gece
            </span>
          </div>
          <div className="rounded-[1rem] bg-[var(--color-slate-soft)] px-4 py-3 text-sm text-slate-600">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Temizlik
            </span>
            <span className="mt-2 block font-semibold text-slate-900">
              {formatCurrency(villa.cleaningFee ?? 0)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {requestHref ? (
            <Link
              href={requestHref}
              className="rounded-full bg-[var(--color-gold)] px-5 py-3 text-center text-sm font-semibold text-[var(--color-ink)] transition hover:bg-amber-300"
            >
              Bu Tarihler Icin Talep Gonder
            </Link>
          ) : (
            <span className="rounded-full bg-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600">
              Uygun Giris ve Cikis Tarihi Sec
            </span>
          )}
          <Link
            href="/iletisim"
            className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            Destek Al
          </Link>
        </div>
      </div>

      {isCalendarOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-[2px] sm:p-6"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="w-full max-w-5xl rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/25 sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-3xl font-semibold text-slate-900">{modalHeading}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {checkIn ? formatShortDate(checkIn) : "Giris"}{" "}
                    {checkOut ? `- ${formatShortDate(checkOut)}` : ""}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                  <div
                    className={`rounded-[1rem] border px-4 py-3 ${
                      checkIn ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Giris
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {checkIn ? formatShortDate(checkIn) : "Tarih sec"}
                        </p>
                      </div>
                      {checkIn ? (
                        <button
                          type="button"
                          onClick={clearCheckIn}
                          className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className={`rounded-[1rem] border px-4 py-3 ${
                      checkOut ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Cikis
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {checkOut ? formatShortDate(checkOut) : "Tarih sec"}
                        </p>
                      </div>
                      {checkOut ? (
                        <button
                          type="button"
                          onClick={clearCheckOut}
                          className="rounded-full px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
                >
                  Ileri
                </button>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                {visibleMonths.map((monthDate) => (
                  <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
                    <p className="text-center text-2xl font-semibold text-slate-900">
                      {getMonthLabel(monthDate)}
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
                        const isBlocked = isBlockedStayDate(dateKey, villa.availabilityRanges);
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
                          ? "Secilen giris tarihi"
                          : isSelectedEnd
                            ? "Secilen cikis tarihi"
                            : isVisuallyBlocked
                              ? "Bu gun dolu veya kapali"
                              : isDisabled && checkIn && !checkOut && dateKey > checkIn
                                ? "Bu cikis tarihi secilen aralikta uygun degil"
                                : "Bu tarihi sec";

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
                    <span className="h-3 w-3 rounded-full bg-slate-900" />
                    Secilen gun
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-slate-100" />
                    Secilen aralik
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-slate-300 bg-white" />
                    Uygun gun
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
                  >
                    Tarihleri temizle
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Kapat
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
