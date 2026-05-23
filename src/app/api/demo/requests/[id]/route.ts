import { NextResponse } from "next/server";
import type { RequestStatus } from "@/lib/demo-operations";
import {
  DemoOperationsStoreError,
  DemoVillaStoreError,
  transitionDemoRequestStatus,
} from "@/lib/server/demo-request-lifecycle";
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

    const updatedRequest = await transitionDemoRequestStatus({
      requestId: id,
      status: payload.status,
      villaSlug: payload.villaSlug,
    });

    revalidateDemoExperience(updatedRequest.villaSlug);

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError || error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Talep durumu guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}
