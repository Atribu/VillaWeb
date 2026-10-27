import { getCurrentPublicSiteTemplate } from "@/lib/server/public-site-template";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { getCurrentLocale } from "@/lib/server/app-locale";

export async function SiteHeader() {
  const { company, themeKey } = await getCurrentPublicSiteTemplate();
  const locale = await getCurrentLocale();
  return <SiteHeaderShell company={company} locale={locale} theme={themeKey} />;
}
