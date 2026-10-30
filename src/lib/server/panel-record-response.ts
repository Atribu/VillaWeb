import { NextResponse } from "next/server";
import { panelAccessErrorResponse } from "@/lib/auth/api-access";
import { PanelRecordError } from "@/lib/panel-record-tools";

export function panelRecordErrorResponse(error: unknown) {
  const access = panelAccessErrorResponse(error);
  if (access) return access;
  if (error instanceof PanelRecordError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  if (typeof error === "object" && error && "code" in error && error.code === "P2034") {
    return NextResponse.json({ error: "Kayıt aynı anda değiştirildi. Yenileyip tekrar deneyin." }, { status: 409 });
  }
  console.error("Panel record operation failed", error);
  return NextResponse.json({ error: "İşlem tamamlanamadı. Lütfen yeniden deneyin." }, { status: 500 });
}
