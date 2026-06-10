import type { ReactNode } from "react";
import Link from "next/link";
import { signOutUser } from "@/lib/auth/actions";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { PanelSidebar } from "@/components/panel/panel-sidebar";
import { getUserSession } from "@/lib/auth/server-session";
import { getLocaleCode, pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default async function ProtectedPanelLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  const locale = await getCurrentLocale();
  const role = session?.role ?? "STAFF";
  const companyName = session?.companyName ?? "Demo Platform";
  const panelBrand = role === "SUPER_ADMIN" ? "VillaHub" : (session?.companyName ?? "Firma Paneli");
  const siteHref = session?.companySlug ? getDemoCompanySiteHref(session.companySlug) : "/";
  const todayLabel = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#eaedf1]">
      <div className="border-b border-[#cfd6dd] bg-[#d8d8dc]">
        <div className="flex items-center justify-between px-4 py-1.5 text-xs text-[#2d4a62] sm:px-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-5 w-6 items-center justify-center rounded-sm bg-[#e11d48] text-[10px] font-bold text-white">
              {getLocaleCode(locale)}
            </span>
            <span>{todayLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-[#58748a] sm:inline">
              {pickLocalized(locale, "Bildirimler acik", "Notifications enabled")}
            </span>
            <LanguageSwitcher locale={locale} variant="light" compact />
            <span className="font-medium text-[#2b78ad]">{session?.displayName ?? "Yetkili"}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-[#1f618e] bg-[#2b78ad] px-4 py-3 text-white sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="block">
              <p className="font-display text-4xl font-semibold tracking-tight">
                {role === "SUPER_ADMIN" ? "Villa" : panelBrand.split(" ")[0]}
                <span className="text-white/80">
                  {role === "SUPER_ADMIN" ? "Hub" : panelBrand.split(" ").slice(1).join(" ")}
                </span>
              </p>
            </Link>

            <div className="hidden items-center gap-3 text-sm xl:flex">
              <span className="font-semibold">{pickLocalized(locale, "Backoffice", "Backoffice")}</span>
              <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-medium text-white/90">
                {role === "SUPER_ADMIN"
                  ? pickLocalized(locale, "Platform Super Admin", "Platform Super Admin")
                  : role === "ADMIN"
                    ? pickLocalized(locale, `${companyName} Admin`, `${companyName} Admin`)
                    : pickLocalized(locale, `${companyName} Personel`, `${companyName} Staff`)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="rounded-md bg-white/12 px-3 py-2 text-sm font-medium text-white/95">
              {role === "SUPER_ADMIN"
                ? pickLocalized(locale, "Coklu Firma Demo Paneli", "Multi-tenant Demo Panel")
                : companyName}
            </div>
            <div className="flex min-w-[260px] items-center overflow-hidden rounded-md border border-[#205d87] bg-white text-slate-700 shadow-inner">
              <div className="border-r border-slate-200 bg-[#f6f8fa] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {pickLocalized(locale, "Rezervasyon Ara", "Search Booking")}
              </div>
              <input
                type="text"
                placeholder={pickLocalized(locale, "Rezervasyon ara", "Search booking")}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                className="border-l border-slate-200 px-3 py-2 text-[#2b78ad] transition hover:bg-slate-50"
                aria-label={pickLocalized(locale, "Rezervasyon ara", "Search booking")}
              >
                {pickLocalized(locale, "Ara", "Search")}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={siteHref}
                className="rounded-md bg-white/12 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/18"
              >
                {pickLocalized(locale, "Site", "Website")}
              </Link>
              <Link
                href="/panel/giris"
                className="rounded-md bg-white/12 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/18"
              >
                {pickLocalized(locale, "Giris", "Login")}
              </Link>
              <form action={signOutUser}>
                <button
                  type="submit"
                  className="rounded-md bg-[#1f5f89] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#194d70]"
                >
                  {pickLocalized(locale, "Cikis", "Logout")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-104px)] grid-cols-[auto_1fr]">
        <aside className="border-r border-[#cfd6dd] bg-white">
          <PanelSidebar role={role} locale={locale} />
        </aside>

        <div className="min-w-0">
          <div className="border-b border-[#d9dee5] bg-[#f5f6f8] px-6 py-4 shadow-[inset_0_-1px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#2b78ad]" />
                <p className="text-xl font-semibold text-[#4f5565]">
                  {role === "SUPER_ADMIN"
                    ? pickLocalized(
                        locale,
                        "Platform firmalari ve operasyon merkezine hos geldiniz",
                        "Welcome to the platform companies and operations center",
                      )
                    : role === "ADMIN"
                      ? pickLocalized(
                          locale,
                          `${companyName} backoffice sistemine hos geldiniz`,
                          `Welcome to the ${companyName} backoffice`,
                        )
                      : pickLocalized(
                          locale,
                          `${companyName} villa operasyon ekranina hos geldiniz`,
                          `Welcome to the ${companyName} villa operations screen`,
                        )}
                </p>
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#7a8796]">
                {role === "SUPER_ADMIN"
                  ? pickLocalized(locale, "Platform kontrol merkezi", "Platform control center")
                  : pickLocalized(locale, "Firma bazli demo panel", "Company-based demo panel")}
              </span>
            </div>
          </div>

          <main className="px-4 py-5 sm:px-7 sm:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
