"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { getLocalizedAvailabilityLabel, getLocalizedVilla } from "@/lib/villa-content-i18n";
import type { CatalogVilla } from "@/lib/villa-catalog";
import { formatShortDate } from "@/lib/villa-catalog";
import {
  findBlockedRange,
  getNightCount,
  toDateKey,
} from "@/lib/villa-availability";

type RequestDateSelectorProps = {
  villa: CatalogVilla;
  initialCheckIn?: string;
  initialCheckOut?: string;
  locale?: AppLocale;
};

export function RequestDateSelector({
  villa,
  initialCheckIn = "",
  initialCheckOut = "",
  locale = "tr",
}: RequestDateSelectorProps) {
  const router = useRouter();
  const localizedVilla = useMemo(() => getLocalizedVilla(villa, locale), [locale, villa]);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const today = useMemo(() => toDateKey(new Date()), []);

  const selection = useMemo(() => {
    if (!checkIn || !checkOut) {
      return {
        status: "idle" as const,
        message: pickLocalized(
          locale,
          "Teklif formunu acmak icin giris ve cikis tarihini sec.",
          "Select check-in and check-out dates to open the inquiry form.",
        ),
      };
    }

    const nightCount = getNightCount(checkIn, checkOut);

    if (nightCount <= 0) {
      return {
        status: "invalid" as const,
        message: pickLocalized(
          locale,
          "Cikis tarihi giris tarihinden sonra olmalidir.",
          "Check-out must be after check-in.",
        ),
      };
    }

    if (nightCount < (localizedVilla.minNightCount ?? 1)) {
      return {
        status: "invalid" as const,
        message: pickLocalized(
          locale,
          `Bu villa icin minimum ${localizedVilla.minNightCount ?? 1} gece secmelisin.`,
          `You need to choose at least ${localizedVilla.minNightCount ?? 1} nights for this villa.`,
        ),
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
      };
    }

    return {
      status: "available" as const,
      message: pickLocalized(
        locale,
        `${nightCount} gecelik secim uygun. Teklif formunu acabilirsin.`,
        `Your ${nightCount}-night stay is available. You can open the inquiry form now.`,
      ),
    };
  }, [checkIn, checkOut, locale, localizedVilla.availabilityRanges, localizedVilla.minNightCount]);

  const isValid = selection.status === "available";
  const hasChanged = checkIn !== initialCheckIn || checkOut !== initialCheckOut;

  function handleContinue() {
    if (!isValid) {
      return;
    }

    const params = new URLSearchParams({
      villa: villa.slug,
      checkIn,
      checkOut,
    });

    router.replace(`/talep?${params.toString()}`, { scroll: false });
    router.refresh();
  }

  const statusClasses =
    selection.status === "available"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : selection.status === "blocked" || selection.status === "invalid"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] text-[var(--serene-on-surface-variant)]";

  return (
    <div className="serene-card p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="serene-eyebrow">
            {pickLocalized(locale, "Tarih Secimi", "Date Selection")}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--serene-on-surface)]">
            {pickLocalized(locale, "Teklif formunu burada aktif hale getir", "Activate the inquiry form here")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--serene-on-surface-variant)]">
            {pickLocalized(
              locale,
              "Villa secimi hazir. Simdi uygun giris ve cikis tarihini belirleyip ayni sayfadan talebini olusturabilirsin.",
              "Your villa choice is ready. Now pick valid check-in and check-out dates and create your inquiry from the same page.",
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!isValid || !hasChanged}
          className={`inline-flex items-center justify-center px-5 py-3 text-sm font-semibold transition ${
            isValid && hasChanged
              ? "serene-button-primary"
              : "cursor-not-allowed rounded-[8px] bg-[var(--serene-outline-variant)] text-white"
          }`}
        >
          {isValid
            ? pickLocalized(locale, "Teklif Formunu Ac", "Open Inquiry Form")
            : pickLocalized(locale, "Once Tarih Sec", "Select Dates First")}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="request-checkin" className="text-sm font-medium text-[var(--serene-on-surface)]">
            {pickLocalized(locale, "Giris tarihi", "Check-in date")}
          </label>
          <input
            id="request-checkin"
            type="date"
            min={today}
            value={checkIn}
            onChange={(event) => {
              const nextValue = event.target.value;
              setCheckIn(nextValue);

              if (checkOut && nextValue && checkOut <= nextValue) {
                setCheckOut("");
              }
            }}
            className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)] focus:bg-white"
          />
        </div>

        <div>
          <label htmlFor="request-checkout" className="text-sm font-medium text-[var(--serene-on-surface)]">
            {pickLocalized(locale, "Cikis tarihi", "Check-out date")}
          </label>
          <input
            id="request-checkout"
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="mt-2 w-full rounded-[8px] border border-[var(--serene-outline-variant)] bg-[var(--serene-surface-low)] px-4 py-3 text-sm text-[var(--serene-on-surface)] outline-none transition focus:border-[var(--serene-primary)] focus:bg-white"
          />
        </div>
      </div>

      <div className={`mt-5 rounded-[8px] border px-4 py-4 text-sm leading-7 ${statusClasses}`}>
        {selection.message}
      </div>
    </div>
  );
}
