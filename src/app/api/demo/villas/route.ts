import { authorizePanelApi, panelAccessErrorResponse } from "@/lib/auth/api-access";
import { randomUUID } from "node:crypto";
import { recordSystemEvent } from "@/lib/server/system-health";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createDemoVillaFromFormData,
  DemoVillaStoreError,
  DemoVillaUnexpectedError,
} from "@/lib/server/demo-villa-store";

export const runtime = "nodejs";
export const maxDuration = 300;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}

function createUnexpectedUploadErrorResponse(error: unknown, stage: string) {
  const errorId = randomUUID();
  const message = getErrorMessage(error);
  const cause = error instanceof DemoVillaUnexpectedError ? error.cause : undefined;
  const shouldExposeDetails =
    process.env.NODE_ENV !== "production" || process.env.VILLA_UPLOAD_DEBUG_ERRORS === "true";

  console.error("Villa upload failed", {
    errorId,
    stage,
    message,
    stack: getErrorStack(error),
    causeMessage: cause ? getErrorMessage(cause) : undefined,
    causeStack: getErrorStack(cause),
  });

  return NextResponse.json(
    {
      error: shouldExposeDetails
        ? `Villa kaydi ${stage} asamasinda hata verdi: ${message}`
        : `Villa kaydi sirasinda beklenmeyen bir hata olustu. Hata kodu: ${errorId}`,
      errorId,
      stage,
    },
    {
      status: 500,
      headers: {
        "x-villa-upload-error-id": errorId,
        "x-villa-upload-stage": stage,
      },
    },
  );
}

export async function POST(request: Request) {
  const denied = await authorizePanelApi(request, "villas");
  if (denied) return denied;
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    await recordSystemEvent("VILLA_FORM_PARSE_FAILED", error);
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    return createUnexpectedUploadErrorResponse(error, "FORM_DATA_PARSE");
  }

  let villa: Awaited<ReturnType<typeof createDemoVillaFromFormData>>;

  try {
    villa = await createDemoVillaFromFormData(formData);
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    if (error instanceof DemoVillaStoreError) {
      return NextResponse.json(
        { error: error.message, stage: "VILLA_VALIDATION" },
        { status: 400, headers: { "x-villa-upload-stage": "VILLA_VALIDATION" } },
      );
    }

    await recordSystemEvent("VILLA_CREATE_FAILED", error);
    return createUnexpectedUploadErrorResponse(
      error,
      error instanceof DemoVillaUnexpectedError ? error.stage : "VILLA_CREATE",
    );
  }

  try {
    revalidatePath("/");
    revalidatePath("/villalar");
    revalidatePath("/panel");
    revalidatePath("/panel/villalar");
    revalidatePath("/panel/villalar/yeni");
  } catch (error) {
    const accessError = panelAccessErrorResponse(error);
    if (accessError) return accessError;
    await recordSystemEvent("VILLA_REVALIDATE_FAILED", error);
    return createUnexpectedUploadErrorResponse(error, "VILLA_REVALIDATE");
  }

  return NextResponse.json({ villa });
}
