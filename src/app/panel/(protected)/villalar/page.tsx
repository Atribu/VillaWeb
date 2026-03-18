import Link from "next/link";
import { formatCurrency, getSeoScore } from "@/lib/villa-catalog";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

export default async function PanelVillasPage() {
  const villaCatalog = await getDemoVillas();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
              Villa Yonetimi
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
              Ornek villa kayitlari ve SEO durumu panelde gorunuyor
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Ornek villalar eklendi. Her kayitta fiyat, gorsel adedi, talep ilgisi ve SEO
              hazirlik puani birlikte listeleniyor.
            </p>
          </div>

          <Link
            href="/panel/villalar/yeni"
            className="rounded-full bg-[var(--color-teal)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)]"
          >
            Yeni Villa Ekle
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {villaCatalog.map((villa) => (
          <article
            key={villa.id}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60"
          >
            <div
              className={`mb-6 h-52 rounded-[1.75rem] bg-cover bg-center ${
                villa.coverImageUrl ? "bg-slate-100" : `bg-gradient-to-br ${villa.coverGradient}`
              }`}
              style={
                villa.coverImageUrl
                  ? {
                      backgroundImage: `url(${villa.coverImageUrl})`,
                    }
                  : undefined
              }
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
                  {villa.badge}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">{villa.title}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {villa.locationLabel} • {villa.category}
                </p>
              </div>
              <div className="rounded-full bg-[var(--color-soft-white)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                {villa.status}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Fiyat</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Gorsel</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {villa.imageCount} / 30
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Talep</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {villa.requestCount}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Blok tarih</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {villa.availabilityRanges.length}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">SEO skoru</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  %{getSeoScore(villa)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-soft-white)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-teal)]">
                SEO Basligi
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{villa.seoTitle}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">{villa.seoDescription}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                Anahtar kelime: {villa.focusKeyword}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/villalar/${villa.slug}`}
                className="inline-flex rounded-full bg-[var(--color-teal)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)]"
              >
                Public Detayi Ac
              </Link>
              <Link
                href="/panel/villalar/yeni"
                className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[var(--color-aqua)] hover:text-[var(--color-teal)]"
              >
                Benzer Villa Ekle
              </Link>
              <Link
                href={`/panel/villalar/${villa.slug}/uygunluk`}
                className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[var(--color-aqua)] hover:text-[var(--color-teal)]"
              >
                Uygunluk Yonet
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
