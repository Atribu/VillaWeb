import { VillaForm } from "@/components/panel/villa-form";

export default function PanelNewVillaPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Yeni Villa Ekle
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
          Villa personelinin gorecegi ana ekran burasi
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Personel hesabi ile girildiginde panel sadece villa listesi ve yeni villa ekleme
          alanlarini gosterir. Admin ise tum modullere ulasir.
        </p>
      </div>

      <VillaForm />
    </div>
  );
}
