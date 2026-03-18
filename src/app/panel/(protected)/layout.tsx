import type { ReactNode } from "react";
import Link from "next/link";
import { signOutUser } from "@/lib/auth/actions";
import { getPanelNavigation } from "@/lib/auth/panel-access";
import { getUserSession } from "@/lib/auth/server-session";

export default async function ProtectedPanelLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  const navigation = getPanelNavigation(session?.role ?? "STAFF");

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="bg-ocean-panel px-6 py-8 text-white">
        <Link href="/" className="block rounded-3xl border border-white/10 bg-white/8 px-5 py-4">
          <p className="font-display text-3xl font-semibold">VillaVera</p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-teal-100">Yonetim Paneli</p>
        </Link>

        <nav className="mt-10 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-teal-50/85 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">
            Aktif Oturum
          </p>
          <p className="mt-3 text-lg font-semibold text-white">
            {session?.displayName ?? "Yetkili Kullanici"}
          </p>
          <p className="mt-1 text-sm text-teal-50/80">
            {session?.role === "ADMIN" ? "Tam yetki" : "Sadece villa modulu"}
          </p>

          <form action={signOutUser} className="mt-5">
            <button
              type="submit"
              className="w-full rounded-full border border-white/18 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cikis Yap
            </button>
          </form>
        </div>
      </aside>

      <div className="bg-[#f7f8f5]">
        <div className="border-b border-slate-200 bg-white/85 px-6 py-5 backdrop-blur sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
                {session?.role === "ADMIN" ? "Admin Paneli" : "Villa Personel Paneli"}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                {session?.role === "ADMIN"
                  ? "Tum panel yetkileri aktif"
                  : "Sadece villa ekleme ve villa yonetimi alanlari aktif"}
              </h1>
            </div>
            <Link
              href="/panel/giris"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[var(--color-aqua)] hover:text-[var(--color-teal)]"
            >
              Giris Ekrani
            </Link>
          </div>
        </div>

        <main className="px-6 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
