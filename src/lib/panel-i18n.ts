import type { AppRole } from "@/lib/auth/users";
import { getPanelNavigation } from "@/lib/auth/panel-access";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";

const groupLabels: Record<string, { tr: string; en: string }> = {
  dashboard: { tr: "Ana Sayfa", en: "Dashboard" },
  companies: { tr: "Firmalar", en: "Companies" },
  reservations: { tr: "Rezervasyonlar", en: "Reservations" },
  operations: { tr: "Takip & Operasyon", en: "Operations" },
  finance: { tr: "Muhasebe", en: "Finance" },
  crm: { tr: "CRM (Musteri Iliskileri)", en: "CRM (Customer Relations)" },
  "users-messages": { tr: "Kullanicilar & Mesajlar", en: "Users & Messages" },
  settings: { tr: "Ayarlar", en: "Settings" },
  definitions: { tr: "Tanimlamalar", en: "Definitions" },
  websites: { tr: "Web Siteleri", en: "Websites" },
  villas: { tr: "Villalar", en: "Villas" },
  "calendar-sync": { tr: "Takvim Senkronizasyon", en: "Calendar Sync" },
  "external-links": { tr: "Diger Linkler", en: "External Links" },
};

const itemLabels: Record<string, { tr: string; en: string }> = {
  "/panel/rezervasyonlar/yeni-rezervasyon": { tr: "Yeni Rezervasyon", en: "New Reservation" },
  "/panel/rezervasyonlar/ev-rezervasyonlari": { tr: "Ev Rezervasyonlari", en: "Villa Reservations" },
  "/panel/talepler": { tr: "Talepler", en: "Inquiries" },
  "/panel/rezervasyonlar/log-analiz": { tr: "Log Analiz", en: "Logs & Analytics" },
  "/panel/takip-operasyon/ev-takip": { tr: "Ev Takip", en: "Villa Follow-up" },
  "/panel/takip-operasyon/ev-operasyon": { tr: "Ev Operasyon", en: "Villa Operations" },
  "/panel/takip-operasyon/ev-temizlik": { tr: "Ev Temizlik", en: "Villa Cleaning" },
  "/panel/takip-operasyon/ev-karsilama": { tr: "Ev Karsilama", en: "Guest Welcome" },
  "/panel/takip-operasyon/tedarikci-onaylari": { tr: "Tedarikci Onaylari", en: "Supplier Approvals" },
  "/panel/takip-operasyon/hatirlaticilar": { tr: "Hatirlaticilar", en: "Reminders" },
  "/panel/muhasebe": { tr: "Genel Bakis", en: "Overview" },
  "/panel/muhasebe/bakiyeler": { tr: "Bakiyeler", en: "Balances" },
  "/panel/muhasebe/faturalar": { tr: "Faturalar", en: "Invoices" },
  "/panel/muhasebe/odeme-takip": { tr: "Odeme Takip", en: "Payment Tracking" },
  "/panel/muhasebe/kasa-takip": { tr: "Kasa Takip", en: "Cashbook" },
  "/panel/crm/ayarlar-ve-tanimlamalar": { tr: "Ayarlar ve Tanimlamalar", en: "Settings & Definitions" },
  "/panel/kuponlar": { tr: "Kupon Kodlari", en: "Coupon Codes" },
  "/panel/indirimler": { tr: "Indirimler & Kampanyalar", en: "Discounts & Campaigns" },
  "/panel/crm/musteriler": { tr: "Musteriler", en: "Customers" },
  "/panel/crm/yorum-sistemi": { tr: "Yorum Sistemi", en: "Review System" },
  "/panel/kullanicilar-mesajlar/acentalar": { tr: "Acentalar", en: "Agencies" },
  "/panel/kullanicilar-mesajlar/subeler": { tr: "Subeler", en: "Branches" },
  "/panel/personel": { tr: "Kullanicilar", en: "Users" },
  "/panel/kullanicilar-mesajlar/roller": { tr: "Roller", en: "Roles" },
  "/panel/kullanicilar-mesajlar/mesajlar": { tr: "Mesajlar", en: "Messages" },
  "/panel/kullanicilar-mesajlar/komisyon-oranlari": { tr: "Komisyon Oranlari", en: "Commission Rates" },
  "/panel/ayarlar/doviz-kurlari": { tr: "Doviz Kurlari", en: "Exchange Rates" },
  "/panel/ayarlar/odeme-sistemi": { tr: "Odeme Sistemi", en: "Payment System" },
  "/panel/ayarlar/cache-takibi": { tr: "Cache Takibi", en: "Cache Tracking" },
  "/panel/ayarlar/sistem-varsayilanlari": { tr: "Sistem Varsayilanlari", en: "System Defaults" },
  "/panel/ayarlar/dokumanlar": { tr: "Dokumanlar", en: "Documents" },
  "/panel/villalar": { tr: "Villa Listesi", en: "Villa List" },
  "/panel/tanimlamalar/bolgeler-ve-havaalanlari": { tr: "Bolgeler ve Havaalanlari", en: "Regions & Airports" },
  "/panel/tanimlamalar/parametre-gruplari": { tr: "Parametre Gruplari", en: "Parameter Groups" },
  "/panel/tanimlamalar/kurlar": { tr: "Kurlar", en: "Rates" },
  "/panel/web-siteleri/site-yonetimi": { tr: "Site Yonetimi", en: "Site Management" },
  "/panel/web-siteleri/landing-sayfalari": { tr: "Landing Sayfalari", en: "Landing Pages" },
  "/panel/web-siteleri/seo-icerikleri": { tr: "SEO Icerikleri", en: "SEO Content" },
  "/panel/villalar/yeni": { tr: "Yeni Villa", en: "New Villa" },
  "/panel/fiyatlar": { tr: "Fiyat Yonetimi", en: "Pricing" },
  "/panel/raporlar": { tr: "Raporlar", en: "Reports" },
  "/panel/takvim-senkronizasyon/ical-kaynaklari": { tr: "iCal Kaynaklari", en: "iCal Sources" },
  "/panel/takvim-senkronizasyon/kanal-eslestirmeleri": { tr: "Kanal Eslestirmeleri", en: "Channel Mappings" },
  "/panel/takvim-senkronizasyon/senkron-loglari": { tr: "Senkron Loglari", en: "Sync Logs" },
  "/panel/diger-linkler/kisayollar": { tr: "Kisayollar", en: "Shortcuts" },
  "/panel/diger-linkler/dis-servisler": { tr: "Dis Servisler", en: "External Services" },
  "/panel/diger-linkler/dokuman-baglantilari": { tr: "Dokuman Baglantilari", en: "Document Links" },
};

export function getLocalizedPanelNavigation(role: AppRole, locale: AppLocale) {
  const navigation = getPanelNavigation(role);

  return navigation.map((entry) => {
    const translatedLabel = groupLabels[entry.id]
      ? pickLocalized(locale, groupLabels[entry.id].tr, groupLabels[entry.id].en)
      : entry.label;

    if (entry.type === "link") {
      return {
        ...entry,
        label: translatedLabel,
      };
    }

    return {
      ...entry,
      label: translatedLabel,
      items: entry.items.map((item) => ({
        ...item,
        label: itemLabels[item.href]
          ? pickLocalized(locale, itemLabels[item.href].tr, itemLabels[item.href].en)
          : item.label,
      })),
    };
  });
}
