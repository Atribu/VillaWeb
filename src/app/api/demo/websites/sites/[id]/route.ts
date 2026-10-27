import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/auth/server-session";
import { parseWebsiteUpdate } from "@/lib/site-templates";
import {
  DemoWebsitesStoreError,
  updateDemoWebsite,
  WebsiteAccessError,
  WebsiteNotFoundError,
} from "@/lib/server/demo-websites-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getUserSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.role)) return NextResponse.json({ error: "Site yönetimi yetkiniz bulunmuyor." }, { status: 403 });
  try {
    const { id } = await context.params;
    let payload;
    try {
      payload = parseWebsiteUpdate(await request.json());
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Geçersiz site ayarı." }, { status: 400 });
    }
    const website = await updateDemoWebsite(id, payload);
    revalidatePath("/", "layout");
    revalidatePath("/panel/web-siteleri/site-yonetimi");
    return NextResponse.json({ website });
  } catch (error) {
    if (error instanceof WebsiteAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    if (error instanceof WebsiteNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof DemoWebsitesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: "Site kaydi guncellenirken hata olustu." }, { status: 500 });
  }
}
