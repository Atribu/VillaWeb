"use client";
import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { parseVillaDraft, type VillaDraft } from "@/lib/villa-draft";

function readFields(form: HTMLFormElement) {
  const fields: Record<string, string[]> = Object.create(null);
  for (const [name, value] of new FormData(form)) {
    if (typeof value === "string") (fields[name] ??= []).push(value);
  }
  return fields;
}

export function useVillaDraft(form: RefObject<HTMLFormElement | null>, storageKey: string, hasFiles: boolean, onRestore: () => void) {
  const [available, setAvailable] = useState<VillaDraft | null>(null);
  const [message, setMessage] = useState("");
  const baseline = useRef("");
  const latestFields = useRef<Record<string, string[]> | null>(null);
  const lastStored = useRef<string | null>(null);
  const enabled = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const files = useRef(hasFiles);
  files.current = hasFiles;
  const flush = useEffectEvent(() => {
    if (!enabled.current || !latestFields.current) return;
    try {
      if (localStorage.getItem(storageKey) !== lastStored.current) {
        setMessage("Taslak başka bir sekmede değişti. Üzerine yazılmadı; alanları kaybetmemek için bu sayfayı açık tutun.");
        return;
      }
      const draft: VillaDraft = { version: 1, savedAt: Date.now(), baseline: baseline.current, fields: latestFields.current, hasFiles: files.current };
      const raw = JSON.stringify(draft);
      localStorage.setItem(storageKey, raw);
      lastStored.current = raw;
      setMessage("Taslak bu tarayıcıda saklandı. Yayındaki kayıt değişmedi.");
    } catch { setMessage("Tarayıcı taslağı saklayamadı. Sayfadan ayrılmadan kaydedin."); }
  });
  useEffect(() => {
    if (!form.current) return;
    baseline.current = JSON.stringify(readFields(form.current));
    try {
      const raw = localStorage.getItem(storageKey);
      const draft = parseVillaDraft(raw);
      lastStored.current = draft ? raw : null;
      setAvailable(draft);
      if (raw && !draft) localStorage.removeItem(storageKey);
    } catch { setMessage("Tarayıcı taslak depolaması kullanılamıyor."); }
    const save = () => flush();
    const visibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      flush();
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [form, storageKey]);
  function schedule() {
    // Do not overwrite a recoverable draft before the user chooses restore or discard.
    if (available) return;
    if (!form.current) return;
    latestFields.current = readFields(form.current);
    enabled.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), 500);
  }
  function clear() {
    enabled.current = false;
    if (timer.current) clearTimeout(timer.current);
    latestFields.current = null;
    try {
      if (localStorage.getItem(storageKey) === lastStored.current) { localStorage.removeItem(storageKey); lastStored.current = null; setMessage(""); }
      else setMessage("Başka sekmede değişen taslak korunmuştur.");
    } catch { setMessage("Tarayıcı taslağı silinemedi."); }
    setAvailable(null);
  }
  function restore() {
    if (!available || !form.current) return;
    for (const field of Array.from(form.current.elements)) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) || !field.name) continue;
      if (field instanceof HTMLInputElement && ["file", "hidden", "submit", "button"].includes(field.type)) continue;
      const values = available.fields[field.name] ?? [];
      if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) field.checked = values.includes(field.value);
      else field.value = values[0] ?? "";
    }
    enabled.current = true;
    latestFields.current = readFields(form.current);
    setAvailable(null);
    setMessage("Taslak geri yüklendi. Fotoğraf ve PDF dosyalarını yeniden seçin; ardından kontrol edip kaydedin.");
    onRestore();
  }
  return { available, message, baselineChanged: Boolean(available && available.baseline !== baseline.current), schedule, clear, restore };
}
