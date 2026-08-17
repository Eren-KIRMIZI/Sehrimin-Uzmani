# Sehrinin Uzmani

Yerel hizmet pazaryeri platformu. Insanlarin yasadiklari sehrde ihtiyac duydugunu uzmani, hizmet saglayiciyi veya profesyoneli kolayca bulmasini; uzmanlarin ise kendi hizmetlerini, calisma bolgelerini, fiyatlarini ve uygunluk durumlarini sergileyerek yeni musteri ulasmasini saglayan modern marketplace platformu.

---

## Mimari

```
                    +-------------------+
                    |     CLIENT        |
                    |  React + TS + TW  |
                    +---------+---------+
                              |
                         REST / WebSocket
                              |
                    +---------v---------+
                    |     FastAPI       |
                    |    Python 3.11    |
                    +---------+---------+
                              |
       +-----------+----------+----------+-------------+------------+
       |           |          |          |             |            |
       v           v          v          v             v            v
     AUTH      MARKETPLACE   CHAT    MATCHING       ADMIN      PAYMENTS
       |           |          |          |             |            |
       +-----------+----------+----------+-------------+------------+
                              |
                    +---------v---------+
                    |      Redis        |
                    |    Memurai        |
                    +-------------------+
                              |
                    +---------v---------+
                    |    MSSQL Server   |
                    +-------------------+
```

Moduler monolith mimarisi ile baslandi. Her domain modulu kendi klasorunde organize. Ileride gereken durumlarda servisleri ayirabilecek esneklik mevcut.

---

## Teknoloji Yiginlari

### Backend

| Katman | Teknoloji |
|--------|-----------|
| Framework | FastAPI 0.115 |
| Dil | Python 3.11 |
| ORM | SQLAlchemy 2.0 |
| Veritabani | Microsoft SQL Server |
| Cache / Queue | Redis Memurai |
| Authentication | JWT (access + refresh token) |
| Password Hashing | bcrypt via passlib |
| Validation | Pydantic v2 |
| API Docs | OpenAPI / Swagger |

### Frontend

| Katman | Teknoloji |
|--------|-----------|
| Framework | React 19 |
| Dil | TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Server State | TanStack Query |
| HTTP Client | Axios |
| Routing | React Router v7 |
| Harita | Leaflet + React-Leaflet |
| Icon | Lucide React |
| Utility | date-fns, clsx |

---

## Proje Yapisi

```
sehriminUzmani/
|
+-- .gitignore
+-- README.md
+-- V1-CHANGELOG.md
+-- V2-CHANGELOG.md
+-- V3-CHANGELOG.md
|
+-- backend/
|   +-- app/
|   |   +-- main.py                     FastAPI uygulama girisi
|   |   +-- seed.py                     Veri tohumlama (sehirler, kategoriler, planlar)
|   |   |
|   |   +-- core/
|   |   |   +-- config.py               Uygulama ayarlari (Pydantic Settings)
|   |   |   +-- database.py             SQLAlchemy engine ve session yonetimi
|   |   |   +-- redis.py                Redis baglanti yonetimi
|   |   |   +-- security.py             JWT uretimi, sifre hashleme, yetkilendirme
|   |   |   +-- exceptions.py           Ozel hata siniflari
|   |   |
|   |   +-- api/
|   |   |   +-- router.py               Tum API routerlarini birlestiren merkezi router
|   |   |
|   |   +-- shared/
|   |   |   +-- enums.py                Tum enum tanimlari (18 enum)
|   |   |   +-- pagination.py           Sayfalama yapisi
|   |   |   +-- utils.py                Yardimci fonksiyonlar (haversine, vb.)
|   |   |
|   |   +-- websocket/
|   |   |   +-- manager.py              WebSocket baglanti yonetimi
|   |   |
|   |   +-- modules/
|   |       +-- auth/                   Kimlik dogrulama (register, login, JWT, refresh)
|   |       +-- users/                  Kullanici yonetimi
|   |       +-- providers/              Uzman profilleri, hizmetler, portfoy, musaitlik, dogrulama
|   |       +-- categories/             Kategori hiyerarsisi (3 seviye)
|   |       +-- locations/              Sehir ve ilce verileri
|   |       +-- search/                 Arama, filtreleme, AI kategori algilama, eslestirme
|   |       +-- requests/               Hizmet talepleri
|   |       +-- quotes/                 Teklif sistemi
|   |       +-- appointments/           Randevu yonetimi
|   |       +-- reviews/                Yorum ve puanlama
|   |       +-- favorites/              Favori listesi
|   |       +-- notifications/          Bildirim sistemi
|   |       +-- messaging/              Gercek zamanli mesajlasma
|   |       +-- commissions/            Komisyon sistemi, kazanc takibi, odemeler
|   |       +-- disputes/               Anlasmazlik cozum sistemi
|   |       +-- subscriptions/          Abonelik planlari ve yonetimi
|   |       +-- promotions/             Promoted provider (one cikarilmis uzman)
|   |       +-- admin/                  Admin paneli endpointleri
|   |       +-- integrations/           Harita, odeme, eposta entegrasyonlari
|   |
|   +-- migrations/                     Veritabani goc dosyalari
|   +-- tests/                          Test dosyalari
|   +-- requirements.txt                Python bagimliliklari
|   +-- .env                            Ortam degiskenleri (git disinda)
|   +-- .env.example                    Ortam degiskenleri sablonu
|
+-- frontend/
    +-- src/
    |   +-- main.tsx                    Uygulama girisi
    |   +-- App.tsx                     Rota tanimlari (18 rota)
    |   +-- index.css                   Global stiller, Tailwind tema, animasyonlar
    |   |
    |   +-- types/                      TypeScript arayuz tanimlari (25+ interface)
    |   +-- services/                   API istemcisi (Axios + JWT interceptor)
    |   +-- stores/                     Zustand durum depolari (auth, location)
    |   |
    |   +-- components/
    |   |   +-- layout/                 Navbar, Footer, Layout
    |   |   +-- map/                    Leaflet harita bileseni
    |   |
    |   +-- pages/
    |       +-- HomePage.tsx            Ana sayfa (Hero, Kategoriler, Onerilenler, Sehirler)
    |       +-- SearchPage.tsx          Arama ve filtreleme (grid/list, skeleton)
    |       +-- MapSearchPage.tsx       Harita + liste gorunumu
    |       +-- ProviderProfilePage.tsx Uzman profili (Hizmetler, Yorumlar, Hakkinda)
    |       +-- ServiceRequestForm.tsx  10 adimli hizmet talebi formu
    |       +-- ChatPage.tsx            Gercek zamanli mesajlasma (WebSocket)
    |       +-- PricingPage.tsx         Abonelik planlari
    |       +-- EarningsPage.tsx        Kazanc takibi
    |       +-- PromotionsPage.tsx      Tanitim kampanyalari
    |       +-- DisputesPage.tsx        Anlasmazlik yonetimi
    |       +-- auth/                   Giris ve kayit sayfalari
    |       +-- dashboard/              Kullanici paneli (V3 ile genisletildi)
    |       +-- admin/                  Admin dashboard (istatistik, yonetim)
    |
    +-- package.json                    Node bagimliliklari
    +-- vite.config.ts                  Vite yapilandirmasi (proxy + Tailwind)
    +-- tsconfig.json                   TypeScript ayarlari
    +-- index.html                      HTML sablonu
```

---

## Veritabani Tablolari

### Temel Tablolar

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| users | Tum kullanicilar | email, phone, password_hash, role, subscription_plan, commission_discount |
| provider_profiles | Uzman profilleri | user_id (FK), business_name, rating, verification_level, hourly_rate |
| categories | Ana kategoriler | name, slug, icon |
| subcategories | Alt kategoriler | category_id (FK), name, slug |
| services | Hizmet turleri | subcategory_id (FK), name, slug |
| provider_services | Uzman-hizmet iliskisi | provider_id (FK), service_id (FK), starting_price |

### Konum Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| cities | 81 il | name, plate_code |
| districts | Ilceler | city_id (FK), name |
| provider_locations | Uzman calisma bolgeleri | provider_id (FK), city_id (FK), district_id (FK) |

### Is Akis Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| service_requests | Hizmet talepleri | customer_id (FK), title, status, urgency, budget_min/max |
| quotes | Teklifler | request_id (FK), provider_id (FK), price, status |
| appointments | Randevular | request_id (FK), provider_id (FK), customer_id (FK), start_at, status |
| reviews | Yorumlar | provider_id (FK), rating, communication_rating, quality_rating |
| favorites | Favoriler | user_id (FK), provider_id (FK) |

### Iletisim Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| conversations | Mesajlasma odalari | customer_id (FK), provider_id (FK) |
| messages | Mesajlar | conversation_id (FK), sender_id (FK), content, message_type |
| notifications | Bildirimler | user_id (FK), type, title, is_read |

### Finansal Tablolar (V3)

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| commission_rates | Komisyon oranlari | category_id (FK), rate, min_amount, is_active |
| transactions | Islemler | provider_id (FK), amount, commission_amount, provider_earning, status |
| provider_earnings | Uzman kazanclari | provider_id (FK), total_earned, pending_amount, paid_amount |
| payout_requests | Odeme talepleri | provider_id (FK), amount, iban, bank_name, status |

### Abonelik Tablolari (V3)

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| subscription_plans | Abonelik planlari | name, slug, price_monthly, commission_discount, badge_type |
| plan_features | Plan ozellikleri | plan_id (FK), feature_name, is_included |
| provider_subscriptions | Uzman abonelikleri | provider_id (FK), plan_id (FK), interval, status, expires_at |
| subscription_payments | Abonelik odemeleri | subscription_id (FK), amount, status |

### Tanitim Tablolari (V3)

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| promoted_providers | One cikarilmis uzmanlar | provider_id (FK), category_id (FK), budget, bid_amount, status |
| promotion_logs | Tanitim loglari | promoted_id (FK), event_type, budget_spent, impressions, clicks |

### Anlasmazlik Tablolari (V3)

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| disputes | Anlasmazliklar | reporter_id (FK), reported_id (FK), reason, status, priority |
| dispute_messages | Anlasmazlik mesajlari | dispute_id (FK), sender_id (FK), message, is_admin |
| dispute_evidence | Anlasmazlik kanitlari | dispute_id (FK), uploaded_by (FK), file_url |

### Yonetim Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| verification_requests | Dogrulama talepleri | provider_id (FK), verification_type, status |
| audit_logs | Audit kayitlari | user_id (FK), action, entity, entity_id |
| provider_availability | Uzman musaitlikleri | provider_id (FK), day_of_week, start_time, end_time |
| portfolio_items | Portfoy ogeleri | provider_id (FK), image_url, title |
| request_files | Talep dosyalari | request_id (FK), file_url, file_type |

---

## API Endpointleri

### Kimlik Dogrulama (Auth)

```
POST   /api/v1/auth/register              Yeni kullanici kaydi
POST   /api/v1/auth/login                 Giris yapma
POST   /api/v1/auth/refresh               Token yenileme
GET    /api/v1/auth/me                    Mevcut kullanici bilgisi
```

### Kullanici (Users)

```
GET    /api/v1/users/me                   Profili goruntuleme
PATCH  /api/v1/users/me                   Profil guncelleme
DELETE /api/v1/users/me                   Hesabi pasiflestirme
```

### Uzman (Providers)

```
POST   /api/v1/providers/profile                      Uzman profili olusturma
GET    /api/v1/providers/me                           Benim uzman profilim
PATCH  /api/v1/providers/me                           Uzman profili guncelleme
GET    /api/v1/providers/{id}                         Uzman profili goruntuleme
POST   /api/v1/providers/services                     Hizmet ekleme
POST   /api/v1/providers/portfolio                    Portfoy ekleme
POST   /api/v1/providers/locations                    Konum ekleme
POST   /api/v1/providers/availability                 Musaitlik ekleme
```

### Uzman Dogrulama (Verification)

```
POST   /api/v1/verification/apply                     Dogrulama icin basvurma
GET    /api/v1/verification/my                        Benim dogrulama taleplerim
GET    /api/v1/verification/pending                   Bekleyen dogrulamalar (admin)
POST   /api/v1/verification/{id}/approve              Dogrulama onaylama (admin)
POST   /api/v1/verification/{id}/reject               Dogrulama reddetme (admin)
```

### Kategori (Categories)

```
GET    /api/v1/categories                             Tum kategoriler
GET    /api/v1/categories/{slug}                      Kategori detayi
GET    /api/v1/categories/{slug}/services             Kategorideki hizmetler
POST   /api/v1/categories/admin                       Kategori olusturma (admin)
POST   /api/v1/categories/admin/{id}/subcategories    Alt kategori olusturma (admin)
POST   /api/v1/categories/admin/subcategories/{id}/services  Hizmet olusturma (admin)
```

### Konum (Locations)

```
GET    /api/v1/locations/cities                       Tum sehirler
GET    /api/v1/locations/cities/{id}/districts        Sehirdeki ilceler
```

### Arama (Search)

```
GET    /api/v1/search/providers                       Uzman arama ve filtreleme
GET    /api/v1/search/autocomplete                    Otomatik tamamlama
POST   /api/v1/search/detect                          AI kategori algilama
```

### AI Eslestirme (Matching)

```
POST   /api/v1/matching/find                          Uzman bul (filtreleme)
POST   /api/v1/matching/ai                            AI destekli eslestirme
GET    /api/v1/matching/recommendations               Oneriler
```

Arama parametreleri: q, category, subcategory, service, city_id, district_id, min_price, max_price, min_rating, verified, lat, lng, radius, sort, page, limit

### Hizmet Talepleri (Requests)

```
POST   /api/v1/requests                               Talep olusturma
GET    /api/v1/requests                               Talepleri listeleme
GET    /api/v1/requests/{id}                          Talep detayi
PATCH  /api/v1/requests/{id}                          Talep guncelleme
DELETE /api/v1/requests/{id}                          Talep silme
```

### Teklifler (Quotes)

```
POST   /api/v1/quotes/requests/{request_id}           Teklif gonderme
GET    /api/v1/quotes/requests/{request_id}           Talepteki teklifler
POST   /api/v1/quotes/{id}/accept                     Teklifi kabul etme
POST   /api/v1/quotes/{id}/reject                     Teklifi reddetme
GET    /api/v1/quotes/my                              Benim tekliflerim
```

### Randevular (Appointments)

```
POST   /api/v1/appointments                           Randevu olusturma
GET    /api/v1/appointments                           Randevulari listeleme
GET    /api/v1/appointments/{id}                      Randevu detayi
PATCH  /api/v1/appointments/{id}                      Randevu guncelleme
POST   /api/v1/appointments/{id}/complete             Randevuyu tamamlama
POST   /api/v1/appointments/{id}/cancel               Randevuyu iptal etme
```

### Yorumlar (Reviews)

```
POST   /api/v1/reviews                                Yorum yapma
GET    /api/v1/reviews/provider/{provider_id}         Uzemandaki yorumlar
```

### Favoriler (Favorites)

```
POST   /api/v1/favorites/{provider_id}                Favoriye ekleme / kaldirma
GET    /api/v1/favorites                              Favorileri listeleme
DELETE /api/v1/favorites/{provider_id}                Favoriden kaldirma
```

### Bildirimler (Notifications)

```
GET    /api/v1/notifications                          Bildirimleri listeleme
GET    /api/v1/notifications/unread-count             Okunmamis bildirim sayisi
POST   /api/v1/notifications/{id}/read                Okundu isaretleme
POST   /api/v1/notifications/read-all                 Hepsi okundu
```

### Mesajlasma (Messaging)

```
POST   /api/v1/messaging/conversations                Conversation olusturma
GET    /api/v1/messaging/conversations                Conversation listesi
GET    /api/v1/messaging/conversations/{id}/messages  Mesajlari listeleme
POST   /api/v1/messaging/conversations/{id}/messages  Mesaj gonderme
GET    /api/v1/messaging/unread-count                 Okunmamis mesaj sayisi
WS     /ws/{token}                                    WebSocket mesajlasma
```

### Komisyon Sistemi (Commissions)

```
GET    /api/v1/commissions/rates                      Komisyon oranlari
POST   /api/v1/commissions/rates                      Komisyon orani olusturma (admin)
DELETE /api/v1/commissions/rates/{id}                 Komisyon orani silme (admin)
GET    /api/v1/commissions/transactions               Islemler
GET    /api/v1/commissions/earnings                   Kazanc ozeti
GET    /api/v1/commissions/earnings/history           Kazanc gecmisi
POST   /api/v1/commissions/payout/request             Odeme talebi
GET    /api/v1/commissions/payout/my                  Odeme taleplerim
GET    /api/v1/commissions/payout/pending             Bekleyen odemeler (admin)
POST   /api/v1/commissions/payout/{id}/approve        Odeme onay (admin)
POST   /api/v1/commissions/payout/{id}/reject         Odeme red (admin)
```

### Anlasmazlik Cozum Sistemi (Disputes)

```
POST   /api/v1/disputes                               Anlasmazlik acma
GET    /api/v1/disputes                               Anlasmazliklarim
GET    /api/v1/disputes/admin/all                     Tum anlasmazliklar (admin)
GET    /api/v1/disputes/{id}                          Anlasmazlik detay
POST   /api/v1/disputes/{id}/messages                 Mesaj ekleme
POST   /api/v1/disputes/{id}/evidence                 Kanit ekleme
POST   /api/v1/disputes/{id}/resolve                  Anlasmazlik cozme (admin)
POST   /api/v1/disputes/{id}/close                    Anlasmazlik kapatma
POST   /api/v1/disputes/{id}/priority                 Oncelik belirleme (admin)
GET    /api/v1/disputes/stats/summary                 Istatistikler (admin)
```

### Abonelik Sistemi (Subscriptions)

```
GET    /api/v1/subscriptions/plans                    Abonelik planlari
POST   /api/v1/subscriptions/plans                    Plan olusturma (admin)
PUT    /api/v1/subscriptions/plans/{id}               Plan guncelleme (admin)
POST   /api/v1/subscriptions/plans/{id}/features      Ozellik ekleme (admin)
POST   /api/v1/subscriptions/subscribe                Abone olma
GET    /api/v1/subscriptions/my                       Abonelik bilgisi
POST   /api/v1/subscriptions/cancel                   Abonelik iptal
GET    /api/v1/subscriptions/payments                 Odemelerim
GET    /api/v1/subscriptions/admin/all                Tum abonelikler (admin)
```

### Tanitim Sistemi (Promotions)

```
POST   /api/v1/promotions                             Tanitim kampanyasi olusturma
GET    /api/v1/promotions/my                          Tanitimlarim
GET    /api/v1/promotions/featured                    One cikarilmis uzmanlar
GET    /api/v1/promotions/leaderboard                 Siralama (admin)
POST   /api/v1/promotions/{id}/pause                  Duraklatma
POST   /api/v1/promotions/{id}/resume                 Devam ettirme
POST   /api/v1/promotions/{id}/cancel                 Iptal etme
POST   /api/v1/promotions/{id}/bid                    Teklif guncelleme
```

### Admin

```
GET    /api/v1/admin/dashboard                        Dashboard istatistikleri
GET    /api/v1/admin/users                            Kullanici listesi
PATCH  /api/v1/admin/users/{id}                       Kullanici guncelleme
GET    /api/v1/admin/providers                        Uzman listesi
PATCH  /api/v1/admin/providers/{id}/verify            Uzman dogrulama
GET    /api/v1/admin/requests                         Talep listesi
GET    /api/v1/admin/reviews                          Yorum listesi
GET    /api/v1/admin/audit-logs                       Audit loglari
```

---

## Rol Tabanli Yetkilendirme

| Rol | Yetkiler |
|-----|----------|
| USER | Profil yonetimi, talep olusturma, teklif kabul/reddet, yorum yapma, favori ekleme, mesajlasma, anlasmazlik acma |
| PROVIDER | Tum USER yetkileri + uzman profili, hizmet ekleme, teklif gonderme, randevu yonetimi, portfoy, kazanc takibi, tanitim kampanyasi |
| ADMIN | Tum yetkiler + kullanici/uzman/kategori/yorum yonetimi, dogrulama onay, komisyon yonetimi, abonelik yonetimi, anlasmazlik cozme, odeme onay |
| MODERATOR | Kismi yonetim yetkileri (anlasmazlik inceleme, yorum moderasyonu) |

---

## Kimlik Dogrulama Akisi

```
Kayit:
  Kullanici bilgileri -> POST /auth/register
  -> Sifre hashlenir (bcrypt)
  -> Kullanici olusturulur
  -> Access token + Refresh token dondurulur

Giris:
  E-posta + sifre -> POST /auth/login
  -> Sifre dogrulanir
  -> Access token + Refresh token dondurulur

Token Yenileme:
  Refresh token -> POST /auth/refresh
  -> Yeni access token + refresh token dondurulur

Yetkilendirme:
  Her istekte Authorization header'da Bearer token gonderilir
  -> Token cozulur, kullanici dogrulanir
  -> Rol kontrolu yapilir
```

---

## Kategori Yapisi

Kategori sistemi 3 seviyelidir ve admin panelinden yonetilir:

```
Ana Kategori (ornegin: Teknik Hizmetler)
  |
  +-- Alt Kategori (ornegin: Elektrik)
  |     |
  |     +-- Hizmet (ornegin: Ev Elektrigi)
  |     +-- Hizmet (ornegin: Sigorta Degisimi)
  |     +-- Hizmet (ornegin: Aydinlatma)
  |
  +-- Alt Kategori (ornegin: Tesisat)
        |
        +-- Hizmet (ornegin: Su Kacagi)
        +-- Hizmet (ornegin: Musluk Tamiri)
        +-- Hizmet (ornegin: Petek Temizligi)
```

### Kategoriler (13 ana, 40+ alt, 150+ hizmet)

| Ana Kategori | Alt Kategoriler |
|-------------|-----------------|
| Ev ve Yasam | Temizlik, Tadilat, Bakim |
| Teknik Hizmetler | Elektrik, Tesisat, Klima-Kombi, Beyaz Esya, Bilgisayar-Telefon, Guvenlik |
| Saglik ve Wellness | Psikoloji, Diyet-Beslenme, Fizyoterapi, Yasam Koclugu |
| Egitim | Okul Dersleri, Sinav Hazirlik, Muzik-Sanat, Yazilim Egitimi |
| Cocuk ve Yasli Bakimi | Bebek-Cocuk Bakimi, Yasli Bakimi, Ozel Bakim |
| Evcil Hayvan | Hayvan Bakim, Hayvan Saglik |
| Arac | Arac Tamir, Yikama, Lastik-Jant, Cekici |
| Tasimacilik | Evden Eve Nakliye, Kurye, Vinc, Depolama |
| Profesyonel Hizmetler | Hukuk, Muhasebe, Ceviri, Danismanlik |
| Gayrimenkul | Emlak, Satis, Kiralama, Degerleme |
| Etkinlik ve Organizasyon | Dugun, Konser, Sirket Etkinligi, Foto-Video |
| Dijital Hizmetler | Yazilim, Tasarim, Dijital Pazarlama, Video, Veri |
| Guzellik | Sac, Tirnak-Cilt, Makyaj, spa |

---

## Arama ve Filtreleme

Arama motoru su filtreleri destekler:

| Filtre | Tip | Aciklama |
|--------|-----|----------|
| q | string | Serbest metin aramasi |
| category | string | Kategori slug'i |
| subcategory | string | Alt kategori slug'i |
| service | string | Hizmet slug'i |
| city_id | int | Sehir ID |
| district_id | int | Ilce ID |
| min_price | float | Minimum fiyat |
| max_price | float | Maksimum fiyat |
| min_rating | float | Minimum puan |
| verified | bool | Dogrulanmis uzmanlar |
| lat, lng | float | Koordinat (yakinlik icin) |
| radius | float | Yaricap (km) |
| sort | string | Siralama (recommended, rating, reviews, newest) |
| page | int | Sayfa numarasi |
| limit | int | Sayfa basina kayit (max 100) |

---

## AI Destekli Ozellikler

### Kategori Algilama

Kullanici dogal dilde ihtiyacini ifade ettiginde sistem otomatik olarak kategori, alt kategori ve hizmeti algilar:

```
Giris: "Kombi bakimi yaptirmak istiyorum"
Cikis: {
  "detected": true,
  "category": "Teknik Hizmetler",
  "subcategory": "Klima-Kombi",
  "service": "Kombi Bakim"
}
```

80+ anahtar kelime destegi: kombi, elektrik, cilingir, temizlik, psikolog, avukat, web, nakliye, ve daha fazlasi.

### Uzman Eslestirme

10 kriterli puanlama algoritmasi:

| Kriter | Max Puan | Aciklama |
|--------|----------|----------|
| Yildiz Puani | 15 | Ortalama musteri puani |
| Yorum Sayisi | 20 | 50+ yorum = max puan |
| Tamamlanan Is | 15 | 100+ is = max puan |
| Deneyim Yili | 10 | 10+ yil = max puan |
| Dogrulama | 10 | Profesyonel/Business seviye |
| Abonelik | 13 | Elmas plan = max puan |
| Tanitim | Boost | Promoted provider oncelik kazanir |
| Hizmet Eslesmesi | 15 | Aranan hizmeti sunuyor mu |
| Konum Eslesmesi | 10 | Ayni bolgede mi |
| Butce Eslesmesi | 8 | Fiyat araligina uygun mu |

---

## Hizmet Talebi Akisi (10 Adim)

```
1. Kullanici hizmet kategorisini secer
2. Hizmet turunu belirler
3. Ihtiyacini aciklar
4. Fotograf/video ekler (opsiyonel)
5. Konum belirler (sehir + ilce)
6. Tercih ettigi tarihi ve saati girer
7. Butcesini belirtir
8. Ek not birakir
9. Onay sayfasinda kontrol eder
10. Talebi yayinlar
```

Sonrasinda: Uzmanlar teklif gonderir -> Kullanici teklifleri karsilastirir -> Bir teklifi kabul eder -> Randevu olusturulur -> Hizmet tamamlanir -> Degerlendirme yapilir.

---

## Teklif Sistemi

Uzmanlar hizmet taleplerine teklif gonderebilir. Bir teklif sunu icerir:

- Fiyat
- Tahmini sure
- Aciklama
- Kullanilacak malzemeler
- Uygun tarih
- Garanti bilgisi

Kullanici teklifleri karsilastirarak en uygun olanini kabul edebilir. Bir teklif kabul edildiginde diger tum teklifler otomatik olarak reddedilir.

---

## Puanlama ve Yorum Sistemi

Sadece tamamlanmis hizmetler degerlendirilebilir. 5 yildizli genel puanlama yaninda alt kategorilerde de puanlama yapilabilir:

- Iletisim
- Kalite
- Fiyat / Performans
- Zamaninda Gelme

Her kullanici bir hizmet icin yalnizca bir kez yorum yapabilir.

---

## Dogrulama Sistemi

Uzmanlar icin 5 dogrulama seviyesi vardir:

| Seviye | Gereklilikler |
|--------|---------------|
| YOK | Henuz dogrulama yapilmadi |
| TEMEL | Telefon + e-posta dogrulamasi |
| KIMLIK | Kimlik belgesi dogrulamasi |
| PROFESYONEL | Mesleki belge / sertifika |
| ISLETME | Isletme belgeleri |

---

## Komisyon Sistemi

Platform her basarili hizmet uzerinden komisyon alir:

- Varsayilan komisyon orani: %10
- Kategori bazli farkli oranlar belirlenebilir
- Abonelik planina gore komisyon indirimi (5% - 20%)
- Uzmanlar kazanclarini takip edebilir
- Odeme talebi ile para cekebilirler (IBAN)

---

## Abonelik Planlari

| Plan | Aylik Fiyat | Komisyon Indirimi | One Cikarilmis | Rozet |
|------|------------|-------------------|----------------|-------|
| Baslangic | Ucretsiz | %0 | 0 | - |
| Bronz | 99 TL | %5 | 2 | Bronz |
| Gumus | 199 TL | %10 | 5 | Gumus |
| Altin | 399 TL | %15 | 10 | Altin |
| Elmas | 799 TL | %20 | 20 | Elmas |

Her plan farkli ozellikler sunar: portfoy fotograf limiti, hizmet sayisi, destek onceligi, gelismis analitik.

---

## Promoted Provider (One Cikarilmis Uzman)

Uzmanlar ucretli tanitim kampanyasi baslatabilir:

- Kategori bazli hedefleme
- Gunluk butce belirleme
- Teklif tutari ile oncelik kazanma
- Goruntulenme / tiklama / CTR takibi
- One cikarilmis uzmanlar arama sonuclarinin ustunde gosterilir
- Duraklatma / devam / iptal imkani

---

## Anlasmazlik Cozum Sistemi

Kullanici ve uzmanlar arasindaki sorunlar icin:

| Neden | Aciklama |
|-------|----------|
| Hizmet Alinamadi | Uzman hizmeti saglamadi |
| Kalite Sorunu | Hizmet kalitesi dusuk |
| Fiyat Anlasmazligi | Fiyat konusunda anlasmazlik |
| Gelmemesi | Uzman randevuya gelmedi |
| Kismi Odeme | Odeme tam yapilmadi |
| Dolandiricilik | Suistimal |
| Diger | Diger nedenler |

Sistem: Anlasmazlik acma -> Karsi taraf ile mesajlasma -> Kanit ekleme -> Admin inceleme -> Cozum uretme

---

## WebSocket Mesajlasma

Gercek zamanli mesajlasma sistemi:

- JWT token ile WebSocket baglantisi
- Conversation bazli mesajlasma
- Mesaj tipleri: TEXT, IMAGE, FILE, QUOTE, APPOINTMENT, LOCATION, SYSTEM
- Okunmamis mesaj sayisi takibi
- Ayni anda birden fazla conversation

---

## Leaflet Harita Entegrasyonu

- Uzmanlarin harita uzerinde gosterimi
- Harita + liste yan yana gorunum
- Yakinlik bazli arama (lat, lng, radius)
- Custom marker ve popup

---

## Guvenlik

Uygulamada uygulanan guvenlik onlemleri:

- JWT tabanli kimlik dogrulama (access + refresh token)
- Rol tabanli yetkilendirme (RBAC)
- Sifre hashleme (bcrypt)
- Girdi dogrulama (Pydantic)
- SQL enjeksiyon korumasi (SQLAlchemy ORM)
- CORS yapilandirmasi
- Audit loglama
- WebSocket kimlik dogrulama

---

## Seed Data

Uygulama ilk kez baslatildiginda otomatik olarak yuklenen veriler:

| Veri | Miktar |
|------|--------|
| Sehirler | 81 il (plaka kodlariyla) |
| Ilceler | Istanbul, Ankara, Nevsehir ornek ilceleri |
| Kategoriler | 13 ana kategori |
| Alt Kategoriler | 40+ alt kategori |
| Hizmetler | 150+ hizmet |
| Abonelik Planlari | 5 plan (Baslangic, Bronz, Gumus, Altin, Elmas) |
| Komisyon Oranlari | Varsayilan %10 |

---

## Calistirma

### On Hazirliklar

1. Microsoft SQL Server yuklu ve calisiyor olmali
2. Redis Memurai yuklu ve calisiyor olmali (port 6379)
3. Python 3.11+ yuklu olmali
4. Node.js 18+ yuklu olmali

### Backend

```bash
cd backend

# Python bagimliliklarini yukle
pip install -r requirements.txt

# .env dosyasini duzenle
# DATABASE_URL satirinda SQL Server sifrenizi guncelleyin
# .env ornegi icin .env.example dosyasina bakin

# Uygulamayi baslat
uvicorn app.main:app --reload --port 8000
```

Uygulama baslatildiginda:
- Veritabani tablolari otomatik olusturulur
- 81 il ve ornek ilceler yuklenir
- 13 kategori ve alt kategoriler yuklenir
- 5 abonelik plani yuklenir
- Komisyon orani yuklenir

API dokumantasyonu: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Bagimliliklari yukle
npm install

# Gelistirme sunucusunu baslat
npm run dev
```

Uygulama: http://localhost:5173

Frontend, /api yolu altindaki tum istekleri backend (port 8000) uzerine proxy olarak iletir.

---

## Frontend Rotalar

| Rota | Sayfa | Aciklama |
|------|-------|----------|
| `/` | Ana Sayfa | Hero, arama, kategoriler, one cikarilmis uzmanlar, sehirler |
| `/search` | Arama | Filtreleme, grid/list gorunum, sayfalama |
| `/map` | Harita Arama | Leaflet harita + yan yana liste |
| `/provider/:id` | Uzman Profili | Profil, hizmetler, yorumlar, hakkinda |
| `/request/create` | Talep Olustur | 10 adimli hizmet talebi formu |
| `/chat` | Mesajlar | Gercek zamanli WebSocket mesajlasma |
| `/dashboard` | Panel | Istatistikler, hizli erisim, menu |
| `/pricing` | Uzman Planlari | Abonelik planlari, ozellik karsilastirma |
| `/earnings` | Kazanc Takibi | Kazanc ozeti, islemler, odeme talebi |
| `/promotions` | Tanitim Kampanyalari | Kampanya olusturma, durum takibi |
| `/disputes` | Anlasmazliklar | Anlasmazlik acma, mesajlasma, detay |
| `/admin` | Admin Dashboard | Istatistikler, kullanici/uzman/talep yonetimi |
| `/login` | Giris | E-posta + sifre ile giris |
| `/register` | Kayit | Kullanici/uzman kaydi |

---

## Ornek Kullanim Senaryolari

### Senaryo 1: AI Destekli Hizmet Talebi

```
Kullanici: "Nevsehir'deki evim icin kombi bakimi yaptirmak istiyorum."

1. Kullanici ana sayfadaki arama kutusuna yazar
2. AI kategori algilama otomatik olarak "Teknik Hizmetler > Klima-Kombi > Kombi Bakim" algilar
3. Kullanici /request/create sayfasina yonlendirilir
4. 10 adimli formu doldurur (aciklama, konum, tarih, butce, vb.)
5. Talep yayinlanir
6. Sistem AI eslestirme ile en uygun uzmanlari puanlar
7. Uzmanlar teklif gonderir
8. Kullanici teklifleri karsilastirarak en uygununu kabul eder
9. Randevu olusturulur
10. Hizmet tamamlanir
11. Kullanici 5 yildizli yorum birakir
12. Komisyon otomatik olarak hesaplanir
```

### Senaryo 2: Uzman Kaydi ve Abonelik

```
Kullanici: "Elektrikciyim, musteriler bulmak istiyorum."

1. Kullanici /register sayfasindan "Uzman" olarak kayit olur
2. /dashboard sayfasindan uzman profili olusturur
3. Hizmet alanini (Elektrik) secer
4. Calistigi sehir ve ilceleri belirtir
5. /pricing sayfasindan "Altin" planini satin alir (%15 komisyon indirimi, 10 one cikarilmis listeleme)
6. /promotions sayfasindan tanitim kampanyasi baslatir
7. Sistemde one cikarilmis uzman olarak gorunur
8. Gelen taleplere teklif gonderir
9. Hizmetleri tamamlar
10. /earnings sayfasindan kazancini takip eder
11. /commissions/payout/request ile odeme talep eder
```

### Senaryo 3: Anlasmazlik Cozumu

```
Kullanici: "Uzman hizmeti tamamlamadi, parasini iade etmek istiyorum."

1. Kullanici /disputes sayfasina gider
2. "Yeni Anlasmazlik Ac" butonuna basar
3. Karsi taraf (uzman) ID'sini, nedeni ve aciklamayi girer
4. Anlasmazlik acilir, durum "Acik" olur
5. Uzman mesaj gonderir, kanit ekler
6. Admin incelemeye alir (durum: "Inceleniyor")
7. Admin cozum uretir (ornegin: kismi iade)
8. Anlasmazlik "Cozuldu" olarak kapanir
```

---

## Dosya Yukleme

Desteklenen dosya tipleri:

- Goruntuler: jpg, jpeg, png, webp
- Videolar: mp4, webm
- Belgeler: pdf, doc, docx

Maksimum dosya boyutu: 10 MB (config dosyasindan degistirilebilir)

---

## Hata Yonetimi

Tum API hatalari standart JSON formatinda dondurulur:

```json
{
  "detail": "Hata mesaji"
}
```

Hata kodlari:

| Kod | Anlam |
|-----|-------|
| 400 | Gecersiz istek |
| 401 | Kimlik dogrulama gerekli |
| 403 | Yetki yetersiz |
| 404 | Kayit bulunamadi |
| 409 | Cakisma (kayit zaten mevcut) |
| 422 | Dogrulama hatasi |
| 500 | Sunucu hatasi |

---

## Planlanan Ozellikler

### V4

- Mobil uygulama (React Native)
- Push notification
- Online odeme altyapisi (iyzico / PayTR)
- Escrow (guvenli odeme)
- Gelismis AI onerileri (OpenAI / LLM tabanli)
- Tavsiye sistemi
- Fraud detection
- Gelismis analitik ve raporlama
- E-posta bildirimleri
- SMS bildirimleri

---

## Lisans

Bu proje gizlidir. Izinsiz kopyalanamaz, dagitamaz veya kullanamazsiniz.
