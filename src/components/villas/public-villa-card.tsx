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

  return (
    <article className="group overflow-hidden rounded-[14px] border border-[#dfe5ea] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.1)]">
      <Link href={href} className="block">
        <div className={`relative overflow-hidden bg-slate-100 ${compact ? "aspect-[1.14/1]" : "aspect-[1.08/1]"}`}>
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

          {localizedVilla.featured ? (
            <div className="absolute right-3 top-3 rounded-[8px] bg-white/92 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
              {pickLocalized(locale, "One Cikan", "Featured")}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f6eb1]">
            {localizedVilla.locationLabel}
          </p>
          <h3 className="mt-2 text-[1.08rem] font-bold text-slate-900">{localizedVilla.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{specs}</p>

          {!compact ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
              {localizedVilla.shortDescription}
            </p>
          ) : null}

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[1.45rem] font-bold tracking-tight text-slate-900">
                {formatCurrency(
                  localizedVilla.discountedNightlyPrice ?? localizedVilla.nightlyPrice,
                  locale,
                )}
              </p>
              <p className="text-xs text-slate-500">{pickLocalized(locale, "/ gecelik", "/ nightly")}</p>
            </div>

            <span className="inline-flex items-center justify-center rounded-[9px] border border-[#c9d5e2] px-4 py-2 text-sm font-semibold text-[#26486b] transition group-hover:border-[#8eb2d4] group-hover:text-[#1f3f61]">
              {pickLocalized(locale, "Detaylari Gor", "View Details")}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
