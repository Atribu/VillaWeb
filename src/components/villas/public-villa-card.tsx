import Link from "next/link";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { getVillaPresentationImage } from "@/lib/public-gallery";
import { getLocalizedVilla } from "@/lib/villa-content-i18n";

type PublicVillaCardProps = {
  villa: CatalogVilla;
  compact?: boolean;
  locale?: AppLocale;
};

export function PublicVillaCard({
  villa,
  compact = false,
  locale = "tr",
}: PublicVillaCardProps) {
  const localizedVilla = getLocalizedVilla(villa, locale);
  const href = `/villalar/${localizedVilla.slug}`;
  const specs = `${localizedVilla.bedroomCount} ${pickLocalized(locale, "Oda", "Bedrooms")}, ${localizedVilla.bathroomCount} ${pickLocalized(locale, "Banyo", "Bathrooms")}, ${localizedVilla.poolType}`;
  const displayImage = getVillaPresentationImage(localizedVilla);
  const amenityChips = Array.from(
    new Set(
      [
        `${localizedVilla.bedroomCount} ${pickLocalized(locale, "Oda", "Bedrooms")}`,
        localizedVilla.poolType,
        localizedVilla.city,
      ]
        .map((chip) => chip.trim())
        .filter(Boolean),
    ),
  ).slice(0, compact ? 2 : 3);

  return (
    <article className="serene-card group overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(26,54,93,0.12)]">
      <Link href={href} className="block">
        <div className={`relative overflow-hidden bg-[var(--serene-surface-low)] ${compact ? "aspect-[1.32/1]" : "aspect-[1.18/1]"}`}>
          {displayImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={displayImage}
              alt={localizedVilla.coverAlt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${localizedVilla.coverGradient}`} />
          )}

          {typeof localizedVilla.rating === "number" ? (
            <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--serene-on-surface)] shadow-sm backdrop-blur">
              <span className="text-[var(--serene-tertiary)]">★</span>
              {localizedVilla.rating.toFixed(2)}
            </div>
          ) : null}

          <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/86 text-[var(--serene-primary)] shadow-sm backdrop-blur transition group-hover:bg-[var(--serene-primary)] group-hover:text-white">
            <span aria-hidden="true" className="text-xl leading-none">♡</span>
          </div>

          {localizedVilla.featured ? (
            <div className="absolute bottom-4 left-4 rounded-[8px] bg-[var(--serene-tertiary-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--serene-tertiary-deep)] shadow-sm">
              {pickLocalized(locale, "One Cikan", "Featured")}
            </div>
          ) : null}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--serene-primary-container)]">
                {localizedVilla.locationLabel}
              </p>
              <h3 className="mt-2 font-display text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--serene-on-surface)]">
                {localizedVilla.title}
              </h3>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-[var(--serene-on-surface)]">
                {formatCurrency(
                  localizedVilla.discountedNightlyPrice ?? localizedVilla.nightlyPrice,
                  locale,
                )}
              </p>
              <p className="text-xs text-[var(--serene-outline)]">{pickLocalized(locale, "/ gece", "/ night")}</p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--serene-on-surface-variant)]">{specs}</p>

          {!compact ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--serene-on-surface-variant)]">
              {localizedVilla.shortDescription}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {amenityChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-[var(--serene-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--serene-primary)]"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-6">
            <span className="inline-flex w-full items-center justify-center rounded-[8px] bg-[var(--serene-primary)] px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-[var(--serene-primary-container)]">
              {pickLocalized(locale, "Detaylari Gor", "View Details")}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
