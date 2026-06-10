import { pickLocalized, type AppLocale } from "@/lib/i18n";
import type { AvailabilityRange, CatalogVilla } from "@/lib/villa-catalog";

const seedVillaTranslations: Record<
  string,
  Partial<
    Pick<
      CatalogVilla,
      | "title"
      | "badge"
      | "category"
      | "shortDescription"
      | "description"
      | "poolType"
      | "coverAlt"
      | "seoTitle"
      | "seoDescription"
      | "focusKeyword"
    >
  >
> = {
  "kalkan-deniz-manzarali-luks-villa-soleia-lagoon": {
    title: "Villa Soleia Lagoon",
    badge: "Sea view",
    category: "Luxury with a view",
    shortDescription:
      "Panoramic sea views, an infinity pool and a premium living setup for up to 8 guests.",
    description:
      "Located close to the heart of Kalkan, Villa Soleia Lagoon offers a spacious and refined holiday setting for large families and guests looking for a premium stay.",
    poolType: "Infinity pool",
    coverAlt: "Pool and terrace view of Villa Soleia Lagoon with panoramic sea views in Kalkan",
    seoTitle: "Luxury sea-view villa in Kalkan | Villa Soleia Lagoon",
    seoDescription:
      "A premium 8-guest villa in Kalkan with sea views and a private pool. Discover a calm and luxurious holiday at Villa Soleia Lagoon.",
    focusKeyword: "sea-view villa in Kalkan",
  },
  "fethiye-ozel-havuzlu-aile-villasi-palm-serenity": {
    title: "Villa Palm Serenity",
    badge: "Family friendly",
    category: "Large family",
    shortDescription:
      "Private garden use, a children's pool and a layout designed for family holidays up to 10 guests.",
    description:
      "Surrounded by nature, Villa Palm Serenity is designed to give families a relaxed stay with its spacious kitchen and open-air lounge areas.",
    poolType: "Private pool + kids' pool",
    coverAlt: "Large garden and pool area of Villa Palm Serenity in Fethiye",
    seoTitle: "Private pool family villa in Fethiye | Villa Palm Serenity",
    seoDescription:
      "A premium family villa in Fethiye with a private pool, spacious garden and comfortable layout for larger groups.",
    focusKeyword: "family villa in Fethiye",
  },
  "kas-balayi-icin-muhafazakar-villa-verde-cove": {
    title: "Villa Verde Cove",
    badge: "Honeymoon choice",
    category: "Honeymoon",
    shortDescription:
      "A private concept for two with an isolated pool and a sunset terrace for a peaceful getaway.",
    description:
      "Villa Verde Cove blends the natural character of Kas with a calm luxury experience and was designed for honeymoon couples seeking privacy.",
    poolType: "Secluded pool",
    coverAlt: "Private hideaway pool terrace of Villa Verde Cove in Kas",
    seoTitle: "Private honeymoon villa in Kas | Villa Verde Cove",
    seoDescription:
      "A secluded honeymoon villa in Kas with a sheltered pool, privacy-focused layout and romantic sunset atmosphere.",
    focusKeyword: "private honeymoon villa in Kas",
  },
  "bodrum-kalabalik-gruplar-icin-luks-villa-marea-grand": {
    title: "Villa Marea Grand",
    badge: "Large group stay",
    category: "Luxury with a view",
    shortDescription:
      "Designed for larger groups with generous outdoor living areas, a broad pool deck and premium entertaining spaces.",
    description:
      "Villa Marea Grand in Bodrum is positioned for larger group holidays, combining scale, comfort and a luxury coastal atmosphere in one stay.",
    poolType: "Temperature-controlled pool",
    coverAlt: "Grand exterior and pool deck of Villa Marea Grand in Bodrum",
    seoTitle: "Luxury group villa in Bodrum | Villa Marea Grand",
    seoDescription:
      "A spacious luxury villa in Bodrum for large groups, with a temperature-controlled pool and premium social areas.",
    focusKeyword: "luxury group villa in Bodrum",
  },
};

const commonTermTranslations: Record<string, string> = {
  "Deniz manzarali": "Sea view",
  "Aile dostu": "Family friendly",
  "Balayi secimi": "Honeymoon choice",
  "Kalabalik grup": "Large group stay",
  "Luks Manzarali": "Luxury with a view",
  "Genis Aile": "Large family",
  Balayi: "Honeymoon",
  "Sonsuzluk havuzu": "Infinity pool",
  "Ozel havuz + cocuk havuzu": "Private pool + kids' pool",
  "Izole havuz": "Secluded pool",
  "Sicaklik kontrollu havuz": "Temperature-controlled pool",
  "Secili Villa": "Featured villa",
  Villa: "Villa",
  "Ozel havuz": "Private pool",
};

export function getLocalizedAvailabilityLabel(
  range: AvailabilityRange,
  locale: AppLocale,
) {
  if (locale === "tr") {
    return range.label;
  }

  if (range.status === "RESERVED") {
    return "Approved reservation";
  }

  if (range.status === "MAINTENANCE") {
    return "Maintenance closure";
  }

  return "Unavailable dates";
}

export function localizeVillaTerm(value: string, locale: AppLocale) {
  if (locale === "tr") {
    return value;
  }

  return commonTermTranslations[value] ?? value;
}

export function getLocalizedVilla(villa: CatalogVilla, locale: AppLocale): CatalogVilla {
  if (locale === "tr") {
    return villa;
  }

  const translation = seedVillaTranslations[villa.slug];

  return {
    ...villa,
    title: villa.titleEn ?? translation?.title ?? villa.title,
    badge: villa.badgeEn ?? translation?.badge ?? localizeVillaTerm(villa.badge, locale),
    category:
      villa.categoryEn ?? translation?.category ?? localizeVillaTerm(villa.category, locale),
    shortDescription: villa.shortDescriptionEn ?? translation?.shortDescription ?? villa.shortDescription,
    description: villa.descriptionEn ?? translation?.description ?? villa.description,
    poolType: villa.poolTypeEn ?? translation?.poolType ?? localizeVillaTerm(villa.poolType, locale),
    coverAlt: villa.coverAltEn ?? translation?.coverAlt ?? villa.coverAlt,
    seoTitle: villa.seoTitleEn ?? translation?.seoTitle ?? villa.seoTitle,
    seoDescription:
      villa.seoDescriptionEn ?? translation?.seoDescription ?? villa.seoDescription,
    focusKeyword: villa.focusKeywordEn ?? translation?.focusKeyword ?? villa.focusKeyword,
    availabilityRanges: villa.availabilityRanges.map((range) => ({
      ...range,
      label: getLocalizedAvailabilityLabel(range, locale),
    })),
  };
}

export function getLocalizedReviewLabel(
  villa: CatalogVilla,
  locale: AppLocale,
) {
  if (typeof villa.rating === "number") {
    return pickLocalized(
      locale,
      `${villa.rating.toFixed(2)} puan${villa.reviewCount ? ` / ${villa.reviewCount} yorum` : ""}`,
      `${villa.rating.toFixed(2)} rating${villa.reviewCount ? ` / ${villa.reviewCount} reviews` : ""}`,
    );
  }

  return pickLocalized(locale, "Yeni portfoy", "New listing");
}
