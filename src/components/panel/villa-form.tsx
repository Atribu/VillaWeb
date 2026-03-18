"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { VILLA_IMAGE_RULES } from "@/lib/villa-catalog";

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

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function VillaForm() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seoPreview, setSeoPreview] = useState({
    title: "",
    slug: "",
    seoTitle: "",
    seoDescription: "",
    focusKeyword: "",
  });

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files ?? []);
    const nextFiles = [...selectedFiles];
    const nextErrors: string[] = [];

    for (const file of incomingFiles) {
      const lowerCaseName = file.name.toLowerCase();
      const isWebp =
        VILLA_IMAGE_RULES.acceptedMimeTypes.includes(file.type as "image/webp") ||
        VILLA_IMAGE_RULES.acceptedExtensions.some((extension) => lowerCaseName.endsWith(extension));

      if (!isWebp) {
        nextErrors.push(`${file.name}: sadece WEBP formatinda gorsel kabul edilir.`);
        continue;
      }

      if (file.size > VILLA_IMAGE_RULES.maxFileSizeInMb * 1024 * 1024) {
        nextErrors.push(
          `${file.name}: dosya boyutu ${VILLA_IMAGE_RULES.maxFileSizeInMb} MB sinirini asiyor.`,
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

      if (nextFiles.length >= VILLA_IMAGE_RULES.maxFiles) {
        nextErrors.push(
          `Villa basina en fazla ${VILLA_IMAGE_RULES.maxFiles} adet gorsel yukleyebilirsin.`,
        );
        break;
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

    if (selectedFiles.length === 0) {
      setSubmitMessage("En az 1 adet WEBP gorsel eklemeden villa kaydi tamamlanamaz.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const formElement = event.currentTarget;
      const formData = new FormData(formElement);
      formData.delete("images");
      selectedFiles.forEach((file) => formData.append("images", file));

      const response = await fetch("/api/demo/villas", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string; villa?: { title: string } };

      if (!response.ok) {
        setSubmitMessage(payload.error ?? "Villa kaydi sirasinda bir hata olustu.");
        return;
      }

      formElement.reset();
      setSelectedFiles([]);
      setUploadErrors([]);
      setSeoPreview({
        title: "",
        slug: "",
        seoTitle: "",
        seoDescription: "",
        focusKeyword: "",
      });
      setSubmitMessage(
        `${payload.villa?.title ?? "Villa"} demo kaydina eklendi. Liste ekrani yenileniyor.`,
      );
      router.push("/panel/villalar");
      router.refresh();
    } catch {
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
            Foto limiti: {selectedFiles.length}/{VILLA_IMAGE_RULES.maxFiles}
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
              defaultValue="ACTIVE"
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            >
              <option value="ACTIVE">Aktif</option>
              <option value="DRAFT">Taslak</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" name="featured" className="h-4 w-4 rounded border-slate-300" />
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
              placeholder="Villa detay sayfasinda yer alacak uzun aciklama metni."
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Gorsel Yukleme
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
          Sadece WEBP, en fazla 8 MB ve villa basina maksimum 30 gorsel
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Demo icin secilen dosyalar proje klasorundeki `public/uploads/villas` altina kaydedilir.
        </p>

        <div className="mt-8 rounded-[1.75rem] border border-dashed border-[var(--color-aqua)] bg-[var(--color-soft-white)] p-6">
          <label
            htmlFor="villa-images"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm shadow-slate-200/50"
          >
            <span className="rounded-full bg-[var(--color-sand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
              WEBP Yukle
            </span>
            <span className="text-lg font-semibold text-[var(--color-ink)]">
              Gorselleri sec veya buraya surukle
            </span>
            <span className="text-sm text-slate-500">
              Her dosya en fazla {VILLA_IMAGE_RULES.maxFileSizeInMb} MB olabilir.
            </span>
          </label>
          <input
            id="villa-images"
            name="images"
            type="file"
            accept=".webp,image/webp"
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
                    {file.type || "image/webp"}
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
              <p className="mt-4 text-sm text-slate-500">{formatFileSize(file.size)}</p>
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
                    placeholder={field.placeholder}
                    onChange={handleSeoFieldChange}
                    className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    required
                    placeholder={field.placeholder}
                    onChange={handleSeoFieldChange}
                    className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                )}
                <p className="mt-2 text-xs leading-6 text-slate-500">{field.helper}</p>
              </div>
            ))}
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
          Demo akisinda kayitlar yerel veri dosyasina yazilir ve proje icindeki gorsel klasorunde
          saklanir.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[var(--color-teal)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Villa kaydediliyor..." : "Villa Kaydini Tamamla"}
        </button>
      </div>
    </form>
  );
}
