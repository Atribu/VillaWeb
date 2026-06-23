"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { VILLA_IMAGE_RULES, type CatalogVilla } from "@/lib/villa-catalog";

const baseFields = [
  { name: "title", label: "Villa basligi", placeholder: "Villa Soleia Lagoon", required: true },
  {
    name: "slug",
    label: "SEO uyumlu slug",
    placeholder: "kalkan-deniz-manzarali-luks-villa-soleia-lagoon",
    required: true,
  },
  { name: "city", label: "Sehir", placeholder: "Antalya", required: true },
  { name: "district", label: "Ilce", placeholder: "Kalkan", required: true },
  { name: "badge", label: "Vitrin etiketi", placeholder: "Deniz manzarali", required: true },
  { name: "category", label: "Kategori", placeholder: "Luks Manzarali", required: true },
  { name: "capacity", label: "Kapasite", placeholder: "8", required: true },
  { name: "bedroomCount", label: "Oda sayisi", placeholder: "4", required: true },
  { name: "bathroomCount", label: "Banyo sayisi", placeholder: "4", required: true },
  { name: "poolType", label: "Havuz tipi", placeholder: "Sonsuzluk havuzu", required: true },
  { name: "nightlyPrice", label: "Gecelik fiyat", placeholder: "15900", required: true },
  {
    name: "discountedNightlyPrice",
    label: "Indirimli fiyat",
    placeholder: "14900",
    required: false,
  },
];

const seoFields = [
  {
    name: "seoTitle",
    label: "SEO basligi",
    placeholder: "Kalkan deniz manzarali luks villa | VillaVera",
    helper: "Tercihen 60 karakter civari ve ana anahtar kelimeyi icermeli.",
  },
  {
    name: "seoDescription",
    label: "Meta aciklama",
    placeholder: "Kalkan'da deniz manzarali, ozel havuzlu premium villa secenegi.",
    helper: "Tercihen 140-160 karakter arasi, tiklanma artiran bir metin yaz.",
  },
  {
    name: "focusKeyword",
    label: "Odak anahtar kelime",
    placeholder: "kalkan deniz manzarali villa",
    helper: "Vitrin icerigi, sayfa basligi ve meta aciklama ile uyumlu olsun.",
  },
  {
    name: "coverAlt",
    label: "Kapak gorseli alt metni",
    placeholder: "Kalkan deniz manzarali villa havuz ve teras gorunumu",
    helper: "Kapak gorselinde ne goruldugunu acik ve dogal sekilde tarif et.",
  },
];

const englishContentFields = [
  { name: "titleEn", label: "Villa basligi (EN)", placeholder: "Villa Soleia Lagoon" },
  { name: "badgeEn", label: "Vitrin etiketi (EN)", placeholder: "Sea view" },
  { name: "categoryEn", label: "Kategori (EN)", placeholder: "Luxury with a view" },
  { name: "poolTypeEn", label: "Havuz tipi (EN)", placeholder: "Infinity pool" },
];

const englishSeoFields = [
  {
    name: "seoTitleEn",
    label: "SEO basligi (EN)",
    placeholder: "Luxury sea-view villa in Kalkan | VillaVera",
    helper: "Ingilizce arama sonuclari icin baslik karsiligi.",
  },
  {
    name: "seoDescriptionEn",
    label: "Meta aciklama (EN)",
    placeholder: "A premium sea-view villa in Kalkan with a private pool and refined stay experience.",
    helper: "Ingilizce meta aciklama; 140-160 karakter arasi idealdir.",
  },
  {
    name: "focusKeywordEn",
    label: "Odak anahtar kelime (EN)",
    placeholder: "sea-view villa in Kalkan",
    helper: "Ingilizce SEO kurgusuyla uyumlu ana kelime gir.",
  },
  {
    name: "coverAltEn",
    label: "Kapak gorseli alt metni (EN)",
    placeholder: "Sea-view villa pool and terrace in Kalkan",
    helper: "Kapak gorselini Ingilizce ve dogal bir dille tarif et.",
  },
];

type VillaApiPayload = {
  error?: string;
  errorId?: string;
  stage?: string;
  villa?: { title: string };
};

type VillaFormProps = {
  mode?: "create" | "edit";
  initialVilla?: CatalogVilla;
};

async function readVillaApiPayload(response: Response): Promise<VillaApiPayload & { raw?: string }> {
  const body = await response.text();

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body) as VillaApiPayload;
  } catch {
    return { raw: body.slice(0, 240) };
  }
}

function buildVillaApiErrorMessage(
  response: Response,
  payload: VillaApiPayload & { raw?: string },
) {
  const errorDetails = [
    payload.stage ? `asama: ${payload.stage}` : null,
    payload.errorId ? `hata kodu: ${payload.errorId}` : null,
  ].filter(Boolean);
  const suffix = errorDetails.length > 0 ? ` (${errorDetails.join(" / ")})` : "";

  return (
    payload.error ??
    payload.raw ??
    `Villa kaydi sirasinda HTTP ${response.status} hatasi olustu.`
  ) + suffix;
}

function getInitialFieldValue(villa: CatalogVilla | undefined, fieldName: string) {
  if (!villa) {
    return "";
  }

  const values: Record<string, string | number | undefined> = {
    title: villa.title,
    slug: villa.slug,
    city: villa.city,
    district: villa.district,
    badge: villa.badge,
    category: villa.category,
    capacity: villa.capacity,
    bedroomCount: villa.bedroomCount,
    bathroomCount: villa.bathroomCount,
    poolType: villa.poolType,
    nightlyPrice: villa.nightlyPrice,
    discountedNightlyPrice: villa.discountedNightlyPrice,
    titleEn: villa.titleEn,
    badgeEn: villa.badgeEn,
    categoryEn: villa.categoryEn,
    poolTypeEn: villa.poolTypeEn,
    shortDescription: villa.shortDescription,
    shortDescriptionEn: villa.shortDescriptionEn,
    description: villa.description,
    descriptionEn: villa.descriptionEn,
    seoTitle: villa.seoTitle,
    seoTitleEn: villa.seoTitleEn,
    seoDescription: villa.seoDescription,
    seoDescriptionEn: villa.seoDescriptionEn,
    focusKeyword: villa.focusKeyword,
    focusKeywordEn: villa.focusKeywordEn,
    coverAlt: villa.coverAlt,
    coverAltEn: villa.coverAltEn,
  };

  return values[fieldName] ?? "";
}

export function VillaForm({ mode = "create", initialVilla }: VillaFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seoPreview, setSeoPreview] = useState({
    title: initialVilla?.title ?? "",
    slug: initialVilla?.slug ?? "",
    seoTitle: initialVilla?.seoTitle ?? "",
    seoDescription: initialVilla?.seoDescription ?? "",
    focusKeyword: initialVilla?.focusKeyword ?? "",
  });

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files ?? []);
    const nextFiles = [...selectedFiles];
    const nextErrors: string[] = [];

    for (const file of incomingFiles) {
      const lowerCaseName = file.name.toLowerCase();
      const isAcceptedImage =
        file.type.startsWith("image/") ||
        VILLA_IMAGE_RULES.acceptedMimeTypes.some((mimeType) => mimeType === file.type) ||
        VILLA_IMAGE_RULES.acceptedExtensions.some((extension) => lowerCaseName.endsWith(extension));

      if (!isAcceptedImage) {
        nextErrors.push(
          `${file.name}: desteklenen bir resim formati olmali (${VILLA_IMAGE_RULES.acceptedInputLabel}).`,
        );
        continue;
      }

      const alreadyExists = nextFiles.some(
        (currentFile) =>
          currentFile.name === file.name &&
          currentFile.size === file.size &&
          currentFile.lastModified === file.lastModified,
      );

      if (alreadyExists) {
        nextErrors.push(`${file.name}: bu gorsel zaten secildi.`);
        continue;
      }

      nextFiles.push(file);
    }

    setSelectedFiles(nextFiles);
    setUploadErrors(nextErrors);
    setSubmitMessage("");
    event.target.value = "";
  }

  function removeImage(fileToRemove: File) {
    setSelectedFiles((current) =>
      current.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          ),
      ),
    );
    setSubmitMessage("");
  }

  function handleSeoFieldChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;

    if (
      name === "title" ||
      name === "slug" ||
      name === "seoTitle" ||
      name === "seoDescription" ||
      name === "focusKeyword"
    ) {
      setSeoPreview((current) => ({
        ...current,
        [name]: value,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isEditMode && selectedFiles.length === 0) {
      setSubmitMessage("En az 1 adet gorsel eklemeden villa kaydi tamamlanamaz.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const formElement = event.currentTarget;
      const formData = new FormData(formElement);
      formData.delete("images");
      selectedFiles.forEach((file) => formData.append("images", file));

      const endpoint =
        isEditMode && initialVilla
          ? `/api/demo/villas/${encodeURIComponent(initialVilla.slug)}`
          : "/api/demo/villas";
      const response = await fetch(endpoint, {
        method: isEditMode ? "PUT" : "POST",
        body: formData,
      });

      const payload = await readVillaApiPayload(response);

      if (!response.ok) {
        const debugPayload = {
          status: response.status,
          statusText: response.statusText,
          payload,
        };
        console.error("Villa upload API error", {
          status: response.status,
          statusText: response.statusText,
          payload,
        });
        console.error("Villa upload API error JSON", JSON.stringify(debugPayload));
        setSubmitMessage(buildVillaApiErrorMessage(response, payload));
        return;
      }

      formElement.reset();
      setSelectedFiles([]);
      setUploadErrors([]);
      setSeoPreview({
        title: payload.villa?.title ?? "",
        slug: "",
        seoTitle: "",
        seoDescription: "",
        focusKeyword: "",
      });
      setSubmitMessage(
        isEditMode
          ? `${payload.villa?.title ?? "Villa"} guncellendi. Liste ekrani yenileniyor.`
          : `${payload.villa?.title ?? "Villa"} demo kaydina eklendi. Liste ekrani yenileniyor.`,
      );
      router.push("/panel/villalar");
      router.refresh();
    } catch (error) {
      console.error("Villa upload request failed", error);
      setSubmitMessage("Villa kaydi sirasinda baglanti hatasi olustu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
              Temel Bilgiler
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
              Villa karti, detay sayfasi ve talep akisini dolduracak alanlar
            </h2>
          </div>
          <div className="rounded-full bg-[var(--color-soft-white)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {isEditMode
              ? `Mevcut: ${initialVilla?.imageCount ?? 0} / Yeni: ${selectedFiles.length}`
              : `Secilen gorsel: ${selectedFiles.length}`}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {baseFields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                required={field.required}
                defaultValue={getInitialFieldValue(initialVilla, field.name)}
                placeholder={field.placeholder}
                onChange={handleSeoFieldChange}
                className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
              />
            </div>
          ))}

          <div>
            <label htmlFor="status" className="text-sm font-medium text-slate-700">
              Kayit durumu
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initialVilla?.status ?? "ACTIVE"}
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            >
              <option value="ACTIVE">Aktif</option>
              <option value="DRAFT">Taslak</option>
              <option value="PAUSED">Pasif</option>
              <option value="ARCHIVED">Arsiv</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initialVilla?.featured ?? false}
              className="h-4 w-4 rounded border-slate-300"
            />
            One cikan villa olarak vitrinde goster
          </label>

          <div className="md:col-span-2">
            <label htmlFor="shortDescription" className="text-sm font-medium text-slate-700">
              Kisa aciklama
            </label>
            <textarea
              id="shortDescription"
              name="shortDescription"
              rows={3}
              required
              defaultValue={getInitialFieldValue(initialVilla, "shortDescription")}
              placeholder="Panoramik manzarali, ozel havuzlu premium villa."
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">
              Detayli aciklama
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              required
              defaultValue={getInitialFieldValue(initialVilla, "description")}
              placeholder="Villa detay sayfasinda yer alacak uzun aciklama metni."
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            />
          </div>

          <div className="md:col-span-2 mt-2 rounded-[1.5rem] border border-slate-200 bg-[var(--color-soft-white)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Ingilizce Icerik
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Public tarafta dil `EN` secildiginde gosterilecek alanlar.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {englishContentFields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    required
                    defaultValue={getInitialFieldValue(initialVilla, field.name)}
                    placeholder={field.placeholder}
                    className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <label htmlFor="shortDescriptionEn" className="text-sm font-medium text-slate-700">
                  Kisa aciklama (EN)
                </label>
                <textarea
                  id="shortDescriptionEn"
                  name="shortDescriptionEn"
                  rows={3}
                  required
                  defaultValue={getInitialFieldValue(initialVilla, "shortDescriptionEn")}
                  placeholder="Panoramic sea views, an infinity pool and a premium stay for up to 8 guests."
                  className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descriptionEn" className="text-sm font-medium text-slate-700">
                  Detayli aciklama (EN)
                </label>
                <textarea
                  id="descriptionEn"
                  name="descriptionEn"
                  rows={5}
                  required
                  defaultValue={getInitialFieldValue(initialVilla, "descriptionEn")}
                  placeholder="Long English copy for the villa detail page."
                  className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Gorsel Yukleme
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
          {isEditMode
            ? "Yeni gorselleri mevcut galeriye ekleyebilirsin"
            : "Yuklenen gorseller otomatik WEBP formatina cevrilir"}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          {isEditMode
            ? "Duzenleme sirasinda gorsel secmezsen mevcut villa gorselleri korunur. Yeni secilen resimler WEBP'e cevrilip galerinin sonuna eklenir."
            : "JPG, PNG, WEBP ve diger desteklenen resim dosyalari sunucuda WEBP'e cevrilip kaydedilir."}
        </p>

        {isEditMode && initialVilla?.imageUrls.length ? (
          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Mevcut Galeri
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Bu gorseller kayitli kalir; yeni secilenler listenin sonuna eklenir.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {initialVilla.imageUrls.length} gorsel
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {initialVilla.imageUrls.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="relative min-h-36 overflow-hidden rounded-[1.25rem] bg-slate-200 bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                >
                  {imageUrl === initialVilla.coverImageUrl || index === 0 ? (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                      Kapak
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[1.75rem] border border-dashed border-[var(--color-aqua)] bg-[var(--color-soft-white)] p-6">
          <label
            htmlFor="villa-images"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm shadow-slate-200/50"
          >
            <span className="rounded-full bg-[var(--color-sand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
              Gorsel Yukle
            </span>
            <span className="text-lg font-semibold text-[var(--color-ink)]">
              Gorselleri sec veya buraya surukle
            </span>
            <span className="text-sm text-slate-500">
              {VILLA_IMAGE_RULES.acceptedInputLabel} gibi formatlar WEBP&apos;e donusturulur.
            </span>
          </label>
          <input
            id="villa-images"
            name="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelection}
            className="sr-only"
          />
        </div>

        {uploadErrors.length > 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <ul className="space-y-2">
              {uploadErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {selectedFiles.map((file) => (
            <div
              key={`${file.name}-${file.lastModified}`}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{file.name}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    {file.type || "image"} {"- WEBP'e cevrilecek"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(file)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
            SEO Alani
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
            Villa detay sayfalarini arama motoru odakli hazirla
          </h2>

          <div className="mt-8 space-y-5">
            {seoFields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                  {field.label}
                </label>
                {field.name === "seoDescription" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    required
                    rows={4}
                    defaultValue={getInitialFieldValue(initialVilla, field.name)}
                    placeholder={field.placeholder}
                    onChange={handleSeoFieldChange}
                    className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    required
                    defaultValue={getInitialFieldValue(initialVilla, field.name)}
                    placeholder={field.placeholder}
                    onChange={handleSeoFieldChange}
                    className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                )}
                <p className="mt-2 text-xs leading-6 text-slate-500">{field.helper}</p>
              </div>
            ))}

            <div className="rounded-[1.5rem] border border-slate-200 bg-[var(--color-soft-white)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Ingilizce SEO
              </p>
              <div className="mt-5 space-y-5">
                {englishSeoFields.map((field) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                      {field.label}
                    </label>
                    {field.name === "seoDescriptionEn" ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        required
                        rows={4}
                        defaultValue={getInitialFieldValue(initialVilla, field.name)}
                        placeholder={field.placeholder}
                        className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                      />
                    ) : (
                      <input
                        id={field.name}
                        name={field.name}
                        required
                        defaultValue={getInitialFieldValue(initialVilla, field.name)}
                        placeholder={field.placeholder}
                        className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                      />
                    )}
                    <p className="mt-2 text-xs leading-6 text-slate-500">{field.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-ocean-panel p-8 text-white shadow-xl shadow-teal-950/20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-100">
            SEO Onizleme
          </p>
          <div className="mt-8 rounded-[1.75rem] bg-white/10 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-100">Google benzeri gorunum</p>
            <p className="mt-4 text-lg font-semibold text-white">
              {seoPreview.seoTitle || seoPreview.title || "Villa SEO basligi burada gorunecek"}
            </p>
            <p className="mt-2 break-all text-sm text-teal-100/90">
              villavera.com/villalar/{seoPreview.slug || "seo-uyumlu-slug"}
            </p>
            <p className="mt-3 text-sm leading-7 text-teal-50/80">
              {seoPreview.seoDescription ||
                "Meta aciklama burada gorunecek. Kisa, net ve tiklanma artiran bir metin yazmak SEO performansini guclendirir."}
            </p>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-white/10 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-100">Odak anahtar kelime</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {seoPreview.focusKeyword || "anahtar kelime bekleniyor"}
            </p>
          </div>

          {submitMessage ? (
            <div className="mt-6 rounded-[1.75rem] border border-white/12 bg-white/10 p-5 text-sm leading-7 text-teal-50">
              {submitMessage}
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-slate-500">
          Kayitlar PostgreSQL veritabanina, gorseller ise sunucudaki villa upload klasorune yazilir.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[var(--color-teal)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting
            ? isEditMode
              ? "Villa guncelleniyor..."
              : "Villa kaydediliyor..."
            : isEditMode
              ? "Villa Bilgilerini Guncelle"
              : "Villa Kaydini Tamamla"}
        </button>
      </div>
    </form>
  );
}
