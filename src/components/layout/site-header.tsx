import Link from "next/link";
import { navigation } from "@/lib/site-data";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { Container } from "@/components/ui/container";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

const utilityDestinations = ["Bodrum", "Kalkan", "Fethiye", "Kas"];

export async function SiteHeader() {
  const company = await getCurrentPublicCompany();
  const initials = company.shortName
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="border-b border-black/6 bg-white">
      <div className="border-b border-black/6 bg-[var(--color-soft-white)]">
        <Container className="flex flex-col gap-3 py-3 text-xs text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/panel/giris" className="font-medium transition hover:text-slate-950">
              Giris
            </Link>
            <Link href="/talep" className="font-medium transition hover:text-slate-950">
              Talep Formu
            </Link>
            <span className="hidden text-slate-300 lg:inline">|</span>
            <span className="font-semibold uppercase tracking-[0.2em] text-[var(--color-teal)]">
              Populer Destinasyonlar
            </span>
            <div className="flex flex-wrap gap-3">
              {utilityDestinations.map((item) => (
                <Link
                  key={item}
                  href={getDemoCompanySiteHref(company.slug, "/villalar")}
                  className="transition hover:text-slate-950"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href={`tel:${company.phone.replace(/\s+/g, "")}`} className="transition hover:text-slate-950">
              {company.phone}
            </a>
            <a href={`mailto:${company.email}`} className="transition hover:text-slate-950">
              {company.email}
            </a>
          </div>
        </Container>
      </div>

      <Container className="py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
              {initials}
            </div>
            <div>
              <p className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
                {company.shortName}
              </p>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                Premium Villa Koleksiyonu
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-[2rem] border border-black/6 bg-[var(--color-soft-white)] p-3 shadow-[0_14px_28px_rgba(15,23,42,0.04)] sm:grid-cols-[1fr_1fr_1fr_auto] xl:min-w-[760px]">
            {[
              ["Nereye", "Kalkan, Kas, Fethiye"],
              ["Ne zaman", "Giris ve cikis tarihleri"],
              ["Kimlerle", "Balayi, aile, grup"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1rem] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
              </div>
            ))}

            <Link
              href={getDemoCompanySiteHref(company.slug, "/villalar")}
              className="inline-flex items-center justify-center rounded-[1rem] bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ara
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-black/6 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={getDemoCompanySiteHref(company.slug, item.href)}
                className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-black/6 bg-white px-4 py-2 text-xs text-slate-500">
              Her villa icin tarih kontrollu talep akisi
            </span>
            <span className="rounded-full border border-black/6 bg-white px-4 py-2 text-xs text-slate-500">
              Kampanya ve kupon destekli fiyatlama
            </span>
          </div>
        </div>
      </Container>
    </header>
  );
}
