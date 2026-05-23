import { ReviewsManager } from "@/components/panel/reviews-manager";
import { getDemoReviews } from "@/lib/server/demo-crm-store";

export const dynamic = "force-dynamic";

export default async function PanelReviewsPage() {
  const reviews = await getDemoReviews();

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Yorum Sistemi
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Villa yorumlarini yayina alma, bekletme veya gizleme akisini yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Buradaki moderasyon degisiklikleri vitrin icerigi ve ekip operasyon notlariyla birlikte
          ayni CRM akisi icinde tutulur.
        </p>
      </div>

      <ReviewsManager reviews={reviews} />
    </div>
  );
}
