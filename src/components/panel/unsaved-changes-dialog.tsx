"use client";

import { useEffect, useId, useRef } from "react";

export function UnsavedChangesDialog({ open, saving, onCancel, onLeave }: {
  open: boolean; saving: boolean; onCancel: () => void; onLeave: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const stayRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    stayRef.current?.focus();
    return () => { dialog.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [open]);
  return <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={onCancel} className="panel-unsaved-dialog">
    <p className="panel-eyebrow">Villa düzenleyici</p>
    <h2 id={titleId} className="mt-3 text-xl font-semibold text-slate-900">{saving ? "Kayıt işlemi devam ediyor" : "Değişiklikler henüz kaydedilmedi"}</h2>
    <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-600">{saving ? "Ayrılırsanız kayıt işleminin sonucunu göremeyebilirsiniz. İşlem tamamlanana kadar bu sayfada kalmanızı öneririz." : "Kaydetmediğiniz değişiklikler yayındaki kayda uygulanmaz. Seçilen dosyalar ve galeri değişiklikleri kaybolabilir. Düzenlemeye devam edebilir veya kaydetmeden ayrılabilirsiniz."}</p>
    <div className="mt-6 flex flex-wrap gap-3"><button ref={stayRef} type="button" className="panel-button" onClick={onCancel}>Düzenlemeye devam et</button><button type="button" className="panel-button-secondary" onClick={onLeave}>{saving ? "Yine de ayrıl" : "Kaydetmeden ayrıl"}</button></div>
  </dialog>;
}
