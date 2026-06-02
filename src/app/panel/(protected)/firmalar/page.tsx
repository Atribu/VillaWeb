import Link from "next/link";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { getAllCompanyRecords } from "@/lib/server/company-store";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await getAllCompanyRecords();

  return (
    <section className="space-y-6">
      <div className="rounded-[1.8rem] border border-[#d8e0e7] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2b78ad]">
          Platform Firmalari
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#334155]">
          Her firmanin paneli ve public sitesi birbirinden ayrildi
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          Bu demo yapida her firma kendi villalarini, taleplerini, fiyatlarini, kuponlarini ve
          web sitesi kayitlarini yalnizca kendi scope&apos;unda gorur. Super admin ise tum firmalari
          tek merkezden izler.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {companies.map((company) => (
          <article
            key={company.id}
            className="rounded-[1.8rem] border border-[#d8e0e7] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2b78ad]">
                  {company.tagline}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{company.name}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{company.heroDescription}</p>
              </div>
              <span className="rounded-full bg-[#eef6fc] px-3 py-1 text-xs font-semibold text-[#2b78ad]">
                {company.slug}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f7f9fb] p-4 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Public Site
                </p>
                <p className="mt-2 font-semibold text-slate-900">{company.primaryDomain}</p>
                <p className="mt-2">{company.phone}</p>
                <p>{company.email}</p>
              </div>
              <div className="rounded-2xl bg-[#f7f9fb] p-4 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Demo Kullanim
                </p>
                <p className="mt-2 font-semibold text-slate-900">{company.panelLabel}</p>
                <p className="mt-2">{company.accentLabel}</p>
                <p className="mt-2">{company.supportHours}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={getDemoCompanySiteHref(company.slug)}
                className="rounded-full bg-[#2b78ad] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#23638f]"
              >
                Siteyi Onizle
              </Link>
              <Link
                href={`/panel/web-siteleri/site-yonetimi`}
                className="rounded-full border border-[#c7d6e3] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#2b78ad] hover:text-[#2b78ad]"
              >
                Web Siteleri Modulu
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
