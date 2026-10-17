import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { BOOKING_TERMS, BOOKING_TERMS_VERSION } from "@/lib/booking-terms";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  return buildPublicMetadata({
    locale,
    title: { tr: "Rezervasyon ve Kullanim Kosullari", en: "Booking and Usage Terms" },
    description: {
      tr: "Villa talebi, tarihler, fiyatlar, ek ucretler, ev kurallari ve rezervasyon onay sureci.",
      en: "Villa inquiries, dates, prices, additional fees, house rules and booking confirmation.",
    },
    canonical: "/kullanim-kosullari",
  });
}

export default async function TermsPage() {
  const locale = await getCurrentLocale();
  return (
    <Container className="py-14 sm:py-16">
      <article className="serene-card mx-auto max-w-4xl p-6 sm:p-10">
        <p className="serene-eyebrow">{pickLocalized(locale, "Surum", "Version")} {BOOKING_TERMS_VERSION}</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[var(--serene-on-surface)]">
          {pickLocalized(locale, "Rezervasyon ve Kullanim Kosullari", "Booking and Usage Terms")}
        </h1>
        <p className="mt-5 text-sm leading-7 text-[var(--serene-on-surface-variant)]">
          {pickLocalized(locale,
            "Talebinizi gondermeden once bu kosullari ve sectiginiz villanin bilgilerini inceleyin. Onayinizin tarihi ve metin surumu talebinizle birlikte kaydedilir.",
            "Before submitting, review these terms and your selected villa's details. The acceptance date and terms version are recorded with your inquiry.")}
        </p>
        <div className="mt-8 divide-y divide-slate-200">
          {BOOKING_TERMS.map((section, index) => (
            <section key={section.title.en} className="py-6">
              <h2 className="text-lg font-semibold text-[var(--serene-on-surface)]">{index + 1}. {section.title[locale]}</h2>
              <p className="mt-3 text-sm leading-8 text-[var(--serene-on-surface-variant)]">{section.text[locale]}</p>
            </section>
          ))}
        </div>
        <Link href="/kvkk" className="mt-6 inline-block text-sm font-semibold text-[var(--serene-primary)] underline">
          {pickLocalized(locale, "KVKK Aydinlatma Metni", "Privacy Notice")}
        </Link>
      </article>
    </Container>
  );
}
