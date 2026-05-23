"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getReviewSourceLabel,
  getReviewStatusLabel,
  getReviewStatusTone,
  type DemoReviewRecord,
  type DemoReviewStatus,
} from "@/lib/demo-crm";
import { formatShortDate } from "@/lib/villa-catalog";

type ReviewsManagerProps = {
  reviews: DemoReviewRecord[];
};

const REVIEW_STATUSES: DemoReviewStatus[] = ["PENDING", "PUBLISHED", "HIDDEN"];

export function ReviewsManager({ reviews }: ReviewsManagerProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<DemoReviewStatus | "ALL">("ALL");
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const filteredReviews = useMemo(() => {
    if (selectedStatus === "ALL") {
      return reviews;
    }

    return reviews.filter((review) => review.status === selectedStatus);
  }, [reviews, selectedStatus]);

  async function updateStatus(review: DemoReviewRecord, status: DemoReviewStatus) {
    setBusyReviewId(review.id);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/crm/reviews/${review.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          villaSlug: review.villaSlug,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(payload.error ?? "Yorum durumu guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Yorum durumu basariyla guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Yorum guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyReviewId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatus("ALL")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            selectedStatus === "ALL"
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-700"
          }`}
        >
          Tumu ({reviews.length})
        </button>
        {REVIEW_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedStatus === status
                ? "bg-[#2b78ad] text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {getReviewStatusLabel(status)} ({reviews.filter((review) => review.status === status).length})
          </button>
        ))}
      </div>

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
        {filteredReviews.map((review) => (
          <article
            key={review.id}
            className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getReviewStatusTone(
                      review.status,
                    )}`}
                  >
                    {getReviewStatusLabel(review.status)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {getReviewSourceLabel(review.source)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {review.rating}/5
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{review.villaTitle}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {review.guestName} · {formatShortDate(review.createdAt.slice(0, 10))}
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-slate-100 bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-slate-600">
                  {review.comment}
                </div>

                {review.staffNote ? (
                  <div className="rounded-[1.2rem] bg-white px-4 py-4 text-sm text-slate-600">
                    Personel notu:{" "}
                    <span className="font-medium text-slate-900">{review.staffNote}</span>
                  </div>
                ) : null}
              </div>

              <div className="w-full max-w-[280px] rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Moderasyon
                </p>
                <select
                  value={review.status}
                  disabled={busyReviewId === review.id}
                  onChange={(event) =>
                    updateStatus(review, event.target.value as DemoReviewStatus)
                  }
                  className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                >
                  {REVIEW_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getReviewStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        ))}

        {filteredReviews.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-8 text-sm leading-7 text-slate-500">
            Secili filtreye uygun yorum kaydi bulunmuyor.
          </div>
        ) : null}
      </div>
    </div>
  );
}
