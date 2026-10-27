import type { Metadata } from "next";
import { LegalDocument } from "@/components/site-templates/legal-document";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  return buildPublicMetadata({ locale, title: { tr: "Kişisel verilerin korunması", en: "Personal data protection" },
    description: { tr: "Kişisel verilerin korunması ve işlenmesine ilişkin bilgilendirme.", en: "Information about the protection and processing of personal data." }, canonical: "/kvkk" });
}

export default async function KvkkPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  return <LegalDocument locale={locale} companySlug={company.slug} companyName={company.shortName}
    title={t("Kişisel verilerin korunması", "Personal data protection")}
    intro={t("Kişisel verilerin korunması ve işlenmesine ilişkin bilgilendirme.", "Information about the protection and processing of personal data.")}
    pending
    sections={[
      { title: t("Veri sorumlusu bilgileri", "Data controller information") },
      { title: t("İşlenen veri kategorileri", "Processed data categories") },
      { title: t("İşleme amaçları ve hukuki sebepler", "Processing purposes and legal bases") },
      { title: t("İlgili kişi hakları ve başvuru süreci", "Data subject rights and application process") },
    ]}
  />;
}
