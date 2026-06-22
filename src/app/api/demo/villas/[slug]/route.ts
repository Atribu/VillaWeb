import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/server-session";
import {
  deleteDemoVilla,
  DemoVillaStoreError,
  updateDemoVillaStatus,
} from "@/lib/server/demo-villa-store";
import type { CatalogVilla } from "@/lib/villa-catalog";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

const allowedStatuses = new Set<CatalogVilla["status"]>([
  "ACTIVE",
  "DRAFT",
  "PAUSED",
  "ARCHIVED",
]);

function revalidateVillaMutationPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/villalar");
  revalidatePath(`/villalar/${slug}`);
  revalidatePath("/talep");
  revalidatePath("/panel");
  revalidatePath("/panel/villalar");
  revalidatePath(`/panel/villalar/${slug}/uygunluk`);
}

function isVillaStatus(value: unknown): value is CatalogVilla["status"] {
  return typeof value === "string" && allowedStatuses.has(value as CatalogVilla["status"]);
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as { status?: unknown };

    if (!isVillaStatus(payload.status)) {
      return NextResponse.json({ error: "Gecerli bir villa durumu secmelisin." }, { status: 400 });
    }

    const villa = await updateDemoVillaStatus(slug, payload.status);
    revalidateVillaMutationPaths(slug);

    return NextResponse.json({ villa });
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Villa durumu guncellenirken beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getUserSession();

  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    await deleteDemoVilla(slug);
    revalidateVillaMutationPaths(slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Villa silinirken beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}
