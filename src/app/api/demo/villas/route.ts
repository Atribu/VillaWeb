import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createDemoVillaFromFormData,
  DemoVillaStoreError,
} from "@/lib/server/demo-villa-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const villa = await createDemoVillaFromFormData(formData);

    revalidatePath("/");
    revalidatePath("/villalar");
    revalidatePath("/panel");
    revalidatePath("/panel/villalar");
    revalidatePath("/panel/villalar/yeni");

    return NextResponse.json({ villa });
  } catch (error) {
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);

    return NextResponse.json(
      { error: "Villa kaydi sirasinda beklenmeyen bir hata olustu." },
      { status: 500 },
    );
  }
}
