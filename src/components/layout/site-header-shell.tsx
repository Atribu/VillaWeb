"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DemoCompanyRecord } from "@/lib/demo-companies";
import { getDemoCompanySiteHref, getLocalizedDemoCompanyRecord } from "@/lib/demo-companies";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { getNavigation } from "@/lib/site-data";
import { Container } from "@/components/ui/container";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

type SiteHeaderShellProps = {
  company: DemoCompanyRecord;
  locale: AppLocale;
};

export function SiteHeaderShell({ company, locale }: SiteHeaderShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const localizedCompany = getLocalizedDemoCompanyRecord(company, locale);
  const initials = company.shortName
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2);
  const navigation = getNavigation(locale);

  const headerClassName = isHome
    ? "absolute inset-x-0 top-0 z-50"
    : "sticky inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(0,32,69,0.94)] backdrop-blur-xl";

  const navLinkClassName = (href: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

    return `border-b pb-1 transition ${
      isActive
        ? "border-[var(--serene-tertiary)] text-white"
        : "border-transparent text-white/82 hover:text-white"
    }`;
  };

  return (
    <header className={headerClassName}>
      <Container className={isHome ? "py-6" : "py-5"}>
        <div className="flex items-center justify-between gap-6 text-white">
          <Link
            href={getDemoCompanySiteHref(company.slug, "/")}
            aria-label={pickLocalized(
              locale,
              `${company.shortName} ana sayfasina don`,
              `Return to ${company.shortName} home page`,
            )}
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-white/24 bg-white/10 text-sm font-bold text-white backdrop-blur">
              {initials}
            </div>
              <div>
                <p className="font-display text-[2rem] font-semibold tracking-[-0.04em] text-white">
                  {company.shortName}
                </p>
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/60">
                  {localizedCompany.tagline}
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={getDemoCompanySiteHref(company.slug, item.href)}
                className={navLinkClassName(item.href)}
              >
                  {item.label}
                </Link>
              ))}
              <LanguageSwitcher locale={locale} variant="dark" compact />
              <Link
                href="/panel/giris"
                className="rounded-[8px] border border-white/22 px-4 py-2 text-white/92 transition hover:border-[var(--serene-tertiary)] hover:text-white"
              >
                {pickLocalized(locale, "Giris / Kayit", "Sign In / Register")}
              </Link>
            </nav>
          </div>
        </Container>
      </header>
  );
}
