"use client";

import { useEffect, useRef, type ReactNode } from "react";
import s from "./stay-pages.module.css";

export function StayModal({ label, onClose, children, gallery = false }: {
  label: string; onClose: () => void; children: ReactNode; gallery?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={ref} aria-label={label} className={`${s.dialog} ${gallery ? s.galleryDialog : ""}`}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={s.dialogContent}>{children}</div>
  </dialog>;
}
