import { PanelRecordError } from "@/lib/panel-record-tools";
import { requiredText, optionalText } from "@/lib/panel-workspace";
import { isSiteTemplateKey, type SiteTemplateKey } from "@/lib/site-templates";

export const PACKAGE_MODULES = ["pricing", "reservations", "operations", "finance", "crm", "calendar", "reports", "websites", "sharing"] as const;
export type PackageModule = typeof PACKAGE_MODULES[number];
export type CompanyPackage = { name: string; users: number | null; activeVillas: number | null; modules: PackageModule[] };
export const DEFAULT_PACKAGE: CompanyPackage = { name: "Mevcut firma", users: null, activeVillas: null, modules: [...PACKAGE_MODULES] };
export type SiteContent = { themeKey: SiteTemplateKey; logoUrl: string; heroTitle: string; heroDescription: string;
  heroTitleEn?: string; heroDescriptionEn?: string;
  phone: string; email: string; address: string; whatsapp: string; domain: string };
export type PlatformConfig = { companyId: string; package: CompanyPackage; siteDraft: SiteContent | null; sitePublished: SiteContent | null; version: number };
export function parsePackage(value: unknown): CompanyPackage {
  const data = value as CompanyPackage;
  if (!data || !Array.isArray(data.modules) || data.modules.some(m => !PACKAGE_MODULES.includes(m))) throw new PanelRecordError("Geçerli modülleri seçin.");
  for (const limit of [data.users, data.activeVillas]) if (limit !== null && (!Number.isInteger(limit) || limit < 1 || limit > 100000)) throw new PanelRecordError("Limit 1-100000 arası olmalı; sınırsız için boş bırakın.");
  return { name: requiredText(data.name, "Paket adı", 80), users: data.users, activeVillas: data.activeVillas, modules: [...new Set(data.modules)] };
}
export function parseSiteContent(value: unknown): SiteContent {
  const data = value as SiteContent;
  if (!data || !isSiteTemplateKey(data.themeKey)) throw new PanelRecordError("Tasarım şablonunu seçin.");
  const logoUrl = optionalText(data.logoUrl, 500);
  if (logoUrl && !/^\/uploads\/[a-zA-Z0-9/_%.-]+\.(?:webp|png|jpg|jpeg)$/i.test(logoUrl)) throw new PanelRecordError("Logo için projeye yüklenmiş bir resmin /uploads/ adresini kullanın.");
  const domain = optionalText(data.domain, 253).toLowerCase();
  if (domain && !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) throw new PanelRecordError("Alan adını https:// ve yol olmadan yazın.");
  const email = optionalText(data.email, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PanelRecordError("Geçerli e-posta girin.");
  return { themeKey: data.themeKey, logoUrl, domain, email, heroTitle: requiredText(data.heroTitle, "Ana başlık", 180),
    heroTitleEn: optionalText(data.heroTitleEn, 180), heroDescriptionEn: optionalText(data.heroDescriptionEn, 1200),
    heroDescription: optionalText(data.heroDescription, 1200), phone: optionalText(data.phone, 40), address: optionalText(data.address, 600), whatsapp: optionalText(data.whatsapp, 40) };
}
export const TRAFFIC_SOURCES = ["DIRECT", "SEARCH", "SOCIAL", "EMAIL", "REFERRAL", "PANEL", "UNKNOWN"] as const;
export type TrafficSource = typeof TRAFFIC_SOURCES[number];
export function trafficSource(value: unknown): TrafficSource { return TRAFFIC_SOURCES.includes(value as TrafficSource) ? value as TrafficSource : "DIRECT"; }
export function rate(numerator: number, denominator: number) { return denominator ? Math.round(numerator / denominator * 10000) / 100 : null; }
