# Gercek iCal senkronizasyonu

## Kullanim

1. Panel > Takvim Senkronizasyon > iCal Kaynaklari ekraninda villayi secin.
2. Kanal adi ve karsi platformun verdigi ozel iCal/ICS baglantisini girin; yonu
   Ice Aktarim olarak birakin. Genel ilan sayfasi veya giris sayfasi olmaz.
3. Manuel Senkron dugmesine basin. Sonuc eklenen, guncellenen, kaldirilan ve
   cakisan blok sayilarini gosterir. Kaynak sagligi elle degistirilemez.
4. Villa doluluk ekraninda kaynaga bagli bloklar gorunur. Public arama, detay
   takvimi ve talep dogrulamasi bu bloklari kullanir. Cikis gunu musait kalir.

Her UID kaynak bazinda eslestirilir; ayni takvimi tekrar almak mukerrer kayit
uretmez. UID'ler ozetlenerek saklanir; uzak takvimdeki kisi adi, aciklama ve
iletisim bilgileri kaydedilmez. URL'ler erisim anahtari icerebilir; herkese
acik yerlere veya loglara kopyalamayin.

Basarili tam takvimde kaybolan veya CANCELLED/TRANSPARENT olan kayitlarin sadece
o kaynaga ait bloklari kaldirilir. Gecerli bos VCALENDAR da o kaynagi bosaltir.
Manuel bloklar, onayli rezervasyonlar ve diger kaynaklar silinmez. Cakisma varsa
iki blok da korunur, WARNING logu olusur; sistem rezervasyonu otomatik iptal etmez.

HTTP hatasi, timeout, gecersiz/eksik ICS veya veritabani hatasi dolulugu bosaltmaz.
Son basarili aktarim zamani ayni kalir, hata loglanir. Kaynagi pasife almak eski
bloklari silmez. URL degistiginde yeni takvim basariyla alinana kadar eski bloklar
korunur. Bir kaynak ayni anda yalnizca tek islem tarafindan senkronize edilir;
islem sirasinda URL/aktiflik degisirse eski indirme sonucu uygulanmaz.

## Disa aktarim ve sinirlar

Villa duzenleme ekranindaki imzali iCal baglantisini karsi platforma ekleyin.
Bu, uzak platforma push API cagrisi degildir; platform baglantiyi kendi kontrol
araliginda okur. iCal anlik channel manager degildir, gecikmeli senkron nedeniyle
eszamanli rezervasyon riski tamamen ortadan kalkmaz.

Export yalnizca sistemin kendi rezervasyonlari ve manuel bloklarini yayinlar.
Ice aktarilan bloklar tekrar export edilmez; boylece silinen kayitlarin karsilikli
aynalama ile sonsuza kadar dolu kalmasi engellenir. Bir kanaldan gelen rezervasyon
bu surumde diger kanallara yeniden dagitilmaz. Kanal Eslestirmeleri referans
kayitlaridir; aktarimi iCal Kaynaklari kaydinin aktifligi belirler.

Desteklenen profil: VCALENDAR 2.0, ayri UID'li VEVENT konaklamalari, tum gun DATE,
UTC veya IANA saat dilimli DATE-TIME. Floating saatler Europe/Istanbul kabul
edilir. DATE kaydinda DTEND yoksa bir gun; saatli kayitta DTEND zorunludur.
Saatli araliklar villa takviminde gun/gece duzeyine indirilir.

RRULE/RDATE/EXDATE/RECURRENCE-ID, DURATION, ozel IANA-disi saat dilimleri ve
METHOD:CANCEL gibi parcali bildirimler desteklenmez. Bunlar sessizce atlanmaz;
aktarim tumden reddedilir ve eski doluluk korunur. Standart konaklama bazli
iCal export kullanin. Her indirmede 2 MB / 2000 etkinlik, 15 saniye ve en fazla
3 yonlendirme siniri vardir. Bu limitler villa fotograf yuklemelerine uygulanmaz.
Sikistirilmis HTTP yaniti kabul edilmez; istemci identity encoding ister.

Yalnizca genel HTTP/HTTPS adresleri indirilir (webcal -> HTTPS). Yerel/ozel IP,
metadata adresleri, ozel port, URL icinde kullanici bilgisi ve HTTPS'ten HTTP'ye
yonlendirme reddedilir. DNS sonucu sokete sabitlenir; her yonlendirme yeniden
kontrol edilir. Sunucuda dis ag/egress kurallariyla ek koruma onerilir.

## Sunucu kurulumu

Bu kodun GitHub'a gonderilmesi tek basina zamanlayiciyi baslatmaz. Canliya
baglanilmadi; asagidaki islemleri sunucuyu yoneten kisi uygulamalidir.

1. Veritabani ve yukleme dizininin yedegini alin. Once staging'de uygulayin.
2. Kodlari alin ve `npm ci` calistirin.
3. `npm run prisma:validate` ve `npm run prisma:db:push` calistirin. Yeni alanlar:
   VillaAvailabilityBlock.calendarSourceId/externalEventId ve CalendarSyncSource
   lastAttemptAt/nextSyncAt/syncLeaseToken/syncLeaseUntil. Bunlar mevcut alanlari
   silmez. Projede versioned migration zinciri henuz yok; veri kaybi uyarisi
   cikarsa durun. `--accept-data-loss` veya canli veride seed kullanmayin.
4. `openssl rand -hex 32` ile AYRI bir CALENDAR_SYNC_SECRET uretin. Uygulama ve
   zamanlayici ayni degeri kullanmali. Git'e eklemeyin. SESSION_SECRET veya
   ICAL_SIGNING_SECRET degerini bu is icin degistirmeyin.
5. `npm run build` ve uygulama servisini yeniden baslatma adimini uygulayin.
   Production fallback'i kullanmaz; PostgreSQL zorunludur. Semayi uygulamadan
   yeni surumu baslatmayin.
6. Gercek bir deneme villasina kanal baglantisi ekleyin, Manuel Senkron ile
   kontrol edin. Tarih degisimi/iptal/hatali URL senaryolarini staging'de deneyin.

### Otomatik calistirma

`POST /api/internal/calendar-sync`, `Authorization: Bearer CALENDAR_SYNC_SECRET`
ister. Panel cookie'si yeterli degildir; eksik/kisa gizli anahtarda endpoint
kapalidir. Her cagrida zamani gelen en fazla 10 aktif kaynak sirayla islenir;
3 dakikalik isleme butcesinden sonra kalanlar sonraki cagrida alinir. Her deneme
sonraki otomatik denemeyi en az 15 dakika erteler. Basarisiz kayit digerlerini
durdurmaz. Kaynak bazli lease birden fazla uygulama surecinde de calisir.

`scripts/sync-calendars.mjs` bu endpoint'i cagirir. Ortaminda ayni
CALENDAR_SYNC_SECRET ve APP_URL veya CALENDAR_SYNC_APP_URL olmali. Bu script
`.env` dosyasini otomatik okumaz; servis yoneticisinden ortami yukleyin. Yerelde
Node 20.6+ ile `node --env-file=.env.local scripts/sync-calendars.mjs` kullanilabilir.
Sonucta hata varsa script 1 koduyla cikar; ayrinti panelin Senkron Loglari'ndadir.

Ornek systemd servis dosyasi (sunucunun kullanici/dizin/Node yoluna uyarlayin):

```ini
# /etc/systemd/system/villaweb-calendar-sync.service
[Unit]
Description=VillaWeb calendar sync
After=network-online.target

[Service]
Type=oneshot
User=dgtl
WorkingDirectory=/home/dgtl/VillaWeb
EnvironmentFile=/etc/villaweb-calendar-sync.env
ExecStart=/usr/bin/node /home/dgtl/VillaWeb/scripts/sync-calendars.mjs
TimeoutStartSec=300
```

```ini
# /etc/systemd/system/villaweb-calendar-sync.timer
[Unit]
Description=Poll due VillaWeb calendars

[Timer]
OnBootSec=2min
OnUnitInactiveSec=1min
Unit=villaweb-calendar-sync.service

[Install]
WantedBy=timers.target
```

`/etc/villaweb-calendar-sync.env` root sahipliginde 0600 izinli olmali; iki deger:
CALENDAR_SYNC_APP_URL (ornegin http://127.0.0.1:3000) ve CALENDAR_SYNC_SECRET.
Uygulama surecine de ayni CALENDAR_SYNC_SECRET tanimlanmali. Nginx uzerinden
cagriliyorsa timeout degerleri isin suresini karsilamali; loopback dogrudan
uygulamaya cagrida dis proxy timeout'una bagimli olunmaz.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now villaweb-calendar-sync.timer
sudo systemctl start villaweb-calendar-sync.service
sudo systemctl status villaweb-calendar-sync.timer
sudo journalctl -u villaweb-calendar-sync.service -n 50 --no-pager
```

Varsayilan batch buyuk kurulumda gecikme yaratabilir; Son Deneme tarihlerini
izleyin. Eski demo SUCCESS loglari gercek kanal aktariminin kaniti degildir.
Yeni kaynak ekledikten sonra gorunen yeni deneme/sonuc zamanini kontrol edin.

## Yerel gelistirme ve test

Fallback senkron durumu ve bloklari Git disindaki
`data/development-calendar-sync.json` dosyasinda atomik kaydedilir. Manuel villa
verilerine kopyalanmaz. Bu yerel dosya modu tek uygulama sureci icindir; canlida
cok surecli guvence PostgreSQL transaction ve kaynak lease'i ile saglanir.

`npm test` parser, adres guvenligi, yonlendirme/DNS sabitleme, kayit degisikligi,
iptal, bos takvim, cakisma, eszamanli deneme ve rollback senaryolarini kapsar.
PostgreSQL dalinin unit testinde sahte DB kullanilir; gercek PostgreSQL/staging
testi yerine gecmez. `npm run test:smoke` izole fixture uzerinde public talep,
checkout, silme korumasi, export ve zamanlayici yetkisini kontrol eder. Ag
aktarimi testlerde kontrollu fixture ile degistirilir; gercek kanal hesabi ve
canli zamanlayici kurulumu burada dogrulanmamistir.

Kontrol sirasinda mevcut Next.js/Sharp bagimliliklari icin npm audit guvenlik
uyarilari da goruldu. Yeni ical.js/ipaddr.js paketleri audit bulgusu uretmedi.
Framework guvenlik guncellemesi ayri bir oncelikli yayin isi olarak ele alinmali;
bu ozelligin testlerinin gecmesi tum bagimliliklarin guvenli oldugu anlamina gelmez.
