import type { PanelModuleMeta } from "@/lib/auth/panel-access";

function prettifySegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PanelModuleShell({
  section,
  slug,
  meta,
}: {
  section: string;
  slug?: string[];
  meta: PanelModuleMeta;
}) {
  const segments = [section, ...(slug ?? [])];
  const currentLabel = segments.map(prettifySegment).join(" / ");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
              {meta.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {meta.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{meta.description}</p>
          </div>

          <div className="rounded-[1.4rem] border border-[#dbe5ee] bg-[#f8fbfd] px-5 py-4 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Secili Modul
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{currentLabel}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f16824]">
            Bu Alanda Ne Olacak
          </p>
          <div className="mt-6 space-y-4">
            {meta.highlights.map((item) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-slate-100 bg-[#f8fafc] px-5 py-4 text-sm font-medium text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2b78ad]">
            Sonraki Faz
          </p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            Backoffice omurgasi hazir, islevler asama asama canliya alinacak
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Bu sayfa su an yeni pazar yeri mimarisi icin ayrilmis durumda. Bir sonraki iterasyonda
            tablo, filtre, form, log ve operasyon aksiyonlari dogrudan bu alanin icine
            yerlestirilecek.
          </p>

          <div className="mt-6 rounded-[1.4rem] border border-dashed border-[#cbd7e1] bg-[#f8fbfd] px-5 py-4">
            <p className="text-sm font-semibold text-slate-800">Hazirlik notu</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Mevcut panelin calisan modulleri korunuyor. Bu ekran ise rezervasyon, operasyon,
              muhasebe ve CRM tarafini buyutmek icin yeni iskelet gorevi goruyor.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
