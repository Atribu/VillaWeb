import Link from "next/link";
import {
  getDemoLandingPages,
  getDemoSeoContents,
  getDemoWebsites,
} from "@/lib/server/demo-websites-store";

export const dynamic = "force-dynamic";

export default async function PanelWebsitesOverviewPage() {
  const [websites, landings, contents] = await Promise.all([
    getDemoWebsites(),
    getDemoLandingPages(),
    getDemoSeoContents(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Web Siteleri
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Site, landing ve SEO yayin akislarini tek panelde yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu modul birden fazla siteyi, landing sayfasi kurulumlarini ve SEO icerik backlogunu
          birlikte takip etmek icin tasarlandi.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          ["Canli site", String(websites.filter((item) => item.status === "LIVE").length), "Yayinda olan alan adlari"],
          ["Landing sayfasi", String(landings.length), "Takip edilen landing kayitlari"],
          ["Yayinda SEO icerigi", String(contents.filter((item) => item.status === "PUBLISHED").length), "Yayinda olan SEO backlog kalemleri"],
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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Site Yonetimi
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Etkin site alanlari
              </h3>
            </div>
            <Link
              href="/panel/web-siteleri/site-yonetimi"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Site Listesi
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {websites.map((site) => (
              <div key={site.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{site.name}</p>
                <p className="mt-2 text-sm text-slate-500">{site.domain}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Icerik Backlog
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Landing ve SEO kalemleri
              </h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {landings.slice(0, 2).map((landing) => (
              <div key={landing.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{landing.title}</p>
                <p className="mt-2 text-sm text-slate-500">{landing.focusKeyword}</p>
              </div>
            ))}
            {contents.slice(0, 2).map((content) => (
              <div key={content.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{content.title}</p>
                <p className="mt-2 text-sm text-slate-500">{content.primaryKeyword}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
