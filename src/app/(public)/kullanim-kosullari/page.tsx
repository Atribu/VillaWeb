import type { Metadata } from "next";
import { LegalDocument } from "@/components/site-templates/legal-document";
import { BOOKING_TERMS, BOOKING_TERMS_VERSION } from "@/lib/booking-terms";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  return buildPublicMetadata({ locale,
    title: { tr: "Rezervasyon ve kullanım koşulları", en: "Booking and usage terms" },
    description: { tr: "Villa talebi, tarihler, fiyatlar, ek ücretler, ev kuralları ve rezervasyon onay süreci.", en: "Villa inquiries, dates, prices, additional fees, house rules and booking confirmation." },
    canonical: "/kullanim-kosullari" });
}

export default async function TermsPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  return <LegalDocument locale={locale} companySlug={company.slug} companyName={company.shortName}
    title={pickLocalized(locale, "Rezervasyon ve kullanım koşulları", "Booking and usage terms")}
    intro={pickLocalized(locale, "Talebinizi göndermeden önce bu koşulları ve seçtiğiniz villanın bilgilerini inceleyin. Onayınızın tarihi ve metin sürümü talebinizle birlikte kaydedilir.", "Before submitting, review these terms and your selected villa’s details. The acceptance date and terms version are recorded with your inquiry.")}
    version={BOOKING_TERMS_VERSION}
    sections={BOOKING_TERMS.map(section => ({ title: section.title[locale], text: section.text[locale] }))}
  />;
}
