import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/server-session";
import { canAccessPanelPath } from "@/lib/auth/panel-access";
import {
  addDemoVillaPricingPeriod,
  deleteDemoVillaPricingPeriod,
  DemoVillaStoreError,
} from "@/lib/server/demo-villa-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function revalidateVillaPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/villalar");
  revalidatePath(`/villalar/${slug}`);
  revalidatePath("/panel");
  revalidatePath("/panel/villalar");
  revalidatePath(`/panel/villalar/${slug}/duzenle`);
  revalidatePath("/panel/fiyatlar");
}

export async function POST(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "villas");
  if (denied) return denied;
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }
  if (!canAccessPanelPath(session.role, "/panel/villalar")) return NextResponse.json({ error: "Bu islem icin yetkiniz bulunmuyor." }, { status: 403 });

  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as {
      id?: string;
      active?: boolean;
      title?: string;
      startDate?: string;
      endDate?: string;
      nightlyPrice?: number;
      cleaningFee?: number | null;
      minNightCount?: number | null;
    };
    const villa = await addDemoVillaPricingPeriod({
      slug,
      id: payload.id ? String(payload.id) : undefined,
      active: payload.active !== false,
      title: String(payload.title ?? ""),
      startDate: String(payload.startDate ?? ""),
      endDate: String(payload.endDate ?? ""),
      nightlyPrice: Number(payload.nightlyPrice ?? 0),
      cleaningFee:
        payload.cleaningFee === null || payload.cleaningFee === undefined
          ? undefined
          : Number(payload.cleaningFee),
      minNightCount:
        payload.minNightCount === null || payload.minNightCount === undefined
          ? undefined
          : Number(payload.minNightCount),
    });

    revalidateVillaPaths(slug);
    return NextResponse.json({ villa });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Villa pricing period create failed", error);
    return NextResponse.json(
      { error: "Fiyat donemi kaydi sirasinda beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await authorizePanelApi(request, "villas");
  if (denied) return denied;
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }
  if (!canAccessPanelPath(session.role, "/panel/villalar")) return NextResponse.json({ error: "Bu islem icin yetkiniz bulunmuyor." }, { status: 403 });

  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as { pricingPeriodId?: string };

    if (!payload.pricingPeriodId) {
      return NextResponse.json({ error: "Silinecek fiyat donemi secilmedi." }, { status: 400 });
    }

    const villa = await deleteDemoVillaPricingPeriod({
      slug,
      pricingPeriodId: payload.pricingPeriodId,
    });

    revalidateVillaPaths(slug);
    return NextResponse.json({ villa });
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Villa pricing period delete failed", error);
    return NextResponse.json(
      { error: "Fiyat donemi silinirken beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}
