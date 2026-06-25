"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";

type VillaGalleryProps = {
  images: string[];
  alt: string;
  coverGradient: string;
  locale?: AppLocale;
};

export function VillaGallery({
  images,
  alt,
  coverGradient,
  locale = "tr",
}: VillaGalleryProps) {
  const cleanImages = useMemo(() => images.filter(Boolean), [images]);
  const galleryTiles = useMemo(
    () => Array.from({ length: 5 }, (_, index) => cleanImages[index] ?? cleanImages[0] ?? ""),
    [cleanImages],
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex !== null ? cleanImages[activeIndex] : null;
  const isOpen = Boolean(activeImage);

  function openGallery(index: number) {
    if (cleanImages.length === 0) {
      return;
    }

    setActiveIndex(Math.min(index, cleanImages.length - 1));
  }

  function closeGallery() {
    setActiveIndex(null);
  }

  function showPrevious() {
    setActiveIndex((current) => {
      if (current === null || cleanImages.length === 0) {
        return current;
      }

      return current === 0 ? cleanImages.length - 1 : current - 1;
    });
  }

  function showNext() {
    setActiveIndex((current) => {
      if (current === null || cleanImages.length === 0) {
        return current;
      }

      return current === cleanImages.length - 1 ? 0 : current + 1;
    });
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => {
          if (current === null || cleanImages.length === 0) {
            return current;
          }

          return current === 0 ? cleanImages.length - 1 : current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => {
          if (current === null || cleanImages.length === 0) {
            return current;
          }

          return current === cleanImages.length - 1 ? 0 : current + 1;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, cleanImages.length]);

  return (
    <>
      <div className="mt-8 grid min-h-[420px] gap-2 overflow-hidden rounded-[16px] lg:grid-cols-[1.04fr_1fr]">
        {galleryTiles[0] ? (
          <button
            type="button"
            onClick={() => openGallery(0)}
            className="group relative min-h-[320px] overflow-hidden bg-[var(--serene-surface-low)] text-left"
            aria-label={pickLocalized(locale, "Galeri ac", "Open gallery")}
          >
            <Image
              src={galleryTiles[0]}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
              priority
            />
          </button>
        ) : (
          <div className={`min-h-[320px] bg-gradient-to-br ${coverGradient}`} />
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {galleryTiles.slice(1, 5).map((imageUrl, index) => {
            const imageIndex = Math.min(index + 1, Math.max(cleanImages.length - 1, 0));

            return (
              <button
                key={`${imageUrl || "gallery-placeholder"}-${index}`}
                type="button"
                onClick={() => openGallery(imageIndex)}
                className="group relative min-h-[205px] overflow-hidden bg-[var(--serene-surface-low)] text-left"
                aria-label={pickLocalized(
                  locale,
                  `Galeri gorseli ${index + 2} ac`,
                  `Open gallery image ${index + 2}`,
                )}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={pickLocalized(
                      locale,
                      `${alt} galeri gorseli ${index + 2}`,
                      `${alt} gallery image ${index + 2}`,
                    )}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${coverGradient}`} />
                )}
                {index === 3 ? (
                  <span className="absolute bottom-4 right-4 rounded-[8px] bg-white px-4 py-2 text-sm font-semibold text-[var(--serene-on-surface)] shadow-sm">
                    {pickLocalized(locale, "Tum fotograflari goster", "Show all photos")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {isOpen && activeImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={pickLocalized(locale, "Villa fotograf galerisi", "Villa photo gallery")}
          className="fixed inset-0 z-[80] bg-[#001b3c]/86 p-4 text-white backdrop-blur-md sm:p-6"
          onClick={closeGallery}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="w-full max-w-6xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white/64">
                    {pickLocalized(locale, "Foto Galeri", "Photo Gallery")}
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">
                    {(activeIndex ?? 0) + 1} / {cleanImages.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeGallery}
                  className="rounded-[8px] bg-white px-4 py-2 text-sm font-semibold text-[var(--serene-primary)] transition hover:bg-[var(--serene-primary-soft)]"
                >
                  {pickLocalized(locale, "Kapat", "Close")}
                </button>
              </div>

              <div className="relative overflow-hidden rounded-[16px] bg-black/20 shadow-2xl shadow-black/30">
                <Image
                  src={activeImage}
                  alt={alt}
                  width={1800}
                  height={1200}
                  className="max-h-[72vh] w-full object-contain"
                  priority
                />

                {cleanImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={showPrevious}
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-2xl font-semibold text-[var(--serene-primary)] shadow-lg transition hover:bg-[var(--serene-primary-soft)]"
                      aria-label={pickLocalized(locale, "Onceki fotograf", "Previous photo")}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-2xl font-semibold text-[var(--serene-primary)] shadow-lg transition hover:bg-[var(--serene-primary-soft)]"
                      aria-label={pickLocalized(locale, "Sonraki fotograf", "Next photo")}
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </div>

              {cleanImages.length > 1 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {cleanImages.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-[8px] border transition ${
                        index === activeIndex
                          ? "border-[var(--serene-tertiary-soft)]"
                          : "border-white/20 opacity-70 hover:opacity-100"
                      }`}
                      aria-label={pickLocalized(
                        locale,
                        `${index + 1}. fotografi ac`,
                        `Open photo ${index + 1}`,
                      )}
                    >
                      <Image
                        src={imageUrl}
                        alt={pickLocalized(
                          locale,
                          `${alt} kucuk galeri gorseli ${index + 1}`,
                          `${alt} thumbnail ${index + 1}`,
                        )}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
