import Image from "next/image";
import Link from "next/link";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";

type PublicVillaCardProps = {
  villa: CatalogVilla;
  compact?: boolean;
};

export function PublicVillaCard({ villa, compact = false }: PublicVillaCardProps) {
  const href = `/villalar/${villa.slug}`;
  const ratingLabel =
    typeof villa.rating === "number"
      ? `${villa.rating.toFixed(2)}${villa.reviewCount ? ` (${villa.reviewCount})` : ""}`
      : null;

  return (
    <article className="group relative overflow-hidden rounded-[1.8rem] border border-black/6 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
      <div className="relative">
        <Link
          href={href}
          aria-label={`${villa.title} detay sayfasını aç`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2"
        >
          <div className="relative aspect-[1.05/1] overflow-hidden bg-slate-100">
          {villa.coverImageUrl ? (
            <Image
              src={villa.coverImageUrl}
              alt={villa.coverAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${villa.coverGradient}`} />
          )}

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <span className="rounded-full bg-white/96 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm">
                {villa.badge}
              </span>
              {villa.isSuperhost ? (
                <span className="rounded-full bg-white/96 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm">
                  Süper Ev Sahibi
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        <button
          type="button"
          aria-label="Favorilere ekle"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M12.1 20.3l-1.1-1C6.2 15 3 12.1 3 8.7 3 6.1 5.1 4 7.7 4c1.4 0 2.7.6 3.6 1.6C12.2 4.6 13.5 4 14.9 4 17.5 4 19.6 6.1 19.6 8.7c0 3.4-3.2 6.3-8 10.6l-1.5 1z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-900">{villa.locationLabel}</p>
              {ratingLabel ? (
                <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                  <span aria-hidden="true">★</span>
                  <span>{ratingLabel}</span>
                </span>
              ) : null}
            </div>

            <h3 className="mt-1 truncate text-[15px] font-semibold leading-tight text-slate-900">
              <Link
                href={href}
                className="outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2"
              >
                {villa.title}
              </Link>
            </h3>

            <p className={`mt-2 text-sm leading-6 text-slate-600 ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
              {villa.shortDescription}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            `${villa.capacity} misafir`,
            `${villa.bedroomCount} oda`,
            `${villa.bathroomCount} banyo`,
            villa.poolType,
            `${villa.minNightCount ?? 1} gece min.`,
          ].map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {item}
            </span>
          ))}
        </div>

        {villa.activeDiscountTitle ? (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-coral)]">
            {villa.activeDiscountTitle}
          </p>
        ) : null}

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
            </span>{" "}
            <span className="text-slate-500">gece</span>
            {villa.discountedNightlyPrice ? (
              <div className="mt-0.5 text-xs text-slate-400 line-through">{formatCurrency(villa.nightlyPrice)}</div>
            ) : null}
          </div>

          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 focus-visible:ring-offset-2"
          >
            İncele
          </Link>
        </div>
      </div>
    </article>
  );
}
