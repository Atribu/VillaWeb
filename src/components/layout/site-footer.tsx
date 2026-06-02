import Link from "next/link";
import { navigation } from "@/lib/site-data";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { Container } from "@/components/ui/container";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

const footerLinks = [
  { href: "/kvkk", label: "KVKK" },
  { href: "/gizlilik", label: "Gizlilik Politikasi" },
  { href: "/kullanim-kosullari", label: "Kullanim Kosullari" },
];

export async function SiteFooter() {
  const company = await getCurrentPublicCompany();

  return (
    <footer className="mt-24 border-t border-black/6 bg-white">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-coral)] text-sm font-bold text-white">
              {company.shortName
                .split(" ")
                .map((item) => item[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{company.shortName}</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                {company.tagline}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
            {company.heroDescription}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${company.phone.replace(/\s+/g, "")}`}
              className="rounded-full border border-black/8 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              {company.phone}
            </a>
            <Link
              href={getDemoCompanySiteHref(company.slug, "/talep")}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Talep Olustur
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Kesfet
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={getDemoCompanySiteHref(company.slug, item.href)}
                className="transition hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Yasal
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Iletisim
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            {[
              { title: "Telefon", value: company.phone },
              { title: "E-posta", value: company.email },
              { title: "WhatsApp", value: company.whatsapp },
              { title: "Calisma", value: company.supportHours },
            ].map((item) => (
              <p key={item.title}>
                <span className="font-semibold text-slate-900">{item.title}:</span> {item.value}
              </p>
            ))}
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-3 border-t border-black/6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>2026 {company.shortName}. Tum haklari saklidir.</p>
        <p>{company.accentLabel}</p>
      </Container>
    </footer>
  );
}
