import type { Metadata } from "next";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";

type PublicMetadataInput = {
  locale: AppLocale;
  title: { tr: string; en: string };
  description: { tr: string; en: string };
  keywords?: { tr: string[]; en: string[] };
  canonical?: string;
  openGraphTitle?: { tr: string; en: string };
  openGraphDescription?: { tr: string; en: string };
  openGraphType?: Metadata["openGraph"] extends infer T
    ? T extends { type?: infer U }
      ? U
      : never
    : never;
};

export function buildPublicMetadata(input: PublicMetadataInput): Metadata {
  const {
    locale,
    title,
    description,
    keywords,
    canonical,
    openGraphTitle,
    openGraphDescription,
    openGraphType = "website",
  } = input;

  return {
    title: pickLocalized(locale, title.tr, title.en),
    description: pickLocalized(locale, description.tr, description.en),
    keywords: keywords ? pickLocalized(locale, keywords.tr, keywords.en) : undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph:
      openGraphTitle || openGraphDescription
        ? {
            title: pickLocalized(
              locale,
              openGraphTitle?.tr ?? title.tr,
              openGraphTitle?.en ?? title.en,
            ),
            description: pickLocalized(
              locale,
              openGraphDescription?.tr ?? description.tr,
              openGraphDescription?.en ?? description.en,
            ),
            type: openGraphType,
          }
        : undefined,
  };
}
