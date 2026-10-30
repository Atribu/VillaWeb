export type ImageUploadState = { status: "uploading" | "ready" | "error"; percent: number | null; error?: string };
export type ImageReceipt = { token: string; expiresAt: number };

// File identity survives reordering. Only failed or expired files need another transfer.
export async function prepareImageQueue<T extends object>(files: T[], receipts: Map<T, ImageReceipt>,
  upload: (file: T, progress: (percent: number | null) => void) => Promise<ImageReceipt>,
  report: (file: T, state: ImageUploadState) => void, now = Date.now()) {
  const tokens: string[] = [];
  let failed = false;
  for (const file of files) {
    let receipt = receipts.get(file);
    if (receipt && receipt.expiresAt <= now + 60000) { receipts.delete(file); receipt = undefined; }
    if (!receipt) {
      report(file, { status: "uploading", percent: 0 });
      try {
        receipt = await upload(file, percent => report(file, { status: "uploading", percent }));
        receipts.set(file, receipt);
      } catch (error) {
        failed = true; report(file, { status: "error", percent: null, error: error instanceof Error ? error.message : "Yükleme başarısız." }); continue;
      }
    }
    tokens.push(receipt.token); report(file, { status: "ready", percent: 100 });
  }
  if (failed) throw new Error("Bazı fotoğraflar yüklenemedi. Hatalı dosyaları yeniden deneyin veya kaldırın. Başarılı yüklemeler korundu.");
  return tokens;
}
