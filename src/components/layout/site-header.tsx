import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { getCurrentLocale } from "@/lib/server/app-locale";

export async function SiteHeader() {
  const company = await getCurrentPublicCompany();
  const locale = await getCurrentLocale();
  return <SiteHeaderShell company={company} locale={locale} />;
}
