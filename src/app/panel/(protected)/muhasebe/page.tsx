import Link from "next/link";
import {
  getInvoiceStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/demo-finance";
import {
  getDemoFinanceBalances,
  getDemoFinanceOverview,
} from "@/lib/server/demo-finance-store";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

export const dynamic = "force-dynamic";

export default async function PanelFinanceOverviewPage() {
  const [overview, balances] = await Promise.all([
    getDemoFinanceOverview(),
    getDemoFinanceBalances(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Muhasebe
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Onayli rezervasyonlardan tureyen finans akislarini tek yerden yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu alan onayli rezervasyonlari otomatik olarak fatura, odeme plani ve kasa hareketine
          donusturur. Panelde yapilan tahsilat guncellemeleri tum muhasebe ekranlarina ayni anda
          yansir.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {overview.summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
            Finans Alarmlari
          </p>
          <div className="mt-6 space-y-4">
            {overview.alerts.map((alert) => (
              <div
                key={alert.title}
                className={`rounded-[1.4rem] border px-5 py-5 ${
                  alert.tone === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : alert.tone === "success"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-[#f8fafc]"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{alert.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.4rem] bg-[#f8fafc] px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Fatura Durumu
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {Object.entries(overview.invoiceStatusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between gap-3">
                    <span>{getInvoiceStatusLabel(status as keyof typeof overview.invoiceStatusCounts)}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-[#f8fafc] px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Odeme Durumu
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {Object.entries(overview.paymentStatusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between gap-3">
                    <span>{getPaymentStatusLabel(status as keyof typeof overview.paymentStatusCounts)}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Acik Bakiyeler
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                En kritik bakiye kayitlari
              </h3>
            </div>
            <Link
              href="/panel/muhasebe/bakiyeler"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Tumunu Gor
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {balances.slice(0, 4).map((balance) => (
              <div key={balance.invoiceId} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{balance.guestName}</p>
                    <p className="mt-2 text-sm text-slate-500">{balance.villaTitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(balance.remainingAmount)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {getPaymentStatusLabel(balance.paymentStatus)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {balance.nextDueDate
                    ? `Siradaki odeme: ${formatShortDate(balance.nextDueDate)}`
                    : "Bu rezervasyon icin acik taksit kalmadi."}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Son Faturalar
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Yeni olusan finans kayitlari
              </h3>
            </div>
            <Link
              href="/panel/muhasebe/faturalar"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Fatura Ekrani
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {overview.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {invoice.guestName} · {invoice.villaTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {getInvoiceStatusLabel(invoice.status)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Son Odemeler
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Tahsilat takviminden gelen hareketler
              </h3>
            </div>
            <Link
              href="/panel/muhasebe/odeme-takip"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Odeme Ekrani
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {overview.recentPayments.map((payment) => (
              <div key={payment.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{payment.guestName}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {payment.title} · {payment.villaTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {getPaymentStatusLabel(payment.displayStatus)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
