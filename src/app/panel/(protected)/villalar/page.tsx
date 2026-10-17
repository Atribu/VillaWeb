import Link from "next/link";
import Image from "next/image";
import { VillaStatusActions } from "@/components/panel/villa-status-actions";
import { formatCurrency, getSeoScore } from "@/lib/villa-catalog";
import { getDemoVillas } from "@/lib/server/demo-villa-store";

export const dynamic = "force-dynamic";

const villaStatusLabels = {
  ACTIVE: "Aktif",
  DRAFT: "Taslak",
  PAUSED: "Pasif",
  ARCHIVED: "Arsiv",
} as const;

const villaStatusClasses = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-600",
  PAUSED: "bg-amber-50 text-amber-700",
  ARCHIVED: "bg-zinc-100 text-zinc-600",
} as const;

type PanelVillasPageProps = {
  searchParams: Promise<{
    q?: string;
    location?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function PanelVillasPage({ searchParams }: PanelVillasPageProps) {
  const filters = await searchParams;
  const villaCatalog = await getDemoVillas();
  const query = filters.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const location = filters.location?.trim() ?? "";
  const status = filters.status?.trim() ?? "";
  const locations = Array.from(
    new Set(villaCatalog.flatMap((villa) => [villa.city, villa.district]).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const filteredVillas = villaCatalog.filter((villa) => {
    const searchText = [
      villa.shortCode,
      villa.title,
      villa.ownerVillaName,
      villa.city,
      villa.district,
      villa.locationLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("tr-TR");
    const matchesQuery = !query || searchText.includes(query);
    const matchesLocation =
      !location || villa.city === location || villa.district === location;
    const matchesStatus = !status || villa.status === status;

    return matchesQuery && matchesLocation && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredVillas.length / 12));
  const page = Math.min(pageCount, Math.max(1, Math.floor(Number(filters.page) || 1)));
  const visible = filteredVillas.slice((page - 1) * 12, page * 12);
  function pageHref(value: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (location) params.set("location", location);
    if (status) params.set("status", status);
    params.set("page", String(value));
    return `/panel/villalar?${params}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4689b5]">Portfoy yonetimi</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Villalar</h1>
          <p className="mt-2 text-sm text-slate-500">Portfoyunuz, fiyatlariniz ve musaitlik durumunuz tek yerde.</p>
        </div>
        <Link href="/panel/villalar/yeni" className="panel-button"><span aria-hidden="true">+</span> Yeni villa ekle</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Toplam villa", villaCatalog.length, "text-slate-900"],
          ["Yayinda", villaCatalog.filter((villa) => villa.status === "ACTIVE").length, "text-emerald-700"],
          ["Taslak", villaCatalog.filter((villa) => villa.status === "DRAFT").length, "text-amber-700"],
          ["Pasif / Arsiv", villaCatalog.filter((villa) => ["PAUSED", "ARCHIVED"].includes(villa.status)).length, "text-slate-500"],
        ].map(([label, count, tone]) => <div key={label} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-2 text-2xl font-semibold tabular-nums ${tone}`}>{count}</p>
        </div>)}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <form method="GET" className="grid items-end gap-3 border-b border-slate-200 bg-slate-50/60 p-5 lg:grid-cols-[minmax(180px,1fr)_180px_150px_auto]">
          <div><label htmlFor="villa-search" className="text-xs font-semibold text-slate-600">Kod veya isim</label>
            <input id="villa-search" name="q" defaultValue={filters.q ?? ""} placeholder="Kod, villa adi, ev sahibindeki adi..." className="panel-input mt-2" />
          </div>
          <div><label htmlFor="villa-location" className="text-xs font-semibold text-slate-600">Lokasyon / bolge</label>
            <select id="villa-location" name="location" defaultValue={location} className="panel-input mt-2"><option value="">Tum bolgeler</option>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
          <div><label htmlFor="villa-status" className="text-xs font-semibold text-slate-600">Yayin durumu</label>
            <select id="villa-status" name="status" defaultValue={status} className="panel-input mt-2"><option value="">Tum durumlar</option>{Object.entries(villaStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div className="flex gap-2"><button className="panel-button" type="submit">Filtrele</button><Link href="/panel/villalar" className="panel-button-secondary">Temizle</Link></div>
        </form>
        <div className="flex justify-between border-b border-slate-100 px-5 py-3 text-xs text-slate-500"><span>{filteredVillas.length} villa bulundu</span><span>Sayfa {page} / {pageCount}</span></div>
        <div className="divide-y divide-slate-100">
          {visible.map((villa) => <article key={villa.id} className="p-5 transition hover:bg-slate-50/50">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Link href={`/panel/villalar/${villa.slug}/duzenle`} className="relative block h-44 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-32 sm:w-44">
                {villa.coverImageUrl ? <Image src={villa.coverImageUrl} alt={villa.title} fill unoptimized sizes="176px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-xs text-slate-400">Fotograf yok</span>}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{villa.shortCode || "Kod girilmedi"}</p>
                    <Link href={`/panel/villalar/${villa.slug}/duzenle`} className="mt-1 block text-lg font-semibold text-slate-900 hover:text-[#4689b5]">{villa.title}</Link>
                    <p className="mt-1 text-xs text-slate-500">{villa.locationLabel} · {villa.capacity} misafir · {villa.bedroomCount} oda</p>
                  </div>
                  <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${villaStatusClasses[villa.status]}`}>{villaStatusLabels[villa.status]}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <p className="text-lg font-semibold text-slate-900">{formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}<span className="ml-1 text-xs font-normal text-slate-400">/ gece</span></p>
                  <span className="text-xs text-slate-500">{villa.imageCount} fotograf</span>
                  <span className="text-xs text-slate-500">{villa.availabilityRanges.length} takvim bloku</span>
                  <span className="text-xs text-slate-500">SEO %{getSeoScore(villa)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-2 xl:w-44 xl:flex-col xl:items-stretch">
                <Link href={`/panel/villalar/${villa.slug}/duzenle`} className="panel-button">Duzenle</Link>
                <Link href={`/panel/villalar/${villa.slug}/duzenle#villa-calendar`} className="panel-button-secondary">Fiyat / Takvim</Link>
                {villa.status === "ACTIVE" ? <Link href={`/villalar/${villa.slug}`} target="_blank" rel="noreferrer" className="px-2 py-1 text-center text-xs font-medium text-slate-500">Sitede goruntule</Link> : null}
              </div>
            </div>
            <details className="mt-4 border-t border-slate-100 pt-3">
              <summary className="cursor-pointer text-xs font-medium text-slate-500">Yayin ve arsiv islemleri</summary>
              <div className="pt-3"><VillaStatusActions slug={villa.slug} title={villa.title} status={villa.status} /></div>
            </details>
          </article>)}
          {!visible.length ? <div className="px-5 py-16 text-center"><p className="font-semibold text-slate-700">Eslesen villa bulunamadi</p><p className="mt-2 text-sm text-slate-500">Arama kelimesini veya bolge filtresini degistirin.</p></div> : null}
        </div>
        {pageCount > 1 ? <nav aria-label="Villa sayfalari" className="flex items-center justify-between border-t border-slate-200 p-4">
          {page > 1 ? <Link href={pageHref(page - 1)} className="panel-button-secondary">Onceki</Link> : <span />}
          <span className="text-sm text-slate-500">{page} / {pageCount}</span>
          {page < pageCount ? <Link href={pageHref(page + 1)} className="panel-button-secondary">Sonraki</Link> : <span />}
        </nav> : null}
      </section>
    </div>
  );
}
