"use client";

import { useEffect, useRef } from "react";

export function VillaFilePreview({ file, index, disabled, onRemove, onMove, first, last }: {
  file: File; index: number; disabled: boolean; onRemove: () => void;
  onMove?: (direction: number) => void; first?: boolean; last?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <figure className="panel-photo-preview">
    {/* Local blob previews do not use the Next image optimizer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img ref={ref} alt={`${index + 1}. secilen fotograf: ${file.name}`} />
    <figcaption>
      <p className="truncate text-xs font-medium text-slate-700" title={file.name}>{file.name}</p>
      {onMove ? <div className="mt-2 flex gap-3 text-xs"><button type="button" disabled={disabled || first} onClick={() => onMove(-1)} aria-label={`${file.name} önceye taşı`}>← Önceye</button><button type="button" disabled={disabled || last} onClick={() => onMove(1)} aria-label={`${file.name} sonraya taşı`}>Sonraya →</button></div> : null}
      <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span><button type="button" disabled={disabled} aria-label={`${file.name} secimden kaldir`} onClick={onRemove}>Kaldır</button></div>
    </figcaption>
  </figure>;
}
