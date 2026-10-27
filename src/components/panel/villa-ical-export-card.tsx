"use client";

import { useState } from "react";

type VillaIcalExportCardProps = {
  icalPath: string;
};

export function VillaIcalExportCard({ icalPath }: VillaIcalExportCardProps) {
  const [message, setMessage] = useState("");

  function getAbsoluteUrl() {
    return typeof window === "undefined" ? icalPath : new URL(icalPath, window.location.origin).toString();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getAbsoluteUrl());
      setMessage("iCal baglantisi panoya kopyalandi.");
    } catch {
      setMessage("Baglanti kopyalanamadi. Metin alanindan manuel kopyalayabilirsin.");
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
        Takvim Entegrasyonu
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
        Villa doluluk takvimini iCal ile disari aktar
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
        Bu salt okunur baglantiyi destekleyen rezervasyon platformlarina ekleyebilirsin. Panelde
        olusturulan dolu, bakim ve kapali tarihler `.ics` olarak yayinlanir.
        Baska kanallardan ice aktarilan bloklar, karsilikli kopyalama dongusu olusmamasi icin bu baglantiya dahil edilmez.
      </p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row">
        <input
          readOnly
          defaultValue={icalPath}
          onFocus={(event) => {
            event.currentTarget.value = getAbsoluteUrl();
            event.currentTarget.select();
          }}
          className="min-w-0 flex-1 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
          aria-label="iCal aktarim baglantisi"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Baglantiyi Kopyala
        </button>
        <a
          href={icalPath}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:border-[var(--color-aqua)] hover:text-[var(--color-teal)]"
        >
          ICS Dosyasini Ac
        </a>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
      <p className="mt-4 text-xs leading-6 text-amber-700">
        Bu baglanti gizli anahtar icerir. Yalnizca baglayacagin platformla paylas.
      </p>
    </section>
  );
}
