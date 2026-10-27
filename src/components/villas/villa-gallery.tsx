"use client";

import Image from "next/image";
import { useState } from "react";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import { StayModal } from "@/components/site-templates/stay-modal";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/stay-pages.module.css";

type VillaGalleryProps = { images: string[]; alt: string; coverGradient: string; locale?: AppLocale };

export function VillaGallery({ images, alt, locale = "tr" }: VillaGalleryProps) {
  const photos = Array.from(new Set(images.filter(Boolean)));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const previous = () => setActiveIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length);
  const next = () => setActiveIndex((index) => index === null ? null : (index + 1) % photos.length);

  if (!photos.length) return <div className={s.galleryEmpty}>{t("Fotoğraflar yakında eklenecek.", "Photos will be added soon.")}</div>;

  return <>
    <div className={s.gallery} data-count={photos.length}>
      <button type="button" className={s.galleryLead} onClick={() => setActiveIndex(0)} aria-label={t("Galeri aç", "Open gallery")}>
        <Image src={photos[0]} alt={alt} fill sizes="(min-width: 800px) 65vw, 100vw" className="object-cover" priority />
      </button>
      {photos.length > 1 && <div className={s.gallerySide} data-count={photos.length}>
        {photos.slice(1, 3).map((src, index) => <button key={src} type="button" onClick={() => setActiveIndex(index + 1)} aria-label={t(`${index + 2}. fotoğrafı aç`, `Open photo ${index + 2}`)}>
          <Image src={src} alt={`${alt} · ${index + 2}`} fill sizes="35vw" className="object-cover" />
        </button>)}
      </div>}
      <button type="button" className={s.galleryAll} onClick={() => setActiveIndex(0)}><SiteIcon name="grid" />{t("Tüm fotoğraflar", "All photos")} ({photos.length})</button>
    </div>
    {activeIndex !== null && <StayModal gallery label={t("Villa fotoğraf galerisi", "Villa photo gallery")} onClose={() => setActiveIndex(null)}>
      <div onKeyDown={(event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); previous(); }
        if (event.key === "ArrowRight") { event.preventDefault(); next(); }
      }}>
        <div className={s.dialogHeading}>
          <div><p className={s.eyebrow} style={{ color: "#b6c8bd" }}>{t("FOTOĞRAF GALERİSİ", "PHOTO GALLERY")}</p><h2 aria-live="polite">{activeIndex + 1} / {photos.length}</h2></div>
          <button type="button" autoFocus className={s.dialogClose} onClick={() => setActiveIndex(null)}>{t("Kapat", "Close")}</button>
        </div>
        <div className={s.galleryImage}>
          <Image src={photos[activeIndex]} alt={alt} width={1600} height={1050} priority />
          {photos.length > 1 && <>
            <button type="button" className={s.galleryArrow} onClick={previous} aria-label={t("Önceki fotoğraf", "Previous photo")}>‹</button>
            <button type="button" className={s.galleryArrow} onClick={next} aria-label={t("Sonraki fotoğraf", "Next photo")}>›</button>
          </>}
        </div>
        {photos.length > 1 && <div className={s.thumbnails}>{photos.map((src, index) => <button key={src} type="button" aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)} aria-label={t(`${index + 1}. fotoğrafı aç`, `Open photo ${index + 1}`)}>
          <Image src={src} alt="" fill sizes="85px" className="object-cover" />
        </button>)}</div>}
      </div>
    </StayModal>}
  </>;
}
