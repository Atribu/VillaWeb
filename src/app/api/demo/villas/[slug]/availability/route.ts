import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/server-session";
import {
  addDemoVillaAvailability,
  deleteDemoVillaAvailability,
  DemoVillaStoreError,
} from "@/lib/server/demo-villa-store";
import type { AvailabilityRange } from "@/lib/villa-catalog";

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
  revalidatePath(`/panel/villalar/${slug}/uygunluk`);
}

function isAvailabilityStatus(value: string): value is AvailabilityRange["status"] {
  return value === "RESERVED" || value === "MAINTENANCE" || value === "UNAVAILABLE";
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as {
      startDate?: string;
      endDate?: string;
      label?: string;
      status?: string;
    };
    const status = payload.status;

    if (!status || !isAvailabilityStatus(status)) {
      return NextResponse.json({ error: "Gecerli bir uygunluk durumu secmelisin." }, { status: 400 });
    }

    const villa = await addDemoVillaAvailability({
      slug,
      startDate: payload.startDate ?? "",
      endDate: payload.endDate ?? "",
      label: payload.label ?? "",
      status,
    });

    revalidateVillaPaths(slug);

    return NextResponse.json({ villa });
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Uygunluk takvimi kaydi sirasinda beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as {
      rangeId?: string;
    };

    if (!payload.rangeId) {
      return NextResponse.json({ error: "Silinecek kayit secilmedi." }, { status: 400 });
    }

    const villa = await deleteDemoVillaAvailability({
      slug,
      rangeId: payload.rangeId,
    });

    revalidateVillaPaths(slug);

    return NextResponse.json({ villa });
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Uygunluk takvimi silinirken beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}
