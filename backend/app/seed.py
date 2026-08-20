from sqlalchemy.orm import Session
from app.modules.locations.models import City, District
from app.modules.categories.models import Category, SubCategory, Service


TURKEY_CITIES = [
    {"name": "Adana", "plate_code": "01"},
    {"name": "Adıyaman", "plate_code": "02"},
    {"name": "Afyonkarahisar", "plate_code": "03"},
    {"name": "Ağrı", "plate_code": "04"},
    {"name": "Amasya", "plate_code": "05"},
    {"name": "Ankara", "plate_code": "06"},
    {"name": "Antalya", "plate_code": "07"},
    {"name": "Artvin", "plate_code": "08"},
    {"name": "Aydın", "plate_code": "09"},
    {"name": "Balıkesir", "plate_code": "10"},
    {"name": "Bilecik", "plate_code": "11"},
    {"name": "Bingöl", "plate_code": "12"},
    {"name": "Bitlis", "plate_code": "13"},
    {"name": "Bolu", "plate_code": "14"},
    {"name": "Burdur", "plate_code": "15"},
    {"name": "Bursa", "plate_code": "16"},
    {"name": "Çanakkale", "plate_code": "17"},
    {"name": "Çankırı", "plate_code": "18"},
    {"name": "Çorum", "plate_code": "19"},
    {"name": "Denizli", "plate_code": "20"},
    {"name": "Diyarbakır", "plate_code": "21"},
    {"name": "Edirne", "plate_code": "22"},
    {"name": "Elazığ", "plate_code": "23"},
    {"name": "Erzincan", "plate_code": "24"},
    {"name": "Erzurum", "plate_code": "25"},
    {"name": "Eskişehir", "plate_code": "26"},
    {"name": "Gaziantep", "plate_code": "27"},
    {"name": "Giresun", "plate_code": "28"},
    {"name": "Gümüşhane", "plate_code": "29"},
    {"name": "Hakkari", "plate_code": "30"},
    {"name": "Hatay", "plate_code": "31"},
    {"name": "Isparta", "plate_code": "32"},
    {"name": "Mersin", "plate_code": "33"},
    {"name": "İstanbul", "plate_code": "34"},
    {"name": "İzmir", "plate_code": "35"},
    {"name": "Kars", "plate_code": "36"},
    {"name": "Kastamonu", "plate_code": "37"},
    {"name": "Kayseri", "plate_code": "38"},
    {"name": "Kırklareli", "plate_code": "39"},
    {"name": "Kırşehir", "plate_code": "40"},
    {"name": "Kocaeli", "plate_code": "41"},
    {"name": "Konya", "plate_code": "42"},
    {"name": "Kütahya", "plate_code": "43"},
    {"name": "Malatya", "plate_code": "44"},
    {"name": "Manisa", "plate_code": "45"},
    {"name": "Kahramanmaraş", "plate_code": "46"},
    {"name": "Mardin", "plate_code": "47"},
    {"name": "Muğla", "plate_code": "48"},
    {"name": "Muş", "plate_code": "49"},
    {"name": "Nevşehir", "plate_code": "50"},
    {"name": "Niğde", "plate_code": "51"},
    {"name": "Ordu", "plate_code": "52"},
    {"name": "Rize", "plate_code": "53"},
    {"name": "Sakarya", "plate_code": "54"},
    {"name": "Samsun", "plate_code": "55"},
    {"name": "Siirt", "plate_code": "56"},
    {"name": "Sinop", "plate_code": "57"},
    {"name": "Sivas", "plate_code": "58"},
    {"name": "Tekirdağ", "plate_code": "59"},
    {"name": "Tokat", "plate_code": "60"},
    {"name": "Trabzon", "plate_code": "61"},
    {"name": "Tunceli", "plate_code": "62"},
    {"name": "Şanlıurfa", "plate_code": "63"},
    {"name": "Uşak", "plate_code": "64"},
    {"name": "Van", "plate_code": "65"},
    {"name": "Yozgat", "plate_code": "66"},
    {"name": "Zonguldak", "plate_code": "67"},
    {"name": "Aksaray", "plate_code": "68"},
    {"name": "Bayburt", "plate_code": "69"},
    {"name": "Karaman", "plate_code": "70"},
    {"name": "Kırıkkale", "plate_code": "71"},
    {"name": "Batman", "plate_code": "72"},
    {"name": "Şırnak", "plate_code": "73"},
    {"name": "Bartın", "plate_code": "74"},
    {"name": "Ardahan", "plate_code": "75"},
    {"name": "Iğdır", "plate_code": "76"},
    {"name": "Yalova", "plate_code": "77"},
    {"name": "Karabük", "plate_code": "78"},
    {"name": "Kilis", "plate_code": "79"},
    {"name": "Osmaniye", "plate_code": "80"},
    {"name": "Düzce", "plate_code": "81"},
]

NEVSEHIR_DISTRICTS = [
    "Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş",
    "Kozaklı", "Merkez", "Ürgüp"
]

ISTANBUL_DISTRICTS = [
    "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar",
    "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş",
    "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca",
    "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih",
    "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal",
    "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer",
    "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli",
    "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"
]

ANKARA_DISTRICTS = [
    "Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı",
    "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut",
    "Evren", "Gölbaşı", "Haymana", "Kalecik", "Kahramankazan",
    "Keçiören", "Mamak", "Nallıhan", "Polatlı", "Pursaklar",
    "Sincan", "Şereflikoçhisar", "Yenimahalle"
]

CATEGORIES_DATA = [
    {
        "name": "Ev & Yaşam",
        "slug": "ev-yasam",
        "icon": "home",
        "subcategories": [
            {
                "name": "Temizlik",
                "slug": "temizlik",
                "services": ["Ev Temizliği", "Ofis Temizliği", "Cam Temizliği", "Halı Yıkama", "Koltuk Yıkama", "Inşaat Sonrası Temizlik"]
            },
            {
                "name": "Tadilat",
                "slug": "tadilat",
                "services": ["Boya", "Alçı", "Fayans", "Parke", "Çatı", "Mantolama"]
            },
            {
                "name": "Bakım",
                "slug": "ev-bakim",
                "services": ["Bahçıvan", "Peyzaj", "Havuz Bakımı", "İlaçlama", "Böcek İlaçlama"]
            },
        ]
    },
    {
        "name": "Teknik Hizmetler",
        "slug": "teknik-hizmetler",
        "icon": "settings",
        "subcategories": [
            {
                "name": "Elektrik",
                "slug": "elektrik",
                "services": ["Ev Elektriği", "Sigorta Değişimi", "Aydınlatma", "Kablo Döşeme", "Güç Kaynağı"]
            },
            {
                "name": "Tesisat",
                "slug": "tesisat",
                "services": ["Su Kaçağı", "Musluk Tamiri", "Petek Temizliği", "Klozet Tamiri", "Kalorifer Tesisatı"]
            },
            {
                "name": "Klima & Kombi",
                "slug": "klima-kombi",
                "services": ["Klima Montaj", "Klima Bakım", "Kombi Bakım", "Kombi Arıza", "Petek Bakım"]
            },
            {
                "name": "Beyaz Eşya",
                "slug": "beyaz-esya",
                "services": ["Buzdolabı Tamiri", "Çamaşır Makinesi", "Bulaşık Makinesi", "Fırın Tamiri"]
            },
            {
                "name": "Bilgisayar & Telefon",
                "slug": "bilgisayar-telefon",
                "services": ["Bilgisayar Tamiri", "Laptop Tamiri", "Telefon Tamiri", "Veri Kurtarma", "Yazılım Destek"]
            },
            {
                "name": "Güvenlik",
                "slug": "guvenlik",
                "services": ["Kamera Kurulumu", "Alarm Sistemi", "Kapı Kilidi", "Çilingir"]
            },
        ]
    },
    {
        "name": "Sağlık & Wellness",
        "slug": "saglik-wellness",
        "icon": "heart",
        "subcategories": [
            {
                "name": "Psikoloji",
                "slug": "psikoloji",
                "services": ["Psikolog", "Aile Terapisti", "Çocuk Psikoloğu", "Hipnoz"]
            },
            {
                "name": "Diyet & Beslenme",
                "slug": "diyet-beslenme",
                "services": ["Diyetisyen", "Beslenme Danışmanı", "Spor Dietisyeni"]
            },
            {
                "name": "Fizyoterapi",
                "slug": "fizyoterapi",
                "services": ["Fizyoterapist", "Masaj", "Manuel Terapi", "Spor Rehabilitasyonu"]
            },
            {
                "name": "Yaşam Koçluğu",
                "slug": "yasam-koclugu",
                "services": ["Yaşam Koçu", "Kariyer Koçu", "İş Koçu"]
            },
        ]
    },
    {
        "name": "Eğitim",
        "slug": "egitim",
        "icon": "book",
        "subcategories": [
            {
                "name": "Okul Dersleri",
                "slug": "okul-dersleri",
                "services": ["Matematik", "Fen Bilimleri", "Türkçe", "İngilizce", "Tarih"]
            },
            {
                "name": "Sınav Hazırlık",
                "slug": "sinav-hazirlik",
                "services": ["YKS", "LGS", "KPSS", "ALES", "TOEFL"]
            },
            {
                "name": "Müzik & Sanat",
                "slug": "muzik-sanat",
                "services": ["Piyano", "Gitar", "Şan", "Resim", "Heykel"]
            },
            {
                "name": "Yazılım & Teknoloji",
                "slug": "yazilim-egitim",
                "services": ["Python", "JavaScript", "Web Development", "Mobil Geliştirme", "Veri Bilimi"]
            },
        ]
    },
    {
        "name": "Çocuk & Yaşlı Bakımı",
        "slug": "cocuk-yasli-bakim",
        "icon": "users",
        "subcategories": [
            {
                "name": "Bebek & Çocuk Bakımı",
                "slug": "bebek-cocuk-bakimi",
                "services": ["Bebek Bakıcısı", "Çocuk Bakıcısı", "Oyun Ablası", "Ödev Yardımı"]
            },
            {
                "name": "Yaşlı Bakımı",
                "slug": "yasli-bakimi",
                "services": ["Yaşlı Bakım Uzmanı", "Refakatçi", "Evde Destek", "Hemşire"]
            },
        ]
    },
    {
        "name": "Evcil Hayvan",
        "slug": "evcil-hayvan",
        "icon": "paw",
        "subcategories": [
            {
                "name": "Bakım",
                "slug": "hayvan-bakim",
                "services": ["Pet Sitter", "Köpek Gezdirme", "Pet Kuaförü", "Evcil Hayvan Nakli"]
            },
            {
                "name": "Sağlık",
                "slug": "hayvan-saglik",
                "services": ["Veteriner", "Aşı", "Kısırlaştırma", "Diş Temizliği"]
            },
            {
                "name": "Eğitim",
                "slug": "hayvan-egitim",
                "services": ["Köpek Eğitimi", "Davranış Eğitimi", "Sosyalleştirme"]
            },
        ]
    },
    {
        "name": "Araç",
        "slug": "arac",
        "icon": "car",
        "subcategories": [
            {
                "name": "Tamir & Bakım",
                "slug": "arac-tamir",
                "services": ["Oto Tamir", "Oto Elektrik", "Motor Revizyonu", "Kaporta Boya"]
            },
            {
                "name": "Yıkama & Detailing",
                "slug": "arac-yikama",
                "services": ["Oto Yıkama", "Detailing", "Seramik Kaplama", "Boya Koruma"]
            },
            {
                "name": "Lastik & Jant",
                "slug": "lastik-jant",
                "services": ["Lastik Değişimi", "Lastik Tamiri", "Jant Düzeltme", "Balans"]
            },
            {
                "name": "Çekici & Taşıma",
                "slug": "cekici",
                "services": ["Oto Çekici", "Kurtarıcı", "Taşıma"]
            },
        ]
    },
    {
        "name": "Taşımacılık",
        "slug": "tasimacilik",
        "icon": "truck",
        "subcategories": [
            {
                "name": "Nakliye",
                "slug": "nakliye",
                "services": ["Evden Eve Nakliye", "Şehirlerarası Nakliye", "Ofis Taşıma", "Küçük Taşıma"]
            },
            {
                "name": "Kurye",
                "slug": "kurye",
                "services": ["Kurye", "Kargo", "Acil Teslimat"]
            },
            {
                "name": "Vinç & Heavy",
                "slug": "vinc",
                "services": ["Vinç Kiralama", "Platform Kiralama", "Yükseklikte Çalışma"]
            },
        ]
    },
    {
        "name": "Profesyonel Hizmetler",
        "slug": "profesyonel-hizmetler",
        "icon": "briefcase",
        "subcategories": [
            {
                "name": "Hukuk",
                "slug": "hukuk",
                "services": ["Avukat", "Arabuluculuk", "Danışmanlık", "Dava Takibi"]
            },
            {
                "name": "Muhasebe",
                "slug": "muhasebe",
                "services": ["Mali Müşavir", "Muhasebeci", "Denetim", "Vergi Danışmanlığı"]
            },
            {
                "name": "Çeviri",
                "slug": "ceviri",
                "services": ["İngilizce Çeviri", "Almanca Çeviri", "Arapça Çeviri", "Teknik Çeviri"]
            },
            {
                "name": "Danışmanlık",
                "slug": "danismanlik",
                "services": ["İş Danışmanlığı", "Pazarlama", "HR Danışmanlığı", "Strateji"]
            },
        ]
    },
    {
        "name": "Gayrimenkul",
        "slug": "gayrimenkul",
        "icon": "building",
        "subcategories": [
            {
                "name": "Emlak",
                "slug": "emlak",
                "services": ["Emlak Danışmanı", "Kiralama", "Satış", "Değerleme"]
            },
        ]
    },
    {
        "name": "Etkinlik & Organizasyon",
        "slug": "etkinlik-organizasyon",
        "icon": "calendar",
        "subcategories": [
            {
                "name": "Düğün & Special",
                "slug": "dugun",
                "services": ["Düğün Organizasyonu", "Nişan", "Doğum Günü", "Nikah"]
            },
            {
                "name": "Fotoğraf & Video",
                "slug": "foto-video",
                "services": ["Düğün Fotoğrafçısı", "Stüdyo Çekimi", "Drone Çekimi", "Video Edit"]
            },
            {
                "name": "Müzik & Eğlence",
                "slug": "muzik-eglence",
                "services": ["DJ", "Müzik grubu", "Ses Sistemi", "Işıklandırma"]
            },
            {
                "name": "Catering",
                "slug": "catering",
                "services": ["Düğün Yemeği", "Cocktail", "Pastane", "Kokteyl"]
            },
        ]
    },
    {
        "name": "Dijital Hizmetler",
        "slug": "dijital-hizmetler",
        "icon": "monitor",
        "subcategories": [
            {
                "name": "Yazılım",
                "slug": "yazilim",
                "services": ["Web Geliştirme", "Mobil Uygulama", "API Geliştirme", "E-Ticaret"]
            },
            {
                "name": "Tasarım",
                "slug": "tasarim",
                "services": ["Grafik Tasarım", "UI/UX", "Logo Tasarımı", "Banner"]
            },
            {
                "name": "Dijital Pazarlama",
                "slug": "dijital-pazarlama",
                "services": ["SEO", "Sosyal Medya", "Google Ads", "Facebook Ads", "İçerik Üretimi"]
            },
            {
                "name": "Video & 3D",
                "slug": "video-3d",
                "services": ["Video Edit", "3D Modelleme", "Animasyon", "Motion Graphics"]
            },
        ]
    },
    {
        "name": "Güzellik",
        "slug": "guzellik",
        "icon": "scissors",
        "subcategories": [
            {
                "name": "Saç",
                "slug": "sac",
                "services": ["Kuaför", "Berber", "Saç Boyama", "Saç Kesimi", "Keratin"]
            },
            {
                "name": "Tırnak & Cilt",
                "slug": "tirnak-cilt",
                "services": ["Manikür", "Pedikür", "Jel Tırnak", "Cilt Bakımı"]
            },
            {
                "name": "Makyaj",
                "slug": "makyaj",
                "services": ["Gelin Makyajı", "Günlük Makyaj", "Profesyonel Makyaj"]
            },
        ]
    },
]


def seed_cities(db: Session):
    existing = db.query(City).count()
    if existing > 0:
        return

    for city_data in TURKEY_CITIES:
        city = City(name=city_data["name"], plate_code=city_data["plate_code"])
        db.add(city)
    db.commit()

    city_map = {c.name: c.id for c in db.query(City).all()}

    district_map = {
        "Nevşehir": NEVSEHIR_DISTRICTS,
        "İstanbul": ISTANBUL_DISTRICTS,
        "Ankara": ANKARA_DISTRICTS,
    }

    for city_name, districts in district_map.items():
        if city_name in city_map:
            for d_name in districts:
                district = District(city_id=city_map[city_name], name=d_name)
                db.add(district)
    db.commit()


def seed_categories(db: Session):
    existing = db.query(Category).count()
    if existing > 0:
        return

    for cat_data in CATEGORIES_DATA:
        category = Category(
            name=cat_data["name"],
            slug=cat_data["slug"],
            icon=cat_data["icon"],
        )
        db.add(category)
        db.flush()

        for sub_data in cat_data["subcategories"]:
            subcategory = SubCategory(
                category_id=category.id,
                name=sub_data["name"],
                slug=sub_data["slug"],
            )
            db.add(subcategory)
            db.flush()

            for i, service_name in enumerate(sub_data["services"]):
                base_slug = service_name.lower().replace(" ", "-").replace("ç", "c").replace("ş", "s").replace("ğ", "g").replace("ı", "i").replace("ö", "o").replace("ü", "u")
                service = Service(
                    subcategory_id=subcategory.id,
                    name=service_name,
                    slug=f"{sub_data['slug']}-{base_slug}",
                    sort_order=i,
                )
                db.add(service)

    db.commit()


SUBSCRIPTION_PLANS_DATA = [
    {
        "name": "Baslangic",
        "slug": "free",
        "description": "Yeni baslayan uzmanlar icin ucretsiz plan",
        "price_monthly": 0,
        "price_quarterly": 0,
        "price_yearly": 0,
        "commission_discount": 0.0,
        "featured_listings": 0,
        "priority_support": False,
        "advanced_analytics": False,
        "highlighted_profile": False,
        "badge_type": "free",
        "max_portfolio_images": 5,
        "max_services": 3,
        "sort_order": 0,
        "features": [
            {"name": "Profil Olusturma", "included": True},
            {"name": "3 Hizmet Ekleme", "included": True},
            {"name": "5 Portfoy Fotografi", "included": True},
            {"name": "Musteri Mesajlari", "included": True},
            {"name": "Randevu Yonetimi", "included": True},
            {"name": "One Cikarilmis Profil", "included": False},
            {"name": "Gelismis Analitik", "included": False},
            {"name": "Oncelikli Destek", "included": False},
        ],
    },
    {
        "name": "Bronz",
        "slug": "bronze",
        "description": "Buyuyen uzmanlar icin ideal plan",
        "price_monthly": 99,
        "price_quarterly": 249,
        "price_yearly": 899,
        "commission_discount": 0.05,
        "featured_listings": 2,
        "priority_support": False,
        "advanced_analytics": False,
        "highlighted_profile": True,
        "badge_type": "bronze",
        "max_portfolio_images": 15,
        "max_services": 8,
        "sort_order": 1,
        "features": [
            {"name": "Tum Ucretsiz Ozellikler", "included": True},
            {"name": "8 Hizmet Ekleme", "included": True},
            {"name": "15 Portfoy Fotografi", "included": True},
            {"name": "%5 Komisyon Indirimi", "included": True},
            {"name": "2 One Cikarilmis Listeleme", "included": True},
            {"name": "Profilde Bronz Rozet", "included": True},
            {"name": "Gelismis Analitik", "included": False},
            {"name": "Oncelikli Destek", "included": False},
        ],
    },
    {
        "name": "Gumus",
        "slug": "silver",
        "description": "Profesyonel uzmanlar icin gelismis plan",
        "price_monthly": 199,
        "price_quarterly": 499,
        "price_yearly": 1799,
        "commission_discount": 0.10,
        "featured_listings": 5,
        "priority_support": True,
        "advanced_analytics": True,
        "highlighted_profile": True,
        "badge_type": "silver",
        "max_portfolio_images": 30,
        "max_services": 15,
        "sort_order": 2,
        "features": [
            {"name": "Tum Bronz Ozellikleri", "included": True},
            {"name": "15 Hizmet Ekleme", "included": True},
            {"name": "30 Portfoy Fotografi", "included": True},
            {"name": "%10 Komisyon Indirimi", "included": True},
            {"name": "5 One Cikarilmis Listeleme", "included": True},
            {"name": "Profilde Gumus Rozet", "included": True},
            {"name": "Gelismis Analitik", "included": True},
            {"name": "Oncelikli Destek", "included": False},
        ],
    },
    {
        "name": "Altin",
        "slug": "gold",
        "description": "En populer plan - max gorunurluk",
        "price_monthly": 399,
        "price_quarterly": 999,
        "price_yearly": 3599,
        "commission_discount": 0.15,
        "featured_listings": 10,
        "priority_support": True,
        "advanced_analytics": True,
        "highlighted_profile": True,
        "badge_type": "gold",
        "max_portfolio_images": 50,
        "max_services": 30,
        "sort_order": 3,
        "features": [
            {"name": "Tum Gumus Ozellikleri", "included": True},
            {"name": "30 Hizmet Ekleme", "included": True},
            {"name": "50 Portfoy Fotografi", "included": True},
            {"name": "%15 Komisyon Indirimi", "included": True},
            {"name": "10 One Cikarilmis Listeleme", "included": True},
            {"name": "Profilde Altin Rozet", "included": True},
            {"name": "Gelismis Analitik", "included": True},
            {"name": "Oncelikli Destek", "included": True},
        ],
    },
    {
        "name": "Elmas",
        "slug": "diamond",
        "description": "Premium kurumsal uzmanlar icin",
        "price_monthly": 799,
        "price_quarterly": 1999,
        "price_yearly": 7199,
        "commission_discount": 0.20,
        "featured_listings": 20,
        "priority_support": True,
        "advanced_analytics": True,
        "highlighted_profile": True,
        "badge_type": "diamond",
        "max_portfolio_images": 100,
        "max_services": 999,
        "sort_order": 4,
        "features": [
            {"name": "Tum Altin Ozellikleri", "included": True},
            {"name": "Sinirsiz Hizmet", "included": True},
            {"name": "100 Portfoy Fotografi", "included": True},
            {"name": "%20 Komisyon Indirimi", "included": True},
            {"name": "20 One Cikarilmis Listeleme", "included": True},
            {"name": "Profilde Elmas Rozet", "included": True},
            {"name": "Gelismis Analitik", "included": True},
            {"name": "Oncelikli Destek", "included": True},
        ],
    },
]

COMMISSION_RATES_DATA = [
    {"rate": 0.10, "description": "Genel komisyon orani"},
]


def seed_subscription_plans(db: Session):
    from app.modules.subscriptions.models import SubscriptionPlan, PlanFeature
    existing = db.query(SubscriptionPlan).count()
    if existing > 0:
        return

    for plan_data in SUBSCRIPTION_PLANS_DATA:
        features = plan_data.pop("features")
        plan = SubscriptionPlan(**plan_data)
        db.add(plan)
        db.flush()

        for i, f in enumerate(features):
            feature = PlanFeature(
                plan_id=plan.id,
                feature_name=f["name"],
                is_included=f["included"],
                sort_order=i,
            )
            db.add(feature)

    db.commit()


def seed_commission_rates(db: Session):
    from app.modules.commissions.models import CommissionRate
    existing = db.query(CommissionRate).count()
    if existing > 0:
        return

    for rate_data in COMMISSION_RATES_DATA:
        rate = CommissionRate(**rate_data)
        db.add(rate)

    db.commit()


DEMO_USERS = [
    {"email": "demo@kullanici.com", "password": "Demo1234", "first_name": "Demo", "last_name": "Kullanici", "role": "USER"},
    {"email": "demo@uzman.com", "password": "Demo1234", "first_name": "Demo", "last_name": "Uzman", "role": "PROVIDER"},
    {"email": "demo@admin.com", "password": "Demo1234", "first_name": "Demo", "last_name": "Admin", "role": "ADMIN"},
]


def seed_demo_users(db: Session):
    from app.modules.users.models import User
    from app.core.security import hash_password

    for user_data in DEMO_USERS:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            continue
        user = User(
            email=user_data["email"],
            password_hash=hash_password(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            role=user_data["role"],
            is_active=True,
        )
        db.add(user)

    db.commit()


def run_all_seeds(db: Session):
    """
    Seed fonksiyonlarını çalıştırır.
    system_settings tablosunda 'seeded' flag'i varsa tekrar çalışmaz.
    """
    try:
        from app.shared.models import SystemSetting
        existing = db.query(SystemSetting).filter(SystemSetting.key == "seeded").first()
        if existing and existing.value == "true":
            import logging
            logging.getLogger(__name__).info("Seed zaten tamamlanmis, atlanıyor.")
            return
    except Exception:
        # Tablo henüz oluşturulmamışsa seed'i çalıştır
        pass

    seed_cities(db)
    seed_categories(db)
    seed_subscription_plans(db)
    seed_commission_rates(db)
    seed_demo_users(db)

    # Seed tamamlandı flag'ini kaydet
    try:
        from app.shared.models import SystemSetting
        flag = db.query(SystemSetting).filter(SystemSetting.key == "seeded").first()
        if not flag:
            flag = SystemSetting(key="seeded", value="true")
            db.add(flag)
        else:
            flag.value = "true"
        db.commit()
    except Exception:
        pass
