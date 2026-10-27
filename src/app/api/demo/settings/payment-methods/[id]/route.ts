import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { NextResponse } from "next/server";
import type { DemoPaymentMethodStatus } from "@/lib/demo-settings";
import {
  DemoSettingsStoreError,
  updateDemoPaymentMethod,
} from "@/lib/server/demo-settings-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoPaymentMethodStatus>(["ACTIVE", "PASSIVE"]);

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "settings");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      label?: string;
      provider?: string;
      status?: DemoPaymentMethodStatus;
      feePercent?: number;
      settlementDays?: number;
      supportsInstallment?: boolean;
      note?: string;
    };

    if (payload.status !== undefined && !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoSettingsStoreError("Gecerli bir odeme durumu secilmelidir.");
    }

    const method = await updateDemoPaymentMethod(id, payload);
    return NextResponse.json({ method });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoSettingsStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Odeme ayari guncellenirken hata olustu." }, { status: 500 });
  }
}
