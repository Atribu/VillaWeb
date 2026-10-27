export const SITE_TEMPLATES = [
  { id: "secki", name: "Seçki", description: "Büyük tipografi, mimari fotoğraflar ve koyu yeşil detaylarla seçkin bir vitrin.", color: "#304f43" },
  { id: "kiyi", name: "Kıyı", description: "Tam genişlikte fotoğraf, sakin mavi tonlar ve kıyı yaşamından ilham alan bir düzen.", color: "#234e64" },
  { id: "rota", name: "Rota", description: "Beyaz-mavi, modern ve arama odaklı; hızlı keşif için kompakt villa kartları.", color: "#2056bf" },
] as const;

export type SiteTemplateKey = (typeof SITE_TEMPLATES)[number]["id"];
export const DEFAULT_SITE_TEMPLATE: SiteTemplateKey = "secki";

export function isSiteTemplateKey(value: unknown): value is SiteTemplateKey {
  return SITE_TEMPLATES.some((template) => template.id === value);
}

// Older installations used "marketplace-core" or had no saved theme.
export function resolveSiteTemplate(value: unknown): SiteTemplateKey {
  return isSiteTemplateKey(value) ? value : DEFAULT_SITE_TEMPLATE;
}

export function normalizeSiteHost(value?: string | null) {
  if (!value || /[\s,@]/.test(value)) return "";
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return "";
  }
}

type WebsiteIdentity = { id: string; companyId?: string; domain?: string | null; default: boolean; themeKey?: string | null };

export function selectCompanyWebsite<T extends WebsiteIdentity>(websites: T[], companyId: string, host: string) {
  const scoped = websites.filter((site) => site.companyId === companyId);
  const normalizedHost = normalizeSiteHost(host);
  const exact = normalizedHost ? scoped.find((site) => normalizeSiteHost(site.domain) === normalizedHost) : undefined;
  return exact ?? scoped.find((site) => site.default) ?? scoped[0] ?? null;
}

export function canManageWebsite(role: string, sessionCompanyId: string | undefined, websiteCompanyId: string) {
  return role === "SUPER_ADMIN" || (role === "ADMIN" && !!sessionCompanyId && sessionCompanyId === websiteCompanyId);
}

export type WebsiteUpdate = { status?: "LIVE" | "STAGING" | "PAUSED"; default?: boolean; themeKey?: SiteTemplateKey };

export function parseWebsiteUpdate(value: unknown): WebsiteUpdate {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Geçerli bir site ayarı gönderilmelidir.");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["status", "default", "themeKey"].includes(key))) throw new Error("Desteklenmeyen site ayarı.");
  if (input.status !== undefined && (typeof input.status !== "string" || !["LIVE", "STAGING", "PAUSED"].includes(input.status))) throw new Error("Geçerli bir site durumu seçilmelidir.");
  if (input.default !== undefined && typeof input.default !== "boolean") throw new Error("Varsayılan seçimi geçersiz.");
  if (input.themeKey !== undefined && !isSiteTemplateKey(input.themeKey)) throw new Error("Geçerli bir tasarım şablonu seçilmelidir.");
  if (Object.keys(input).length === 0) throw new Error("Güncellenecek bir ayar seçilmelidir.");
  return input as WebsiteUpdate;
}
