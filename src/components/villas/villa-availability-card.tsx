"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { isDateKey } from "@/lib/booking-dates";
import { StayModal } from "@/components/site-templates/stay-modal";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/stay-pages.module.css";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import {
  getLocalizedAvailabilityLabel,
  getLocalizedVilla,
} from "@/lib/villa-content-i18n";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatShortDate } from "@/lib/villa-catalog";
import { getMinimumNightCountForStay } from "@/lib/demo-operations";
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
  companySlug?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onSelect?: (checkIn: string, checkOut: string) => void;
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
  companySlug,
  initialCheckIn = "",
  initialCheckOut = "",
  onSelect,
}: AvailabilityCardProps) {
  const localizedVilla = useMemo(() => getLocalizedVilla(villa, locale), [locale, villa]);
  const [checkIn, setCheckIn] = useState(isDateKey(initialCheckIn) ? initialCheckIn : "");
  const [checkOut, setCheckOut] = useState(isDateKey(initialCheckOut) ? initialCheckOut : "");
  const [visibleMonth, setVisibleMonth] = useState(() => getStartOfMonth(isDateKey(initialCheckIn) && initialCheckIn >= toDateKey(new Date()) ? new Date(`${initialCheckIn}T12:00:00`) : new Date()));
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

    if (nightCount <= 0 || checkIn < today) {
      return {
        status: "invalid" as const,
        message: pickLocalized(
          locale,
          "Giriş geçmişte olamaz; çıkış tarihi girişten sonra olmalıdır.",
          "Arrival cannot be in the past; departure must be after arrival.",
        ),
        blockedRange: null,
        nightCount: 0,
      };
    }

    const minimumNightCount = getMinimumNightCountForStay(localizedVilla, checkIn, checkOut);

    if (nightCount < minimumNightCount) {
      return {
        status: "invalid" as const,
        message: pickLocalized(
          locale,
          `Secilen fiyat donemi icin minimum ${minimumNightCount} gece secmelisin.`,
          `You need to choose at least ${minimumNightCount} nights for the selected pricing period.`,
        ),
        blockedRange: null,
        nightCount,
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
  }, [checkIn, checkOut, locale, localizedVilla, today]);

  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const selectedRequest = `/talep?villa=${encodeURIComponent(villa.slug)}&checkIn=${checkIn}&checkOut=${checkOut}`;
  const requestHref = companySlug ? getDemoCompanySiteHref(companySlug, selectedRequest) : selectedRequest;
  const modalHeading = getModalHeading(availability, checkIn, checkOut, locale);

  return <>
    <div className={s.calendarCard}>
      <h2>{t("Güzel günlerinizi seçin.", "Choose your days away.")}</h2>
      <div className={s.dateButtons}>
        <button type="button" onClick={() => setIsCalendarOpen(true)} aria-haspopup="dialog"><span>{t("Giriş", "Check-in")}</span><strong>{checkIn ? formatShortDate(checkIn, locale) : t("Tarih seç", "Select date")}</strong></button>
        <button type="button" onClick={() => setIsCalendarOpen(true)} aria-haspopup="dialog"><span>{t("Çıkış", "Check-out")}</span><strong>{checkOut ? formatShortDate(checkOut, locale) : t("Tarih seç", "Select date")}</strong></button>
      </div>
      <div className={s.calendarTools}>
        <button type="button" onClick={() => setIsCalendarOpen(true)}>{t("Takvimi aç", "Open calendar")}</button>
        {(checkIn || checkOut) && <button type="button" onClick={clearAll}>{t("Tarihleri temizle", "Clear dates")}</button>}
      </div>
      <p className={s.notice} data-tone={availability.status === "blocked" || availability.status === "invalid" ? "error" : undefined} aria-live="polite">{availability.message}</p>
      <p className={s.note} style={{ marginTop: 12 }}>{t("Minimum", "Minimum")} {getMinimumNightCountForStay(localizedVilla, checkIn, checkOut)} {t("gece", "nights")} · {t("Dolu tarihler seçilemez.", "Unavailable dates cannot be selected.")}</p>
      {availability.status === "available"
        ? onSelect
          ? <button type="button" className={s.button} onClick={() => onSelect(checkIn, checkOut)}>{t("Tarihleri uygula", "Apply dates")}<SiteIcon name="arrow" /></button>
          : <Link href={requestHref} className={s.button}>{t("Bu tarihler için talep gönder", "Send inquiry for these dates")}<SiteIcon name="arrow" /></Link>
        : <button type="button" className={s.button} onClick={() => setIsCalendarOpen(true)}><SiteIcon name="calendar" />{t("Uygun tarihleri gör", "See available dates")}</button>}
      <p className={s.note} style={{ textAlign: "center", marginTop: 12 }}>{t("Bu aşamada ödeme alınmaz.", "You will not be charged at this stage.")}</p>
    </div>
    {isCalendarOpen && <StayModal label={t("Konaklama tarihlerini seç", "Choose your stay dates")} onClose={() => setIsCalendarOpen(false)}>
              <div className="mb-5 flex justify-end"><button type="button" autoFocus className={s.dialogClose} onClick={() => setIsCalendarOpen(false)}>{pickLocalized(locale, "Kapat", "Close")}</button></div>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-display text-3xl font-normal tracking-[-0.04em] text-[var(--serene-on-surface)]">
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
                    className={`rounded-[4px] border px-4 py-3 ${
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
                          aria-label={pickLocalized(locale, "Giriş tarihini temizle", "Clear check-in date")}
                          onClick={clearCheckIn}
                          className="rounded-[8px] px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className={`rounded-[4px] border px-4 py-3 ${
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
                          aria-label={pickLocalized(locale, "Çıkış tarihini temizle", "Clear check-out date")}
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
                    className="serene-button-secondary rounded-[8px] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pickLocalized(locale, "Geri", "Back")}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                  className="serene-button-secondary rounded-[8px] px-4 py-2 text-sm font-semibold"
                >
                  {pickLocalized(locale, "Ileri", "Next")}
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {visibleMonths.map((monthDate) => (
                  <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
                    <p className="text-center text-base font-semibold text-slate-900">
                      {getMonthLabel(monthDate, locale)}
                    </p>

                    <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
                      {weekdayLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-7 gap-1">
                      {getMonthDays(monthDate).map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="h-10 rounded-full" />;
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
                            ? "border-[var(--serene-primary)] bg-[var(--serene-primary)] text-white"
                            : isInRange
                              ? "border-[var(--serene-primary-soft)] bg-[var(--serene-primary-soft)] text-[var(--serene-primary)]"
                              : isVisuallyBlocked
                                ? "border-transparent bg-white text-slate-300 line-through"
                                : isDisabled
                                  ? "border-transparent bg-white text-slate-300"
                                  : "border-transparent bg-white text-[var(--serene-on-surface)] hover:bg-[var(--serene-surface-low)]";

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
                            aria-label={`${formatShortDate(dateKey, locale)} · ${title}`}
                            aria-pressed={isSelectedStart || isSelectedEnd}
                            onClick={() => handleDateSelection(dateKey)}
                            className={`h-10 rounded-full border text-sm font-semibold transition ${dayClasses}`}
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
                    <span className="h-3 w-3 rounded-[3px] bg-[var(--serene-primary)]" />
                    {pickLocalized(locale, "Secilen gun", "Selected day")}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-[3px] bg-[var(--serene-primary-soft)]" />
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
                    className="serene-button-primary rounded-[8px] px-5 py-3 text-sm font-semibold"
                  >
                    {pickLocalized(locale, "Kapat", "Close")}
                  </button>
                </div>
              </div>
    </StayModal>}
  </>;
}
