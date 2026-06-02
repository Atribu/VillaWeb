# VillaWeb

Cok firmali villa kiralama vitrini ve backoffice platformu.

Uygulama artik calisan runtime seviyesinde `PostgreSQL + Prisma` kullanir.

- public vitrin firma bazli veriyi veritabanindan okur
- panel modulleri firma scope ile veritabanina yazar/okur
- kimlik dogrulama verisi kullanici ve membership modelleri uzerinden cozulur
- gorsel upload tarafinda dosyalar yerel olarak `public/uploads/villas` altinda tutulur

## Teknik Yigin

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `PostgreSQL`
- `Prisma`

## Multi-Tenant Mantik

Uretim tarafinda sistem artik `companyId` temelli calisacak.

- her firma kendi verisini gorur
- firmalar birbirinin villasini, talebini, kuponunu, muhasebesini goremez
- public site tarafinda her firma kendi `CompanyWebsite` kaydina baglanir
- platform owner / platform admin butun tenant'leri gorebilir

## Prisma Kurulumu

1. `.env.example` icindeki degerleri kendi ortamina gore kopyala.
2. PostgreSQL veritabanini hazirla.
3. Su komutlari calistir:

```bash
npm run prisma:validate
npm run prisma:generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/villaweb?schema=public" npm run prisma:db:push
npm run prisma:seed
```

Prod benzeri deploy akisi icin:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

## Seed Ile Gelen Baslangic Verisi

- 1 platform owner
- 1 platform admin
- 2 demo firma:
  - `VillaVera Collection`
  - `Sahil Collection Villas`
- firma bazli:
  - website
  - region / airport
  - villa / galeri / availability
  - pricing / campaign / coupon
  - booking request / operation task
  - invoice / payment / cash entry
  - review / analytics
  - agency / branch / message / commission
  - landing / SEO / blog
  - calendar sync

## Gelistirme Komutlari

```bash
npm run dev
npm run build
npm run lint
npm run prisma:validate
npm run prisma:generate
npm run prisma:db:push
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:seed
```

## Demo Hesaplari

- `super-admin` / `VillaSuper2026!`
- `villavera-admin` / `VillaAdmin2026!`
- `villavera-personel` / `VillaStaff2026!`
- `sahil-admin` / `SahilAdmin2026!`
- `sahil-finance` / `SahilFinans2026!`

Bu kullanicilar `prisma seed` ile veritabanina yazilir.

## Onemli Notlar

- Build su anda veritabanina bagimli static prerender zorunlulugu tasimaz; public layout dinamik calisir.
- Gercek yayinda `DATABASE_URL` ve `SESSION_SECRET` ortama tanimlanmalidir.
- Localde `prisma:seed` komutunun basarili olmasi icin PostgreSQL servisinin calisiyor olmasi gerekir.

Detayli gecis plani:

- [docs/postgresql-prisma-production-plan.md](docs/postgresql-prisma-production-plan.md)
