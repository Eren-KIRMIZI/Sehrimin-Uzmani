# Şehrimin Uzmanı

> **Talebini yaz → AI senin için anlasın → Sana uygun uzmanları karşılaştır → Teklif, randevu, ödeme ve yorumu tek yerde tamamla.**

Şehrindeki uzmanı, hizmet sağlayıcıyı veya profesyoneli saniyeler içinde bulmana yarayan yerel hizmet pazaryeri. Yapay zeka destekli talep analizi ve şeffaf eşleştirme algoritmasıyla piyasanın en doğal ve güvenilir alternatifi.

## Neden Şehrimin Uzmanı?

| # | Değer Önerisi | Açıklama |
|---|---------------|----------|
| 1 | **Talebini Yaz, AI Anlasın** | Uzun formlar yok. "Kombim su akıtıyor, Nevşehir'de acil" yaz; sistem kategori, konum, aciliyet ve bütçeyi otomatik çıkarır. |
| 2 | **Şeffaf Eşleştirme** | Her uzman önerisi için "Bu uzmanı neden önerdik?" açıklamasını görebilirsin. Algoritma kara kutu değil. |
| 3 | **Uçtan Uca Tek Platform** | Teklif → randevu → ödeme → yorum işlemlerini farklı uygulamalara dağılmadan tek ekranda tamamla. |

---

## Mimari

```
                    +-------------------+
                    |     ISTEMCI       |
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
     AUTH      PAZARYERI    SOHBET   ESLESTIRME    ADMIN       ODEME
       |           |          |          |             |            |
       +-----------+----------+----------+-------------+------------+
                              |
               +--------------+--------------+
               |              |              |
    +----------v--+    +-------v------+  +---v-----------+
    |   Redis      |    |  PostgreSQL  |  |  OpenRouter   |
    |   (Memurai)  |    |              |  |  (LLM)        |
    +--------------+    +--------------+  +---------------+
```

Moduler monolith mimarisi. Her domain modulu kendi klasorunde organize edilmistir. Gerektiginde servislere ayrilabilecek esneklik mevcut.

---

## Sayilarla Proje

| Metrik                  | Deger                         |
|-------------------------|-------------------------------|
| Backend API Endpoint    | 113 REST + 1 WebSocket        |
| Veritabani Tablosu      | 39 SQLAlchemy Model           |
| Backend Modul           | 18 domain modulu              |
| Frontend Sayfasi        | 14 sayfa                      |
| TypeScript Interface    | 25+                           |
| Enum Tipi               | 13                            |
| Kategori                | 13 ana, 40+ alt, 150+ hizmet  |
| Kaynak Dosya            | ~110                          |
| Toplam Satir Kod        | ~12.500+                      |
| Test Sayisi             | 65 (pytest)                   |

---

## Teknoloji Yiginlari

### Backend

| Katman           | Teknoloji                                 |
|------------------|-------------------------------------------|
| Framework        | FastAPI 0.115                             |
| Dil              | Python 3.11                               |
| ORM              | SQLAlchemy 2.0                            |
| Veritabani       | PostgreSQL 18                             |
| DB Driver        | psycopg2-binary                           |
| Cache / Kuyruk   | Redis (Memurai)                           |
| Kimlik Dogrulama | JWT (access + refresh token)              |
| Sifre Hashleme   | bcrypt / passlib                          |
| Dogrulama        | Pydantic v2                               |
| API Dokumantasyon| OpenAPI / Swagger UI                      |
| Arka Plan Gorevleri | APScheduler                            |
| Iki Faktörlü Kimlik | TOTP (pyotp)                           |
| Hiz Sinirlamasi  | Bellek ici IP bazli                       |
| Dil Modeli       | OpenRouter (Gemini, GPT ve diger LLM'ler) |

### Frontend

| Katman           | Teknoloji                                      |
|------------------|------------------------------------------------|
| Framework        | React 19                                       |
| Dil              | TypeScript                                     |
| Build            | Vite 8                                         |
| Stil             | Tailwind CSS v4                                |
| Durum Yonetimi   | Zustand                                        |
| Sunucu Durumu    | TanStack Query (paylasilan hook'lar, otomatik cache) |
| HTTP Istemcisi   | Axios                                          |
| Yonlendirme      | React Router v7                                |
| Harita           | Leaflet + React-Leaflet                        |
| Grafik           | Recharts                                       |
| Ikon             | Lucide React                                   |
| Yardimci Kutup.  | date-fns, clsx                                 |

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
|   |   +-- main.py                    FastAPI giris noktasi, startup, scheduler
|   |   +-- seed.py                    Veri tohumlama (sehirler, kategoriler, planlar)
|   |   |
|   |   +-- core/
|   |   |   +-- config.py              Uygulama ayarlari (Pydantic Settings)
|   |   |   +-- database.py            SQLAlchemy engine ve oturum yonetimi
|   |   |   +-- redis.py               Redis baglanti yonetimi
|   |   |   +-- security.py            JWT, sifre hashleme, yetkilendirme
|   |   |   +-- exceptions.py          Ozel hata siniflari
|   |   |   +-- rate_limiter.py        IP bazli hiz sinirlamasi
|   |   |   +-- logging.py             Loglama yapilandirmasi
|   |   |   +-- jobs.py                APScheduler arka plan gorevleri
|   |   |   +-- encryption.py          AES-256-GCM sifreleme (IBAN vb.)
|   |   |   +-- cache.py               TTL bazli referans veri onbellek
|   |   |
|   |   +-- ai/
|   |   |   +-- base.py                Soyut LLM saglayici tanimi
|   |   |   +-- service.py             Talep analizi ve eslestirme aciklamasi
|   |   |   +-- router.py              /ai endpoint'leri
|   |   |   +-- providers/             OpenRouter entegrasyonu
|   |   |   +-- prompts/               Sistem ve kullanici prompt sablonlari
|   |   |
|   |   +-- api/
|   |   |   +-- router.py              Tum router'lari birlestiren merkezi router
|   |   |
|   |   +-- shared/
|   |   |   +-- enums.py               Tum enum tanimlari (13 enum)
|   |   |   +-- pagination.py          Sayfalama yapisi (max 50)
|   |   |   +-- utils.py               Yardimci fonksiyonlar (haversine vb.)
|   |   |
|   |   +-- websocket/
|   |   |   +-- manager.py             WebSocket baglanti yonetimi
|   |   |
|   |   +-- modules/
|   |       +-- auth/                  Kimlik dogrulama (12 endpoint)
|   |       +-- users/                 Kullanici yonetimi (3 endpoint)
|   |       +-- providers/             Uzman profilleri, analitik, rozetler, itibar
|   |       +-- categories/            Kategori hiyerarsisi (6 endpoint)
|   |       +-- locations/             Sehir ve ilce verileri (2 endpoint)
|   |       +-- search/                Arama + LLM destekli kategori algilama
|   |       +-- requests/              Hizmet talepleri (5 endpoint)
|   |       +-- quotes/                Teklif sistemi (5 endpoint)
|   |       +-- appointments/          Randevu yonetimi (6 endpoint)
|   |       +-- reviews/               Yorum, puanlama, yanit (3 endpoint)
|   |       +-- favorites/             Favori listesi (3 endpoint)
|   |       +-- notifications/         Bildirim yonetimi (4 endpoint)
|   |       +-- messaging/             Gercek zamanli WebSocket mesajlasma
|   |       +-- commissions/           Kazanc ve komisyon yonetimi
|   |       +-- subscriptions/         Abonelik planlari ve odeme gecmisi
|   |       +-- promotions/            Reklam kampanyasi sistemi
|   |       +-- disputes/              Anlasmazlik yonetimi
|   |       +-- admin/                 Yonetici paneli, denetim kaydi
|   |
|   +-- tests/
|   |   +-- conftest.py                Pytest sabitleri ve test veritabani
|   |   +-- test_auth.py               Kimlik dogrulama testleri
|   |   +-- test_admin.py              Yonetici islemleri testleri
|   |   +-- test_provider.py           Uzman profil testleri
|   |   +-- test_search.py             Arama testleri
|   |   +-- ... (10 test modulu daha)
|   |
|   +-- requirements.txt
|   +-- .env.example
|
+-- frontend/
    +-- src/
    |   +-- components/
    |   |   +-- ai/                    Dogal dil talep asistani
    |   |   +-- layout/                Navbar, Footer, Layout sarmalayici
    |   |   +-- map/                   Leaflet harita bileseni
    |   |   +-- notifications/         Bildirim merkezi (dropdown)
    |   |
    |   +-- pages/
    |   |   +-- HomePage.tsx           Ana sayfa
    |   |   +-- SearchPage.tsx         Uzman arama ve filtreleme
    |   |   +-- MapSearchPage.tsx      Harita uzerinde arama
    |   |   +-- ProviderProfilePage.tsx Uzman profili, itibar, rozetler
    |   |   +-- ServiceRequestForm.tsx  Dogal dil asistanli hizmet talebi
    |   |   +-- ChatPage.tsx           WebSocket mesajlasma
    |   |   +-- dashboard/             Kullanici ve uzman panelleri
    |   |   +-- admin/AdminPage.tsx    Yonetici paneli
    |   |   +-- PricingPage.tsx        Abonelik planlari
    |   |   +-- EarningsPage.tsx       Uzman kazanc takibi
    |   |   +-- PromotionsPage.tsx     Kampanya yonetimi
    |   |   +-- DisputesPage.tsx       Anlasmazlik yonetimi
    |   |
    |   +-- hooks/
    |   |   +-- useQueries.ts          Tum TanStack Query hook'lari
    |   |
    |   +-- services/
    |   |   +-- api.ts                 Axios istemcisi, JWT interceptor'lari
    |   |   +-- index.ts               Tum API modul fonksiyonlari
    |   |
    |   +-- stores/
    |   |   +-- authStore.ts           Zustand ile kimlik durumu
    |   |
    |   +-- types/
    |   |   +-- index.ts               Tum TypeScript arayuz tanimlari
    |   |
    |   +-- index.css                  Global stil ve tasarim degiskenleri
    |
    +-- vite.config.ts
    +-- tsconfig.json
    +-- package.json
```

---

## Ozellikler

### Hizmet Talep Sistemi

- Dogal dil ile hizmet talebi olusturma: Kullanici ne istedigini yazinca sistem kategori, konum, aciliyet, butce ve tarih bilgilerini otomatik cikarir
- 10 adimli rehberli hizmet talebi formu
- Kategori, sehir, ilce, tarih, butce, aciliyet ve not alanlari
- Talebin kategori ve konuma gore uzmanlara iletilmesi
- Teklif karsilastirma ve kabul mekanizmasi

### Uzman Eslestirme

- Puanlamaya dayali eslestirme motoru (puan, deneyim, konum, dogrulama durumu vb.)
- Uzman profillerinin kiyaslamali gosterimi
- Arama sonuclarinda "Bu uzmani neden onerdik?" aciklamasi

### Uzman Profil ve Yonetimi

- Is adi, biyografi, deneyim yili ve fotograf profili
- Coklu hizmet ve lokasyon tanimi
- Portfoy yukleme (goruntu / video / belge)
- Musaitlik takvimi

### Itibar Sistemi

Toplam 100 puan uzerinden hesaplanan itibar skoru:

| Bileseni             | Agirlik | Aciklama                                      |
|----------------------|---------|-----------------------------------------------|
| Ortalama puan        | %40     | Musteri yorumlarindan hesaplanan ortalama     |
| Tamamlanan is sayisi | %25     | Logaritmik olcek (200 is = maksimum puan)     |
| Dogrulama seviyesi   | %15     | Yok, Temel, Kimlik, Mesleki, Ticari           |
| Yanit hizi           | %10     | Ortalama yanit suresi (dakika cinsinden)      |
| Tekrar musteri orani | %10     | Geri donen musteri sikligi                    |

**Itibar Etiketleri:** Gelisiyor / Orta / Iyi / Cok Iyi / Mukemmel

### Rozet Sistemi

Uzmanlar bircok kritere gore rozet kazanir:

| Rozet                  | Kriter                                  |
|------------------------|-----------------------------------------|
| Hizli Yanit            | Ortalama yanit suresi < 15 dakika       |
| 100+ Tamamlanan Is     | 100 veya daha fazla tamamlanan is       |
| Ustelestirilmis Uzman  | Dogrulama durumu: MESLEKI veya TICARI   |
| Musteri Favorisi       | Ortalama puan 4.8 ve uzeri              |
| Deneyimli Profesyonel  | 5+ yil deneyim ve 4.5+ puan             |
| Yildiz Uzman           | 4.9+ puan ve 50+ yorum                  |
| Tutarli Hizmet         | Son 30 gun icinde 5+ yorum, 4.5+ puan   |

### Abonelik ve Komisyon

5 abonelik plani mevcuttur. Her plan farkli komisyon orani, one cikarilmis listeleme hakki ve gelen teklif limiti icerir:

| Plan       | Komisyon | One Cikarilmis Listeleme | Aylik Teklif Limiti |
|------------|----------|--------------------------|----------------------|
| Baslangic  | %15      | Yok                      | 5                    |
| Bronz      | %13      | 2                        | 15                   |
| Gumus      | %11      | 5                        | 40                   |
| Altin      | %10      | 10                       | 100                  |
| Elmas      | %8       | Sinırsız                 | Sinirsiz             |

Odeme talepleri IBAN bazli yapilir; IBAN bilgileri AES-256-GCM ile sifrelenerek saklanir.

### Reklam ve Tanitim Kampanyasi

- Teklif bazli reklam sistemi (bid per click / impression)
- Gunluk butce siniri
- Kampanya durum yonetimi: Aktif, Duraklatilmis, Iptal Edilmis, Suresi Dolmus
- Tiklama ve gosterim sayaci

### Anlasmazlik Yonetimi

- Kullanici veya uzman anlasmazlik acabilir
- Taraflar mesaj ve kanit ekleyebilir
- Admin inceleme ve cozum asamalari: Acik, Inceleniyor, Cozuldu, Kapatildi
- Oncelik seviyeleri: Dusuk, Orta, Yuksek, Acil

### Mesajlasma

- Gercek zamanli WebSocket sohbet
- Metin, goruntu, dosya, teklif, randevu ve konum mesaj tipleri
- Okunmamis mesaj sayaci
- Platform disi iletisim engeli (telefon, e-posta filtresi)

### Bildirimler

- Anlık bildirim olusturma (randevu, teklif, mesaj, sistem vb.)
- Okundu / Okunmadi durumu
- Toplu okundu islemi
- Navbar'a entegre bildirim merkezi dropdown'i

### Yonetici Paneli

- Platform genelinde kullanici ve uzman yonetimi
- Bekleyen dogrulama taleplerinin onaylanmasi
- Anlasmazlik yonetimi ve cozum mekanizmasi
- Odeme talebi onaylama
- Fraud (dolandiricilik) riski degerlendirmesi
- Denetim kaydi (audit log)
- Genel platform istatistikleri ve aktivite grafikleri

---

## Guvenlik

### Kimlik Dogrulama

- JWT tabanli kimlik dogrulama (access token 30 dakika, refresh token 30 gun)
- Refresh token donusumu (her kullanicida tek gecerli token)
- Opsiyonel iki faktörlu kimlik dogrulama (TOTP / Google Authenticator)
- Bcrypt ile sifre hashleme (cost factor 12)
- Guclu sifre politikasi (8+ karakter, buyuk/kucuk/rakam zorunlulugu)

### API ve Ag Guvenligi

- Tum endpoint'lerde JWT dogrulama zorunlulugu
- IP bazli hiz sinirlamasi (kayit: 5/dk, giris: 10/dk, genel: 100/dk)
- CORS politikasi (izin verilen kaynaklar)
- WebSocket kimlik dogrulama (sadece access token)

### Uygulama Guvenligi

- AES-256-GCM ile hassas veri sifreleme (IBAN, banka bilgileri)
- Denetim kaydi (audit log) tum kritik islemler icin
- Mesaj icerik filtresi (platform disi iletisim engeli)
- Portfoy ve konum limitleri (max 30 portfoy, max 10 konum)
- Tekrarlanan veri kontrolleri (duplicate service, duplicate review)
- Randevu durum makinesi gecerlilik kontrolleri
- Odeme islemi kilitleme (SELECT FOR UPDATE)
- Profil guncelleme alan beyaz listesi

---

## Arka Plan Gorevleri

APScheduler ile zamanlanan gorevler:

| Gorev                     | Periyot      | Aciklama                                  |
|---------------------------|--------------|-------------------------------------------|
| subscription_expiry_check | 15 dakikada bir | Suresi dolan abonelikleri pasiflestirir |
| promotion_expiry_check    | 30 dakikada bir | Suresi dolan kampanyalari kapatir       |
| daily_budget_reset        | Her gun gece yarisi | Gunluk reklam butcelerini sifirlar |

---

## CI/CD

GitHub Actions ile otomatik is akisi:

```
Push / PR  -->  Lint  -->  Test  -->  Build  -->  Deploy
```

- Python: flake8 lint + pytest
- Node.js: oxlint + Vite build

---

## Seed Data

Uygulama ilk kez baslatildiginda otomatik yuklenen veriler:

| Veri                | Miktar                              |
|---------------------|-------------------------------------|
| Sehirler            | 81 il (plaka kodlariyla)            |
| Ilceler             | Istanbul, Ankara, Nevsehir ornekleri|
| Kategoriler         | 13 ana kategori                     |
| Alt Kategoriler     | 40+ alt kategori                    |
| Hizmetler           | 150+ hizmet                         |
| Abonelik Planlari   | 5 plan                              |
| Komisyon Oranlari   | Varsayilan %10                      |

---

## Kurulum ve Calistirma

### Gereksinimler

- PostgreSQL (port 5432)
- Redis / Memurai (port 6379)
- Python 3.11+
- Node.js 18+

### Hizli Baslangic

Proje kokunden tek komutla hem backend hem frontend baslatilir:

```bash
npm run dev
```

Bu komut `concurrently` ile backend (port 8000) ve frontend (port 5173) ayni anda baslatir.

### Backend

```bash
cd backend

# Bagimliliklari yukle
pip install -r requirements.txt

# Ortam degiskenlerini ayarla
cp .env.example .env
# DATABASE_URL, SECRET_KEY ve OPENROUTER_API_KEY degerlerini .env dosyasina ekle

# Uygulamayi baslat
uvicorn app.main:app --reload --port 8000
```

Uygulama baslatildiginda:
- Veritabani tablolari otomatik olusturulur
- 81 il ve ornek ilceler yuklenir
- 13 kategori, alt kategoriler ve hizmetler yuklenir
- 5 abonelik plani yuklenir
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

Frontend, `/api` altindaki tum istekleri backend'e (port 8000) proxy olarak iletir.

### Testler

```bash
cd backend
python -m pytest tests/ -v
```

65 test, 13 modul. Testler SQLite uzerinde calisir, PostgreSQL gerekmez.

---

## Frontend Rotalar

| Rota              | Sayfa                  | Aciklama                                      | Yetki   |
|-------------------|------------------------|-----------------------------------------------|---------|
| `/`               | Ana Sayfa              | Hero, arama, kategoriler, one cikarilmis uzmanlar | Acik |
| `/search`         | Arama                  | Filtreleme, grid/liste gorunum, sayfalama     | Acik    |
| `/map`            | Harita Arama           | Leaflet harita + yan yana liste               | Acik    |
| `/provider/:id`   | Uzman Profili          | Profil, itibar, rozetler, yorumlar            | Acik    |
| `/request/create` | Talep Olustur          | Dogal dil asistanli hizmet talebi formu       | Giris   |
| `/chat`           | Mesajlar               | WebSocket mesajlasma                          | Giris   |
| `/dashboard`      | Panel                  | Istatistikler, analitik, hizli erisim         | Giris   |
| `/pricing`        | Uzman Planlari         | Abonelik planlari ve ozellik karsilastirma    | Giris   |
| `/earnings`       | Kazanc Takibi          | Kazanc ozeti, islemler, odeme talebi          | Uzman   |
| `/promotions`     | Kampanyalar            | Kampanya olusturma ve durum takibi            | Uzman   |
| `/disputes`       | Anlasmazliklar         | Anlasmazlik acma ve mesajlasma                | Giris   |
| `/admin`          | Yonetici Paneli        | Platform istatistikleri ve yonetim            | Admin   |
| `/login`          | Giris                  | E-posta + sifre ile giris (2FA destekli)      | Acik    |
| `/register`       | Kayit                  | Kullanici / uzman kaydi                       | Acik    |

---

## Veritabani Indeksleri

Veritabaninda 98 index mevcuttur. Onemli olanlar:

| Tablo               | Index                              | Amaci                         |
|---------------------|------------------------------------|-------------------------------|
| provider_profiles   | ix_provider_profiles_rating        | Uzman siralamasi              |
| provider_profiles   | ix_provider_profiles_verified      | Dogrulanmis uzman filtresi    |
| service_requests    | ix_service_requests_status_created | Talep filtreleme ve siralama  |
| appointments        | ix_appointments_status_start       | Randevu takvimi               |
| quotes              | ix_quotes_request_status           | Teklif durumu sorgusu         |
| reviews             | ix_reviews_provider_created        | Uzman yorum gecmisi           |
| messages            | ix_messages_conv_created           | Mesaj siralamasi              |
| notifications       | ix_notifications_user_read         | Okunmamis bildirim sayisi     |
| transactions        | ix_transactions_provider           | Kazanc gecmisi                |
| favorites           | ix_favorites_user_provider         | Tekrar ekleme kontrolu        |

---

## Hata Kodlari

Tum API hatalari asagidaki formatta dondurulur:

```json
{
  "detail": "Hata mesaji"
}
```

| Kod | Anlam                         |
|-----|-------------------------------|
| 400 | Gecersiz istek                |
| 401 | Kimlik dogrulama gerekli      |
| 403 | Yetki yetersiz                |
| 404 | Kayit bulunamadi              |
| 409 | Cakisma (kayit zaten mevcut)  |
| 422 | Dogrulama hatasi              |
| 429 | Cok fazla istek (rate limit)  |
| 500 | Sunucu hatasi                 |

---

## Ornek Kullanim Senaryolari

### Senaryo 1: Hizmet Talebi Olusturma

```
1. Kullanici talep formuna gider
2. Dogal dil kutusuna "Nevsehir'de kombim su akitiyor, acil birini ariyorum" yazar
3. Sistem kategori, konum, aciliyet ve tarih bilgilerini otomatik cikarir
4. Kullanici kalan alanları onaylar ve talebi yayinlar
5. Uzmanlara bildirim gider
6. Uzmanlar teklif gonderir
7. Kullanici teklifleri karsilastirir ve en uygununu kabul eder
8. Randevu olusturulur ve hizmet tamamlanir
9. Kullanici yorum birakir, komisyon otomatik hesaplanir
```

### Senaryo 2: Uzman Kaydi ve Abonelik

```
1. Kullanici kayit sayfasindan "Uzman" rolüyle kayit olur
2. Uzman profili olusturur (is adi, biyografi, hizmetler, calisma bolgeleri)
3. Abonelik sayfasindan plani secer
4. Kampanya olusturarak one cikabilir
5. Gelen taleplere teklif gonderir
6. Tamamlanan hizmetleri takip eder ve odeme talebinde bulunur
```

### Senaryo 3: Anlasmazlik Cozumu

```
1. Kullanici anlasmazlik acar, neden ve aciklama girer
2. Karsi taraf bildirim alir ve yanit mesaji gonderir
3. Admin anlasmazligi inceler ve cozum uretir
4. Anlasmazlik "Cozuldu" olarak kapanir
```

---

## Yol Haritası

> **Geliştirme Felsefesi:**
> Feature complete → Production hardening → Gerçek para → 50 uzman + 100 müşteri → Ölç → Optimize et

### Faz 4 — Bölgesel Büyüme 🟠 *(Şu an)*

Kontrollü beta sonrası veriye dayalı genişleme:

```
Nevşehir → Kayseri → Aksaray → Konya → Ankara
```

---

## Lisans

Bu proje gizlidir. Izinsiz kopyalanamaz, dagitamaz veya kullanilamaz.
