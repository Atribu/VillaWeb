"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DemoRegionAirportRecord } from "@/lib/demo-definitions";
import {
  VILLA_AMENITY_OPTIONS,
  VILLA_HOUSE_RULE_OPTIONS,
  VILLA_IMAGE_RULES,
  VILLA_SUITABILITY_OPTIONS,
  type CatalogVilla,
} from "@/lib/villa-catalog";

const baseFields = [
  { name: "title", label: "Villa basligi", placeholder: "Villa Soleia Lagoon", required: true },
  { name: "shortCode", label: "Kisa kod", placeholder: "VL-001", required: true },
  {
    name: "slug",
    label: "SEO uyumlu slug",
    placeholder: "kalkan-deniz-manzarali-luks-villa-soleia-lagoon",
    required: true,
  },
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

const distanceFields = [
  { name: "marketDistanceMeters", label: "Markete mesafe (metre)", placeholder: "350" },
  { name: "beachDistanceMeters", label: "Denize mesafe (metre)", placeholder: "800" },
  { name: "centerDistanceMeters", label: "Merkeze mesafe (metre)", placeholder: "2500" },
  { name: "airportDistanceKm", label: "Havalimanina mesafe (km)", placeholder: "55" },
];

const feeFields = [
  { name: "cleaningFee", label: "Temizlik ucreti", placeholder: "0" },
  { name: "electricityFee", label: "Elektrik ucreti", placeholder: "0" },
  { name: "waterFee", label: "Su ucreti", placeholder: "0" },
  { name: "extraGuestFee", label: "Ek misafir ucreti", placeholder: "0" },
  { name: "damageDeposit", label: "Hasar depozitosu", placeholder: "0" },
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
  regions?: DemoRegionAirportRecord[];
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
    shortCode: villa.shortCode,
    slug: villa.slug,
    city: villa.city,
    district: villa.district,
    address: villa.address,
    ownerVillaName: villa.ownerVillaName,
    supplierName: villa.supplierName,
    supplierPhone: villa.supplierPhone,
    supplierEmail: villa.supplierEmail,
    supplierNotes: villa.supplierNotes,
    latitude: villa.latitude,
    longitude: villa.longitude,
    marketDistanceMeters: villa.marketDistanceMeters,
    beachDistanceMeters: villa.beachDistanceMeters,
    centerDistanceMeters: villa.centerDistanceMeters,
    airportDistanceKm: villa.airportDistanceKm,
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
    checkInTime: villa.checkInTime,
    checkOutTime: villa.checkOutTime,
    cleaningFee: villa.cleaningFee,
    electricityFee: villa.electricityFee,
    waterFee: villa.waterFee,
    extraGuestFee: villa.extraGuestFee,
    damageDeposit: villa.damageDeposit,
    extraFeeNotes: villa.extraFeeNotes,
    extraFeeNotesEn: villa.extraFeeNotesEn,
    minNightCount: villa.minNightCount,
    houseRules: villa.houseRules?.join("\n"),
    houseRulesEn: villa.houseRulesEn?.join("\n"),
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
    tourismLicenseNumber: villa.tourismLicenseNumber,
    tourismLicensePdfUrl: villa.tourismLicensePdfUrl,
    coverAlt: villa.coverAlt,
    coverAltEn: villa.coverAltEn,
  };

  return values[fieldName] ?? "";
}

export function VillaForm({ mode = "create", initialVilla }: VillaFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
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

  function handlePdfSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedPdf(null);
      event.target.value = "";
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setUploadErrors([`${file.name}: Turizm isletme belgesi PDF formatinda olmali.`]);
      setSelectedPdf(null);
      event.target.value = "";
      return;
    }

    setSelectedPdf(file);
    setUploadErrors([]);
    setSubmitMessage("");
    event.target.value = "";
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
      formData.delete("tourismLicensePdf");
      selectedFiles.forEach((file) => formData.append("images", file));
      if (selectedPdf) {
        formData.append("tourismLicensePdf", selectedPdf);
      }

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
      setSelectedPdf(null);
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
    <form onSubmit={handleSubmit} className="space-y-6" id="villa-form">
      <section id="villa-basics" className="panel-section rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
              Temel Bilgiler
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
              Villa bilgileri ve icerik
            </h2>
          </div>
          <div className="rounded-full bg-[var(--color-soft-white)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {isEditMode
              ? `Mevcut: ${initialVilla?.imageCount ?? 0} / Yeni: ${selectedFiles.length}`
              : `Secilen gorsel: ${selectedFiles.length}`}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="city" className="text-sm font-medium text-slate-700">
              Lokasyon
            </label>
            <input
              id="city"
              name="city"
              required
              defaultValue={getInitialFieldValue(initialVilla, "city")}
              placeholder="Bodrum"
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            />
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Yeni lokasyon yazarsan sistem kayit sirasinda otomatik tanimlar.
            </p>
          </div>
          <div>
            <label htmlFor="district" className="text-sm font-medium text-slate-700">
              Bolge
            </label>
            <input
              id="district"
              name="district"
              required
              defaultValue={getInitialFieldValue(initialVilla, "district")}
              placeholder="Yalikavak"
              className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
            />
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Bu bolge secili lokasyonun altina otomatik eklenir.
            </p>
          </div>

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

          <div className="md:col-span-2 rounded-[1.5rem] border border-slate-200 bg-[var(--color-soft-white)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Yasal Belge Bilgileri
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="tourismLicenseNumber"
                  className="text-sm font-medium text-slate-700"
                >
                  Turizm İşletme Belge No
                </label>
                <input
                  id="tourismLicenseNumber"
                  name="tourismLicenseNumber"
                  defaultValue={getInitialFieldValue(initialVilla, "tourismLicenseNumber")}
                  placeholder="Örn: 48-12345"
                  className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Public villa detayında yasal bilgi olarak gösterilir.
                </p>
              </div>

              <div>
                <label htmlFor="tourism-license-pdf" className="text-sm font-medium text-slate-700">
                  Belge PDF&apos;i
                </label>
                <label
                  htmlFor="tourism-license-pdf"
                  className="mt-2 flex cursor-pointer flex-col rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600 transition hover:border-[var(--color-aqua)]"
                >
                  <span className="font-semibold text-[var(--color-ink)]">
                    {selectedPdf ? selectedPdf.name : "PDF dosyası seç"}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Sadece PDF kabul edilir. Yeni PDF seçmezsen mevcut belge korunur.
                  </span>
                </label>
                <input
                  id="tourism-license-pdf"
                  name="tourismLicensePdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfSelection}
                  className="sr-only"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPdf ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPdf(null)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                    >
                      PDF&apos;i kaldır
                    </button>
                  ) : null}
                  {initialVilla?.tourismLicensePdfUrl ? (
                    <a
                      href={initialVilla.tourismLicensePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--color-aqua)] hover:text-[var(--color-teal)]"
                    >
                      Mevcut PDF&apos;i aç
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

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

      <section id="villa-operations" className="panel-section rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
          Operasyon ve Konaklama
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
          Operasyon bilgileri
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Tedarikci bilgileri sadece panelde kalir. Konum, mesafeler, olanaklar, ek ucretler ve
          kurallar public villa detayinda misafire gosterilebilir.
        </p>

        <div className="mt-8 grid gap-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Ic Operasyon Bilgileri
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="ownerVillaName" className="text-sm font-medium text-slate-700">
                  Ev sahibinin kullandigi villa adi
                </label>
                <input
                  id="ownerVillaName"
                  name="ownerVillaName"
                  defaultValue={getInitialFieldValue(initialVilla, "ownerVillaName")}
                  placeholder="Orn: Mehmet Bey Evi"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)]"
                />
              </div>
              <div>
                <label htmlFor="supplierName" className="text-sm font-medium text-slate-700">
                  Tedarikci / yetkili adi
                </label>
                <input
                  id="supplierName"
                  name="supplierName"
                  defaultValue={getInitialFieldValue(initialVilla, "supplierName")}
                  placeholder="Ad soyad veya firma"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)]"
                />
              </div>
              <div>
                <label htmlFor="supplierPhone" className="text-sm font-medium text-slate-700">
                  Tedarikci telefonu
                </label>
                <input
                  id="supplierPhone"
                  name="supplierPhone"
                  type="tel"
                  defaultValue={getInitialFieldValue(initialVilla, "supplierPhone")}
                  placeholder="+90 5xx xxx xx xx"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)]"
                />
              </div>
              <div>
                <label htmlFor="supplierEmail" className="text-sm font-medium text-slate-700">
                  Tedarikci e-postasi
                </label>
                <input
                  id="supplierEmail"
                  name="supplierEmail"
                  type="email"
                  defaultValue={getInitialFieldValue(initialVilla, "supplierEmail")}
                  placeholder="tedarikci@example.com"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)]"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="supplierNotes" className="text-sm font-medium text-slate-700">
                  Operasyon notu
                </label>
                <textarea
                  id="supplierNotes"
                  name="supplierNotes"
                  rows={3}
                  defaultValue={getInitialFieldValue(initialVilla, "supplierNotes")}
                  placeholder="Anahtar teslimi, iletisim tercihi veya ek operasyon notlari"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)]"
                />
              </div>
            </div>
          </div>

          <div id="villa-location" className="panel-section rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Konum ve Mesafeler
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="address" className="text-sm font-medium text-slate-700">
                  Acik adres / konum aciklamasi
                </label>
                <input
                  id="address"
                  name="address"
                  defaultValue={getInitialFieldValue(initialVilla, "address")}
                  placeholder="Mahalle, cadde ve konum tarifi"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
              </div>
              <div>
                <label htmlFor="latitude" className="text-sm font-medium text-slate-700">
                  Enlem
                </label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="0.0000001"
                  min="-90"
                  max="90"
                  defaultValue={getInitialFieldValue(initialVilla, "latitude")}
                  placeholder="36.2521000"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="text-sm font-medium text-slate-700">
                  Boylam
                </label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="0.0000001"
                  min="-180"
                  max="180"
                  defaultValue={getInitialFieldValue(initialVilla, "longitude")}
                  placeholder="29.4137000"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
              </div>
              {distanceFields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min="0"
                    step={field.name === "airportDistanceKm" ? "0.1" : "1"}
                    defaultValue={getInitialFieldValue(initialVilla, field.name)}
                    placeholder={field.placeholder}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Giris ve Konaklama
              </p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="checkInTime" className="text-sm font-medium text-slate-700">
                    Giris saati
                  </label>
                  <input
                    id="checkInTime"
                    name="checkInTime"
                    type="time"
                    defaultValue={getInitialFieldValue(initialVilla, "checkInTime") || "16:00"}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="checkOutTime" className="text-sm font-medium text-slate-700">
                    Cikis saati
                  </label>
                  <input
                    id="checkOutTime"
                    name="checkOutTime"
                    type="time"
                    defaultValue={getInitialFieldValue(initialVilla, "checkOutTime") || "10:00"}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="minNightCount" className="text-sm font-medium text-slate-700">
                    Minimum konaklama (gece)
                  </label>
                  <input
                    id="minNightCount"
                    name="minNightCount"
                    type="number"
                    min="1"
                    required
                    defaultValue={getInitialFieldValue(initialVilla, "minNightCount") || 1}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Misafir Uygunlugu
              </p>
              <div className="mt-5 grid gap-3">
                {VILLA_SUITABILITY_OPTIONS.map((option) => (
                  <label
                    key={option.key}
                    className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      name="suitabilityTags"
                      value={option.key}
                      defaultChecked={initialVilla?.suitabilityTags?.includes(option.key) ?? false}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div id="villa-amenities" className="panel-section rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Villa Olanaklari
            </p>
            <div className="mt-5 space-y-6">
              {Array.from(new Set(VILLA_AMENITY_OPTIONS.map((option) => option.category))).map((category) => (
                <fieldset key={category}>
                  <legend className="mb-3 text-sm font-semibold text-slate-800">{category}</legend>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VILLA_AMENITY_OPTIONS.filter((option) => option.category === category).map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    name="amenities"
                    value={option.key}
                    defaultChecked={initialVilla?.amenities?.some((item) => item.key === option.key) ?? false}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                  </span>
                </label>
              ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          <div id="villa-fees" className="panel-section rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Ek Ucretler ve Depozito
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">Temizlik ucreti konaklama toplamina eklenir. Diger tutarlar misafire bilgi olarak gosterilir; ne zaman ve nasil tahsil edilecegini asagidaki aciklamada belirtin. Hasar depozitosu konaklama bedelinden ayridir.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {feeFields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={getInitialFieldValue(initialVilla, field.name) || 0}
                    placeholder={field.placeholder}
                    className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                  />
                </div>
              ))}
              <div className="md:col-span-2 xl:col-span-3">
                <label htmlFor="extraFeeNotes" className="text-sm font-medium text-slate-700">
                  Ek ucret aciklamasi
                </label>
                <textarea
                  id="extraFeeNotes"
                  name="extraFeeNotes"
                  rows={3}
                  defaultValue={getInitialFieldValue(initialVilla, "extraFeeNotes")}
                  placeholder="Ucretlerin hangi durumda uygulanacagini acikla"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <label htmlFor="extraFeeNotesEn" className="text-sm font-medium text-slate-700">
                  Ek ucret aciklamasi (EN)
                </label>
                <textarea
                  id="extraFeeNotesEn"
                  name="extraFeeNotesEn"
                  rows={3}
                  defaultValue={getInitialFieldValue(initialVilla, "extraFeeNotesEn")}
                  placeholder="Explain when the additional fees apply"
                  className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div id="villa-rules" className="panel-section grid gap-5 md:grid-cols-2">
            <fieldset className="md:col-span-2">
              <legend className="mb-3 text-sm font-semibold text-slate-800">Ev kurallari</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {VILLA_HOUSE_RULE_OPTIONS.map((rule) => <label key={rule.key} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <input type="checkbox" name="houseRulePresets" value={rule.key} defaultChecked={initialVilla?.houseRules?.includes(rule.label) ?? false} className="h-4 w-4" />
                  {rule.label}
                </label>)}
              </div>
              <p className="mt-2 text-xs text-slate-500">Hazir kurallarin Ingilizce karsiligi otomatik eklenir.</p>
            </fieldset>
            <div>
              <label htmlFor="houseRules" className="text-sm font-medium text-slate-700">
                Ek kurallar (TR)
              </label>
              <textarea
                id="houseRules"
                name="houseRules"
                rows={6}
                defaultValue={(initialVilla?.houseRules ?? []).filter((value) => !VILLA_HOUSE_RULE_OPTIONS.some((rule) => rule.label === value)).join("\n")}
                placeholder={"Her satira bir kural yazin\nIceride sigara icilmez\nParti duzenlenemez"}
                className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="houseRulesEn" className="text-sm font-medium text-slate-700">
                Ev kurallari (EN)
              </label>
              <textarea
                id="houseRulesEn"
                name="houseRulesEn"
                rows={6}
                defaultValue={(initialVilla?.houseRulesEn ?? []).filter((value) => !VILLA_HOUSE_RULE_OPTIONS.some((rule) => rule.labelEn === value)).join("\n")}
                placeholder={"Write one rule per line\nNo smoking indoors\nNo parties or events"}
                className="mt-2 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="villa-images" className="panel-section rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
            ? "Duzenleme sirasinda gorsel secmezsen mevcut villa gorselleri korunur. Yeni secilen resimler WEBP'e cevrilir, BookToVilla filigrani eklenir ve galerinin sonuna kaydedilir."
            : "JPG, PNG, WEBP ve diger desteklenen resim dosyalari sunucuda WEBP'e cevrilir ve BookToVilla filigrani eklenerek kaydedilir."}
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

      <section id="villa-seo" className="panel-section grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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

      <div className="panel-savebar flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-slate-500">
          {submitMessage || "Degisiklikleri tamamladiginizda kaydetmeyi unutmayin."}
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
