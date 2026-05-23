import { NextResponse } from "next/server";
import type { DemoReviewStatus } from "@/lib/demo-crm";
import { DemoOperationsStoreError } from "@/lib/server/demo-operations-store";
import { updateDemoReviewStatus } from "@/lib/server/demo-crm-store";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoReviewStatus>(["PUBLISHED", "PENDING", "HIDDEN"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoReviewStatus;
      villaSlug?: string;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoOperationsStoreError("Gecerli bir yorum durumu secilmelidir.");
    }

    const review = await updateDemoReviewStatus(id, payload.status);
    revalidateDemoExperience(payload.villaSlug ?? review.villaSlug);

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Yorum durumu guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}
