"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function PanelDialog({ open, title, onClose, children, busy = false, wide = false }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; busy?: boolean; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [open]);
  return <dialog ref={ref} aria-labelledby={id} className={`panel-unsaved-dialog ${wide ? "panel-dialog-wide" : ""}`}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="mb-5 flex items-center justify-between gap-4"><h2 id={id} className="text-lg font-semibold">{title}</h2>
      <button type="button" className="panel-button-secondary" onClick={onClose} disabled={busy} autoFocus aria-label="Pencereyi kapat">Kapat</button></div>
    {children}
  </dialog>;
}
