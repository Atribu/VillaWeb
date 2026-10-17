import type { ReactNode } from "react";
import Link from "next/link";
import { signOutUser } from "@/lib/auth/actions";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { PanelSidebar } from "@/components/panel/panel-sidebar";
import { getUserSession } from "@/lib/auth/server-session";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { pickLocalized } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import "../panel.css";

export default async function ProtectedPanelLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  const locale = await getCurrentLocale();
  const role = session?.role ?? "STAFF";
  const companyName = session?.companyName ?? "BookToVilla";
  const siteHref = session?.companySlug ? getDemoCompanySiteHref(session.companySlug) : "/";
  const displayName = session?.displayName ?? "Yetkili";
  const date = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date());
  return (
    <div className="panel-shell min-h-screen">
      <a href="#panel-content" className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3">Icerige gec</a>
      <header className="panel-masthead">
        <Link href="/panel" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#173c64] text-white">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8" /></svg>
          </span>
          <span className="min-w-0"><span className="block truncate text-lg font-semibold tracking-tight">BookToVilla</span><span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Yonetim merkezi</span></span>
        </Link>
        <form action="/panel/talepler" method="GET" role="search" className="hidden max-w-md flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 md:flex">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-slate-400" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>
          <input name="q" aria-label="Rezervasyon ara" placeholder="Misafir, villa veya rezervasyon ara..." className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" />
          <button className="text-xs font-semibold text-slate-500" type="submit">Ara</button>
        </form>
        <div className="flex items-center gap-3">
          <Link href={siteHref} className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">{pickLocalized(locale, "Siteyi gor", "View website")}</Link>
          <LanguageSwitcher locale={locale} variant="light" compact />
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9eff5] text-xs font-bold text-[#173c64]">{displayName.slice(0, 2).toLocaleUpperCase("tr-TR")}</span>
              <span className="hidden max-w-36 truncate text-sm font-medium lg:block">{displayName}</span>
            </summary>
            <div className="absolute right-0 z-50 mt-3 w-60 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <p className="text-sm font-semibold">{companyName}</p>
              <p className="mt-1 text-xs text-slate-500">{role === "SUPER_ADMIN" ? "Platform yoneticisi" : role === "ADMIN" ? "Firma yoneticisi" : "Villa yetkilisi"}</p>
              <form action={signOutUser}><button className="mt-4 text-sm font-semibold text-rose-700" type="submit">{pickLocalized(locale, "Guvenli cikis", "Sign out")}</button></form>
            </div>
          </details>
        </div>
      </header>
      <div className="panel-workspace">
        <PanelSidebar role={role} locale={locale} />
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4 px-5 pt-5 text-xs text-slate-500 sm:px-8">
            <span className="truncate">{role === "SUPER_ADMIN" ? "Tum firmalar" : companyName} <span className="mx-2 text-slate-300">/</span> Backoffice</span>
            <time className="shrink-0" suppressHydrationWarning>{date}</time>
          </div>
          <main id="panel-content" className="panel-main mx-auto max-w-[1600px] p-5 sm:p-8" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </div>
  );
}
