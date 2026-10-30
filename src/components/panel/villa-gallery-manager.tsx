"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { galleryVersion, moveItem, type GalleryState } from "@/lib/panel-record-tools";
import { PanelDialog } from "@/components/panel/panel-dialog";
import { useUnsavedChanges } from "@/components/panel/use-unsaved-changes";
import { UnsavedChangesDialog } from "@/components/panel/unsaved-changes-dialog";

export function VillaGalleryManager({ villaId, initial }: { villaId: string; initial: GalleryState }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [gallery, setGallery] = useState(initial);
  const [dragged, setDragged] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dirty = galleryVersion(gallery) !== galleryVersion(saved);
  const guard = useUnsavedChanges(dirty, busy);
  function change(next: GalleryState) { guard.resetNavigationGuard(); setGallery(next); setMessage(""); }
  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/panel/villas/${encodeURIComponent(villaId)}/gallery`, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...gallery, version: galleryVersion(saved) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Galeri kaydedilemedi.");
      setSaved(result.gallery); setGallery(result.gallery); setMessage("Galeri kaydedildi."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bağlantı hatası."); }
    finally { setBusy(false); }
  }
  return <section id="villa-gallery-manage" className="panel-section rounded-xl border border-slate-200 bg-white p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="panel-eyebrow">Kayıtlı fotoğraflar</p><h2 className="mt-2 text-xl font-semibold">Galeri yönetimi</h2></div><span className="text-sm text-slate-500">{gallery.urls.length} fotoğraf</span></div>
    <p className="mt-3 text-sm leading-6 text-slate-500">Sürükleyerek veya yön düğmeleriyle sıralayın. Kapak seçimi ve kaldırma işlemleri yalnızca “Galeriyi kaydet” ile uygulanır. Asıl dosyalar sunucudan silinmez.</p>
    <fieldset disabled={busy} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {gallery.urls.map((url, index) => <figure key={url} className="panel-managed-photo" draggable={!busy}
        onDragStart={event => { event.dataTransfer.setData("text/plain", String(index)); event.dataTransfer.effectAllowed = "move"; setDragged(index); }} onDragEnd={() => setDragged(null)} onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); if (dragged !== null && !busy) change({ ...gallery, urls: moveItem(gallery.urls, dragged, index) }); setDragged(null); }}>
        <button type="button" className="relative block aspect-[4/3] w-full" onClick={() => setPreview(url)} aria-label={`${index + 1}. fotoğrafı büyüt`}>
          <Image src={url} alt={`${index + 1}. villa fotoğrafı`} fill unoptimized draggable={false} sizes="300px" className="object-cover" />
          <span className="absolute left-2 top-2 rounded bg-white px-2 py-1 text-xs">{index + 1}{gallery.cover === url ? " · Kapak" : ""}</span>
        </button>
        <figcaption className="flex flex-wrap items-center gap-2 p-3">
          <button type="button" className="panel-button-secondary" disabled={index === 0} onClick={() => change({ ...gallery, urls: moveItem(gallery.urls, index, index - 1) })} aria-label={`${index + 1}. fotoğrafı önceye taşı`}>←</button>
          <button type="button" className="panel-button-secondary" disabled={index === gallery.urls.length - 1} onClick={() => change({ ...gallery, urls: moveItem(gallery.urls, index, index + 1) })} aria-label={`${index + 1}. fotoğrafı sonraya taşı`}>→</button>
          <button type="button" className="text-xs underline" aria-pressed={gallery.cover === url} onClick={() => change({ ...gallery, cover: url })}>Kapak yap</button>
          <button type="button" className="text-xs text-rose-700 underline" disabled={gallery.urls.length <= 1} onClick={() => setRemoving(url)}>Kaldır</button>
        </figcaption>
      </figure>)}
    </fieldset>
    <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" className="panel-button" disabled={!dirty || busy} onClick={save}>{busy ? "Kaydediliyor…" : "Galeriyi kaydet"}</button>
      <button type="button" className="panel-button-secondary" disabled={!dirty || busy} onClick={() => change(saved)}>Değişiklikleri geri al</button><p role="status" className="text-sm">{message || (dirty ? "Kaydedilmemiş galeri değişiklikleri var." : "")}</p></div>
    <PanelDialog open={Boolean(removing)} title="Fotoğraf galeriden kaldırılsın mı?" onClose={() => setRemoving(null)}>
      <p className="text-sm leading-6 text-slate-600">Fotoğraf bu listeden çıkarılacak. İşlemi uygulamak için ardından galeriyi kaydedin; kaydetmeden önce geri alabilirsiniz.</p>
      <button type="button" className="panel-button mt-5" onClick={() => { const urls = gallery.urls.filter(url => url !== removing); change({ urls, cover: gallery.cover === removing ? urls[0] : gallery.cover }); setRemoving(null); }}>Galeriden kaldır</button>
    </PanelDialog>
    <PanelDialog open={Boolean(preview)} title="Fotoğraf önizleme" wide onClose={() => setPreview(null)}>
      {preview ? <div className="relative h-[65vh]"><Image src={preview} alt="Villa fotoğrafı önizleme" fill unoptimized sizes="90vw" className="object-contain" /></div> : null}
    </PanelDialog>
    <UnsavedChangesDialog open={Boolean(guard.pendingDestination)} saving={busy} onCancel={guard.cancelNavigation} onLeave={guard.confirmNavigation} />
  </section>;
}
