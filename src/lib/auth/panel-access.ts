import type { AppRole } from "@/lib/auth/users";

export type PanelIconName =
  | "dashboard"
  | "cart"
  | "calendar"
  | "wallet"
  | "crm"
  | "users"
  | "settings"
  | "lab"
  | "globe"
  | "home"
  | "sync"
  | "link";

export type PanelNavLink = {
  label: string;
  href: string;
  roles: AppRole[];
};

export type PanelNavEntry =
  | {
      type: "link";
      id: string;
      label: string;
      href: string;
      icon: PanelIconName;
      roles: AppRole[];
    }
  | {
      type: "group";
      id: string;
      label: string;
      icon: PanelIconName;
      roles: AppRole[];
      items: PanelNavLink[];
    };

export type PanelModuleMeta = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
};

const panelEntries: PanelNavEntry[] = [
  {
    type: "link",
    id: "dashboard",
    label: "Ana Sayfa",
    href: "/panel",
    icon: "dashboard",
    roles: ["ADMIN"],
  },
  {
    type: "link",
    id: "companies",
    label: "Firmalar",
    href: "/panel/firmalar",
    icon: "globe",
    roles: ["SUPER_ADMIN"],
  },
  {
    type: "group",
    id: "reservations",
    label: "Rezervasyonlar",
    icon: "cart",
    roles: ["ADMIN"],
    items: [
      { label: "Yeni Rezervasyon", href: "/panel/rezervasyonlar/yeni-rezervasyon", roles: ["ADMIN"] },
      { label: "Ev Rezervasyonlari", href: "/panel/rezervasyonlar/ev-rezervasyonlari", roles: ["ADMIN"] },
      { label: "Talepler", href: "/panel/talepler", roles: ["ADMIN"] },
      { label: "Log Analiz", href: "/panel/rezervasyonlar/log-analiz", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "operations",
    label: "Takip & Operasyon",
    icon: "calendar",
    roles: ["ADMIN"],
    items: [
      { label: "Ev Takip", href: "/panel/takip-operasyon/ev-takip", roles: ["ADMIN"] },
      { label: "Ev Operasyon", href: "/panel/takip-operasyon/ev-operasyon", roles: ["ADMIN"] },
      { label: "Ev Temizlik", href: "/panel/takip-operasyon/ev-temizlik", roles: ["ADMIN"] },
      { label: "Ev Karsilama", href: "/panel/takip-operasyon/ev-karsilama", roles: ["ADMIN"] },
      {
        label: "Tedarikci Onaylari",
        href: "/panel/takip-operasyon/tedarikci-onaylari",
        roles: ["ADMIN"],
      },
      { label: "Hatirlaticilar", href: "/panel/takip-operasyon/hatirlaticilar", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "finance",
    label: "Muhasebe",
    icon: "wallet",
    roles: ["ADMIN"],
    items: [
      { label: "Genel Bakis", href: "/panel/muhasebe", roles: ["ADMIN"] },
      { label: "Bakiyeler", href: "/panel/muhasebe/bakiyeler", roles: ["ADMIN"] },
      { label: "Faturalar", href: "/panel/muhasebe/faturalar", roles: ["ADMIN"] },
      { label: "Odeme Takip", href: "/panel/muhasebe/odeme-takip", roles: ["ADMIN"] },
      { label: "Kasa Takip", href: "/panel/muhasebe/kasa-takip", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "crm",
    label: "CRM (Musteri Iliskileri)",
    icon: "crm",
    roles: ["ADMIN"],
    items: [
      {
        label: "Ayarlar ve Tanimlamalar",
        href: "/panel/crm/ayarlar-ve-tanimlamalar",
        roles: ["ADMIN"],
      },
      { label: "Kupon Kodlari", href: "/panel/kuponlar", roles: ["ADMIN"] },
      { label: "Indirimler & Kampanyalar", href: "/panel/indirimler", roles: ["ADMIN"] },
      { label: "Musteriler", href: "/panel/crm/musteriler", roles: ["ADMIN"] },
      { label: "Yorum Sistemi", href: "/panel/crm/yorum-sistemi", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "users-messages",
    label: "Kullanicilar & Mesajlar",
    icon: "users",
    roles: ["ADMIN"],
    items: [
      { label: "Acentalar", href: "/panel/kullanicilar-mesajlar/acentalar", roles: ["ADMIN"] },
      { label: "Subeler", href: "/panel/kullanicilar-mesajlar/subeler", roles: ["ADMIN"] },
      { label: "Kullanicilar", href: "/panel/personel", roles: ["ADMIN"] },
      { label: "Roller", href: "/panel/kullanicilar-mesajlar/roller", roles: ["ADMIN"] },
      { label: "Mesajlar", href: "/panel/kullanicilar-mesajlar/mesajlar", roles: ["ADMIN"] },
      {
        label: "Komisyon Oranlari",
        href: "/panel/kullanicilar-mesajlar/komisyon-oranlari",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    type: "group",
    id: "settings",
    label: "Ayarlar",
    icon: "settings",
    roles: ["ADMIN"],
    items: [
      { label: "Doviz Kurlari", href: "/panel/ayarlar/doviz-kurlari", roles: ["ADMIN"] },
      { label: "Odeme Sistemi", href: "/panel/ayarlar/odeme-sistemi", roles: ["ADMIN"] },
      { label: "Cache Takibi", href: "/panel/ayarlar/cache-takibi", roles: ["ADMIN"] },
      {
        label: "Sistem Varsayilanlari",
        href: "/panel/ayarlar/sistem-varsayilanlari",
        roles: ["ADMIN"],
      },
      { label: "Dokumanlar", href: "/panel/ayarlar/dokumanlar", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "definitions",
    label: "Tanimlamalar",
    icon: "lab",
    roles: ["ADMIN"],
    items: [
      { label: "Villa Tanimlari", href: "/panel/villalar", roles: ["ADMIN"] },
      {
        label: "Bolgeler ve Havaalanlari",
        href: "/panel/tanimlamalar/bolgeler-ve-havaalanlari",
        roles: ["ADMIN"],
      },
      {
        label: "Parametre Gruplari",
        href: "/panel/tanimlamalar/parametre-gruplari",
        roles: ["ADMIN"],
      },
      { label: "Kurlar", href: "/panel/tanimlamalar/kurlar", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "websites",
    label: "Web Siteleri",
    icon: "globe",
    roles: ["ADMIN"],
    items: [
      { label: "Site Yonetimi", href: "/panel/web-siteleri/site-yonetimi", roles: ["ADMIN"] },
      { label: "Landing Sayfalari", href: "/panel/web-siteleri/landing-sayfalari", roles: ["ADMIN"] },
      { label: "SEO Icerikleri", href: "/panel/web-siteleri/seo-icerikleri", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "villas",
    label: "Villalar",
    icon: "home",
    roles: ["ADMIN", "STAFF"],
    items: [
      { label: "Villa Listesi", href: "/panel/villalar", roles: ["ADMIN", "STAFF"] },
      { label: "Yeni Villa", href: "/panel/villalar/yeni", roles: ["ADMIN", "STAFF"] },
      { label: "Fiyat Yonetimi", href: "/panel/fiyatlar", roles: ["ADMIN"] },
      { label: "Raporlar", href: "/panel/raporlar", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "calendar-sync",
    label: "Takvim Senkronizasyon",
    icon: "sync",
    roles: ["ADMIN"],
    items: [
      {
        label: "iCal Kaynaklari",
        href: "/panel/takvim-senkronizasyon/ical-kaynaklari",
        roles: ["ADMIN"],
      },
      {
        label: "Kanal Eslestirmeleri",
        href: "/panel/takvim-senkronizasyon/kanal-eslestirmeleri",
        roles: ["ADMIN"],
      },
      { label: "Senkron Loglari", href: "/panel/takvim-senkronizasyon/senkron-loglari", roles: ["ADMIN"] },
    ],
  },
  {
    type: "group",
    id: "external-links",
    label: "Diger Linkler",
    icon: "link",
    roles: ["ADMIN"],
    items: [
      { label: "Kisayollar", href: "/panel/diger-linkler/kisayollar", roles: ["ADMIN"] },
      { label: "Dis Servisler", href: "/panel/diger-linkler/dis-servisler", roles: ["ADMIN"] },
      { label: "Dokuman Baglantilari", href: "/panel/diger-linkler/dokuman-baglantilari", roles: ["ADMIN"] },
    ],
  },
];

const moduleMetaByPath: Record<string, PanelModuleMeta> = {
  "rezervasyonlar": {
    eyebrow: "Rezervasyon Merkezi",
    title: "Pazar yeri mantigina uygun rezervasyon yasam dongusu burada yonetilecek",
    description:
      "Yeni rezervasyon acma, kanal bazli rezervasyon takibi, log analizi ve teklif sureci bu alan altinda buyuyecek.",
    highlights: [
      "Yeni rezervasyon akislarini panel icinden yonetme",
      "Talepler ile gercek rezervasyonlar arasinda operasyon baglantisi kurma",
      "Kanal ve manuel giris kayitlarini tek merkezden izleme",
    ],
  },
  "rezervasyonlar/yeni-rezervasyon": {
    eyebrow: "Yeni Rezervasyon",
    title: "Elle rezervasyon acma modulu icin hazir alan",
    description:
      "Telefon, acenta veya dis kanal uzerinden gelen rezervasyonlarin manuel olarak kayda alinacagi ekran bu bolume yerlestirilecek.",
    highlights: [
      "Villa secimi ve tarih kontrolu",
      "Misafir ve odeme ozet bilgileri",
      "Operasyon ekiplerine otomatik bildirim",
    ],
  },
  "rezervasyonlar/ev-rezervasyonlari": {
    eyebrow: "Ev Rezervasyonlari",
    title: "Villa bazli aktif rezervasyonlari izlemek icin hazir modül",
    description:
      "Onaylanan rezervasyonlar, iptaller ve tarih bazli doluluk listeleri bu sayfada merkezilesir.",
    highlights: [
      "Tarih bazli rezervasyon tablosu",
      "Villa bazli filtreler",
      "Rezervasyon durumu ve operasyon atamasi",
    ],
  },
  "rezervasyonlar/log-analiz": {
    eyebrow: "Log & Analiz",
    title: "Rezervasyon hareketlerini analiz eden kayit merkezi",
    description:
      "Kullanici hareketleri, rezervasyon degisimleri ve kanal bazli loglar burada raporlanabilir hale getirilecek.",
    highlights: [
      "Durum degisim loglari",
      "Talep donusum analizi",
      "Kaynak bazli performans raporlari",
    ],
  },
  "takip-operasyon": {
    eyebrow: "Operasyon Merkezi",
    title: "Temizlikten karsilamaya kadar saha operasyonlarini yoneten omurga",
    description:
      "Bu modul, rezervasyon onayi sonrasinda operasyon takvimini ve saha gorevlerini pazar yeri mantigina uygun sekilde tasiyacak.",
    highlights: [
      "Temizlik ve karşılama görevleri",
      "Tedarikçi ve operasyon onayları",
      "Hatırlatıcı ve görev akışları",
    ],
  },
  "muhasebe": {
    eyebrow: "Finans Omurgasi",
    title: "Bakiye, fatura ve odeme takibini tek panelde toplamak icin hazir alan",
    description:
      "Rezervasyon gelirleri ve acenta/tedarikci finans hareketleri bu modulle kurumsal panele tasinacak.",
    highlights: [
      "Bakiye ve kasa hareketleri",
      "Tahsilat ve odeme akislari",
      "Fatura ve finans raporlari",
    ],
  },
  "crm": {
    eyebrow: "CRM Merkezi",
    title: "Musteri, kampanya ve yorum akisini tek yerde yoneten modul",
    description:
      "Mevcut kupon ve indirim modulleri bu bolumun omurgasina oturtulacak; sonraki adimda musteri verisi ve segmentasyon eklenebilir.",
    highlights: [
      "Musteri kartlari ve segmentler",
      "Kampanya ve kupon kontrolu",
      "Yorum ve geri bildirim sistemi",
    ],
  },
  "kullanicilar-mesajlar": {
    eyebrow: "Kullanici Merkezi",
    title: "Acenta, sube, personel ve mesaj akisini buyutmek icin yeni omurga",
    description:
      "Personel ekraninin ileride rol, sube, acenta ve mesaj yapisiyla genisleyecegi ana alan burasi olacak.",
    highlights: [
      "Acenta ve sube yonetimi",
      "Rol ve yetki matrisi",
      "Ic mesaj ve bildirim yapisi",
    ],
  },
  "ayarlar": {
    eyebrow: "Sistem Ayarlari",
    title: "Kur, odeme ve sistem varsayimlari icin merkez ayar alani",
    description:
      "Genel sistem parametreleri bu bolum altinda toplanarak daha buyuk pazar yeri paneline zemin hazirlayacak.",
    highlights: [
      "Kur ve odeme ayarlari",
      "Cache ve sistem araclari",
      "Operasyon dokumanlari",
    ],
  },
  "tanimlamalar": {
    eyebrow: "Temel Tanimlamalar",
    title: "Villa, bolge ve parametre tanimlarini yoneten sistem katmani",
    description:
      "Villa tanimlari su an canli; sonraki asamada bolgeler, havaalanlari ve kural gruplari da bu alana eklenecek.",
    highlights: [
      "Villa ve bolge tanimlari",
      "Parametre ve kural gruplari",
      "Merkezi veri standardizasyonu",
    ],
  },
  "web-siteleri": {
    eyebrow: "Web Siteleri",
    title: "Birden fazla site ve landing kurgusuna hazir panel omurgasi",
    description:
      "Kurumsal site, landing sayfalari ve SEO icerik operasyonlari bu bolumde bagimsiz olarak buyutulebilir.",
    highlights: [
      "Site bazli icerik modulleri",
      "Landing page planlama",
      "SEO icerik ve yayin operasyonu",
    ],
  },
  "takvim-senkronizasyon": {
    eyebrow: "Kanal Senkronu",
    title: "Takvim senkronizasyonu ve kanal loglari icin ayri operasyon alani",
    description:
      "iCal ve kanal bazli takvim akislari ileride burada toplanarak cakismaz rezervasyon mantigina tasinabilir.",
    highlights: [
      "iCal kaynaklari",
      "Kanal baglantilari",
      "Senkronizasyon loglari",
    ],
  },
  "diger-linkler": {
    eyebrow: "Harici Baglantilar",
    title: "Ekip ici kisayollar ve dis servis baglantilari icin destek alani",
    description:
      "Operasyonun hizli hareket etmesi icin dis servis baglantilari ve dokuman kisayollari bu bolumden yonetilebilir.",
    highlights: [
      "Kisayol listeleri",
      "Dokuman baglantilari",
      "Harici servis erisimleri",
    ],
  },
};

const allowedPlaceholderSections = new Set([
  "rezervasyonlar",
  "takip-operasyon",
  "muhasebe",
  "crm",
  "kullanicilar-mesajlar",
  "ayarlar",
  "tanimlamalar",
  "web-siteleri",
  "takvim-senkronizasyon",
  "diger-linkler",
]);

function pathMatches(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleCanAccess(requiredRoles: AppRole[], currentRole: AppRole) {
  if (requiredRoles.includes(currentRole)) {
    return true;
  }

  return currentRole === "SUPER_ADMIN" && requiredRoles.includes("ADMIN");
}

export function getPanelNavigation(role: AppRole) {
  return panelEntries
    .filter((entry) => roleCanAccess(entry.roles, role))
    .map((entry) => {
      if (entry.type === "link") {
        return entry;
      }

      const visibleItems = entry.items.filter((item) => roleCanAccess(item.roles, role));

      return {
        ...entry,
        items: visibleItems,
      };
    })
    .filter((entry) => entry.type === "link" || entry.items.length > 0);
}

export function getPanelHomePath(role: AppRole) {
  return role === "STAFF" ? "/panel/villalar" : "/panel";
}

export function canAccessPanelPath(role: AppRole, pathname: string) {
  if (role === "SUPER_ADMIN") {
    return true;
  }

  const navigation = getPanelNavigation(role);

  return navigation.some((entry) => {
    if (entry.type === "link") {
      return pathMatches(entry.href, pathname);
    }

    return entry.items.some((item) => pathMatches(item.href, pathname));
  });
}

export function getPanelEntryState(pathname: string, entry: PanelNavEntry) {
  if (entry.type === "link") {
    return {
      isActive: pathMatches(entry.href, pathname),
      hasActiveChild: false,
    };
  }

  const hasActiveChild = entry.items.some((item) => pathMatches(item.href, pathname));

  return {
    isActive: false,
    hasActiveChild,
  };
}

export function getPanelModuleMeta(section: string, slug?: string[]) {
  const baseKey = section;
  const deepKey = [section, ...(slug ?? [])].join("/");

  if (!allowedPlaceholderSections.has(section)) {
    return null;
  }

  if (moduleMetaByPath[deepKey]) {
    return moduleMetaByPath[deepKey];
  }

  if (moduleMetaByPath[baseKey]) {
    return moduleMetaByPath[baseKey];
  }

  return null;
}

export function isPlaceholderPanelSection(section: string) {
  return allowedPlaceholderSections.has(section);
}
