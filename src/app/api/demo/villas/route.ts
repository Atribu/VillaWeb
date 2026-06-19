import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createDemoVillaFromFormData,
  DemoVillaStoreError,
} from "@/lib/server/demo-villa-store";

export const runtime = "nodejs";
export const maxDuration = 300;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function createUnexpectedUploadErrorResponse(error: unknown, stage: string) {
  const errorId = randomUUID();
  const message = getErrorMessage(error);
  const shouldExposeDetails =
    process.env.NODE_ENV !== "production" || process.env.VILLA_UPLOAD_DEBUG_ERRORS === "true";

  console.error("Villa upload failed", {
    errorId,
    stage,
    message,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    {
      error: shouldExposeDetails
        ? `Villa kaydi ${stage} asamasinda hata verdi: ${message}`
        : `Villa kaydi sirasinda beklenmeyen bir hata olustu. Hata kodu: ${errorId}`,
      errorId,
      stage,
    },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    return createUnexpectedUploadErrorResponse(error, "FORM_DATA_PARSE");
  }

  try {
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

    return createUnexpectedUploadErrorResponse(error, "VILLA_CREATE");
  }
}
