import Link from "next/link";
import {
  getDemoDocumentLinks,
  getDemoExternalServices,
  getDemoShortcuts,
} from "@/lib/server/demo-external-links-store";

export const dynamic = "force-dynamic";

export default async function PanelExternalLinksOverviewPage() {
  const [shortcuts, services, documentLinks] = await Promise.all([
    getDemoShortcuts(),
    getDemoExternalServices(),
    getDemoDocumentLinks(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Diger Linkler
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Ekibin kullandigi kisayol, servis ve dokuman baglantilarini merkezden yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu bolum operasyon hizini arttiran link katalogu gibi calisir; baglantilar kategori ve
          durum bazinda takip edilir.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          ["Kisayol", String(shortcuts.length), "Panel icinde hizli gecis baglantilari"],
          ["Dis servis", String(services.length), "Harici arac ve dashboard baglantilari"],
          ["Dokuman linki", String(documentLinks.length), "Yasal ve operasyonel belge baglantilari"],
        ].map(([label, value, detail]) => (
          <div
            key={label}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Katalog
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Kisa erisim listeleri
              </h3>
            </div>
            <Link
              href="/panel/diger-linkler/kisayollar"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Kisayollar
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {shortcuts.slice(0, 3).map((shortcut) => (
              <div key={shortcut.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{shortcut.title}</p>
                <p className="mt-2 text-sm text-slate-500">{shortcut.category}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Servisler
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Harici arac baglantilari
              </h3>
            </div>
            <Link
              href="/panel/diger-linkler/dis-servisler"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Dis Servisler
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {services.slice(0, 3).map((service) => (
              <div key={service.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{service.name}</p>
                <p className="mt-2 text-sm text-slate-500">{service.category}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
