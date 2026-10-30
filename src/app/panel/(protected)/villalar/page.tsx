import Link from "next/link";
import Image from "next/image";
import { VillaBulkActions, VillaSelection } from "@/components/panel/villa-bulk-actions";
import { PanelPageHeader } from "@/components/panel/panel-page-header";
import { VillaStatusActions } from "@/components/panel/villa-status-actions";
import { formatCurrency } from "@/lib/villa-catalog";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import { getVillaPublicationWarnings, selectPanelVillas, PANEL_VILLA_PAGE_SIZE } from "@/lib/panel-villa-list";

export const dynamic = "force-dynamic";
const statusLabels = { ACTIVE: "Yayında", DRAFT: "Taslak", PAUSED: "Pasif", ARCHIVED: "Arşiv" } as const;
const statusClasses = { ACTIVE: "bg-emerald-50 text-emerald-800", DRAFT: "bg-slate-100 text-slate-600", PAUSED: "bg-amber-50 text-amber-800", ARCHIVED: "bg-zinc-100 text-zinc-600" } as const;
type Filters = { q?: string; location?: string; status?: string; sort?: string; page?: string; review?: string };

export default async function PanelVillasPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams;
  const villas = await getDemoVillas();
  const { visible, total, page, pageCount } = selectPanelVillas(villas, filters);
  const locations = Array.from(new Set(villas.flatMap((villa) => [villa.city, villa.district]).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "tr"));
  function href(changes: Partial<Filters>) {
    const params = new URLSearchParams();
    Object.entries({ ...filters, page: undefined, ...changes }).forEach(([key, value]) => { if (value) params.set(key, value); });
    return `/panel/villalar?${params}`;
  }
  const hasFilters = Boolean(filters.q || filters.location || filters.status || filters.review);
  return <div className="space-y-6">
    <PanelPageHeader eyebrow="Portföy yönetimi" title="Villalar" description="Villalarınızı bulun, bilgilerini düzenleyin ve yayın durumlarını yönetin."
      actions={<Link href="/panel/villalar/yeni" className="panel-button"><span aria-hidden="true">+</span> Villa ekle</Link>} />
    <nav aria-label="Villa yayın durumları" className="panel-status-tabs">
      <Link href={href({ status: "" })} aria-current={!filters.status ? "page" : undefined}>Tümü <span>{villas.length}</span></Link>
      {Object.entries(statusLabels).map(([value, label]) => <Link key={value} href={href({ status: value })} aria-current={filters.status === value ? "page" : undefined}>
        {label}<span>{villas.filter((villa) => villa.status === value).length}</span>
      </Link>)}
    </nav>
    <section aria-label="Villa listesi" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <form method="GET" className="grid items-end gap-3 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_160px_170px_auto]">
        {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
        <div><label htmlFor="villa-search" className="text-xs font-semibold text-slate-600">Villa ara</label>
          <input id="villa-search" name="q" defaultValue={filters.q ?? ""} placeholder="İsim, kısa kod veya ev sahibindeki adı" className="panel-input mt-2" />
        </div>
        <div><label htmlFor="villa-location" className="text-xs font-semibold text-slate-600">Lokasyon / bölge</label>
          <select id="villa-location" name="location" defaultValue={filters.location ?? ""} className="panel-input mt-2"><option value="">Tüm bölgeler</option>{locations.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div><label htmlFor="villa-sort" className="text-xs font-semibold text-slate-600">Sıralama</label>
          <select id="villa-sort" name="sort" defaultValue={filters.sort ?? ""} className="panel-input mt-2"><option value="">Varsayılan sıralama</option><option value="title">Villa adı (A–Z)</option><option value="price-asc">Fiyat (artan)</option><option value="price-desc">Fiyat (azalan)</option></select>
        </div>
        <button className="panel-button h-[44px]" type="submit">Sonuçları göster</button>
        <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-2 xl:col-span-4"><input name="review" value="1" type="checkbox" defaultChecked={filters.review === "1"} /> Bilgilerinde eksik olabilecek villalar</label>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span><strong className="font-semibold text-slate-800">{total}</strong> villa{hasFilters ? " filtrelerle eşleşiyor" : " listeleniyor"}{filters.q ? ` · “${filters.q}”` : ""}{filters.location ? ` · ${filters.location}` : ""}</span>
        {hasFilters ? <Link href="/panel/villalar" className="font-semibold text-[#173c64] underline underline-offset-4">Filtreleri temizle</Link> : <span>Fiyatlar gecelik başlangıç fiyatıdır.</span>}
      </div>
      <VillaBulkActions key={JSON.stringify(filters)} villas={visible.map(({ id, title, status, companyId }) => ({ id, title, status, companyId }))}>
      <div className="panel-villa-heading" aria-hidden="true"><span>Villa / konum</span><span>Gecelik fiyat</span><span>Yayın durumu</span><span>İşlemler</span></div>
      <div className="divide-y divide-slate-100">
        {visible.map((villa) => {
          const warnings = getVillaPublicationWarnings(villa);
          const editHref = `/panel/villalar/${villa.slug}/duzenle`;
          return <article key={villa.id} className="panel-villa-row transition hover:bg-slate-50/50" aria-label={villa.title}>
            <div className="panel-villa-identity">
              <VillaSelection id={villa.id} title={villa.title} />
              <Link href={editHref} className="relative block h-16 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100" aria-label={`${villa.title} düzenle`}>
                {villa.coverImageUrl ? <Image src={villa.coverImageUrl} alt="" fill unoptimized sizes="80px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-[10px] text-slate-500">Fotoğraf yok</span>}
              </Link>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">{villa.shortCode || "Kod girilmedi"}</p>
                <Link href={editHref} className="mt-1 block truncate text-sm font-semibold text-slate-900 hover:text-[#4689b5]" title={villa.title}>{villa.title}</Link>
                <p className="mt-1 truncate text-xs text-slate-500">{villa.locationLabel} · {villa.capacity} misafir</p>
              </div>
            </div>
            <div className="panel-villa-price"><p className="text-sm font-semibold text-slate-800">{formatCurrency(villa.discountedNightlyPrice ?? villa.nightlyPrice)}</p><p className="mt-1 text-[11px] text-slate-500">{villa.imageCount} fotoğraf · {villa.bedroomCount} oda</p></div>
            <div><span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${statusClasses[villa.status]}`}>{statusLabels[villa.status]}</span>
              {warnings.length ? <Link href={editHref} className="mt-2 block text-[11px] text-amber-800 underline decoration-dotted underline-offset-4" title={`Kontrol önerisi: ${warnings.join(", ")}`}>{warnings.length} bilgi kontrolü</Link> : <p className="mt-2 text-[11px] text-slate-500">Temel bilgiler tam</p>}
            </div>
            <div className="panel-villa-actions">
              <Link href={editHref} className="panel-button-secondary">Düzenle</Link>
              <Link href={`${editHref}#villa-calendar`} className="text-xs font-medium text-[#173c64] underline underline-offset-4">Takvim</Link>
              {villa.status === "ACTIVE" ? <Link href={`/villalar/${villa.slug}`} target="_blank" rel="noreferrer" className="text-[11px] text-slate-500 hover:underline">Sitede görüntüle ↗</Link> : null}
            </div>
            <details className="panel-villa-danger"><summary>Yayın ve arşiv işlemleri</summary><div className="pt-4"><p className="mb-3 text-xs text-slate-500">Yayın durumu ve kalıcı silme işlemleri. Bilgileri değiştirmek için Düzenle düğmesini kullanın.</p><VillaStatusActions slug={villa.slug} title={villa.title} status={villa.status} /></div></details>
          </article>;
        })}
        {!visible.length ? <div className="px-5 py-16 text-center"><p className="font-semibold text-slate-700">{hasFilters ? "Aramanıza uygun villa bulunamadı" : "Henüz villa eklenmemiş"}</p><p className="mt-2 text-sm text-slate-500">{hasFilters ? "Daha kısa bir arama deneyin veya filtreleri temizleyin." : "İlk villanızın bilgilerini ve fotoğraflarını ekleyerek başlayın."}</p><Link href={hasFilters ? "/panel/villalar" : "/panel/villalar/yeni"} className="panel-button-secondary mt-5">{hasFilters ? "Filtreleri temizle" : "Villa ekle"}</Link></div> : null}
      </div>
      </VillaBulkActions>
      {total > 0 ? <nav aria-label="Villa sayfaları" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
        <span>{(page - 1) * PANEL_VILLA_PAGE_SIZE + 1}–{Math.min(page * PANEL_VILLA_PAGE_SIZE, total)} / {total} villa</span>
        <div className="flex items-center gap-3">{page > 1 ? <Link href={href({ page: String(page - 1) })} className="panel-button-secondary">Önceki</Link> : null}<span>Sayfa {page} / {pageCount}</span>{page < pageCount ? <Link href={href({ page: String(page + 1) })} className="panel-button-secondary">Sonraki</Link> : null}</div>
      </nav> : null}
    </section>
    <p className="text-xs leading-5 text-slate-500">Bilgi kontrolü; fotoğraf, fiyat, İngilizce içerik ve belge numarası için bir hatırlatmadır. Yayın durumunu kendiliğinden değiştirmez.</p>
  </div>;
}
