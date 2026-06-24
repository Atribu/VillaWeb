import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "Kullanim Kosullari", en: "Terms of Use" },
    description: {
      tr: "Site kullanim kosullari ve talep akisina dair hukuki cerceve sayfasi.",
      en: "A legal framework page for site usage terms and the inquiry flow.",
    },
    canonical: "/kullanim-kosullari",
  });
}

const sections = [
  "Site kullanim cercevesi",
  "Icerik ve fikri mulkiyet notlari",
  "Talep formu ve iletisim sureci kurallari",
  "Sorumluluk sinirlari ve guncelleme hakki",
];

export default async function TermsPage() {
  const locale = await getCurrentLocale();

  return (
    <Container className="py-14 sm:py-16">
      <div className="serene-card p-8">
        <p className="serene-eyebrow">
          {pickLocalized(locale, "Kullanim Kosullari", "Terms of Use")}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--serene-on-surface)]">
          {pickLocalized(locale, "Kullanim sartlari icin yasal sayfa iskeleti", "Legal page framework for the terms of use")}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-[var(--serene-on-surface-variant)]">
          {pickLocalized(
            locale,
            "Bu alan, site kullanimi, talep akisinin hukuki cercevesi ve icerik kullanim kosullari icin yasal omurgayi tasir.",
            "This section contains the legal framework for site usage, the inquiry flow and content usage terms.",
          )}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((item) => (
            <div key={item} className="rounded-[16px] border border-[var(--serene-outline-variant)]/60 bg-[var(--serene-surface-low)] px-5 py-5 text-sm font-medium text-[var(--serene-on-surface)]">
              {pickLocalized(
                locale,
                item,
                item === "Site kullanim cercevesi"
                  ? "Framework of site usage"
                  : item === "Icerik ve fikri mulkiyet notlari"
                    ? "Content and intellectual property notes"
                    : item === "Talep formu ve iletisim sureci kurallari"
                      ? "Inquiry form and communication rules"
                      : "Liability limits and right to update",
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
