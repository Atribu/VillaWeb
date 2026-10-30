"use client";
import { useRef, useState } from "react";
import { prepareImageQueue, type ImageReceipt, type ImageUploadState } from "@/lib/image-upload-queue";
import { uploadVillaForm } from "@/lib/villa-form-upload";
export function useImageUploadQueue(companyId: string) {
  const receipts = useRef(new Map<File, ImageReceipt>());
  const [states, setStates] = useState(new Map<File, ImageUploadState>());
  async function prepare(files: File[]) {
    return prepareImageQueue(files, receipts.current, async (file, progress) => {
      const body = new FormData(); body.set("companyId", companyId); body.set("image", file);
      const response = await uploadVillaForm("/api/panel/uploads/images", "POST", body, progress);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `Fotoğraf yüklenemedi (${response.status}).`);
      if (typeof result.token !== "string" || !Number.isFinite(result.expiresAt)) throw new Error("Yükleme doğrulanamadı.");
      return result as ImageReceipt;
    }, (file, state) => setStates(current => new Map(current).set(file, state)));
  }
  function forget(file: File) { receipts.current.delete(file); setStates(current => { const next = new Map(current); next.delete(file); return next; }); }
  function clear() { receipts.current.clear(); setStates(new Map()); }
  return { states, prepare, forget, clear };
}
