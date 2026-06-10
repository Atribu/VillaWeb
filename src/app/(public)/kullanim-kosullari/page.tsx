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
      <div className="rounded-[2.3rem] border border-black/6 bg-white p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
          {pickLocalized(locale, "Kullanim Kosullari", "Terms of Use")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
          {pickLocalized(locale, "Kullanim sartlari icin yasal sayfa iskeleti", "Legal page framework for the terms of use")}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600">
          {pickLocalized(
            locale,
            "Bu alan, site kullanimi, talep akisinin hukuki cercevesi ve icerik kullanim kosullari icin yasal omurgayi tasir.",
            "This section contains the legal framework for site usage, the inquiry flow and content usage terms.",
          )}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((item) => (
            <div key={item} className="rounded-[1.4rem] bg-[var(--color-slate-soft)] px-5 py-5 text-sm font-medium text-slate-700">
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
