import Image from "next/image";
import Link from "next/link";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";

type PublicVillaCardProps = {
  villa: CatalogVilla;
  compact?: boolean;
};

export function PublicVillaCard({ villa, compact = false }: PublicVillaCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.8rem] border border-black/6 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
      <Link href={`/villalar/${villa.slug}`} className="group block">
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
            <span className="rounded-full bg-white/96 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
              {villa.badge}
            </span>
            <span className="rounded-full bg-slate-900/78 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {villa.requestCount}+ talep
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{villa.locationLabel}</p>
            <h3 className="mt-1 text-xl font-semibold leading-tight text-slate-900">
              <Link href={`/villalar/${villa.slug}`} className="transition hover:text-[var(--color-coral)]">
                {villa.title}
              </Link>
            </h3>
          </div>
          <div className="text-right">
            {villa.discountedNightlyPrice ? (
              <p className="text-xs text-slate-400 line-through">{formatCurrency(villa.nightlyPrice)}</p>
            ) : null}
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
            </p>
            <p className="text-xs text-slate-500">gecelik</p>
          </div>
        </div>

        <p className={`mt-3 text-sm leading-6 text-slate-600 ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
          {villa.shortDescription}
        </p>

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

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{villa.viewCount}</span> goruntulenme
          </div>
          <Link
            href={`/villalar/${villa.slug}`}
            className="inline-flex rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Detaylari Incele
          </Link>
        </div>
      </div>
    </article>
  );
}
