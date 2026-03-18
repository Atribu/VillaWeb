# Villa Kiralama Platformu Blueprint

## 1. Proje Ozeti

Bu proje, SEO odakli bir villa kiralama vitrini ile yonetim panelini ayni `Next.js` uygulamasi icinde barindiran bir sistem olacak.

Ilk fazda odak:
- villa listeleme ve detay sayfalari
- talep / randevu olusturma
- gecelik fiyat gosterimi
- tarih bazli indirim yonetimi
- kupon kodu mantigi
- panel uzerinden villa ve fiyat yonetimi
- temel raporlama

Ikinci fazda eklenecek ana baslik:
- online odeme entegrasyonu

## 2. Teknoloji Karari

- Runtime: `Node.js`
- Framework: `Next.js` App Router
- UI: `React`
- Dil: `TypeScript`
- Stil: `Tailwind CSS`
- Veritabani: `PostgreSQL`
- ORM: `Prisma`
- Form yonetimi: `React Hook Form`
- Validasyon: `Zod`
- Kimlik dogrulama: `NextAuth` veya `Better Auth`
- Gorsel optimizasyon: `next/image`

Not:
- Arayuzde mumkun oldugunca `Tailwind` kullanilacak.
- Ayrica klasik `.css` yazimi minimumda tutulacak.

## 3. Roller ve Yetkiler

### Roller

- `ADMIN`
- `STAFF`

### Temel Kurallar

- Sistemde yalnizca `1` aktif `ADMIN` olacak.
- `STAFF` kullanicilari sinirsiz sayida eklenebilecek veya kaldirilabilecek.
- `ADMIN` tum verilere ve tum yonetim ekranlarina erisecek.
- `STAFF` villa icerigi ve kendisine verilen operasyon alanlarinda calisacak.

### Yetki Matrisi

| Alan | Admin | Staff |
|---|---:|---:|
| Dashboard ve tum raporlar | Evet | Sinirli |
| Villa ekleme | Evet | Evet |
| Villa duzenleme | Evet | Evet |
| Villa silme / pasife alma | Evet | Tercihen hayir |
| Fiyat degistirme | Evet | Evet |
| Indirim tanimlama | Evet | Evet |
| Kupon tanimlama | Evet | Hayir |
| Personel ekleme / cikarma | Evet | Hayir |
| Tum talepleri gorme | Evet | Evet, atanmis veya ilgili villalarda |
| Ayarlar | Evet | Hayir |

Oneri:
- `STAFF` kullanicisinin gorebilecegi villalar istege gore tum villalar veya sadece kendi yukledigi villalar olabilir.
- Ilk faz icin basit tutmak adina `STAFF` tum villalari gorebilir; kritik alanlar yine yetkiyle kisitlanir.

## 4. Urun Modulleri

### Public Site

- Ana sayfa
- Villa listeleme
- Villa detay
- Kampanyalar
- Hakkimizda
- SSS
- Iletisim
- Blog / Rehber
- Talep gonderme

### Panel

- Dashboard
- Villa yonetimi
- Takvim / musaitlik
- Fiyatlandirma
- Indirimler
- Kuponlar
- Talepler
- Personel yonetimi
- Raporlar
- Genel ayarlar

## 5. Public Site Sayfa Yapisi

### Ana Sayfa `/`

Amac:
- guven vermek
- premium tatil hissi vermek
- arama ve talep akisini one cikarmak
- SEO icin zengin icerik sunmak

Bolumler:
- Hero alan: buyuk gorsel, baslik, alt metin, CTA
- Hizli arama: tarih, kisi sayisi, lokasyon, villa tipi
- One cikan villalar
- Kampanya alani
- Neden bizi tercih etmeli
- Bolge / kategori kartlari
- Musteri guveni olusturan alanlar
- SSS ozeti
- Blog / rehber icerikleri
- Alt CTA: talep olustur

### Villalar `/villalar`

Amac:
- filtreli listeleme
- SEO uyumlu kategori mantigi

Filtreler:
- bolge
- kisi kapasitesi
- havuz tipi
- denize yakinlik
- fiyat araligi
- musaitlik durumu
- kampanyali villa

### Villa Detay `/villalar/[slug]`

Bolumler:
- galeri
- kisa ozet ve fiyat kutusu
- eski fiyat / indirimli fiyat gosterimi
- tarih secimi
- talep formu
- ozellikler
- konum / bolge bilgisi
- musaitlik takvimi
- benzer villalar
- SSS
- SEO icerigi

Detay sayfasinda gosterilecek ana bilgiler:
- villa adi
- slug
- konum
- kapasite
- oda / banyo sayisi
- havuz bilgisi
- gecelik fiyat
- aktif kampanya
- gorseller
- aciklama
- kurallar

### Kampanyalar `/kampanyalar`

Aktif kampanyalarin liste sayfasi olacak.

### Hakkimizda `/hakkimizda`

Kurumsal guven, marka hikayesi, hizmet sekli.

### SSS `/sss`

SEO ve donusum icin cok degerli sayfa.

### Iletisim `/iletisim`

- iletisim formu
- telefon
- e-posta
- adres
- harita

### Blog `/blog`

Organik trafik toplamak icin temel icerik merkezi.

Ornek kategori basliklari:
- bolge rehberleri
- tatil onerileri
- villa secim rehberi
- balayi villalari
- cocuklu aileler icin villalar

### Blog Detay `/blog/[slug]`

Her yazi SEO odakli olacak.

## 6. Panel Sayfa Yapisi

### Panel Giris `/panel/giris`

Yalnizca admin ve staff icin.

### Dashboard `/panel`

Gosterilecek kartlar:
- toplam villa sayisi
- aktif kampanya sayisi
- bekleyen talep sayisi
- bugun gelen talep
- en cok incelenen villa
- en cok talep alan villa
- en cok gelir getiren villa

### Villa Yonetimi `/panel/villalar`

Fonksiyonlar:
- villa listesi
- arama
- filtre
- yeni villa ekleme
- villa duzenleme
- durum degistirme: aktif / pasif / taslak

### Villa Yeni `/panel/villalar/yeni`

Form alanlari:
- temel bilgiler
- fiyat
- ozellikler
- aciklama
- gorseller
- musaitlik
- SEO alanlari

### Villa Duzenle `/panel/villalar/[id]`

Sekmeler:
- genel bilgiler
- medya
- fiyatlandirma
- indirimler
- musaitlik
- SEO

### Talepler `/panel/talepler`

Alanlar:
- talep listesi
- villa bazli filtre
- tarih araligi filtreleri
- durum filtreleri
- talep detayi
- talep durumu guncelleme

Talep durumlari:
- `NEW`
- `CONTACT_PENDING`
- `CONTACTED`
- `OFFER_SENT`
- `CONFIRMED`
- `CANCELLED`

### Fiyatlandirma `/panel/fiyatlar`

Yonetilecekler:
- standart gecelik fiyat
- tarih aralikli ozel fiyat
- minimum gece
- maksimum gece

### Indirimler `/panel/indirimler`

Yonetilecekler:
- villa bazli indirim
- tarih bazli indirim
- yuzdelik veya sabit indirim
- vitrin etiketi: `%20 indirim`, `Erken rezervasyon`

### Kuponlar `/panel/kuponlar`

Yonetilecekler:
- kupon kodu
- indirim orani
- baslangic ve bitis tarihi
- kullanim limiti
- aktif / pasif durumu

### Personel `/panel/personel`

Sadece admin gorecek.

Yonetilecekler:
- yeni personel ekleme
- personel pasife alma
- sifre yenileme
- rol durumu

### Raporlar `/panel/raporlar`

Rapor basliklari:
- villa bazli talep sayisi
- villa bazli goruntulenme
- villa bazli donusum
- villa bazli gelir
- tarih araligina gore performans

### Ayarlar `/panel/ayarlar`

- site genel ayarlari
- iletisim bilgileri
- sosyal medya
- SEO varsayilanlari

## 7. Onerilen Route Agaci

```text
src/app
├── (public)
│   ├── page.tsx                           -> /
│   ├── villalar
│   │   ├── page.tsx                       -> /villalar
│   │   └── [slug]
│   │       └── page.tsx                   -> /villalar/[slug]
│   ├── kampanyalar
│   │   └── page.tsx                       -> /kampanyalar
│   ├── hakkimizda
│   │   └── page.tsx                       -> /hakkimizda
│   ├── sss
│   │   └── page.tsx                       -> /sss
│   ├── iletisim
│   │   └── page.tsx                       -> /iletisim
│   ├── blog
│   │   ├── page.tsx                       -> /blog
│   │   └── [slug]
│   │       └── page.tsx                   -> /blog/[slug]
│   ├── talep
│   │   └── page.tsx                       -> /talep
│   └── kampanya
│       └── [slug]
│           └── page.tsx                   -> /kampanya/[slug]
├── panel
│   ├── giris
│   │   └── page.tsx                       -> /panel/giris
│   ├── layout.tsx
│   ├── page.tsx                           -> /panel
│   ├── villalar
│   │   ├── page.tsx                       -> /panel/villalar
│   │   ├── yeni
│   │   │   └── page.tsx                   -> /panel/villalar/yeni
│   │   └── [id]
│   │       ├── page.tsx                   -> /panel/villalar/[id]
│   │       ├── duzenle
│   │       │   └── page.tsx               -> /panel/villalar/[id]/duzenle
│   │       └── fiyatlar
│   │           └── page.tsx               -> /panel/villalar/[id]/fiyatlar
│   ├── talepler
│   │   ├── page.tsx                       -> /panel/talepler
│   │   └── [id]
│   │       └── page.tsx                   -> /panel/talepler/[id]
│   ├── fiyatlar
│   │   └── page.tsx                       -> /panel/fiyatlar
│   ├── indirimler
│   │   └── page.tsx                       -> /panel/indirimler
│   ├── kuponlar
│   │   └── page.tsx                       -> /panel/kuponlar
│   ├── personel
│   │   └── page.tsx                       -> /panel/personel
│   ├── raporlar
│   │   └── page.tsx                       -> /panel/raporlar
│   └── ayarlar
│       └── page.tsx                       -> /panel/ayarlar
└── api
    ├── auth
    ├── villas
    ├── requests
    ├── coupons
    ├── pricing
    ├── discounts
    └── analytics
```

## 8. Bilesen Katmanlari

### Layout Bilesenleri

- `Header`
- `Footer`
- `Container`
- `SectionHeading`
- `CTASection`

### Villa Bilesenleri

- `VillaCard`
- `VillaGallery`
- `VillaFeatureList`
- `VillaPriceBox`
- `VillaAvailabilityCalendar`
- `RelatedVillas`

### Form Bilesenleri

- `DateRangePicker`
- `GuestSelector`
- `CouponInput`
- `RequestForm`

### Panel Bilesenleri

- `Sidebar`
- `Topbar`
- `StatsCard`
- `DataTable`
- `StatusBadge`
- `PriceEditor`
- `DiscountEditor`

## 9. Veritabani Taslagi

Asagidaki model yapisi ilk faz icin yeterli ve genislemeye uygun.

### 9.1 Users

`users`
- `id`
- `name`
- `email`
- `password_hash`
- `role` -> `ADMIN | STAFF`
- `is_active`
- `created_at`
- `updated_at`

Not:
- Uygulama mantigi ikinci bir `ADMIN` olusturulmasini engeller.

### 9.2 Villas

`villas`
- `id`
- `title`
- `slug`
- `short_description`
- `description`
- `city`
- `district`
- `address`
- `latitude`
- `longitude`
- `capacity`
- `bedroom_count`
- `bathroom_count`
- `pool_type`
- `nightly_base_price`
- `currency`
- `status` -> `DRAFT | ACTIVE | PASSIVE`
- `featured`
- `seo_title`
- `seo_description`
- `seo_keywords`
- `created_by_user_id`
- `created_at`
- `updated_at`

### 9.3 Villa Media

`villa_images`
- `id`
- `villa_id`
- `url`
- `alt_text`
- `sort_order`
- `is_cover`
- `created_at`

### 9.4 Ozellikler

`amenities`
- `id`
- `name`
- `icon`

`villa_amenities`
- `id`
- `villa_id`
- `amenity_id`

### 9.5 Musaitlik ve Takvim

`villa_availability_blocks`
- `id`
- `villa_id`
- `start_date`
- `end_date`
- `block_type` -> `AVAILABLE | UNAVAILABLE | MAINTENANCE | RESERVED`
- `note`
- `created_by_user_id`

Bu tablo sayesinde:
- musait gunler
- kapali tarihler
- bakim gunleri
- daha sonra rezervasyon bloklari
yonetilebilir.

### 9.6 Fiyatlandirma

`villa_seasonal_prices`
- `id`
- `villa_id`
- `start_date`
- `end_date`
- `nightly_price`
- `min_nights`
- `max_nights`
- `created_by_user_id`
- `created_at`

Kurallar:
- Eger secilen tarih araliginda aktif sezon fiyati varsa onu kullan.
- Yoksa `nightly_base_price` kullan.

### 9.7 Indirimler

`villa_discounts`
- `id`
- `villa_id`
- `name`
- `discount_type` -> `PERCENTAGE | FIXED`
- `discount_value`
- `start_at`
- `end_at`
- `label`
- `is_active`
- `created_by_user_id`
- `created_at`

Ekranda gosterim:
- eski fiyat ustu cizili
- yeni fiyat vurgulu
- kampanya etiketi gorunur

### 9.8 Kuponlar

`coupon_codes`
- `id`
- `code`
- `description`
- `discount_type` -> `PERCENTAGE | FIXED`
- `discount_value`
- `start_at`
- `end_at`
- `usage_limit`
- `used_count`
- `is_active`
- `created_at`

`coupon_redemptions`
- `id`
- `coupon_id`
- `appointment_request_id`
- `discount_amount`
- `created_at`

Not:
- Ilk fazda odeme olmasa da kupon, talep formunda uygulanip yaklasik indirimli teklif hesaplatmak icin kullanilabilir.

### 9.9 Talepler ve Randevu

`appointment_requests`
- `id`
- `villa_id`
- `full_name`
- `phone`
- `email`
- `guest_count`
- `stay_start_date`
- `stay_end_date`
- `preferred_contact_date`
- `preferred_contact_time_range`
- `message`
- `coupon_code_text`
- `estimated_base_amount`
- `estimated_discount_amount`
- `estimated_final_amount`
- `status`
- `source` -> `WEB | PANEL | PHONE`
- `created_at`
- `updated_at`

Bu tablo ilk faz icin yeterli.

Ikinci fazda eklenebilir:
- `payments`
- `bookings`
- `invoices`

### 9.10 Talep Gecmisi

`appointment_request_status_history`
- `id`
- `appointment_request_id`
- `old_status`
- `new_status`
- `changed_by_user_id`
- `created_at`

### 9.11 Analitik

`villa_view_events`
- `id`
- `villa_id`
- `session_id`
- `user_agent`
- `referer`
- `created_at`

`villa_live_sessions`
- `id`
- `villa_id`
- `session_id`
- `last_seen_at`

`revenue_records`
- `id`
- `villa_id`
- `appointment_request_id`
- `amount`
- `currency`
- `recorded_at`

`villa_daily_metrics`
- `id`
- `villa_id`
- `metric_date`
- `view_count`
- `request_count`
- `coupon_usage_count`
- `revenue_total`

Rapor ornekleri:
- en cok goruntulenen villa
- en cok talep alan villa
- en cok donusum alan villa
- en cok gelir getiren villa

### 9.12 Icerik ve SEO

`blog_posts`
- `id`
- `title`
- `slug`
- `excerpt`
- `content`
- `cover_image`
- `seo_title`
- `seo_description`
- `published_at`
- `status`

`site_settings`
- `id`
- `site_name`
- `default_title`
- `default_description`
- `phone`
- `email`
- `address`
- `instagram_url`
- `facebook_url`
- `whatsapp_number`

## 10. Fiyat Hesaplama Mantigi

Onerilen siralama:

1. Secili tarih araligi icin sezonluk fiyat var mi kontrol et.
2. Yoksa villa taban gecelik fiyatini kullan.
3. Villa bazli aktif indirim varsa uygula.
4. Kullanici kupon girmisse kupon kontrol et.
5. Nihai tahmini tutari hesapla.

Formul:
- `ham fiyat = gecelik fiyat x gece sayisi`
- `indirimli fiyat = ham fiyat - aktif indirim`
- `kuponlu fiyat = indirimli fiyat - kupon etkisi`

Public sitede gosterim:
- standart fiyat
- indirim varsa eski fiyat ustu cizili
- "bu tarihler icin gecerli" metni

## 11. SEO Gereksinimleri

Bu proje ilk etapta reklam yerine organik buyume hedefledigi icin SEO cekirdek ozellik olacak.

Gerekli basliklar:
- her sayfa icin ozel `title` ve `description`
- SEO dostu `slug`
- `canonical` etiketleri
- `robots.txt`
- `sitemap.xml`
- `open graph` ve sosyal paylasim gorselleri
- `next/image` ile optimize gorseller
- performans odakli sayfa yapisi
- `schema.org` yapilandirilmis veri

Onerilen JSON-LD tipleri:
- `Organization`
- `BreadcrumbList`
- `FAQPage`
- `BlogPosting`
- `VacationRental` veya uygun `LodgingBusiness` varyanti

Detay sayfalarinda SEO guclendiriciler:
- bolge odakli uzun aciklama
- yakin yerler
- villa ozellikleri
- sik sorulan sorular
- ic linkleme

## 12. Tasarim ve Renk Yonu

### Gorsel Yon

Kurumsal ama tatil hissi guclu bir arayuz.

Ana prensipler:
- ferah bosluk kullanimi
- buyuk fotograf alanlari
- premium ama sicak his
- net CTA butonlari
- mobilde temiz ve hizli deneyim

### Onerilen Renk Paleti

- Deniz turkuazi: `#0F766E`
- Canli aqua: `#14B8A6`
- Kum beji: `#F5E6C8`
- Gunes altini: `#F59E0B`
- Koyu metin: `#1F2937`
- Kirik beyaz: `#FFFDF8`

### Header Yapisi

- sol: logo
- orta: ana menuler
- sag: telefon / WhatsApp / CTA

Menu:
- Ana Sayfa
- Villalar
- Kampanyalar
- Hakkimizda
- Blog
- Iletisim

Ana CTA:
- `Talep Olustur`

### Footer Yapisi

- logo ve kisa kurumsal metin
- hizli linkler
- villa kategorileri
- iletisim bilgileri
- sosyal medya
- KVKK / gizlilik / kullanim kosullari

## 13. MVP Yol Haritasi

### Faz 1

- auth ve roller
- public site sayfalari
- villa ekleme / listeleme / detay
- talep formu
- fiyat ve indirim sistemi
- kupon altyapisi
- temel dashboard
- temel SEO

### Faz 2

- online odeme
- rezervasyon ve kesinlestirme
- gelismis raporlar
- e-posta / WhatsApp otomasyonlari
- daha gelismis canli ilgi gostergeleri

## 14. Ilk Kurulumda Olusturulacak Klasorler

```text
src/
  app/
  components/
  features/
    villas/
    requests/
    pricing/
    coupons/
    auth/
    dashboard/
  lib/
  server/
  types/
  styles/
prisma/
docs/
public/
```

## 15. Sonuc

Bu blueprint ile proje su omurga uzerine kurulacak:
- SEO odakli public site
- admin + staff rollerine sahip panel
- talep / randevu odakli ilk faz
- fiyat, indirim ve kupon yonetimi
- villa bazli performans ve gelir raporlari

Bir sonraki dogal adim:
- `Prisma schema` taslagi
- `Next.js` proje kurulumu
- temel route ve layout iskeletinin olusturulmasi
