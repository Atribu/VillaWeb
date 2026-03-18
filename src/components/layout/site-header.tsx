import Link from "next/link";
import { navigation } from "@/lib/site-data";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/6 bg-[rgba(255,255,255,0.92)] backdrop-blur-xl">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-coral)] text-sm font-bold text-white shadow-sm">
              VV
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-slate-900">VillaVera</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Villa Collection
              </p>
            </div>
          </Link>

          <button
            type="button"
            className="hidden items-center gap-4 rounded-full border border-black/8 bg-white px-5 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)] lg:inline-flex"
          >
            <span className="text-sm font-semibold text-slate-700">Nereye gitmek istersin?</span>
            <span className="h-4 w-px bg-slate-200" />
            <span className="text-sm text-slate-500">Tarih sec</span>
            <span className="h-4 w-px bg-slate-200" />
            <span className="text-sm text-slate-500">Kac kisi?</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-coral)] text-xs font-bold text-white">
              +
            </span>
          </button>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="tel:+908500000000"
              className="rounded-full border border-black/8 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              +90 850 000 00 00
            </a>
            <Link
              href="/panel/giris"
              className="rounded-full border border-black/8 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Panel
            </Link>
            <Link
              href="/talep"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Talep Olustur
            </Link>
          </div>
        </div>

        <div className="mt-4 hidden items-center justify-between gap-6 border-t border-black/6 pt-4 lg:flex">
          <nav className="flex items-center gap-7">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="rounded-full bg-[var(--color-coral-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            Reklamsiz buyume icin SEO odakli kurgu
          </div>
        </div>
      </Container>
    </header>
  );
}
