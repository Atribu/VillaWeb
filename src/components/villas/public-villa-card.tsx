import Image from "next/image";
import Link from "next/link";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";

type PublicVillaCardProps = {
  villa: CatalogVilla;
  compact?: boolean;
};

export function PublicVillaCard({ villa, compact = false }: PublicVillaCardProps) {
  const href = `/villalar/${villa.slug}`;
  const reviewLabel =
    typeof villa.rating === "number"
      ? `${villa.rating.toFixed(2)}${villa.reviewCount ? ` / ${villa.reviewCount} yorum` : ""}`
      : "Yeni portfoy";

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-black/6 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
      <Link
        href={href}
        aria-label={`${villa.title} detay sayfasini ac`}
        className="absolute inset-0 z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/75 focus-visible:ring-offset-4"
      />

      <div className="relative">
        <div className="relative aspect-[1.02/1] overflow-hidden bg-slate-100">
          {villa.coverImageUrl ? (
            <Image
              src={villa.coverImageUrl}
              alt={villa.coverAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition duration-700 group-hover:scale-[1.06]"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${villa.coverGradient}`} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/20 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/94 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm">
                {villa.badge}
              </span>
              {villa.featured ? (
                <span className="rounded-full bg-[var(--color-coral)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                  Editor secimi
                </span>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="Favorilere ekle"
              className="relative z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
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

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/88 ring-1 ring-white/14">
                {villa.category}
              </span>
              <span className="text-sm font-medium text-white/88">{reviewLabel}</span>
            </div>

            <h3 className="mt-4 font-display text-[1.65rem] font-semibold tracking-[-0.04em]">
              {villa.title}
            </h3>

            <p className="mt-2 text-sm text-white/80">{villa.locationLabel}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p
          className={`text-sm leading-7 text-slate-600 ${
            compact ? "line-clamp-2" : "line-clamp-3"
          }`}
        >
          {villa.shortDescription}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            ["Misafir", `${villa.capacity} kisilik`],
            ["Yatak odasi", `${villa.bedroomCount} oda`],
            ["Banyo", `${villa.bathroomCount} adet`],
            ["Konaklama", `${villa.minNightCount ?? 1} gece min.`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[var(--color-slate-soft)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {[villa.poolType, villa.activeDiscountTitle ?? "Esnek tarih secimi"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-black/6 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {item}
            </span>
          ))}
          {villa.isSuperhost ? (
            <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-coral)]">
              Premium ev sahibi
            </span>
          ) : null}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Gecelik baslayan fiyat
            </p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-2xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
              </p>
              {villa.discountedNightlyPrice ? (
                <p className="pb-1 text-sm text-slate-400 line-through">
                  {formatCurrency(villa.nightlyPrice)}
                </p>
              ) : null}
            </div>
          </div>

          <span className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[var(--color-teal)]">
            Detaylari incele
          </span>
        </div>
      </div>
    </article>
  );
}
