"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUS_OPTIONS, type RequestStatus } from "@/lib/demo-operations";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";

type ManualReservationFormProps = {
  villas: CatalogVilla[];
};

type FormState = {
  villaSlug: string;
  checkIn: string;
  checkOut: string;
  guestCount: string;
  fullName: string;
  phone: string;
  email: string;
  message: string;
  couponCode: string;
  initialStatus: RequestStatus;
};

function getNightCount(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const startDate = new Date(`${checkIn}T00:00:00`);
  const endDate = new Date(`${checkOut}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function ManualReservationForm({ villas }: ManualReservationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    villaSlug: villas[0]?.slug ?? "",
    checkIn: "",
    checkOut: "",
    guestCount: "2",
    fullName: "",
    phone: "",
    email: "",
    message: "",
    couponCode: "",
    initialStatus: "APPROVED",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const selectedVilla = useMemo(
    () => villas.find((villa) => villa.slug === form.villaSlug) ?? null,
    [form.villaSlug, villas],
  );

  const nightCount = useMemo(
    () => getNightCount(form.checkIn, form.checkOut),
    [form.checkIn, form.checkOut],
  );
  const nightlyPrice = selectedVilla?.discountedNightlyPrice ?? selectedVilla?.nightlyPrice ?? 0;
  const estimatedTotal =
    nightCount > 0
      ? nightCount * nightlyPrice + (selectedVilla?.cleaningFee ?? 0)
      : selectedVilla?.cleaningFee ?? 0;

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          villaSlug: form.villaSlug,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guestCount: Number(form.guestCount),
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          message: form.message,
          couponCode: form.couponCode,
          initialStatus: form.initialStatus,
          origin: "MANUAL_PANEL",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Rezervasyon kaydi olusturulamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Rezervasyon kaydi basariyla olusturuldu. Liste ekranina yonlendiriliyorsun.");
      router.push("/panel/rezervasyonlar/ev-rezervasyonlari");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Rezervasyon olusturulurken baglanti hatasi olustu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.8rem] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/60"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Villa secimi</span>
            <select
              value={form.villaSlug}
              onChange={(event) => updateField("villaSlug", event.target.value)}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            >
              {villas.map((villa) => (
                <option key={villa.slug} value={villa.slug}>
                  {villa.title} · {villa.city} / {villa.district}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Ilk durum</span>
            <select
              value={form.initialStatus}
              onChange={(event) =>
                updateField("initialStatus", event.target.value as RequestStatus)
              }
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            >
              {REQUEST_STATUS_OPTIONS.filter((option) => option.value !== "CANCELLED").map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Giris tarihi</span>
            <input
              type="date"
              value={form.checkIn}
              onChange={(event) => updateField("checkIn", event.target.value)}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Cikis tarihi</span>
            <input
              type="date"
              value={form.checkOut}
              onChange={(event) => updateField("checkOut", event.target.value)}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Misafir sayisi</span>
            <input
              type="number"
              min={1}
              max={selectedVilla?.capacity ?? 20}
              value={form.guestCount}
              onChange={(event) => updateField("guestCount", event.target.value)}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Kupon kodu</span>
            <input
              type="text"
              value={form.couponCode}
              onChange={(event) => updateField("couponCode", event.target.value.toUpperCase())}
              placeholder="Opsiyonel"
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm uppercase text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Ad soyad</span>
            <input
              type="text"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Telefon</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">E-posta</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Operasyon notu</span>
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              rows={5}
              className="w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
            />
          </label>
        </div>

        {message ? (
          <div
            className={`mt-5 rounded-[1rem] border px-4 py-3 text-sm ${
              messageTone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#2b78ad] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#215d86] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Kaydediliyor..." : "Rezervasyon Kaydini Olustur"}
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2b78ad]">
            Secili Villa
          </p>
          {selectedVilla ? (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{selectedVilla.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedVilla.city} / {selectedVilla.district}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  ["Kapasite", `${selectedVilla.capacity} misafir`],
                  ["Minimum gece", `${selectedVilla.minNightCount ?? 1} gece`],
                  ["Gecelik fiyat", formatCurrency(selectedVilla.nightlyPrice)],
                  [
                    "Indirimli fiyat",
                    selectedVilla.discountedNightlyPrice
                      ? formatCurrency(selectedVilla.discountedNightlyPrice)
                      : "Aktif kampanya yok",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f16824]">
            Tahmini Ozet
          </p>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-4">
              <span>Gece sayisi</span>
              <span className="font-semibold text-slate-900">{nightCount || "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Gecelik fiyat</span>
              <span className="font-semibold text-slate-900">
                {nightlyPrice > 0 ? formatCurrency(nightlyPrice) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Temizlik</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(selectedVilla?.cleaningFee ?? 0)}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-[1.2rem] bg-slate-900 px-4 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Tahmini toplam
            </p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(estimatedTotal)}</p>
          </div>

          <p className="mt-4 text-xs leading-6 text-slate-500">
            Bu toplam, secili tarih ve kupon kurallari API tarafinda yeniden hesaplanir. Kayit
            sirasinda uygunluk ve kapasite kontrolleri tekrar calisir.
          </p>
        </div>
      </aside>
    </div>
  );
}
