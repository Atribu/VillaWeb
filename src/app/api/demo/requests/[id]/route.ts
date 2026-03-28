import { NextResponse } from "next/server";
import type { RequestStatus } from "@/lib/demo-operations";
import {
  DemoOperationsStoreError,
  getDemoRequestById,
  updateDemoRequestStatus,
} from "@/lib/server/demo-operations-store";
import {
  DemoVillaStoreError,
  addDemoVillaAvailability,
  deleteDemoVillaAvailabilityByRequestId,
} from "@/lib/server/demo-villa-store";
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

    const existingRequest = await getDemoRequestById(id);

    if (!existingRequest) {
      throw new DemoOperationsStoreError("Talep bulunamadi.");
    }

    const oldStatus = existingRequest.status;
    const nextStatus = payload.status;
    const villaSlug = payload.villaSlug ?? existingRequest.villaSlug;

    if (oldStatus === nextStatus) {
      revalidateDemoExperience(villaSlug);
      return NextResponse.json({ request: existingRequest });
    }

    let reservationBlocksCreated = false;

    // Airbnb mantigi: Onaylanan rezervasyon takvimi kilitler.
    if (nextStatus === "APPROVED" && oldStatus !== "APPROVED") {
      await addDemoVillaAvailability({
        slug: existingRequest.villaSlug,
        startDate: existingRequest.checkIn,
        endDate: existingRequest.checkOut,
        label: `Rezervasyon: ${existingRequest.fullName}`,
        status: "RESERVED",
        sourceRequestId: existingRequest.id,
      });
      reservationBlocksCreated = true;
    }

    if (oldStatus === "APPROVED" && nextStatus !== "APPROVED") {
      await deleteDemoVillaAvailabilityByRequestId({
        slug: existingRequest.villaSlug,
        requestId: existingRequest.id,
      });
    }

    let updatedRequest;
    try {
      updatedRequest = await updateDemoRequestStatus(id, nextStatus);
    } catch (error) {
      if (reservationBlocksCreated) {
        // Status update başarısız olursa, takvimdeki rezervasyon bloğunu geri al.
        await deleteDemoVillaAvailabilityByRequestId({
          slug: existingRequest.villaSlug,
          requestId: existingRequest.id,
        }).catch(() => {});
      }

      throw error;
    }
    revalidateDemoExperience(villaSlug);

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
