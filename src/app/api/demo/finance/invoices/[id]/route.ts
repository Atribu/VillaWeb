import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/server-session";
import { canAccessPanelPath } from "@/lib/auth/panel-access";
import { revalidateDemoExperience } from "@/lib/server/demo-revalidate";
import type { DemoInvoiceStatus } from "@/lib/demo-finance";
import {
  DemoFinanceStoreError,
  updateDemoInvoiceStatus,
} from "@/lib/server/demo-finance-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ALLOWED_STATUSES = new Set<DemoInvoiceStatus>(["DRAFT", "SENT", "PAID", "CANCELLED"]);

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  if (!canAccessPanelPath(session.role, "/panel/muhasebe/faturalar")) return NextResponse.json({ error: "Bu islem icin yetkiniz bulunmuyor." }, { status: 403 });
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status?: DemoInvoiceStatus;
    };

    if (!payload.status || !ALLOWED_STATUSES.has(payload.status)) {
      throw new DemoFinanceStoreError("Gecerli bir fatura durumu secilmelidir.");
    }

    const invoice = await updateDemoInvoiceStatus(id, payload.status);
    revalidateDemoExperience(invoice.villaSlug);

    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof DemoFinanceStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Fatura durumu guncellenirken hata olustu." },
      { status: 500 },
    );
  }
}
