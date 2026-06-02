# PostgreSQL + Prisma Production Plan

Bu dokuman, mevcut `JSON` tabanli demo yapinin gercek cok firmali bir mimariye nasil tasinacagini netlestirir.

## Hedef Mimari

- Veritabani: `PostgreSQL`
- ORM: `Prisma`
- Mimari: `multi-tenant`
- Temel izolasyon anahtari: `companyId`
- Rol modeli:
  - `PLATFORM_OWNER`
  - `PLATFORM_ADMIN`
  - `COMPANY_USER`
- Firma ici uyelik rolleri:
  - `COMPANY_ADMIN`
  - `SALES`
  - `OPERATIONS`
  - `FINANCE`
  - `CRM`
  - `CONTENT`
  - `VILLA_MANAGER`

## Veri Omurgasi

Gercek uretim verisi artik su eksenlerde modellenir:

- Platform:
  - `PlatformSetting`
  - `User`
  - `AuthSession`
  - `PasswordResetToken`
- Tenant:
  - `Company`
  - `CompanyMembership`
  - `CompanySetting`
  - `CompanyWebsite`
- Portfoy:
  - `Region`
  - `Airport`
  - `Amenity`
  - `Villa`
  - `VillaImage`
  - `VillaAmenity`
  - `VillaAvailabilityBlock`
  - `VillaPricingRule`
- Ticari akis:
  - `Campaign`
  - `CampaignVilla`
  - `Coupon`
  - `CouponVilla`
  - `CouponRedemption`
  - `BookingRequest`
  - `BookingRequestStatusHistory`
  - `OperationTask`
  - `Invoice`
  - `Payment`
  - `CashLedgerEntry`
- CRM ve analitik:
  - `GuestReview`
  - `VillaViewEvent`
  - `VillaLiveSession`
  - `VillaDailyMetric`
- Kanal ve organizasyon:
  - `Agency`
  - `Branch`
  - `InternalMessage`
  - `CommissionRule`
  - `CalendarSyncSource`
  - `CalendarSyncMapping`
  - `CalendarSyncLog`
- Icerik ve SEO:
  - `LandingPage`
  - `SeoContent`
  - `BlogPost`
- Denetim:
  - `AuditLog`

## Demo Store -> Prisma Esleme

- `data/demo-villas.json`
  - `Company`
  - `CompanyWebsite`
  - `Region`
  - `Villa`
  - `VillaImage`
  - `VillaAvailabilityBlock`
- `data/demo-pricing.json`
  - `Villa`
  - `VillaPricingRule`
- `data/demo-discounts.json`
  - `Campaign`
  - `CampaignVilla`
- `data/demo-coupons.json`
  - `Coupon`
  - `CouponVilla`
  - `CouponRedemption`
- `data/demo-requests.json`
  - `BookingRequest`
  - `BookingRequestStatusHistory`
  - `Invoice`
  - `Payment`
  - `GuestReview`
- `data/demo-operation-tasks.json`
  - `OperationTask`
- CRM / Muhasebe / Web / Sync dosyalari
  - ilgili alt modellerin uretim karsiliklarina tasinir

## Seed Stratejisi

`prisma/seed.cjs` sunlari olusturur:

- 1 platform owner
- 1 platform admin
- 2 demo firma
- her firma icin:
  - ayarlar
  - primary website
  - bolgeler
  - villalar
  - kampanya / kupon
  - talep / rezervasyon
  - operasyon gorevi
  - muhasebe kayitlari
  - CRM / yorum
  - ajans / sube / mesaj
  - landing / SEO / blog
  - takvim senkron verisi

Boylece staging ya da ilk local kurulumda panelin ana modulleri bos acilmaz.

## Uretime Gecis Sirasi

1. `Prisma schema` ve `seed` ile kalici veri katmanini sabitle.
2. Auth katmanini demo `users.ts` listesinden al ve `User + AuthSession + CompanyMembership` ustune tasi.
3. `getPanelCompanyScope()` ve public company cozumunu veritabanindan okuyan bir tenant resolver'a cevir.
4. Modul modul JSON store yerine repository katmani kullan:
   - Villalar
   - Talepler / rezervasyonlar
   - Fiyat / kampanya / kupon
   - Operasyon
   - Muhasebe
   - CRM
   - Web / SEO
   - Takvim sync
5. En son demo fallback kodlarini temizle.

## Kritik Kurallar

- Her firma verisi mutlaka `companyId` ile scope edilmeli.
- Public site domain ya da subdomain uzerinden tek bir `CompanyWebsite` kaydina baglanmali.
- Platform admin ve firma admin sorgulari ayni repository uzerinden ama farkli scope kurallariyla calismali.
- `AuditLog` ve `BookingRequestStatusHistory` gibi kayitlar kritik akislar icin zorunlu tutulmali.

## Bu Turdan Sonra En Dogru Adim

Gercek auth ve repository migration'ina gecmek.

Oncelik sirasi:

1. `User / session / company membership`
2. `Villa repository`
3. `BookingRequest + pricing engine`
4. `Panel modullerini Prisma ile besleme`
