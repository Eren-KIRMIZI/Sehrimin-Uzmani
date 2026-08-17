from typing import Optional
from sqlalchemy.orm import Session
from app.modules.categories.models import Category, SubCategory, Service


KEYWORD_MAP = {
    "kombi": {"category": "teknik-hizmetler", "subcategory": "klima-kombi", "service": "Kombi Bakim"},
    "petek": {"category": "teknik-hizmetler", "subcategory": "klima-kombi", "service": "Petek Bakim"},
    "ısıtma": {"category": "teknik-hizmetler", "subcategory": "klima-kombi", "service": "Kombi Bakim"},
    "klima": {"category": "teknik-hizmetler", "subcategory": "klima-kombi", "service": "Klima Montaj"},
    "su kacagi": {"category": "teknik-hizmetler", "subcategory": "tesisat", "service": "Su Kacagi"},
    "tesisat": {"category": "teknik-hizmetler", "subcategory": "tesisat", "service": "Su Kacagi"},
    "musluk": {"category": "teknik-hizmetler", "subcategory": "tesisat", "service": "Musluk Tamiri"},
    "elektrik": {"category": "teknik-hizmetler", "subcategory": "elektrik", "service": "Ev Elektrigi"},
    "priz": {"category": "teknik-hizmetler", "subcategory": "elektrik", "service": "Priz Tamiri"},
    "sigorta": {"category": "teknik-hizmetler", "subcategory": "elektrik", "service": "Sigorta Degisimi"},
    "cilingir": {"category": "teknik-hizmetler", "subcategory": "guvenlik", "service": "Cilingir"},
    "kapi kilidi": {"category": "teknik-hizmetler", "subcategory": "guvenlik", "service": "Kapi Kilidi"},
    "bilgisayar": {"category": "teknik-hizmetler", "subcategory": "bilgisayar-telefon", "service": "Bilgisayar Tamiri"},
    "laptop": {"category": "teknik-hizmetler", "subcategory": "bilgisayar-telefon", "service": "Laptop Tamiri"},
    "telefon": {"category": "teknik-hizmetler", "subcategory": "bilgisayar-telefon", "service": "Telefon Tamiri"},
    "kamera": {"category": "teknik-hizmetler", "subcategory": "guvenlik", "service": "Kamera Kurulumu"},
    "guvenlik": {"category": "teknik-hizmetler", "subcategory": "guvenlik", "service": "Alarm Sistemi"},
    "temizlik": {"category": "ev-yasam", "subcategory": "temizlik", "service": "Ev Temizligi"},
    "ev temizligi": {"category": "ev-yasam", "subcategory": "temizlik", "service": "Ev Temizligi"},
    "hali": {"category": "ev-yasam", "subcategory": "temizlik", "service": "Hali Yikama"},
    "koltuk": {"category": "ev-yasam", "subcategory": "temizlik", "service": "Koltuk Yikama"},
    "boyama": {"category": "ev-yasam", "subcategory": "tadilat", "service": "Boya"},
    "boya": {"category": "ev-yasam", "subcategory": "tadilat", "service": "Boya"},
    "fayans": {"category": "ev-yasam", "subcategory": "tadilat", "service": "Fayans"},
    "parke": {"category": "ev-yasam", "subcategory": "tadilat", "service": "Parke"},
    "psikolog": {"category": "saglik-wellness", "subcategory": "psikoloji", "service": "Psikolog"},
    "terapi": {"category": "saglik-wellness", "subcategory": "psikoloji", "service": "Psikolog"},
    "diyet": {"category": "saglik-wellness", "subcategory": "diyet-beslenme", "service": "Diyetisyen"},
    "beslenme": {"category": "saglik-wellness", "subcategory": "diyet-beslenme", "service": "Diyetisyen"},
    "fizyoterapi": {"category": "saglik-wellness", "subcategory": "fizyoterapi", "service": "Fizyoterapist"},
    "masaj": {"category": "saglik-wellness", "subcategory": "fizyoterapi", "service": "Masaj"},
    "diger": {"category": "saglik-wellness", "subcategory": "yasam-koclugu", "service": "Yasam Kocu"},
    "ozel ders": {"category": "egitim", "subcategory": "okul-dersleri", "service": "Matematik"},
    "matematik": {"category": "egitim", "subcategory": "okul-dersleri", "service": "Matematik"},
    "ingilizce": {"category": "egitim", "subcategory": "okul-dersleri", "service": "Ingilizce"},
    "piano": {"category": "egitim", "subcategory": "muzik-sanat", "service": "Piyano"},
    "gitar": {"category": "egitim", "subcategory": "muzik-sanat", "service": "Gitar"},
    "yazilim": {"category": "egitim", "subcategory": "yazilim-egitim", "service": "Python"},
    "python": {"category": "egitim", "subcategory": "yazilim-egitim", "service": "Python"},
    "bakici": {"category": "cocuk-yasli-bakim", "subcategory": "bebek-cocuk-bakimi", "service": "Bebek Bakicisi"},
    "bebek": {"category": "cocuk-yasli-bakim", "subcategory": "bebek-cocuk-bakimi", "service": "Bebek Bakicisi"},
    "yasli": {"category": "cocuk-yasli-bakim", "subcategory": "yasli-bakimi", "service": "Yasli Bakim Uzmani"},
    "refakatci": {"category": "cocuk-yasli-bakim", "subcategory": "yasli-bakimi", "service": "Refakatci"},
    "veteriner": {"category": "evcil-hayvan", "subcategory": "hayvan-saglik", "service": "Veteriner"},
    "kopek": {"category": "evcil-hayvan", "subcategory": "hayvan-bakim", "service": "Kopek Gezdirme"},
    "pet": {"category": "evcil-hayvan", "subcategory": "hayvan-bakim", "service": "Pet Sitter"},
    "oto tamir": {"category": "arac", "subcategory": "arac-tamir", "service": "Oto Tamir"},
    "araba": {"category": "arac", "subcategory": "arac-tamir", "service": "Oto Tamir"},
    "lastik": {"category": "arac", "subcategory": "lastik-jant", "service": "Lastik Degisimi"},
    "cekici": {"category": "arac", "subcategory": "cekici", "service": "Oto Cekici"},
    "nakliye": {"category": "tasimacilik", "subcategory": "nakliye", "service": "Evden Eve Nakliye"},
    "tasima": {"category": "tasimacilik", "subcategory": "nakliye", "service": "Evden Eve Nakliye"},
    "kurye": {"category": "tasimacilik", "subcategory": "kurye", "service": "Kurye"},
    "avukat": {"category": "profesyonel-hizmetler", "subcategory": "hukuk", "service": "Avukat"},
    "dava": {"category": "profesyonel-hizmetler", "subcategory": "hukuk", "service": "Avukat"},
    "muhasebe": {"category": "profesyonel-hizmetler", "subcategory": "muhasebe", "service": "Mali Musavir"},
    "vergi": {"category": "profesyonel-hizmetler", "subcategory": "muhasebe", "service": "Mali Musavir"},
    "ceviri": {"category": "profesyonel-hizmetler", "subcategory": "ceviri", "service": "Ingilizce Ceviri"},
    "emlak": {"category": "gayrimenkul", "subcategory": "emlak", "service": "Emlak Danismani"},
    "satilik": {"category": "gayrimenkul", "subcategory": "emlak", "service": "Satis Danismani"},
    "kiralik": {"category": "gayrimenkul", "subcategory": "emlak", "service": "Kiralama"},
    "dugun": {"category": "etkinlik-organizasyon", "subcategory": "dugun", "service": "Dugun Organizasyonu"},
    "fotografci": {"category": "etkinlik-organizasyon", "subcategory": "foto-video", "service": "Dugun Fotografçisi"},
    "web": {"category": "dijital-hizmetler", "subcategory": "yazilim", "service": "Web Gelistirme"},
    "web site": {"category": "dijital-hizmetler", "subcategory": "yazilim", "service": "Web Gelistirme"},
    "grafik": {"category": "dijital-hizmetler", "subcategory": "tasarim", "service": "Grafik Tasarim"},
    "logo": {"category": "dijital-hizmetler", "subcategory": "tasarim", "service": "Logo Tasarimi"},
    "seo": {"category": "dijital-hizmetler", "subcategory": "dijital-pazarlama", "service": "SEO"},
    "sosyal medya": {"category": "dijital-hizmetler", "subcategory": "dijital-pazarlama", "service": "Sosyal Medya"},
    "kuaför": {"category": "guzellik", "subcategory": "sac", "service": "Kuaför"},
    "berber": {"category": "guzellik", "subcategory": "sac", "service": "Berber"},
    "sac": {"category": "guzellik", "subcategory": "sac", "service": "Sac Kesimi"},
    "manikur": {"category": "guzellik", "subcategory": "tirnak-cilt", "service": "Manikur"},
    "makyaj": {"category": "guzellik", "subcategory": "makyaj", "service": "Gelin Makyaji"},
    "bahce": {"category": "ev-yasam", "subcategory": "bakim", "service": "Bahcivan"},
    "peyzaj": {"category": "ev-yasam", "subcategory": "bakim", "service": "Peyzaj"},
}


def detect_category(user_input: str, db: Session) -> dict:
    text = user_input.lower().strip()

    best_match = None
    best_length = 0

    for keyword, mapping in KEYWORD_MAP.items():
        if keyword in text and len(keyword) > best_length:
            best_match = mapping
            best_length = len(keyword)

    if not best_match:
        return {
            "detected": False,
            "category": None,
            "subcategory": None,
            "service": None,
            "suggestion": "Kategori algilanamadi. Lutfen kategorinizi manuel secin.",
        }

    category = db.query(Category).filter(Category.slug == best_match["category"]).first()
    subcategory = db.query(SubCategory).filter(SubCategory.slug == best_match["subcategory"]).first() if best_match.get("subcategory") else None
    service = db.query(Service).filter(Service.name == best_match["service"]).first() if best_match.get("service") else None

    return {
        "detected": True,
        "category": {"id": category.id, "name": category.name, "slug": category.slug} if category else None,
        "subcategory": {"id": subcategory.id, "name": subcategory.name, "slug": subcategory.slug} if subcategory else None,
        "service": {"id": service.id, "name": service.name, "slug": service.slug} if service else None,
        "suggestion": f"Ihtiyaciniz algilandi: {category.name if category else ''} > {subcategory.name if subcategory else ''} > {service.name if service else ''}",
    }
