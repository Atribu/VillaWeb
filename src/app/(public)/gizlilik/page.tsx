import type { Metadata } from "next";
import { LegalDocument } from "@/components/site-templates/legal-document";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  return buildPublicMetadata({ locale, title: { tr: "Gizlilik politikası", en: "Privacy policy" },
    description: { tr: "Veri kullanımı, çerezler ve talep kayıtları hakkında bilgilendirme.", en: "Information about data usage, cookies and inquiry records." }, canonical: "/gizlilik" });
}

export default async function PrivacyPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  return <LegalDocument locale={locale} companySlug={company.slug} companyName={company.shortName}
    title={t("Gizlilik politikası", "Privacy policy")}
    intro={t("Veri kullanımı, çerezler ve talep kayıtları hakkında bilgilendirme.", "Information about data usage, cookies and inquiry records.")}
    pending
    sections={[
      { title: t("Toplanan veriler ve kullanıldığı alanlar", "Collected data and usage areas") },
      { title: t("Çerez ve oturum yönetimi", "Cookie and session management") },
      { title: t("İletişim formları ve talep kayıtları", "Contact forms and inquiry records") },
      { title: t("Saklama ve imha süreçleri", "Retention and deletion processes") },
    ]}
  />;
}
