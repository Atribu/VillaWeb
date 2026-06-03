import "server-only";

import {
  buildCrmOverview,
  buildDemoCustomers,
  type DemoReviewStatus,
} from "@/lib/demo-crm";
import {
  getDemoCoupons,
  getDemoDiscountCampaigns,
  getDemoRequests,
  DemoOperationsStoreError,
} from "@/lib/server/demo-operations-store";
import { db } from "@/lib/db";
import { assertPanelCompanyAccess, resolvePanelCompanyId } from "@/lib/server/demo-company-context";
import { getFallbackReviews } from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import {
  mapDemoReviewStatusToPrisma,
  mapReviewStatusToDemo,
} from "@/lib/server/prisma-demo-shared";

export async function getDemoCustomers() {
  const requests = await getDemoRequests();
  return buildDemoCustomers(requests);
}

export async function getDemoReviews() {
  return withDevelopmentFallback(
    async () => {
      const companyId = await resolvePanelCompanyId();
      const reviews = await db.guestReview.findMany({
        where: companyId ? { companyId } : undefined,
        include: {
          villa: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reviews.map((review) => ({
        id: review.id,
        companyId: review.companyId,
        villaSlug: review.villa.slug,
        villaTitle: review.villa.title,
        guestName: review.guestName,
        rating: review.rating,
        comment: review.comment,
        source: review.source,
        status: mapReviewStatusToDemo(review.status),
        createdAt: review.createdAt.toISOString(),
        staffNote: review.staffNote ?? undefined,
      }));
    },
    async () => getFallbackReviews(await resolvePanelCompanyId()),
  );
}

export async function updateDemoReviewStatus(reviewId: string, status: DemoReviewStatus) {
  const review = await db.guestReview.findUnique({
    where: { id: reviewId },
    select: { id: true, companyId: true },
  });

  if (!review) {
    throw new DemoOperationsStoreError("Yorum bulunamadi.");
  }

  await assertPanelCompanyAccess(review.companyId);

  const updated = await db.guestReview.update({
    where: { id: reviewId },
    data: {
      status: mapDemoReviewStatusToPrisma(status),
      updatedAt: new Date(),
      staffNote:
        status === "PUBLISHED"
          ? "Yorum yayina alindi."
          : status === "HIDDEN"
            ? "Yorum gizli moda alindi."
            : "Yorum moderasyon bekliyor.",
    },
    include: {
      villa: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  return {
    id: updated.id,
    companyId: updated.companyId,
    villaSlug: updated.villa.slug,
    villaTitle: updated.villa.title,
    guestName: updated.guestName,
    rating: updated.rating,
    comment: updated.comment,
    source: updated.source,
    status: mapReviewStatusToDemo(updated.status),
    createdAt: updated.createdAt.toISOString(),
    staffNote: updated.staffNote ?? undefined,
  };
}

export async function getDemoCrmOverview() {
  const [requests, coupons, discounts, reviews] = await Promise.all([
    getDemoRequests(),
    getDemoCoupons(),
    getDemoDiscountCampaigns(),
    getDemoReviews(),
  ]);

  return buildCrmOverview({
    requests,
    coupons,
    discounts,
    reviews,
  });
}
