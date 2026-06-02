import type { ReactNode } from "react";
import Link from "next/link";
import { signOutUser } from "@/lib/auth/actions";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { PanelSidebar } from "@/components/panel/panel-sidebar";
import { getUserSession } from "@/lib/auth/server-session";

export default async function ProtectedPanelLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  const role = session?.role ?? "STAFF";
  const companyName = session?.companyName ?? "Demo Platform";
  const panelBrand = role === "SUPER_ADMIN" ? "VillaHub" : (session?.companyName ?? "Firma Paneli");
  const siteHref = session?.companySlug ? getDemoCompanySiteHref(session.companySlug) : "/";
  const todayLabel = new Intl.DateTimeFormat("tr-TR", {
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
              TR
            </span>
            <span>{todayLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-[#58748a] sm:inline">Bildirimler acik</span>
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
              <span className="font-semibold">Backoffice</span>
              <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-medium text-white/90">
                {role === "SUPER_ADMIN"
                  ? "Platform Super Admin"
                  : role === "ADMIN"
                    ? `${companyName} Admin`
                    : `${companyName} Personel`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="rounded-md bg-white/12 px-3 py-2 text-sm font-medium text-white/95">
              {role === "SUPER_ADMIN" ? "Coklu Firma Demo Paneli" : companyName}
            </div>
            <div className="flex min-w-[260px] items-center overflow-hidden rounded-md border border-[#205d87] bg-white text-slate-700 shadow-inner">
              <div className="border-r border-slate-200 bg-[#f6f8fa] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Rezervasyon Ara
              </div>
              <input
                type="text"
                placeholder="Rezervasyon ara"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                className="border-l border-slate-200 px-3 py-2 text-[#2b78ad] transition hover:bg-slate-50"
                aria-label="Rezervasyon ara"
              >
                Ara
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={siteHref}
                className="rounded-md bg-white/12 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/18"
              >
                Site
              </Link>
              <Link
                href="/panel/giris"
                className="rounded-md bg-white/12 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/18"
              >
                Giris
              </Link>
              <form action={signOutUser}>
                <button
                  type="submit"
                  className="rounded-md bg-[#1f5f89] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#194d70]"
                >
                  Cikis
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-104px)] grid-cols-[auto_1fr]">
        <aside className="border-r border-[#cfd6dd] bg-white">
          <PanelSidebar role={role} />
        </aside>

        <div className="min-w-0">
          <div className="border-b border-[#d9dee5] bg-[#f5f6f8] px-6 py-4 shadow-[inset_0_-1px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#2b78ad]" />
                <p className="text-xl font-semibold text-[#4f5565]">
                  {role === "SUPER_ADMIN"
                    ? "Platform firmalari ve operasyon merkezine hos geldiniz"
                    : role === "ADMIN"
                      ? `${companyName} backoffice sistemine hos geldiniz`
                      : `${companyName} villa operasyon ekranina hos geldiniz`}
                </p>
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#7a8796]">
                {role === "SUPER_ADMIN" ? "Platform kontrol merkezi" : "Firma bazli demo panel"}
              </span>
            </div>
          </div>

          <main className="px-4 py-5 sm:px-7 sm:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
