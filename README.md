# Sehrinin Uzmani

Yerel hizmet pazaryeri platformu. Insanlarin yasadiklari sehrde ihtiyac duydugu uzmani, hizmet saglayiciyi veya profesyoneli kolayca bulmasini; uzmanlarin ise kendi hizmetlerini, calisma bolgelerini, fiyatlarini ve uygunluk durumlarini sergileyerek yeni musteri ulasmasini saglayan modern marketplace platformu.

---

## Mimari

```
                    +-------------------+
                    |     CLIENT        |
                    |  React + TS + TW  |
                    +---------+---------+
                              |
                     REST + WebSocket
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
                     |    PostgreSQL     |
                    +-------------------+
```

Moduler monolith mimarisi ile baslandi. Her domain modulu kendi klasorunde organize. Ileride gereken durumlarda servisleri ayirabilecek esneklik mevcut.

---

## Sayilarla Proje

| Metrik | Deger |
|--------|-------|
| Backend API Endpoint | 113 REST + 1 WebSocket |
| Veritabani Tablosu | 39 SQLAlchemy Model |
| Backend Modul | 18 domain modulu |
| Frontend Sayfasi | 14 sayfa |
| Frontend Bileseni | 5 bilesen (Layout haric) |
| TypeScript Interface | 25+ |
| Enum Tipi | 13 |
| Kategori | 13 ana, 40+ alt, 150+ hizmet |
| Kaynak Dosya | ~110 |
| Toplam Satir Kod | ~12.500+ |
| Test Sayisi | 65 (pytest) |

---

## Teknoloji Yiginlari

### Backend

| Katman | Teknoloji |
|--------|-----------|
| Framework | FastAPI 0.115 |
| Dil | Python 3.11 |
| ORM | SQLAlchemy 2.0 |
| Veritabani | PostgreSQL 18 |
| DB Driver | psycopg2-binary |
| Cache / Queue | Redis Memurai |
| Authentication | JWT (access + refresh token) |
| Password Hashing | bcrypt via passlib |
| Validation | Pydantic v2 |
| API Docs | OpenAPI / Swagger |
| Background Jobs | APScheduler |
| 2FA | TOTP (pyotp) |
| Rate Limiting | In-memory IP-based |

### Frontend

| Katman | Teknoloji |
|--------|-----------|
| Framework | React 19 |
| Dil | TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Server State | TanStack Query (paylasilan hook'lar, otomatik cache) |
| HTTP Client | Axios |
| Routing | React Router v7 |
| Harita | Leaflet + React-Leaflet |
| Icon | Lucide React |
| Utility | date-fns, clsx |
| i18n | TR / EN destekli |

---

## Proje Yapisi

```
sehriminUzmani/
|
+-- .gitignore
+-- .github/workflows/ci.yml          CI/CD pipeline
+-- README.md
+-- docs/kvkk.md                       KVKK aydinlatma metni
|
+-- backend/
|   +-- app/
|   |   +-- main.py                     FastAPI uygulama girisi, startup, scheduler
|   |   +-- seed.py                     Veri tohumlama (sehirler, kategoriler, planlar)
|   |   |
|   |   +-- core/
|   |   |   +-- config.py               Uygulama ayarlari (Pydantic Settings, SECRET_KEY)
|   |   |   +-- database.py             SQLAlchemy engine ve session yonetimi
|   |   |   +-- redis.py                Redis baglanti yonetimi
|   |   |   +-- security.py             JWT uretimi, sifre hashleme, yetkilendirme
|   |   |   +-- exceptions.py           Ozel hata siniflari
|   |   |   +-- rate_limiter.py         In-memory IP bazli rate limiting
|   |   |   +-- logging.py              Python logging yapilandirmasi
|   |   |   +-- jobs.py                 APScheduler background gorevleri
|   |   |   +-- encryption.py           AES-256-GCM veri sifreleme (IBAN, vb.)
|   |   |   +-- cache.py                TTL bazli referans veri onbellekleyici
|   |   |
|   |   +-- api/
|   |   |   +-- router.py               Tum API routerlarini birlestiren merkezi router
|   |   |
|   |   +-- shared/
|   |   |   +-- enums.py                Tum enum tanimlari (13 enum)
|   |   |   +-- pagination.py           Sayfalama yapisi (max 50)
|   |   |   +-- utils.py                Yardimci fonksiyonlar (haversine, vb.)
|   |   |
|   |   +-- websocket/
|   |   |   +-- manager.py              WebSocket baglanti yonetimi
|   |   |
|   |   +-- modules/
|   |       +-- auth/                   Kimlik dogrulama (12 endpoint)
|   |       +-- users/                  Kullanici yonetimi (3 endpoint)
|   |       +-- providers/              Uzman profilleri (8 endpoint)
|   |       +-- categories/             Kategori hiyerarsisi (6 endpoint)
|   |       +-- locations/              Sehir ve ilce verileri (2 endpoint)
|   |       +-- search/                 Arama, AI kategori algilama (3 endpoint)
|   |       +-- search/matching_router  AI eslestirme (3 endpoint)
|   |       +-- requests/               Hizmet talepleri (5 endpoint)
|   |       +-- quotes/                 Teklif sistemi (5 endpoint)
|   |       +-- appointments/           Randevu yonetimi (6 endpoint)
|   |       +-- reviews/                Yorum, puanlama, yanit (3 endpoint)
|   |       +-- favorites/              Favori listesi (3 endpoint)
|   |       +-- notifications/          Bildirim sistemi (4 endpoint)
|   |       +-- messaging/              Gercek zamanli mesajlasma (6 endpoint)
|   |       +-- commissions/            Komisyon, kazanc, odeme (11 endpoint)
|   |       +-- disputes/               Anlasmazlik cozum sistemi (10 endpoint)
|   |       +-- subscriptions/          Abonelik planlari (9 endpoint)
|   |       +-- promotions/             Tanitim kampanyasi (11 endpoint)
|   |       +-- admin/                  Admin paneli (8 endpoint)
|   |       +-- integrations/           Harita, odeme, eposta entegrasyonlari
|   |
|   +-- tests/                          Test dosyalari (13 modul, 65 test)
|   +-- requirements.txt                Python bagimliliklari
|   +-- .env                            Ortam degiskenleri (git disinda)
|
+-- frontend/
    +-- src/
    |   +-- main.tsx                    Uygulama girisi
    |   +-- App.tsx                     Rota tanimlari (14 rota, ProtectedRoute)
    |   +-- index.css                   Global stiller, Tailwind tema, animasyonlar
    |   |
    |   +-- types/                      TypeScript arayuz tanimlari (25+ interface)
    |   +-- services/                   API istemcisi (Axios + JWT interceptor)
    |   +-- stores/                     Zustand durum depolari (auth, location)
    |   +-- hooks/                      Ozel React hook'lari (useWebSocket, useQueries)
    |   +-- i18n/                       Coklu dil destegi (tr.ts, en.ts)
    |   |
    |   +-- components/
    |   |   +-- layout/                 Navbar, Footer, Layout
    |   |   +-- auth/                   ProtectedRoute bileseni
    |   |   +-- map/                    Leaflet harita bileseni (marker clustering)
    |   |   +-- ErrorBoundary.tsx       Hata yakalama bileseni
    |   |
    |   +-- pages/
    |       +-- HomePage.tsx            Ana sayfa (Hero, Kategoriler, Onerilenler)
    |       +-- SearchPage.tsx          Arama ve filtreleme (grid/list, skeleton)
    |       +-- MapSearchPage.tsx       Harita + liste gorunumu
    |       +-- ProviderProfilePage.tsx Uzman profili
    |       +-- ServiceRequestForm.tsx  10 adimli hizmet talebi formu
    |       +-- ChatPage.tsx            Gercek zamanli mesajlasma (WebSocket)
    |       +-- PricingPage.tsx         Abonelik planlari
    |       +-- EarningsPage.tsx        Kazanc takibi
    |       +-- PromotionsPage.tsx      Tanitim kampanyalari
    |       +-- DisputesPage.tsx        Anlasmazlik yonetimi
    |       +-- auth/                   Giris ve kayit sayfalari
    |       +-- dashboard/              Kullanici paneli
    |       +-- admin/                  Admin dashboard
    |
    +-- package.json
    +-- vite.config.ts
    +-- index.html                      HTML sablonu (SEO, OpenGraph, JSON-LD)
```

---

## Veritabani Tablolari (39 Model)

### Temel Tablolar

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| users | Tum kullanicilar | email, phone, password_hash, role, subscription_plan, commission_discount, two_factor_enabled |
| provider_profiles | Uzman profilleri | user_id (FK), business_name, rating, verification_level, hourly_rate |
| categories | Ana kategoriler | name, slug, icon |
| subcategories | Alt kategoriler | category_id (FK), name, slug |
| services | Hizmet turleri | subcategory_id (FK), name, slug |
| provider_services | Uzman-hizmet iliskisi | provider_id (FK), service_id (FK), starting_price (UNIQUE) |

### Konum Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| cities | 81 il | name, plate_code |
| districts | Ilceler | city_id (FK), name |
| provider_locations | Uzman calisma bolgeleri | provider_id (FK), city_id (FK), district_id (FK) (COMPOSITE INDEX) |

### Is Akis Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| service_requests | Hizmet talepleri | customer_id (FK), title, status, urgency, budget_min/max |
| quotes | Teklifler | request_id (FK), provider_id (FK), price, status |
| appointments | Randevular | request_id (FK), provider_id (FK), customer_id (FK), start_at, status |
| reviews | Yorumlar | provider_id (FK), rating, customer_id (FK), provider_reply (UNIQUE: request+customer) |
| favorites | Favoriler | user_id (FK), provider_id (FK) |

### Iletisim Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| conversations | Mesajlasma odalari | customer_id (FK), provider_id (FK) |
| messages | Mesajlar | conversation_id (FK), sender_id (FK), content, message_type |
| notifications | Bildirimler | user_id (FK), type, title, is_read |

### Finansal Tablolar

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| commission_rates | Komisyon oranlari | category_id (FK), rate, min_amount, is_active |
| transactions | Islemler | provider_id (FK), amount, commission_amount, provider_earning, status |
| provider_earnings | Uzman kazanclari | provider_id (FK), total_earned, pending_amount, paid_amount |
| payout_requests | Odeme talepleri | provider_id (FK), amount, iban, bank_name, status |

### Abonelik Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| subscription_plans | Abonelik planlari | name, slug, price_monthly, commission_discount, badge_type |
| plan_features | Plan ozellikleri | plan_id (FK), feature_name, is_included |
| provider_subscriptions | Uzman abonelikleri | provider_id (FK), plan_id (FK), interval, status, expires_at |
| subscription_payments | Abonelik odemeleri | subscription_id (FK), amount, status |

### Tanitim Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| promoted_providers | One cikarilmis uzmanlar | provider_id (FK), category_id (FK), budget, bid_amount, status |
| promotion_logs | Tanitim loglari | promoted_id (FK), event_type, budget_spent, impressions, clicks |

### Anlasmazlik Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| disputes | Anlasmazliklar | reporter_id (FK), reported_id (FK), reason, status, priority |
| dispute_messages | Anlasmazlik mesajlari | dispute_id (FK), sender_id (FK), message, is_admin |
| dispute_evidence | Anlasmazlik kanitlari | dispute_id (FK), uploaded_by (FK), file_url |

### Yonetim ve Guvenlik Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| revoked_tokens | Iptal edilen tokenlar | user_id (FK), token, expires_at |
| verification_requests | Dogrulama talepleri | provider_id (FK), verification_type, status |
| audit_logs | Audit kayitlari | user_id (FK), action, entity, entity_id |
| provider_availability | Uzman musaitlikleri | provider_id (FK), day_of_week, start_time, end_time |
| portfolio_items | Portfoy ogeleri | provider_id (FK), image_url, title |
| request_files | Talep dosyalari | request_id (FK), file_url, file_type |

---

## API Endpointleri (113 REST + 1 WebSocket)

### Kimlik Dogrulama (Auth) - 12 Endpoint

```
POST   /api/v1/auth/register              Yeni kullanici kaydi (USER/PROVIDER)
POST   /api/v1/auth/login                 Giris yapma (2FA destekli)
POST   /api/v1/auth/login/2fa             2FA dogrulama ile giris
POST   /api/v1/auth/refresh               Token yenileme (rotation)
GET    /api/v1/auth/me                    Mevcut kullanici bilgisi
POST   /api/v1/auth/logout                Cikis yapma
POST   /api/v1/auth/forgot-password       Sifre sifirlama istegi (30 dk token)
POST   /api/v1/auth/reset-password        Sifre sifirlama (token ile)
POST   /api/v1/auth/change-password       Sifre degistirme (mevcut sifre ile)
POST   /api/v1/auth/2fa/enable            2FA kurulumu baslatma
POST   /api/v1/auth/2fa/verify            2FA kurulumu dogrulama
POST   /api/v1/auth/2fa/disable           2FA devre disi birakma
```

### Kullanici (Users) - 3 Endpoint

```
GET    /api/v1/users/me                   Profil goruntuleme
PATCH  /api/v1/users/me                   Profil guncelleme (whitelist: ad, soyad, telefon, avatar)
DELETE /api/v1/users/me                   Hesabi pasiflestirme + token iptali
```

### Uzman (Providers) - 8 Endpoint

```
POST   /api/v1/providers/profile                      Uzman profili olusturma
GET    /api/v1/providers/me                           Benim uzman profilim
PATCH  /api/v1/providers/me                           Uzman profili guncelleme
GET    /api/v1/providers/{id}                         Uzman profili goruntuleme (eager load)
POST   /api/v1/providers/services                     Hizmet ekleme (duplicate kontrol)
POST   /api/v1/providers/portfolio                    Portfoy ekleme (max 30)
POST   /api/v1/providers/locations                    Konum ekleme (max 10)
POST   /api/v1/providers/availability                 Musaitlik ekleme
```

### Uzman Dogrulama (Verification) - 5 Endpoint

```
POST   /api/v1/verification/apply                     Dogrulama icin basvurma
GET    /api/v1/verification/my                        Benim dogrulama taleplerim
GET    /api/v1/verification/pending                   Bekleyen dogrulamalar (admin)
POST   /api/v1/verification/{id}/approve              Dogrulama onaylama (admin)
POST   /api/v1/verification/{id}/reject               Dogrulama reddetme (admin)
```

### Kategori (Categories) - 6 Endpoint

```
GET    /api/v1/categories                             Tum kategoriler
GET    /api/v1/categories/{slug}                      Kategori detayi
GET    /api/v1/categories/{slug}/services             Kategorideki hizmetler
POST   /api/v1/categories/admin                       Kategori olusturma (admin)
POST   /api/v1/categories/admin/{id}/subcategories    Alt kategori olusturma (admin)
POST   /api/v1/categories/admin/subcategories/{id}/services  Hizmet olusturma (admin)
```

### Konum (Locations) - 2 Endpoint

```
GET    /api/v1/locations/cities                       Tum sehirler (81 il)
GET    /api/v1/locations/cities/{id}/districts        Sehirdeki ilceler
```

### Arama (Search) - 3 Endpoint

```
GET    /api/v1/search/providers                       Uzman arama ve filtreleme
GET    /api/v1/search/autocomplete                    Otomatik tamamlama
POST   /api/v1/search/detect                          AI kategori algilama (80+ anahtar kelime)
```

### AI Eslestirme (Matching) - 3 Endpoint

```
POST   /api/v1/matching/find                          Uzman bul (filtreleme)
POST   /api/v1/matching/ai                            AI destekli eslestirme (10 kriterli puanlama)
GET    /api/v1/matching/recommendations               Oneriler
```

### Hizmet Talepleri (Requests) - 5 Endpoint

```
POST   /api/v1/requests                               Talep olusturma
GET    /api/v1/requests                               Talepleri listeleme (sayfalama)
GET    /api/v1/requests/{id}                          Talep detayi (auth gerekli)
PATCH  /api/v1/requests/{id}                          Talep guncelleme
DELETE /api/v1/requests/{id}                          Talep silme (aktif durumda silinemez)
```

### Teklifler (Quotes) - 5 Endpoint

```
POST   /api/v1/quotes/requests/{request_id}           Teklif gonderme
GET    /api/v1/quotes/requests/{request_id}           Talepteki teklifler
POST   /api/v1/quotes/{id}/accept                     Teklifi kabul etme (PENDING kontrolu + digerleri red)
POST   /api/v1/quotes/{id}/reject                     Teklifi reddetme
GET    /api/v1/quotes/my                              Benim tekliflerim (sayfalama)
```

### Randevular (Appointments) - 6 Endpoint

```
POST   /api/v1/appointments                           Randevu olusturma (quote_id opsiyonel)
GET    /api/v1/appointments                           Randevulari listeleme (sayfalama, rol bazli filtre)
GET    /api/v1/appointments/{id}                      Randevu detayi (sahip veya admin)
PATCH  /api/v1/appointments/{id}                      Randevu guncelleme (whitelist: location, notes, start_at, end_at)
POST   /api/v1/appointments/{id}/complete             Tamamlama + komisyon hesaplama
POST   /api/v1/appointments/{id}/cancel               Iptal etme (sahip olan)
```

### Yorumlar (Reviews) - 3 Endpoint

```
POST   /api/v1/reviews                                Yorum yapma (sadece COMPLETED + request sahibi + provider dogrulama)
GET    /api/v1/reviews/provider/{provider_id}         Uzemandaki yorumlar (sayfalama, eager load)
POST   /api/v1/reviews/{review_id}/reply              Uzmanin yoruma yaniti (max 1000 karakter, tek yanit)
```

### Favoriler (Favorites) - 3 Endpoint

```
POST   /api/v1/favorites/{provider_id}                Favoriye ekleme / kaldirma (toggle)
GET    /api/v1/favorites                              Favorileri listeleme
DELETE /api/v1/favorites/{provider_id}                Favoriden kaldirma
```

### Bildirimler (Notifications) - 4 Endpoint

```
GET    /api/v1/notifications                          Bildirimleri listeleme
GET    /api/v1/notifications/unread-count             Okunmamis bildirim sayisi
POST   /api/v1/notifications/{id}/read                Okundu isaretleme (participant kontrolu)
POST   /api/v1/notifications/read-all                 Hepsi okundu
```

### Mesajlasma (Messaging) - 6 Endpoint + 1 WebSocket

```
POST   /api/v1/messaging/conversations                Conversation olusturma (duplicate kontrol)
GET    /api/v1/messaging/conversations                Conversation listesi (sayfalama)
GET    /api/v1/messaging/conversations/{id}/messages  Mesajlari listeleme (sayfalama, participant kontrol)
POST   /api/v1/messaging/conversations/{id}/messages  Mesaj gonderme (icerik filtresi)
GET    /api/v1/messaging/unread-count                 Okunmamis mesaj sayisi
WS     /ws/{token}                                    WebSocket mesajlasma (access token ile baglanti)
```

### Komisyon Sistemi (Commissions) - 11 Endpoint

```
GET    /api/v1/commissions/rates                      Komisyon oranlari
POST   /api/v1/commissions/rates                      Komisyon orani olusturma/guncelleme (admin)
DELETE /api/v1/commissions/rates/{id}                 Komisyon orani silme (admin)
GET    /api/v1/commissions/transactions               Islemler (sayfalama, rol bazli)
GET    /api/v1/commissions/earnings                   Kazanc ozeti
GET    /api/v1/commissions/earnings/history           Kazanc gecmisi (sayfalama)
POST   /api/v1/commissions/payout/request             Odeme talebi (with_for_update, bakiye kontrolu)
GET    /api/v1/commissions/payout/my                  Odeme taleplerim
GET    /api/v1/commissions/payout/pending             Bekleyen odemeler (admin)
POST   /api/v1/commissions/payout/{id}/approve        Odeme onay (admin, with_for_update)
POST   /api/v1/commissions/payout/{id}/reject         Odeme red (admin, bakiye iadesi)
```

### Anlasmazlik Cozum Sistemi (Disputes) - 10 Endpoint

```
POST   /api/v1/disputes                               Anlasmazlik acma
GET    /api/v1/disputes                               Anlasmazliklarim (sayfalama)
GET    /api/v1/disputes/admin/all                     Tum anlasmazliklar (admin)
GET    /api/v1/disputes/{id}                          Anlasmazlik detay (mesaj + kanit dahil)
POST   /api/v1/disputes/{id}/messages                 Mesaj ekleme (participant veya admin)
POST   /api/v1/disputes/{id}/evidence                 Kanit ekleme
POST   /api/v1/disputes/{id}/resolve                  Anlasmazlik cozme + iade (admin)
POST   /api/v1/disputes/{id}/close                    Anlasmazlik kapatma (participant)
POST   /api/v1/disputes/{id}/priority                 Oncelik belirleme (admin)
GET    /api/v1/disputes/stats/summary                 Istatistikler (admin)
```

### Abonelik Sistemi (Subscriptions) - 9 Endpoint

```
GET    /api/v1/subscriptions/plans                    Abonelik planlari (aktif)
POST   /api/v1/subscriptions/plans                    Plan olusturma (admin)
PUT    /api/v1/subscriptions/plans/{id}               Plan guncelleme (admin)
POST   /api/v1/subscriptions/plans/{id}/features      Ozellik ekleme (admin)
POST   /api/v1/subscriptions/subscribe                Abone olma (aylik/3 aylik/yillik)
GET    /api/v1/subscriptions/my                       Abonelik bilgisi
POST   /api/v1/subscriptions/cancel                   Abonelik iptal
GET    /api/v1/subscriptions/payments                 Odemelerim
GET    /api/v1/subscriptions/admin/all                Tum abonelikler (admin)
```

### Tanitim Sistemi (Promotions) - 11 Endpoint

```
POST   /api/v1/promotions                             Tanitim kampanyasi olusturma
GET    /api/v1/promotions/my                          Tanitimlarim
GET    /api/v1/promotions/featured                    One cikarilmis uzmanlar (kategori/sehir filtresi)
GET    /api/v1/promotions/leaderboard                 Siralama (admin)
POST   /api/v1/promotions/{id}/pause                  Duraklatma
POST   /api/v1/promotions/{id}/resume                 Devam ettirme
POST   /api/v1/promotions/{id}/cancel                 Iptal etme
POST   /api/v1/promotions/{id}/bid                    Teklif guncelleme (with_for_update)
POST   /api/v1/promotions/{id}/impression             Goruntulenme kaydi + butce harcama
POST   /api/v1/promotions/{id}/click                  Tiklama kaydi + butce harcama
```

### Admin - 8 Endpoint

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
| PROVIDER | Tum USER yetkileri + uzman profili, hizmet ekleme, teklif gonderme, randevu yonetimi, portfoy, kazanc takibi, tanitim kampanyasi, yoruma yanit |
| ADMIN | Tum yetkiler + kullanici/uzman/kategori/yorum yonetimi, dogrulama onay, komisyon yonetimi, abonelik yonetimi, anlasmazlik cozme, odeme onay |
| MODERATOR | Kismi yonetim yetkileri (anlasmazlik inceleme, yorum moderasyonu) |

---

## Kimlik Dogrulama Akisi

```
Kayit:
  Kullanici bilgileri -> POST /auth/register
  -> Sadece USER/PROVIDER rolleri kabul edilir
  -> Sifre hashlenir (bcrypt, 8+ karakter, buyuk/kucuk harf/rakam zorunlu)
  -> Access token + Refresh token dondurulur

Giris:
  E-posta + sifre -> POST /auth/login
  -> Sifre dogrulanir
  -> 2FA aktifse temp_token dondurulur
  -> 2FA ile giris: temp_token + kod -> POST /auth/login/2fa
  -> Access token + Refresh token dondurulur

Token Yenileme:
  Refresh token -> POST /auth/refresh
  -> Eski refresh token iptal edilir (RevokedToken)
  -> Yeni access token + refresh token dondurulur (rotation)

Sifre Sifirlama:
  E-posta -> POST /auth/forgot-password
  -> 30 dakika gecerli reset token uretilir
  -> Token ile yeni sifre belirlenir

Yetkilendirme:
  Her istekte Authorization header'da Bearer token gonderilir
  -> Token cozulur, kullanici dogrulanir
  -> Rol kontrolu yapilir
  -> Revoked token kontrolu yapilir
```

---

## 2FA (Iki Faktorlu Kimlik Dogrulama)

TOTP tabanli iki faktorlu dogrulama destegi:

1. Kullanici `POST /auth/2fa/enable` ile kurulum baslatir (QR kod URI'si doner)
2. Dogrulama uygulamasindaki kodu `POST /auth/2fa/verify` ile girer
3. 2FA aktif hale gelir
4. Giris yaparken sifre dogrulamasindan sonra `POST /auth/login/2fa` ile kod gerekir
5. `POST /auth/2fa/disable` ile sifre dogrulamasiyla devre disi birakilir

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
| Gzellik | Sac, Tirnak-Cilt, Makyaj, spa |

---

## Arama ve Filtreleme

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

Sonrasinda: Uzmanlar teklif gonderir -> Kullanici teklifleri karsilastirir -> Bir teklifi kabul eder -> Randevu olusturulur -> Hizmet tamamlanir -> Degerlendirme yapilir -> Komisyon otomatik hesaplanir.

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

Her kullanici bir hizmet icin yalnizca bir kez yorum yapabilir. Uzmanlar yoruma tek seferlik yanit verebilir.

---

## Dogrulama Sistemi

| Seviye | Gereklilikler |
|--------|---------------|
| YOK | Henuz dogrulama yapilmadi |
| TEMEL | Telefon + e-posta dogrulamasi |
| KIMLIK | Kimlik belgesi dogrulamasi |
| PROFESYONEL | Mesleki belge / sertifika |
| ISLETME | Isletme belgeleri |

---

## Komisyon Sistemi

- Varsayilan komisyon orani: %10
- Kategori bazli farkli oranlar belirlenebilir
- Abonelik planina gore komisyon indirimi (5% - 20%)
- Etkin oran = temel oran x (1 - max(kullanici indirimi, plan indirimi))
- Uzmanlar kazanclarini takip edebilir
- Odeme talebi ile para cekebilirler (IBAN)
- Odeme islemleri with_for_update ile yarisi onler

---

## Abonelik Planlari

| Plan | Aylik Fiyat | Komisyon Indirimi | One Cikarilmis | Rozet |
|------|------------|-------------------|----------------|-------|
| Baslangic | Ucretsiz | %0 | 0 | - |
| Bronz | 99 TL | %5 | 2 | Bronz |
| Gumus | 199 TL | %10 | 5 | Gumus |
| Altin | 399 TL | %15 | 10 | Altin |
| Elmas | 799 TL | %20 | 20 | Elmas |

Her plan farkli ozellikler sunar: portfoy fotograf limiti, hizmet sayisi, destek onceligi, gelismis analitik. Abonelik suresi doldugunda arka planda otomatik pasiflestirilir.

---

## Promoted Provider (One Cikarilmis Uzman)

- Kategori bazli hedefleme
- Gunluk butce belirleme
- Teklif tutari ile oncelik kazanma (priority_boost = 1 + bid * 0.1)
- Goruntulenme / tiklama / CTR takibi
- Butce doldugunda otomatik expire
- One cikarilmis uzmanlar arama sonuclarinin ustunde gosterilir
- Duraklatma / devam / iptal imkani

---

## Anlasmazlik Cozum Sistemi

| Neden | Aciklama |
|-------|----------|
| Hizmet Alinamadi | Uzman hizmeti saglamadi |
| Kalite Sorunu | Hizmet kalitesi dusuk |
| Fiyat Anlasmazligi | Fiyat konusunda anlasmazlik |
| Gelmemesi | Uzman randevuya gelmedi |
| Kismi Odeme | Odeme tam yapilmadi |
| Dolandiricilik | Suistimal |
| Diger | Diger nedenler |

Sistem: Anlasmazlik acma -> Karsi taraf ile mesajlasma -> Kanit ekleme -> Admin inceleme -> Cozum uretme (para iadesi dahil)

---

## WebSocket Mesajlasma

- JWT token ile WebSocket baglantisi (access token gerekli, refresh token red)
- Conversation bazli mesajlasma
- Mesaj tipleri: TEXT, IMAGE, FILE, QUOTE, APPOINTMENT, LOCATION, SYSTEM
- Okunmamis mesaj sayisi takibi
- Ayni anda birden fazla conversation
- Icerik filtresi: WhatsApp, telefon numarasi, e-posta, Telegram gibi platform disi iletisim bilgileri engellenir
- Mesaj uzunluk siniri: 2000 karakter
- mark_read islemi sadece participant tarafindan yapilabilir
- Otomatik yeniden baglanti (exponential backoff, max 30s)

---

## Leaflet Harita Entegrasyonu

- Uzmanlarin harita uzerinde gosterimi
- Harita + liste yan yana gorunum
- Yakinlik bazli arama (lat, lng, radius)
- Custom marker ve popup
- Marker clustering (leaflet.markercluster)

---

## Guvenlik

### Kimlik Dogrulama ve Yetkilendirme
- JWT tabanli kimlik dogrulama (access + refresh token)
- Refresh token rotation (eski token RevokedToken tablosuna kaydedilir)
- Rol tabanli yetkilendirme (RBAC)
- Sifre hashleme (bcrypt, 8+ karakter, buyuk/kucuk harf/rakam zorunlu)
- 2FA destegi (TOTP tabanli)

### Rate Limiting
- Giris: 5 deneme / 5 dakika
- Kayit: 3 deneme / 10 dakika
- Token yenileme: 10 deneme / 5 dakika
- Sifre sifirlama: 3 deneme / 10 dakika

### Veri Guvenligi
- Girdi dogrulama (Pydantic v2, @field_validator ile rol kisitlama)
- SQL enjeksiyon korumasi (SQLAlchemy ORM)
- CORS yapilandirmasi
- SECRET_KEY ortam degiskeninden okunur, yoksa otomatik uretilir (uyari ile)
- Aktif olmayan kullanicilar token ile erisemez
- Hassas veri sifreleme (AES-256-GCM, IBAN/banka bilgileri)

### Uygulama Seviyesi
- Audit loglama
- WebSocket kimlik dogrulama (sadece access token, refresh token red)
- Mesaj icerik filtresi (platform disi iletisim engeli)
- Portfoy limiti (max 30), konum limiti (max 10)
- Tekrarlanan veri kontrolleri (duplicate service, duplicate review)
- Randevu durum makinesi kontrolleri
- Odeme yarisi korumasi (with_for_update)
- Profil guncelleme whitelist (sadece belirli alanlar degistirilebilir)
- Telefon numarasi benzersizlik kontrolu
- Detay endpointleri icin auth zorunlulugu

---

## Background Job Sistemi

APScheduler ile arka plan gorevleri:

| Gorev | Periyot | Aciklama |
|-------|---------|----------|
| subscription_expiry_check | 15 dakika | Suresi dolan abonelikleri pasiflestirir |
| promotion_expiry_check | 30 dakika | Suresi dolan tanitimlari expire eder |
| daily_budget_reset | Gunluk | Gunluk butce sifirlama |

---

## CI/CD Pipeline

GitHub Actions ile otomatik is akisi:

```
Push/PR -> Lint -> Test -> Build -> Deploy
```

- Python lint (flake8) ve test (pytest)
- Node.js lint (eslint) ve build (vite)
- Production deploy asamasinda otomatik build

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

1. PostgreSQL yuklu ve calisiyor olmali (port 5432)
2. Redis Memurai yuklu ve calisiyor olmali (port 6379)
3. Python 3.11+ yuklu olmali
4. Node.js 18+ yuklu olmali

### Hizli Baslatma (Tikla)

Proje kokunden tek komutla hem backend hem frontend baslatilabilir:

```bash
npm run dev
```

Bu komut `concurrently` ile backend (port 8000) ve frontend (port 5173) ayni anda baslatir.

### Backend

```bash
cd backend

# Python bagimliliklarini yukle
pip install -r requirements.txt

# .env dosyasini duzenle
# DATABASE_URL satirinda PostgreSQL sifrenizi guncelleyin
# SECRET_KEY ortam degiskenine bir deger atayin (yoksa otomatik uretilir)

# Uygulamayi baslat
uvicorn app.main:app --reload --port 8000
```

Uygulama baslatildiginda:
- Veritabani tablolari otomatik olusturulur
- 81 il ve ornek ilceler yuklenir
- 13 kategori ve alt kategoriler yuklenir
- 5 abonelik plani yuklenir
- Komisyon orani yuklenir
- APScheduler arka plan gorevleri baslatilir

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

### Testler

```bash
cd backend
python -m pytest tests/ -v
```

13 test modulu, 65 test. Testler SQLite uzerinde calisir, PostgreSQL gerekmez.

---

## Performans Index'leri

Veritabaninda 98 index mevcut. Onemli olusturulan index'ler:

| Tablo | Index | Amaci |
|-------|-------|-------|
| provider_profiles | ix_provider_profiles_rating | Uzman siralamasi |
| provider_profiles | ix_provider_profiles_verified | Dogrulanmis uzman filtresi |
| service_requests | ix_service_requests_status_created | Talep filtreleme + siralama |
| appointments | ix_appointments_status_start | Randevu takvimi |
| quotes | ix_quotes_request_status | Teklif durumu sorgusu |
| reviews | ix_reviews_provider_created | Uzman yorum gecmisi |
| messages | ix_messages_conv_created | Mesaj siralamasi |
| notifications | ix_notifications_user_read | Okunmamis bildirim sayisi |
| transactions | ix_transactions_provider | Kazanc gecmisi |
| favorites | ix_favorites_user_provider | Tekrar kontrolu |

---

## Frontend Rotalar

| Rota | Sayfa | Aciklama | Yetki |
|------|-------|----------|-------|
| `/` | Ana Sayfa | Hero, arama, kategoriler, one cikarilmis uzmanlar, sehirler | Acik |
| `/search` | Arama | Filtreleme, grid/list gorunum, sayfalama | Acik |
| `/map` | Harita Arama | Leaflet harita + yan yana liste | Acik |
| `/provider/:id` | Uzman Profili | Profil, hizmetler, yorumlar, hakkinda | Acik |
| `/request/create` | Talep Olustur | 10 adimli hizmet talebi formu | Giris |
| `/chat` | Mesajlar | Gercek zamanli WebSocket mesajlasma | Giris |
| `/dashboard` | Panel | Istatistikler, hizli erisim, menu | Giris |
| `/pricing` | Uzman Planlari | Abonelik planlari, ozellik karsilastirma | Giris |
| `/earnings` | Kazanc Takibi | Kazanc ozeti, islemler, odeme talebi | Uzman |
| `/promotions` | Tanitim Kampanyalari | Kampanya olusturma, durum takibi | Uzman |
| `/disputes` | Anlasmazliklar | Anlasmazlik acma, mesajlasma, detay | Giris |
| `/admin` | Admin Dashboard | Istatistikler, kullanici/uzman/talep yonetimi | Admin |
| `/login` | Giris | E-posta + sifre ile giris (2FA destekli) | Acik |
| `/register` | Kayit | Kullanici/uzman kaydi | Acik |

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
