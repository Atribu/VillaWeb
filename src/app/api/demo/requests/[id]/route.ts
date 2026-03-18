import { NextResponse } from "next/server";
import type { RequestStatus } from "@/lib/demo-operations";
import {
  DemoOperationsStoreError,
  updateDemoRequestStatus,
} from "@/lib/server/demo-operations-store";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: RequestStatus;
      villaSlug?: string;
    };

    if (!payload.status) {
      throw new DemoOperationsStoreError("Talep durumu zorunludur.");
    }

    const updatedRequest = await updateDemoRequestStatus(id, payload.status);
    revalidateDemoExperience(payload.villaSlug ?? updatedRequest.villaSlug);

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Talep durumu guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}
