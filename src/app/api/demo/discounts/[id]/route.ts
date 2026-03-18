import { NextResponse } from "next/server";
import {
  deleteDemoDiscountCampaign,
  DemoOperationsStoreError,
  updateDemoDiscountCampaign,
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
      active?: boolean;
      villaScope?: string;
    };
    const discount = await updateDemoDiscountCampaign(id, {
      active: Boolean(payload.active),
    });

    revalidateDemoExperience(payload.villaScope === "ALL" ? undefined : payload.villaScope);

    return NextResponse.json({ discount });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Indirim kampanyasi guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      villaScope?: string;
    };

    await deleteDemoDiscountCampaign(id);
    revalidateDemoExperience(payload.villaScope === "ALL" ? undefined : payload.villaScope);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof DemoOperationsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Indirim kampanyasi silinirken hata olustu." },
      { status: 500 },
    );
  }
}
