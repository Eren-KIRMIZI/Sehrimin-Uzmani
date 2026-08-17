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
       +-----------+----------+----------+-------------+
       |           |          |          |             |
       v           v          v          v             v
     AUTH      MARKETPLACE   CHAT    MATCHING       ADMIN
       |           |          |          |             |
       +-----------+----------+----------+-------------+
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

Moduler monolith mimarisi ile baslandi. Her domain modulu kendi klasorunde organizer. Ileride gereken durumlarda servisleri ayirabilecek esneklik mevcut.

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
| Task Queue | Celery (planlanan) |

### Frontend

| Katman | Teknoloji |
|--------|-----------|
| Framework | React 19 |
| Dil | TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Server State | TanStack Query |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Harita | Leaflet + React-Leaflet |
| Icon | Lucide React |
| Utility | date-fns, clsx |

---

## Proje Yapisi

```
sehriminUzmani/
|
+-- backend/
|   +-- app/
|   |   +-- main.py                     FastAPI uygulama girisi
|   |   +-- seed.py                     Veri tohumlama (sehirler, kategoriler)
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
|   |   |   +-- enums.py                Tum enum tanimlari
|   |   |   +-- pagination.py           Sayfalama yapisi
|   |   |   +-- utils.py                Yardimci fonksiyonlar
|   |   |
|   |   +-- modules/
|   |   |   +-- auth/                   Kimlik dogrulama (register, login, JWT, refresh)
|   |   |   +-- users/                  Kullanici yonetimi
|   |   |   +-- providers/              Uzman profilleri, hizmetler, portfoy, musaitlik
|   |   |   +-- categories/             Kategori hiyerarsisi (3 seviye)
|   |   |   +-- locations/              Sehir ve ilce verileri
|   |   |   +-- search/                 Arama ve filtreleme motoru
|   |   |   +-- requests/               Hizmet talepleri
|   |   |   +-- quotes/                 Teklif sistemi
|   |   |   +-- appointments/           Randevu yonetimi
|   |   |   +-- reviews/                Yorum ve puanlama
|   |   |   +-- favorites/              Favori listesi
|   |   |   +-- notifications/          Bildirim sistemi
|   |   |   +-- messaging/              Mesajlasma modelleri
|   |   |   +-- admin/                  Admin paneli endpointleri
|   |   |
|   |   +-- integrations/               Harita, odeme, eposta entegrasyonlari
|   |   +-- websocket/                  WebSocket yapilandirmasi
|   |
|   +-- migrations/                     Veritabani goc dosyalari
|   +-- tests/                          Test dosyalari
|   +-- requirements.txt                Python bagimliliklari
|   +-- .env                            Ortam degiskenleri
|
+-- frontend/
    +-- src/
    |   +-- main.tsx                    Uygulama girisi
    |   +-- App.tsx                     Rota tanimlari
    |   +-- index.css                   Global stiller ve Tailwind
    |   |
    |   +-- types/                      TypeScript arayuz tanimlari
    |   +-- services/                   API istemcisi (Axios + JWT interceptor)
    |   +-- stores/                     Zustand durum depolari
    |   |
    |   +-- components/
    |   |   +-- layout/                 Navbar, Footer, Layout
    |   |
    |   +-- pages/
    |       +-- HomePage.tsx            Ana sayfa
    |       +-- SearchPage.tsx          Arama ve filtreleme
    |       +-- ProviderProfilePage.tsx Uzman profili
    |       +-- auth/                   Giris ve kayit sayfalari
    |       +-- dashboard/              Kullanici paneli
    |
    +-- package.json                    Node bagimliliklari
    +-- vite.config.ts                  Vite yapilandirmasi
    +-- tsconfig.json                   TypeScript ayarlari
    +-- index.html                      HTML sablonu
```

---

## Veritabani Tablolari

### Temel Tablolar

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| users | Tum kullanicilar | email, phone, password_hash, role, is_active |
| provider_profiles | Uzman profilleri | user_id (FK), business_name, rating, verification_status |
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
| service_requests | Hizmet talepleri | customer_id (FK), title, status, urgency, budget |
| quotes | Teklifler | request_id (FK), provider_id (FK), price, status |
| appointments | Randevular | request_id (FK), provider_id (FK), start_at, status |
| reviews | Yorumlar | provider_id (FK), rating, communication_rating, quality_rating |
| favorites | Favoriler | user_id (FK), provider_id (FK) |

### Iletisim Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| conversations | Mesajlasma odalari | customer_id (FK), provider_id (FK) |
| messages | Mesajlar | conversation_id (FK), sender_id (FK), content, message_type |
| notifications | Bildirimler | user_id (FK), type, title, is_read |

### Yonetim Tablolari

| Tablo | Aciklama | Onemli Kolonlar |
|-------|----------|-----------------|
| verification_requests | Dogrulama talepleri | provider_id (FK), verification_type, status |
| payments | Odemeler | user_id (FK), amount, status |
| disputes | Anlasmazliklar | request_id (FK), reason, status |
| audit_logs | Audit kayitlari | user_id (FK), action, entity, entity_id |
| platform_settings | Platform ayarlari | key, value |
| provider_availability | Uzman musaitlikleri | provider_id (FK), day_of_week, start_time, end_time |
| portfolio_items | Portfoy ogeleri | provider_id (FK), image_url, title |
| request_files | Talep dosyalari | request_id (FK), file_url, file_type |

---

## API Endpointleri

### Kimlik Dogrulama (Auth)

```
POST   /api/v1/auth/register          Yeni kullanici kaydi
POST   /api/v1/auth/login             Giris yapma
POST   /api/v1/auth/refresh           Token yenileme
GET    /api/v1/auth/me                Mevcut kullanici bilgisi
```

### Kullanici (Users)

```
GET    /api/v1/users/me               Profili goruntuleme
PATCH  /api/v1/users/me               Profil guncelleme
DELETE /api/v1/users/me               Hesabi pasiflestirme
```

### Uzman (Providers)

```
POST   /api/v1/providers/profile                    Uzman profili olusturma
GET    /api/v1/providers/me                         Benim uzman profilim
PATCH  /api/v1/providers/me                         Uzman profili guncelleme
GET    /api/v1/providers/{id}                       Uzman profili goruntuleme
POST   /api/v1/providers/services                   Hizmet ekleme
POST   /api/v1/providers/portfolio                  Portfoy ekleme
POST   /api/v1/providers/locations                  Konum ekleme
POST   /api/v1/providers/availability               Musaitlik ekleme
```

### Kategori (Categories)

```
GET    /api/v1/categories                           Tum kategoriler
GET    /api/v1/categories/{slug}                    Kategori detayi
GET    /api/v1/categories/{slug}/services           Kategorideki hizmetler
POST   /api/v1/categories/admin                     Kategori olusturma (admin)
POST   /api/v1/categories/admin/{id}/subcategories Alt kategori olusturma (admin)
POST   /api/v1/categories/admin/subcategories/{id}/services  Hizmet olusturma (admin)
```

### Konum (Locations)

```
GET    /api/v1/locations/cities                     Tum sehirler
GET    /api/v1/locations/cities/{id}/districts      Sehirdeki ilceler
```

### Arama (Search)

```
GET    /api/v1/search/providers                     Uzman arama ve filtreleme
GET    /api/v1/search/autocomplete                  Otomatik tamamlama
```

Arama parametreleri: q, category, subcategory, service, city_id, district_id, min_price, max_price, min_rating, verified, available, lat, lng, radius, sort, page, limit

### Hizmet Talepleri (Requests)

```
POST   /api/v1/requests                             Talep olusturma
GET    /api/v1/requests                             Talepleri listeleme
GET    /api/v1/requests/{id}                        Talep detayi
PATCH  /api/v1/requests/{id}                        Talep guncelleme
DELETE /api/v1/requests/{id}                        Talep silme
```

### Teklifler (Quotes)

```
POST   /api/v1/quotes/requests/{request_id}         Teklif gonderme
GET    /api/v1/quotes/requests/{request_id}         Talepteki teklifler
POST   /api/v1/quotes/{id}/accept                   Teklifi kabul etme
POST   /api/v1/quotes/{id}/reject                   Teklifi reddetme
GET    /api/v1/quotes/my                            Benim tekliflerim
```

### Randevular (Appointments)

```
POST   /api/v1/appointments                         Randevu olusturma
GET    /api/v1/appointments                         Randevulari listeleme
GET    /api/v1/appointments/{id}                    Randevu detayi
PATCH  /api/v1/appointments/{id}                    Randevu guncelleme
POST   /api/v1/appointments/{id}/complete           Randevuyu tamamlama
POST   /api/v1/appointments/{id}/cancel             Randevuyu iptal etme
```

### Yorumlar (Reviews)

```
POST   /api/v1/reviews                              Yorum yapma
GET    /api/v1/reviews/provider/{provider_id}       Uzemandaki yorumlar
```

### Favoriler (Favorites)

```
POST   /api/v1/favorites/{provider_id}              Favoriye ekleme / kaldirma
GET    /api/v1/favorites                            Favorileri listeleme
DELETE /api/v1/favorites/{provider_id}              Favoriden kaldirma
```

### Bildirimler (Notifications)

```
GET    /api/v1/notifications                        Bildirimleri listeleme
GET    /api/v1/notifications/unread-count           Okunmamis bildirim sayisi
POST   /api/v1/notifications/{id}/read              Okundu isaretleme
POST   /api/v1/notifications/read-all               Hepsi okundu
```

### Admin

```
GET    /api/v1/admin/dashboard                      Dashboard istatistikleri
GET    /api/v1/admin/users                          Kullanici listesi
PATCH  /api/v1/admin/users/{id}                     Kullanici guncelleme
GET    /api/v1/admin/providers                      Uzman listesi
PATCH  /api/v1/admin/providers/{id}/verify          Uzman dogrulama
GET    /api/v1/admin/requests                       Talep listesi
GET    /api/v1/admin/reviews                        Yorum listesi
GET    /api/v1/admin/audit-logs                     Audit loglari
```

---

## Rol Tabanli Yetkilendirme

| Rol | Yetkiler |
|-----|----------|
| USER | Profil yonetimi, talep olusturma, teklif kabul/reddet, yorum yapma, favori ekleme |
| PROVIDER | Tum USER yetkileri + uzman profili, hizmet ekleme, teklif gonderme, randevu yonetimi |
| ADMIN | Tum yetkiler + kullanici/uzman/kategori/yorum yonetimi, dogrulama, audit log |
| MODERATOR | Kismi yonetim yetkileri |

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

Varsayilan olarak yuklenen kategoriler:

- Ev ve Yasam (Temizlik, Tadilat, Bakim)
- Teknik Hizmetler (Elektrik, Tesisat, Klima, Beyaz Esya, Bilgisayar, Guvenlik)
- Saglik ve Wellness (Psikoloji, Diyet, Fizyoterapi, Yasam Koclugu)
- Egitim (Okul Dersleri, Sinav Hazirlik, Muzik, Yazilim)
- Cocuk ve Yasli Bakimi
- Evcil Hayvan
- Arac (Tamir, Yikama, Lastik, Cekici)
- Tasimacilik (Nakliye, Kurye, Vinc)
- Profesyonel Hizmetler (Hukuk, Muhasebe, Ceviri, Danismanlik)
- Gayrimenkul
- Etkinlik ve Organizasyon
- Dijital Hizmetler (Yazilim, Tasarim, Dijital Pazarlama, Video)
- Guzellik (Sac, Tirnak, Makyaj)

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

## Hizmet Talebi Akisi

```
1. Kullanici hizmet kategorisini secer
2. Hizmet turunu belirler
3. Ihtiyacini aciklar
4. Fotograf/video ekler (opsiyonel)
5. Konum belirler (sehir + ilce)
6. Tercih ettigi tarihi ve saati girer
7. Butcesini belirtir
8. Ek not birakir
9. Talebi yayinlar
10. Sistem uygun uzmanlara gosterir
11. Uzmanlar teklif gonderir
12. Kullanici teklifleri karsilastirir
13. Bir teklifi kabul eder
14. Randevu olusturulur
15. Hizmet tamamlanir
16. Kullanici degerlendirme yapar
```

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

Uzmanlar icin 4 dogrulama seviyesi vardir:

| Seviye | Gereklilikler |
|--------|---------------|
| Temel Dogrulanmis | Telefon + e-posta dogrulamasi |
| Kimlik Dogrulanmis | Kimlik belgesi dogrulamasi |
| Profesyonel Dogrulanmis | Mesleki belge / sertifika |
| Isletme Dogrulanmis | Isletme belgeleri |

---

## Guvenlik

Uygulamada uygulanan guvenlik onlemleri:

- JWT tabanli kimlik dogrulama (access + refresh token)
- Rol tabanli yetkilendirme (RBAC)
- Sifre hashleme (bcrypt)
- Girdi dogrulama (Pydantic)
- SQL enjeksiyon korumasi (SQLAlchemy ORM)
- XSS korumasi
- CORS yapilandirmasi
- API rate limiting (planlanan)
- Dosya yukleme dogrulamasi (planlanan)
- Audit loglama

---

## Seed Data

Uygulama ilk kez baslatildiginda otomatik olarak yuklenen veriler:

### Sehirler
Turkiye'deki 81 il plaka kodlariyla birlikte yuklenir. Istanbul, Ankara ve Nevsehir icin ornek ilceler de eklenir.

### Kategoriler
13 ana kategori, 40+ alt kategori ve 150+ hizmet otomatik olarak olusturulur.

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

# Uygulamayi baslat
uvicorn app.main:app --reload --port 8000
```

Uygulama baslatildiginda:
- Veritabani tablolari otomatik olusturulur
- 81 il ve ornek ilceler yuklenir
- 13 kategori ve alt kategoriler yuklenir

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

## Ornek Kullanim Senaryolari

### Senaryo 1: Hizmet Talebi

```
Kullanici: "Nevsehir'deki evim icin kombi bakimi yaptirmak istiyorum."

1. Kullanici /search sayfasina gider
2. Arama kutusuna "kombi bakim" yazar
3. Sehir olarak Nevsehir'i secer
4. Sistem uygun uzmanlari listeler
5. Kullanici bir uzmanin profiline tiklar
6. "Teklif Iste" butonuna basar
7. Talep formunu doldurur
8. Talep yayinlanir
9. Uzmanlar teklif gonderir
10. Kullanici en uygun teklifi kabul eder
11. Randevu olusturulur
12. Hizmet tamamlanir
13. Kullanici 5 yildizli yorum birakir
```

### Senaryo 2: Uzman Kaydi

```
Kullanici: "Elektrikciyim, musteriler bulmak istiyorum."

1. Kullanici /register sayfasindan "Uzman" olarak kayit olur
2. /dashboard sayfasindan uzman profili olusturur
3. Hizmet alanini (Elektrik) secer
4. Calistigi sehir ve ilceleri belirtir
5. Calisma saatlerini girer
6. Fiyatlandirmasini olusturur
7. Portfoyune ornek islerini ekler
8. Sertifika ve belgelerini yukler
9. Dogrulama icin basvurur
10. Admin dogrulamayi onaylar
11. Uzman artik arama sonuçlarinda gorunur
12. Gelen taleplere teklif gonderir
```

### Senaryo 3: Admin Yonetimi

```
Admin paneli uzerinden:

1. Dashboard istatistikleri goruntulenir
2. Yeni kullanici ve uzmanlar incelenir
3. Kategoriler ve hizmetler yonetilir
4. Uzman dogrulama talepleri degerlendirilir
5. Sikayet ve anlasmazliklar incelenir
6. Yorumlar moderasyona tabi tutulur
7. Platform ayarlari guncellenir
8. Audit loglari incelenir
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

## Planlanan Ozellikler (V2 / V3)

### V2

- WebSocket uzerinden gercek zamanli mesajlasma
- Leaflet harita uzerinde uzman gosterimi
- Uzman musaitlik takvimi (randevu sistemi)
- Bildirim sistemi (e-posta + push)
- Uzman dogrulama akisi
- AI destekli kategori algilama

### V3

- Online odeme altyapisi (iyzico / PayTR)
- Komisyon sistemi
- Escrow (guvenli odeme)
- Anlasmazlik cozum sistemi
- Abonelik modelleri
- Promoted provider (one cikarilmis uzman)
- AI destekli uzman eslestirme

### V4

- Mobil uygulama (React Native)
- Push notification
- Gelismis AI onerileri
- Tavsiye sistemi
- Fraud detection
- Gelismis analitik

---

## Lisans

Bu proje gizlidir. Izinsiz kopyalanamaz, dagitamaz veya kullanamazsiniz.
