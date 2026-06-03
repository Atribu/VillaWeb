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

const popularGroups = [
  "Balayi Villalari",
  "Deniz Manzarali Villalar",
  "Korunakli Havuzlu Villalar",
  "Jakuzili Villalar",
  "Uzun Donem Konaklamalar",
];

export async function SiteFooter() {
  const company = await getCurrentPublicCompany();

  return (
    <footer className="mt-24 border-t border-black/6 bg-[var(--color-soft-white)]">
      <Container className="py-14">
        <div className="rounded-[2rem] border border-black/6 bg-white p-6 shadow-[0_14px_28px_rgba(15,23,42,0.04)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--color-coral)]">
                Kampanya ve firsatlar
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                Firsatlarimizi ve yeni villalari aninda ogrenin
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600">
                Donemsel indirimler, yeni eklenen portfoyler ve uzun konaklama firsatlari icin
                bultene kaydolun. Bu alan, EvTatilim benzeri daha katalog agirlikli sitelerde iyi
                calisan guven bloklarindan biri.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] bg-[var(--color-slate-soft)] p-4 sm:grid-cols-[1fr_auto]">
              <div className="rounded-[1rem] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  E-posta adresiniz
                </p>
                <p className="mt-1 text-sm text-slate-500">kampanya@ornekmail.com</p>
              </div>
              <button
                type="button"
                className="rounded-[1rem] bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Kaydol
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <p className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
              {company.shortName}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">
              Premium Villa Koleksiyonu
            </p>
            <p className="mt-5 max-w-md text-sm leading-8 text-slate-600">
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
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Kesfet</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={getDemoCompanySiteHref(company.slug, item.href)}
                  className="transition hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Kategoriler</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600">
              {popularGroups.map((item) => (
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

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Iletisim & Yasal</p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-950">Telefon:</span> {company.phone}
              </p>
              <p>
                <span className="font-semibold text-slate-950">E-posta:</span> {company.email}
              </p>
              <p>
                <span className="font-semibold text-slate-950">WhatsApp:</span> {company.whatsapp}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {footerLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-slate-950">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div className="border-t border-black/6 bg-white">
        <Container className="flex flex-col gap-3 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>2026 {company.shortName}. Tum haklari saklidir.</p>
          <p>{company.accentLabel}</p>
        </Container>
      </div>
    </footer>
  );
}
