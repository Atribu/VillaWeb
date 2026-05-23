"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCashDirectionLabel,
  getCashDirectionTone,
  type DemoCashDirection,
  type DemoCashEntry,
} from "@/lib/demo-finance";
import { DEMO_REFERENCE_DATE } from "@/lib/demo-operations";
import { formatCurrency, formatShortDate } from "@/lib/villa-catalog";

type FinanceCashbookManagerProps = {
  entries: DemoCashEntry[];
};

export function FinanceCashbookManager({ entries }: FinanceCashbookManagerProps) {
  const router = useRouter();
  const [direction, setDirection] = useState<DemoCashDirection>("EXPENSE");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(DEMO_REFERENCE_DATE);
  const [note, setNote] = useState("");
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function submitCashEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/finance/cashbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction,
          category,
          title,
          amount: Number(amount),
          date,
          note,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kasa kaydi olusturulamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kasa hareketi basariyla eklendi.");
      setCategory("");
      setTitle("");
      setAmount("");
      setNote("");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kasa kaydi sirasinda baglanti hatasi olustu.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEntry(entryId: string) {
    setBusyEntryId(entryId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/finance/cashbook/${entryId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Kasa kaydi silinemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kasa kaydi silindi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kasa silme sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyEntryId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submitCashEntry}
        className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <select
            value={direction}
            onChange={(event) => setDirection(event.target.value as DemoCashDirection)}
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          >
            <option value="EXPENSE">Gider</option>
            <option value="INCOME">Gelir</option>
          </select>
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Kategori"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Baslik"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Tutar"
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
          />
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Opsiyonel not"
          rows={3}
          className="mt-4 w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Manuel eklenen hareketler otomatik tahsilat akisini bozmaz; sadece kasa gorunumune eklenir.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Kaydediliyor..." : "Kasa Hareketi Ekle"}
          </button>
        </div>
      </form>

      {message ? (
        <div
          className={`rounded-[1.2rem] border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-4">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCashDirectionTone(
                      entry.direction,
                    )}`}
                  >
                    {getCashDirectionLabel(entry.direction)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {entry.category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {entry.source === "MANUAL" ? "Manuel" : "Otomatik"}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{entry.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatShortDate(entry.date)}
                    {entry.villaTitle ? ` · ${entry.villaTitle}` : ""}
                    {entry.guestName ? ` · ${entry.guestName}` : ""}
                  </p>
                </div>

                {entry.note ? (
                  <div className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4 text-sm text-slate-600">
                    {entry.note}
                  </div>
                ) : null}
              </div>

              <div className="w-full max-w-[260px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Tutar
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {formatCurrency(entry.amount)}
                </p>
                {entry.source === "MANUAL" ? (
                  <button
                    type="button"
                    disabled={busyEntryId === entry.id}
                    onClick={() => deleteEntry(entry.id)}
                    className="mt-4 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyEntryId === entry.id ? "Siliniyor..." : "Kaydi Sil"}
                  </button>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Bu hareket tahsilat ekranindan otomatik olusturuldu.
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}

        {entries.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Henuz kasa hareketi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
