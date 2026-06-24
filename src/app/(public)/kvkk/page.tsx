import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  return buildPublicMetadata({
    locale,
    title: { tr: "KVKK", en: "Data Protection" },
    description: {
      tr: "Kisisel verilerin korunmasi ve islenmesine iliskin aydinlatma metni.",
      en: "A privacy notice about the protection and processing of personal data.",
    },
    canonical: "/kvkk",
  });
}

const sections = [
  "Veri sorumlusu bilgileri",
  "Islenen veri kategorileri",
  "Isleme amaclari ve hukuki sebepler",
  "Ilgili kisi haklari ve basvuru sureci",
];

export default async function KvkkPage() {
  const locale = await getCurrentLocale();

  return (
    <Container className="py-14 sm:py-16">
      <div className="serene-card p-8">
        <p className="serene-eyebrow">
          {pickLocalized(locale, "KVKK", "Data Protection")}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--serene-on-surface)]">
          {pickLocalized(locale, "Aydinlatma metni icin yasal sayfa iskeleti", "Legal page framework for the privacy notice")}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-[var(--serene-on-surface-variant)]">
          {pickLocalized(
            locale,
            "Bu sayfa, kisisel verilerin korunmasi ve islenmesine dair aydinlatma metnini tasimak uzere modern ama ciddi bir yasal icerik yapisiyla kurgulandi.",
            "This page was designed with a modern yet serious legal structure to carry the privacy notice on the protection and processing of personal data.",
          )}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((item) => (
            <div key={item} className="rounded-[16px] border border-[var(--serene-outline-variant)]/60 bg-[var(--serene-surface-low)] px-5 py-5 text-sm font-medium text-[var(--serene-on-surface)]">
              {pickLocalized(
                locale,
                item,
                item === "Veri sorumlusu bilgileri"
                  ? "Data controller information"
                  : item === "Islenen veri kategorileri"
                    ? "Processed data categories"
                    : item === "Isleme amaclari ve hukuki sebepler"
                      ? "Processing purposes and legal bases"
                      : "Data subject rights and application process",
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
