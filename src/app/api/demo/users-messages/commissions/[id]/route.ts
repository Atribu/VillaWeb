import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { NextResponse } from "next/server";
import {
  DemoUsersMessagesStoreError,
  updateDemoCommissionRate,
} from "@/lib/server/demo-users-messages-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "users");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      active?: boolean;
      percent?: number;
    };

    if (payload.active === undefined && payload.percent === undefined) {
      throw new DemoUsersMessagesStoreError("Guncellenecek komisyon bilgisi secilmelidir.");
    }

    const commission = await updateDemoCommissionRate(id, payload);

    return NextResponse.json({ commission });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoUsersMessagesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Komisyon guncellenirken hata olustu." }, { status: 500 });
  }
}
