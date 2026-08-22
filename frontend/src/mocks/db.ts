// ============================================================================
// MOCK VERİ TABANI — Backend kapalıyken tüm sayfaların test edilebilmesi için
// Gerçek API yanıtı gelmezse servis katmanı bu veriye düşer (fallback).
// Mutation'lar bellek içi çalışır; sayfa yenilenince sıfırlanır.
// ============================================================================

const daysFromNow = (days: number, hour = 10, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const seq: Record<string, number> = {};
export const nextId = (key: string): number => {
  seq[key] = (seq[key] || 1000) + 1;
  return seq[key];
};

// â”€â”€ Konum â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const cities = [
  { id: 1, name: 'İstanbul', plate_code: 34 },
  { id: 2, name: 'Ankara', plate_code: 6 },
  { id: 3, name: 'İzmir', plate_code: 35 },
  { id: 4, name: 'Bursa', plate_code: 16 },
  { id: 5, name: 'Antalya', plate_code: 7 },
  { id: 6, name: 'Nevşehir', plate_code: 50 },
  { id: 7, name: 'Kayseri', plate_code: 38 },
  { id: 8, name: 'Aksaray', plate_code: 68 },
  { id: 9, name: 'Konya', plate_code: 42 },
  { id: 10, name: 'Adana', plate_code: 1 },
];

export const districts = [
  { id: 1, name: 'Kadıköy', city_id: 1 },
  { id: 2, name: 'Beşiktaş', city_id: 1 },
  { id: 3, name: 'Üsküdar', city_id: 1 },
  { id: 4, name: 'Åişli', city_id: 1 },
  { id: 5, name: 'Çankaya', city_id: 2 },
  { id: 6, name: 'Keçiören', city_id: 2 },
  { id: 7, name: 'Bornova', city_id: 3 },
  { id: 8, name: 'Karşıyaka', city_id: 3 },
];

// â”€â”€ Kategoriler / Hizmetler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const categories = [
  {
    id: 1, name: 'Teknik Hizmetler', slug: 'teknik-hizmetler', icon: 'âš¡',
    subcategories: [
      { id: 1, name: 'Elektrik', slug: 'elektrik', category_id: 1, services: [
        { id: 1, name: 'Elektrikçi', slug: 'elektrikci', subcategory_id: 1 },
        { id: 2, name: 'Sigorta Değişimi', slug: 'sigorta-degisimi', subcategory_id: 1 },
      ]},
      { id: 2, name: 'Tesisat', slug: 'tesisat', category_id: 1, services: [
        { id: 3, name: 'Tesisatçı', slug: 'tesisatci', subcategory_id: 2 },
        { id: 4, name: 'Kombi Bakımı', slug: 'kombi-bakimi', subcategory_id: 2 },
      ]},
      { id: 3, name: 'Beyaz Eşya', slug: 'beyaz-esya', category_id: 1, services: [
        { id: 5, name: 'Buzdolabı Tamiri', slug: 'buzdolabi-tamiri', subcategory_id: 3 },
      ]},
    ],
  },
  {
    id: 2, name: 'Ev ve Yaşam', slug: 'ev-ve-yasam', icon: 'ğŸ ',
    subcategories: [
      { id: 4, name: 'Temizlik', slug: 'temizlik', category_id: 2, services: [
        { id: 6, name: 'Ev Temizliği', slug: 'ev-temizligi', subcategory_id: 4 },
        { id: 7, name: 'Derin Temizlik', slug: 'derin-temizlik', subcategory_id: 4 },
      ]},
      { id: 5, name: 'Tadilat', slug: 'tadilat', category_id: 2, services: [
        { id: 8, name: 'Boya Badana', slug: 'boya-badana', subcategory_id: 5 },
      ]},
    ],
  },
  {
    id: 3, name: 'Sağlık ve Wellness', slug: 'saglik-ve-wellness', icon: 'ğŸ’†',
    subcategories: [
      { id: 6, name: 'Fizyoterapi', slug: 'fizyoterapi', category_id: 3, services: [
        { id: 9, name: 'Fizyoterapist', slug: 'fizyoterapist', subcategory_id: 6 },
      ]},
      { id: 7, name: 'Psikoloji', slug: 'psikoloji', category_id: 3, services: [
        { id: 10, name: 'Psikolog', slug: 'psikolog', subcategory_id: 7 },
      ]},
    ],
  },
  {
    id: 4, name: 'Eğitim', slug: 'egitim', icon: 'ğŸ“š',
    subcategories: [
      { id: 8, name: 'Özel Ders', slug: 'ozel-ders', category_id: 4, services: [
        { id: 11, name: 'Matematik', slug: 'matematik', subcategory_id: 8 },
        { id: 12, name: 'İngilizce', slug: 'ingilizce', subcategory_id: 8 },
      ]},
    ],
  },
  {
    id: 5, name: 'Çocuk ve Yaşlı Bakımı', slug: 'cocuk-ve-yasli-bakimi', icon: 'ğŸ‘¶',
    subcategories: [
      { id: 9, name: 'Yaşlı Bakımı', slug: 'yasli-bakimi', category_id: 5, services: [
        { id: 13, name: 'Bakıcı', slug: 'bakici', subcategory_id: 9 },
      ]},
    ],
  },
  {
    id: 6, name: 'Evcil Hayvan', slug: 'evcil-hayvan', icon: 'ğŸ¾',
    subcategories: [
      { id: 10, name: 'Pet Kuaförü', slug: 'pet-kuaforu', category_id: 6, services: [
        { id: 14, name: 'Köpek Kuaförü', slug: 'kopek-kuaforu', subcategory_id: 10 },
      ]},
    ],
  },
  {
    id: 7, name: 'Araç', slug: 'arac', icon: 'ğŸš—',
    subcategories: [
      { id: 11, name: 'Oto Servis', slug: 'oto-servis', category_id: 7, services: [
        { id: 15, name: 'Mekanik', slug: 'mekanik', subcategory_id: 11 },
      ]},
    ],
  },
  {
    id: 8, name: 'Taşımacılık', slug: 'tasimacilik', icon: 'ğŸšš',
    subcategories: [
      { id: 13, name: 'Nakliyat', slug: 'nakliyat', category_id: 8, services: [
        { id: 16, name: 'Evden Eve Nakliyat', slug: 'evden-eve-nakliyat', subcategory_id: 13 },
      ]},
    ],
  },
  {
    id: 9, name: 'Profesyonel Hizmetler', slug: 'profesyonel-hizmetler', icon: 'ğŸ’¼',
    subcategories: [
      { id: 14, name: 'Muhasebe', slug: 'muhasebe', category_id: 9, services: [
        { id: 17, name: 'Mali Müşavir', slug: 'mali-musavir', subcategory_id: 14 },
      ]},
    ],
  },
  {
    id: 10, name: 'Gayrimenkul', slug: 'gayrimenkul', icon: 'ğŸ¢',
    subcategories: [
      { id: 15, name: 'Emlak Danışmanlığı', slug: 'emlak-danismanligi', category_id: 10, services: [
        { id: 18, name: 'Danışman', slug: 'danisman', subcategory_id: 15 },
      ]},
    ],
  },
  {
    id: 11, name: 'Etkinlik ve Organizasyon', slug: 'etkinlik-ve-organizasyon', icon: 'ğŸ‰',
    subcategories: [
      { id: 16, name: 'Düğün', slug: 'dugun', category_id: 11, services: [
        { id: 19, name: 'Fotoğrafçı', slug: 'fotografci', subcategory_id: 16 },
      ]},
    ],
  },
  {
    id: 12, name: 'Dijital Hizmetler', slug: 'dijital-hizmetler', icon: 'ğŸ’»',
    subcategories: [
      { id: 17, name: 'Web Tasarım', slug: 'web-tasarim', category_id: 12, services: [
        { id: 20, name: 'Yazılımcı', slug: 'yazilimci', subcategory_id: 17 },
      ]},
    ],
  },
  {
    id: 13, name: 'Güzellik', slug: 'guzellik', icon: '💅',
    subcategories: [
      { id: 18, name: 'Kuaför', slug: 'kuafor', category_id: 13, services: [
        { id: 21, name: 'Saç Kesimi', slug: 'sac-kesimi', subcategory_id: 18 },
      ]},
    ],
  },
  {
    id: 14, name: 'Spor ve Fitness', slug: 'spor-ve-fitness', icon: '🏋️',
    subcategories: [
      { id: 19, name: 'Kişisel Antrenör', slug: 'kisisel-antrenor', category_id: 14, services: [
        { id: 22, name: 'Özel Ders', slug: 'ozel-ders-spor', subcategory_id: 19 },
      ]},
    ],
  },
];

// ————————————————————————————————————————————————————————————————————————————————————————————————————
const baseUser = (id: number, first_name: string, last_name: string, email: string, role: string, extra: Record<string, unknown> = {}) => ({
  id, first_name, last_name, email, role,
  phone: '+90 5xx xxx xx xx',
  avatar_url: '',
  subscription_plan: role === 'PROVIDER' ? 'silver' : '',
  two_factor_enabled: false,
  is_active: true,
  created_at: daysFromNow(-365),
  ...extra,
});

export const users: any[] = [
  baseUser(1, 'Sistem', 'Yöneticisi', 'admin@sehriminuzmani.com', 'ADMIN'),
  baseUser(2, 'Ayşe', 'Yılmaz', 'demo@ornek.com', 'USER'),
  baseUser(3, 'Mehmet', 'Demir', 'uzman@ornek.com', 'PROVIDER', { subscription_plan: 'gold' }),
  baseUser(4, 'Ayşe', 'Kaya', 'ayse.kaya@ornek.com', 'PROVIDER', { subscription_plan: 'diamond' }),
  baseUser(5, 'Zeynep', 'Åahin', 'zeynep.sahin@ornek.com', 'PROVIDER', { subscription_plan: 'silver' }),
  baseUser(6, 'Emre', 'Çelik', 'emre.celik@ornek.com', 'PROVIDER'),
  baseUser(7, 'Fatma', 'Aydın', 'fatma.aydin@ornek.com', 'PROVIDER', { subscription_plan: 'silver' }),
  baseUser(8, 'Can', 'Öztürk', 'can.ozturk@ornek.com', 'PROVIDER'),
  baseUser(9, 'Elif', 'Arslan', 'elif.arslan@ornek.com', 'PROVIDER', { subscription_plan: 'bronze' }),
  baseUser(10, 'Burak', 'Koç', 'burak.koc@ornek.com', 'PROVIDER'),
  baseUser(11, 'Ali', 'Vural', 'ali.vural@ornek.com', 'USER'),
  baseUser(12, 'Merve', 'Doğan', 'merve.dogan@ornek.com', 'USER'),
];

// â”€â”€ Uzman Profilleri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mkAvailability = () => [1, 2, 3, 4, 5, 6].map((day, i) => ({
  id: i + 1, day_of_week: day === 6 ? 6 : day - 1,
  start_time: '09:00', end_time: day === 6 ? '16:00' : '18:00',
}));

export const providers: any[] = [
  {
    id: 1, user_id: 3, business_name: 'Demir Elektrik & Tesisat',
    bio: '15 yıllık deneyimimle elektrik tesisatı, kombi bakımı ve acil arıza giderme konularında hizmet veriyorum. Kadıköy ve çevresinde aynı gün çözüm garantisi.',
    avatar_url: '', rating: 4.8, review_count: 127, completed_jobs: 342, years_experience: 15,
    verification_level: 'PROFESSIONAL', is_available: true, hourly_rate: 350,
    subscription_plan: 'gold', badge_type: 'gold',
    services: [
      { id: 1, service: { id: 1, name: 'Elektrikçi', slug: 'elektrikci', subcategory_id: 1 }, starting_price: 300, description: 'Priz, anahtar, sigorta ve aydınlatma işleri' },
      { id: 2, service: { id: 4, name: 'Kombi Bakımı', slug: 'kombi-bakimi', subcategory_id: 2 }, starting_price: 550, description: 'Yıllık bakım, arıza tespiti ve onarım' },
      { id: 3, service: { id: 3, name: 'Tesisatçı', slug: 'tesisatci', subcategory_id: 2 }, starting_price: 250, description: 'Su tesisatı, gider açma, batarya montajı' },
    ],
    locations: [{ id: 1, city: cities[0], district: districts[0] }],
    portfolio: [
      { id: 1, image_url: 'https://picsum.photos/seed/elektrik1/600/450', title: 'Apartman panosu yenileme' },
      { id: 2, image_url: 'https://picsum.photos/seed/elektrik2/600/450', title: 'Kombi bakımı' },
      { id: 3, image_url: 'https://picsum.photos/seed/elektrik3/600/450', title: 'Ofiste aydınlatma projesi' },
    ],
    availability: mkAvailability(),
  },
  {
    id: 2, user_id: 4, business_name: 'Kaya Temizlik',
    bio: 'Profesyonel ekipmanlarla ev, ofis ve derin temizlik. Memnun kalmazsanız ücret alınmaz.',
    avatar_url: '', rating: 4.9, review_count: 89, completed_jobs: 512, years_experience: 8,
    verification_level: 'BUSINESS', is_available: true, hourly_rate: 280,
    subscription_plan: 'diamond', badge_type: 'diamond',
    services: [
      { id: 4, service: { id: 6, name: 'Ev Temizliği', slug: 'ev-temizligi', subcategory_id: 4 }, starting_price: 750, description: '3+1 daire standart temizlik' },
      { id: 5, service: { id: 7, name: 'Derin Temizlik', slug: 'derin-temizlik', subcategory_id: 4 }, starting_price: 1400, description: 'Detaylı, ekipmanlı derin temizlik' },
    ],
    locations: [{ id: 2, city: cities[0], district: districts[1] }],
    portfolio: [
      { id: 4, image_url: 'https://picsum.photos/seed/temizlik1/600/450', title: 'Sonrası — mutfak' },
      { id: 5, image_url: 'https://picsum.photos/seed/temizlik2/600/450', title: 'Ofis temizliği' },
    ],
    availability: mkAvailability(),
  },
  {
    id: 3, user_id: 5, business_name: 'Uzm. Psk. Zeynep Åahin',
    bio: 'Kaygı, stres yönetimi ve ilişki sorunlarında bilişsel davranışçı terapi. Online ve yüz yüze seanslar.',
    avatar_url: '', rating: 4.7, review_count: 54, completed_jobs: 480, years_experience: 10,
    verification_level: 'ID', is_available: false, hourly_rate: 900,
    subscription_plan: 'silver', badge_type: 'silver',
    services: [
      { id: 6, service: { id: 10, name: 'Psikolog', slug: 'psikolog', subcategory_id: 7 }, starting_price: 900, description: '50 dk bireysel seans' },
    ],
    locations: [{ id: 3, city: cities[1], district: districts[4] }],
    portfolio: [],
    availability: mkAvailability().slice(0, 5),
  },
  {
    id: 4, user_id: 6, business_name: 'Çelik Tesisat',
    bio: 'Su tesisatı, gider açma ve kalorifer sistemlerinde hızlı çözüm.',
    avatar_url: '', rating: 4.5, review_count: 41, completed_jobs: 198, years_experience: 12,
    verification_level: 'BASIC', is_available: true, hourly_rate: 300,
    subscription_plan: '', badge_type: '',
    services: [
      { id: 7, service: { id: 3, name: 'Tesisatçı', slug: 'tesisatci', subcategory_id: 2 }, starting_price: 220, description: 'Gider açma, batarya, klozet montajı' },
    ],
    locations: [{ id: 4, city: cities[0], district: districts[2] }],
    portfolio: [],
    availability: mkAvailability(),
  },
  {
    id: 5, user_id: 7, business_name: 'Fatma Aydın — Matematik Öğretmeni',
    bio: 'LGS ve AYT matematikte nokta atışı çalışma. 9 yıllık özel ders deneyimi.',
    avatar_url: '', rating: 5.0, review_count: 32, completed_jobs: 156, years_experience: 9,
    verification_level: 'ID', is_available: true, hourly_rate: 400,
    subscription_plan: 'silver', badge_type: 'silver',
    services: [
      { id: 8, service: { id: 11, name: 'Matematik', slug: 'matematik', subcategory_id: 8 }, starting_price: 400, description: 'Birebir online veya yüz yüze ders' },
    ],
    locations: [{ id: 5, city: cities[2], district: districts[6] }],
    portfolio: [],
    availability: mkAvailability().slice(1, 6),
  },
  {
    id: 6, user_id: 8, business_name: 'Öztürk Nakliyat',
    bio: 'Åehir içi ve şehirler arası evden eve nakliyat. Sigortalı taşıma, ücretsiz ekspertiz.',
    avatar_url: '', rating: 4.4, review_count: 67, completed_jobs: 289, years_experience: 14,
    verification_level: 'NONE', is_available: true, hourly_rate: 0,
    subscription_plan: '', badge_type: '',
    services: [
      { id: 9, service: { id: 16, name: 'Evden Eve Nakliyat', slug: 'evden-eve-nakliyat', subcategory_id: 13 }, starting_price: 3500, description: '3+1 daire şehir içi komple taşıma' },
    ],
    locations: [{ id: 6, city: cities[0], district: districts[3] }],
    portfolio: [
      { id: 6, image_url: 'https://picsum.photos/seed/nakliye1/600/450', title: 'Asansörlü taşıma' },
    ],
    availability: mkAvailability(),
  },
  {
    id: 7, user_id: 9, business_name: 'Elif Arslan Hair Studio',
    bio: 'Kesim, boya, bakım ve düğün saçı tasarımı. Randevulu çalışır.',
    avatar_url: '', rating: 4.6, review_count: 78, completed_jobs: 640, years_experience: 7,
    verification_level: 'PROFESSIONAL', is_available: true, hourly_rate: 250,
    subscription_plan: 'bronze', badge_type: 'gold',
    services: [
      { id: 10, service: { id: 21, name: 'Saç Kesimi', slug: 'sac-kesimi', subcategory_id: 18 }, starting_price: 250, description: 'Kesim + şekillendirme' },
    ],
    locations: [{ id: 7, city: cities[0], district: districts[0] }],
    portfolio: [
      { id: 7, image_url: 'https://picsum.photos/seed/sac1/600/450', title: 'Gelin saçı' },
      { id: 8, image_url: 'https://picsum.photos/seed/sac2/600/450', title: 'Röfle & bakım' },
    ],
    availability: mkAvailability(),
  },
  {
    id: 8, user_id: 10, business_name: 'Koç Oto Servis',
    bio: 'Tüm markalara periyodik bakım, mekanik ve fren sistemi servisi.',
    avatar_url: '', rating: 4.3, review_count: 45, completed_jobs: 233, years_experience: 11,
    verification_level: 'BASIC', is_available: true, hourly_rate: 500,
    subscription_plan: '', badge_type: '',
    services: [
      { id: 11, service: { id: 15, name: 'Mekanik', slug: 'mekanik', subcategory_id: 11 }, starting_price: 800, description: 'Periyodik bakım paketi' },
    ],
    locations: [{ id: 8, city: cities[0], district: districts[2] }],
    portfolio: [],
    availability: mkAvailability(),
  },
];

// â”€â”€ Talepler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const requests: any[] = [
  {
    id: 1, customer_id: 2, title: 'Salonda priz ve aydınlatma arızası',
    description: 'Salondaki üç priz çalışmıyor, avize titriyor. Acil elektrikçi gerekiyor.',
    category_id: 1, subcategory_id: 1, service_id: 1,
    city_id: 1, district_id: 1, status: 'OPEN', urgency: 'HIGH',
    budget_min: 500, budget_max: 1500, preferred_date: daysFromNow(1),
    notes: 'Akşam saatleri tercih edilir.', created_at: daysFromNow(-2),
  },
  {
    id: 2, customer_id: 2, title: '3+1 ev temizliği',
    description: 'Taşınma sonrası detaylı temizlik isteniyor, beyaz eşyalar dahil.',
    category_id: 2, subcategory_id: 4, service_id: 6,
    city_id: 1, district_id: 1, status: 'IN_PROGRESS', urgency: 'MEDIUM',
    budget_min: 800, budget_max: 1400, preferred_date: daysFromNow(2),
    notes: '', created_at: daysFromNow(-5),
  },
  {
    id: 3, customer_id: 2, title: 'Kombi yıllık bakımı',
    description: 'Marka: Vaillant, son bakım 1 yıl önce yapıldı.',
    category_id: 1, subcategory_id: 2, service_id: 4,
    city_id: 1, district_id: 1, status: 'COMPLETED', urgency: 'LOW',
    budget_min: 600, budget_max: 900, preferred_date: daysFromNow(-18),
    notes: '', created_at: daysFromNow(-20),
  },
  {
    id: 4, customer_id: 2, title: 'LGS matematik özel ders',
    description: '8. sınıf oğlum için haftada 2 gün matematik dersi aranıyor.',
    category_id: 4, subcategory_id: 8, service_id: 11,
    city_id: 1, district_id: undefined, status: 'OPEN', urgency: 'MEDIUM',
    budget_min: 200, budget_max: 400, preferred_date: daysFromNow(3),
    notes: 'Online olabilir.', created_at: daysFromNow(-1),
  },
];

// â”€â”€ Teklifler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const quotes: any[] = [
  {
    id: 1, request_id: 1, provider_id: 1, price: 850,
    estimated_duration: '1 gün', warranty: '6 ay işçilik garantisi',
    description: 'Priz grubu sigortası ve avize bağlantısı yenilenecek, malzeme dahildir.',
    materials: 'Priz, kablo, avise bağlantı malzemesi',
    status: 'SUBMITTED', created_at: daysFromNow(-1, 14),
    items: [
      { id: 1, name: 'Priz grubu yenileme', price: 300, type: 'LABOR', quantity: 1 },
      { id: 2, name: 'Aydınlatma onarımı', price: 450, type: 'LABOR', quantity: 1 },
      { id: 3, name: 'Malzeme', price: 100, type: 'MATERIAL', quantity: 1 },
    ],
  },
  {
    id: 2, request_id: 1, provider_id: 4, price: 700,
    estimated_duration: '2 gün', warranty: 'Yok',
    description: 'Prizler değiştirilir, avize kontrol edilir. Malzeme hariçtir.',
    materials: 'Hariç',
    status: 'SUBMITTED', created_at: daysFromNow(-1, 9),
    items: [
      { id: 4, name: 'İşçilik', price: 700, type: 'LABOR', quantity: 1 },
    ],
  },
  {
    id: 3, request_id: 2, provider_id: 2, price: 1100,
    estimated_duration: '1 gün', warranty: 'Memnuniyet garantisi',
    description: '3+1 daire taşınma sonrası derin temizlik, beyaz eşya dış cephesi dahil.',
    materials: 'Temizlik malzemeleri dahil',
    status: 'ACCEPTED', created_at: daysFromNow(-4, 11),
    items: [{ id: 5, name: 'Derin temizlik paketi', price: 1100, type: 'LABOR', quantity: 1 }],
  },
  {
    id: 4, request_id: 4, provider_id: 5, price: 350,
    estimated_duration: 'Ders başına 90 dk', warranty: 'İlk ders memnuniyet garantisi',
    description: 'Haftada 2 gün online LGS matematik programı, deneme analizleri dahil.',
    materials: '-',
    status: 'SUBMITTED', created_at: daysFromNow(0, 8),
    items: [{ id: 6, name: 'Ders paketi (saatlik)', price: 350, type: 'LABOR', quantity: 1 }],
  },
];

// â”€â”€ Randevular â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const appointments: any[] = [
  {
    id: 1, request_id: 3, provider_id: 1, customer_id: 2,
    start_at: daysFromNow(-18, 13), end_at: daysFromNow(-18, 15),
    location: 'Kadıköy — müşteri adresi', notes: 'Vaillant kombi yıllık bakım',
    status: 'COMPLETED', created_at: daysFromNow(-20),
  },
  {
    id: 2, request_id: 2, provider_id: 2, customer_id: 2,
    start_at: daysFromNow(2, 14), end_at: daysFromNow(2, 18),
    location: 'Kadıköy — müşteri adresi', notes: 'Taşınma sonrası temizlik',
    status: 'CONFIRMED', created_at: daysFromNow(-4),
  },
  {
    id: 3, request_id: undefined, provider_id: 1, customer_id: 2,
    start_at: daysFromNow(3, 11), end_at: daysFromNow(3, 12),
    location: 'Kadıköy — müşteri adresi', notes: 'Priz ve aydınlatma onarımı',
    status: 'SCHEDULED', created_at: daysFromNow(0),
  },
  {
    id: 4, request_id: undefined, provider_id: 7, customer_id: 2,
    start_at: daysFromNow(-6, 16), end_at: daysFromNow(-6, 17),
    location: 'Elif Arslan Hair Studio', notes: 'Saç kesimi randevusu',
    status: 'CANCELLED', created_at: daysFromNow(-8),
  },
];

// â”€â”€ Yorumlar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const reviews: any[] = [
  {
    id: 1, provider_id: 1, customer_id: 2, rating: 5,
    comment: 'Kombi bakımını aynı gün tamamladı, fiyat da teklifte kaldı. Kesinlikle tavsiye ederim.',
    communication_rating: 5, quality_rating: 5, price_rating: 4, punctuality_rating: 5,
    provider_reply: 'Teşekkürler Ayşe Hanım, güveniniz için biz teşekkür ederiz. ğŸ™‚',
    created_at: daysFromNow(-17),
  },
  {
    id: 2, provider_id: 1, customer_id: 11, rating: 4,
    comment: 'İşi iyi yaptı ama biraz geç geldi.',
    communication_rating: 4, quality_rating: 5, price_rating: 4, punctuality_rating: 3,
    provider_reply: '',
    created_at: daysFromNow(-10),
  },
  {
    id: 3, provider_id: 2, customer_id: 12, rating: 5,
    comment: 'Ekip çok titizdi, ev mis gibi oldu. Fiyat da çok uygundu.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: 'Biz teşekkür ederiz, tekrar bekleriz!',
    created_at: daysFromNow(-30),
  },
  {
    id: 4, provider_id: 5, customer_id: 11, rating: 5,
    comment: 'Kızım matematikte büyük ilerleme kaydetti. Fatma Hanım harika bir öğretmen.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: '',
    created_at: daysFromNow(-3),
  },
  {
    id: 5, provider_id: 1, customer_id: 12, rating: 5,
    comment: 'Sigorta kutusunu aynı gün değiştirdi, çok memnun kaldım.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 4,
    provider_reply: '',
    created_at: daysFromNow(-40),
  },
];

// â”€â”€ Bildirimler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const notifications: any[] = [
  { id: 1, user_id: 2, type: 'QUOTE', title: 'Yeni Teklif', message: 'Demir Elektrik & Tesisat talebinize â‚º850 teklif verdi.', is_read: false, created_at: daysFromNow(-1, 14) },
  { id: 2, user_id: 2, type: 'QUOTE', title: 'Yeni Teklif', message: 'Çelik Tesisat talebinize â‚º700 teklif verdi.', is_read: false, created_at: daysFromNow(-1, 9) },
  { id: 3, user_id: 2, type: 'APPOINTMENT', title: 'Randevu Onaylandı', message: 'Kaya Temizlik randevunuzu onayladı.', is_read: false, created_at: daysFromNow(-3) },
  { id: 4, user_id: 2, type: 'MESSAGE', title: 'Yeni Mesaj', message: 'Mehmet Demir size bir mesaj gönderdi.', is_read: true, created_at: daysFromNow(-2) },
  { id: 5, user_id: 3, type: 'REQUEST', title: 'Yeni Talep', message: 'Bölgenizde yeni bir elektrik talebi yayınlandı.', is_read: false, created_at: daysFromNow(-2) },
];

// â”€â”€ Mesajlaşma â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const conversations: any[] = [
  {
    id: 1, customer_id: 2, provider_id: 1, created_at: daysFromNow(-2),
    unread_count: 1,
    customer: users[1], provider: providers[0],
    last_message: { id: 3, conversation_id: 1, sender_id: 3, content: 'Yarın 11:00 uygun mu?', message_type: 'TEXT', created_at: daysFromNow(0, 9, 30), is_read: false },
  },
  {
    id: 2, customer_id: 2, provider_id: 2, created_at: daysFromNow(-4),
    unread_count: 0,
    customer: users[1], provider: providers[1],
    last_message: { id: 5, conversation_id: 2, sender_id: 2, content: 'Teşekkürler, cumartesi görüşürüz!', message_type: 'TEXT', created_at: daysFromNow(-3, 18), is_read: true },
  },
];

export const messages: any[] = [
  { id: 1, conversation_id: 1, sender_id: 2, content: 'Merhaba, salondaki priz arızası için ne kadar sürede gelebilirsiniz?', message_type: 'TEXT', created_at: daysFromNow(-1, 20), is_read: true },
  { id: 2, conversation_id: 1, sender_id: 3, content: 'Merhaba Ayşe Hanım, teklifi incelediniz mi? Yarın öğleden sonra müsaitim.', message_type: 'TEXT', created_at: daysFromNow(-1, 21), is_read: true },
  { id: 3, conversation_id: 1, sender_id: 3, content: 'Yarın 11:00 uygun mu?', message_type: 'TEXT', created_at: daysFromNow(0, 9, 30), is_read: false },
  { id: 4, conversation_id: 2, sender_id: 4, content: 'Cumartesi 14:00 için randevunuz onaylandı.', message_type: 'TEXT', created_at: daysFromNow(-3, 12), is_read: true },
  { id: 5, conversation_id: 2, sender_id: 2, content: 'Teşekkürler, cumartesi görüşürüz!', message_type: 'TEXT', created_at: daysFromNow(-3, 18), is_read: true },
];

// â”€â”€ Kazançlar / Komisyonlar (uzman görünümü) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const earningsSummary = {
  total_earned: 48250, pending_amount: 1250, paid_amount: 32000, available_for_payout: 15000,
};

export const transactions: any[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  provider_id: 1,
  amount: [850, 550, 1200, 300, 950, 700, 1450, 550, 850, 300, 1100, 650, 900, 500][i],
  commission_amount: [42, 27, 60, 15, 47, 35, 72, 27, 42, 15, 55, 32, 45, 25][i],
  provider_earning: [808, 523, 1140, 285, 903, 665, 1378, 523, 808, 285, 1045, 618, 855, 475][i],
  status: i < 2 ? 'PENDING' : 'COMPLETED',
  created_at: daysFromNow(-(i * 2 + 1)),
}));

export const earningsHistory = Array.from({ length: 30 }, (_, i) => ({
  date: daysFromNow(-(29 - i)).slice(0, 10),
  amount: Math.round(200 + Math.abs(Math.sin(i * 1.7)) * 900),
}));

export const payouts: any[] = [
  { id: 1, provider_id: 1, amount: 5000, bank_name: 'Ziraat Bankasi', iban: 'TR330006100519786457841326', status: 'APPROVED', created_at: daysFromNow(-25) },
  { id: 2, provider_id: 1, amount: 7500, bank_name: 'Ziraat Bankasi', iban: 'TR330006100519786457841326', status: 'REJECTED', created_at: daysFromNow(-12) },
  { id: 3, provider_id: 1, amount: 19500, bank_name: 'Garanti BBVA', iban: 'TR120006200000100000123456', status: 'PENDING', created_at: daysFromNow(-2) },
];

// â”€â”€ Abonelik â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const plans = [
  {
    id: 1, name: 'Starter', slug: 'starter', price_monthly: 0, price_yearly: 0,
    commission_discount: 0, badge_type: '', featured_limit: 0, popular: false,
    features: [
      { id: 1, feature_name: 'Profil oluşturma', is_included: true },
      { id: 2, feature_name: 'Taleplere teklif verme', is_included: true },
      { id: 3, feature_name: 'Öne çıkarma', is_included: false },
      { id: 4, feature_name: 'Komisyon indirimi', is_included: false },
    ],
  },
  {
    id: 2, name: 'Bronze', slug: 'bronze', price_monthly: 149, price_yearly: 1490,
    commission_discount: 5, badge_type: 'bronze', featured_limit: 1, popular: false,
    features: [
      { id: 5, feature_name: 'Profil oluşturma', is_included: true },
      { id: 6, feature_name: 'Taleplere teklif verme', is_included: true },
      { id: 7, feature_name: '1 öne çıkan ilan', is_included: true },
      { id: 8, feature_name: '%5 komisyon indirimi', is_included: true },
    ],
  },
  {
    id: 3, name: 'Silver', slug: 'silver', price_monthly: 299, price_yearly: 2990,
    commission_discount: 10, badge_type: 'silver', featured_limit: 5, popular: true,
    features: [
      { id: 9, feature_name: 'Bronze özellikleri', is_included: true },
      { id: 10, feature_name: '5 öne çıkan ilan', is_included: true },
      { id: 11, feature_name: '%10 komisyon indirimi', is_included: true },
      { id: 12, feature_name: 'Gelişmiş istatistikler', is_included: true },
    ],
  },
  {
    id: 4, name: 'Gold', slug: 'gold', price_monthly: 599, price_yearly: 5990,
    commission_discount: 20, badge_type: 'gold', featured_limit: 15, popular: false,
    features: [
      { id: 13, feature_name: 'Silver özellikleri', is_included: true },
      { id: 14, feature_name: '15 öne çıkan ilan', is_included: true },
      { id: 15, feature_name: '%20 komisyon indirimi', is_included: true },
      { id: 16, feature_name: 'Öncelikli destek', is_included: true },
    ],
  },
  {
    id: 5, name: 'Diamond', slug: 'diamond', price_monthly: 999, price_yearly: 9990,
    commission_discount: 30, badge_type: 'diamond', featured_limit: 40, popular: false,
    features: [
      { id: 17, feature_name: 'Gold özellikleri', is_included: true },
      { id: 18, feature_name: '40 öne çıkan ilan', is_included: true },
      { id: 19, feature_name: '%30 komisyon indirimi', is_included: true },
      { id: 20, feature_name: 'Kişisel hesap yöneticisi', is_included: true },
    ],
  },
];

export const mySubscription = {
  id: 1, plan: plans[2], interval: 'MONTHLY', status: 'ACTIVE',
  expires_at: daysFromNow(45), created_at: daysFromNow(-15),
};

// â”€â”€ Kampanyalar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const promotions: any[] = [
  {
    id: 1, provider_id: 1, category_id: 1, budget: 1000, daily_budget: 50, bid_amount: 25,
    status: 'ACTIVE', impressions: 4230, clicks: 312, budget_spent: 340,
    created_at: daysFromNow(-10), expires_at: daysFromNow(20),
  },
  {
    id: 2, provider_id: 1, category_id: 1, budget: 500, daily_budget: 30, bid_amount: 15,
    status: 'PAUSED', impressions: 1180, clicks: 64, budget_spent: 210,
    created_at: daysFromNow(-30), expires_at: daysFromNow(-5),
  },
];

// â”€â”€ Anlaşmazlıklar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const disputes: any[] = [
  {
    id: 1, reporter_id: 2, reported_id: 8, reason: 'Randevuya Gelmedi',
    description: 'Anlaştığımız tarihte uzman gelmedi, telefonlara da cevap verilmiyor.',
    status: 'OPEN', priority: 'HIGH', resolution: '',
    created_at: daysFromNow(-3),
    reporter: users[1], reported: users[7],
    messages: [
      { id: 1, dispute_id: 1, sender_id: 2, message: 'Anlaştığımız tarihte gelmedi.', is_admin: false, created_at: daysFromNow(-3), sender: users[1] },
      { id: 2, dispute_id: 1, sender_id: 1, message: 'Talebiniz incelenmeye alındı, ilgili uzmana ulaşıyoruz.', is_admin: true, created_at: daysFromNow(-2), sender: users[0] },
    ],
  },
  {
    id: 2, reporter_id: 2, reported_id: 6, reason: 'Kalite Sorunu',
    description: 'Yapılan boyada eksik yerler kaldı, düzeltme istedim ancak dönüş yapılmadı.',
    status: 'RESOLVED', priority: 'MEDIUM',
    resolution: 'Taraflar arasında anlaşma sağlandı, eksikler 3 gün içinde tamamlandı.',
    created_at: daysFromNow(-20),
    reporter: users[1], reported: users[5],
    messages: [
      { id: 3, dispute_id: 2, sender_id: 2, message: 'Boyada eksikler var.', is_admin: false, created_at: daysFromNow(-20), sender: users[1] },
    ],
  },
];

// â”€â”€ Doğrulama Talepleri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const verifications: any[] = [
  { id: 1, provider_id: 6, provider_name: 'Öztürk Nakliyat', verification_type: 'BUSINESS', document_url: 'https://picsum.photos/seed/doc1/500/350', status: 'PENDING', created_at: daysFromNow(-2) },
  { id: 2, provider_id: 8, provider_name: 'Koç Oto Servis', verification_type: 'PROFESSIONAL', document_url: 'https://picsum.photos/seed/doc2/500/350', status: 'PENDING', created_at: daysFromNow(-1) },
  { id: 3, provider_id: 4, provider_name: 'Çelik Tesisat', verification_type: 'IDENTITY', document_url: 'https://picsum.photos/seed/doc3/500/350', status: 'PENDING', created_at: daysFromNow(0) },
  { id: 4, provider_id: 7, provider_name: 'Elif Arslan Hair Studio', verification_type: 'PROFESSIONAL', document_url: 'https://picsum.photos/seed/doc4/500/350', status: 'PENDING', created_at: daysFromNow(0) },
  { id: 5, provider_id: 1, provider_name: 'Demir Elektrik & Tesisat', verification_type: 'PROFESSIONAL', document_url: 'https://picsum.photos/seed/doc5/500/350', status: 'APPROVED', admin_note: '', created_at: daysFromNow(-60), reviewed_at: daysFromNow(-58) },
];

// â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const adminDashboard = {
  total_users: 12480, total_providers: 1832, total_requests: 3421,
  total_appointments: 2870, total_revenue: 184500, active_subscriptions: 412,
  open_disputes: 3, pending_verifications: 4,
};

export const auditLogs: any[] = [
  { id: 1, admin_id: 1, action: 'VERIFY_APPROVE', target: 'verification#5', created_at: daysFromNow(-58) },
  { id: 2, admin_id: 1, action: 'DISPUTE_RESOLVE', target: 'dispute#2', created_at: daysFromNow(-15) },
  { id: 3, admin_id: 1, action: 'AD_REJECT', target: 'ad#7', created_at: daysFromNow(-4) },
];

// â”€â”€ İlan Kategorileri ve İlanlar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const adCategories = [
  { id: 1, name: 'Vasıta', slug: 'vasita', icon: 'ğŸš—', parent_id: null },
  { id: 2, name: 'Araba', slug: 'araba', icon: '', parent_id: 1 },
  { id: 3, name: 'Motosiklet', slug: 'motosiklet', icon: '', parent_id: 1 },
  { id: 4, name: 'Emlak', slug: 'emlak', icon: 'ğŸ ', parent_id: null },
  { id: 5, name: 'Konut', slug: 'konut', icon: '', parent_id: 4 },
  { id: 6, name: 'İşyeri', slug: 'isyeri', icon: '', parent_id: 4 },
  { id: 7, name: 'Elektronik', slug: 'elektronik', icon: 'ğŸ’»', parent_id: null },
  { id: 8, name: 'Telefon', slug: 'telefon', icon: '', parent_id: 7 },
  { id: 9, name: 'Bilgisayar', slug: 'bilgisayar', icon: '', parent_id: 7 },
  { id: 10, name: 'Ev & Yaşam', slug: 'ev-yasam', icon: 'ğŸª‘', parent_id: null },
  { id: 11, name: 'Mobilya', slug: 'mobilya', icon: '', parent_id: 10 },
  { id: 12, name: 'Bahçe', slug: 'bahce', icon: '', parent_id: 10 },
  { id: 13, name: 'Hizmet İlanları', slug: 'hizmet-ilan', icon: 'ğŸ”§', parent_id: null },
  { id: 14, name: 'Eleman Arıyorum', slug: 'eleman-ariyorum', icon: '', parent_id: 13 },
  { id: 15, name: 'İş Arıyorum', slug: 'is-ariyorum', icon: '', parent_id: 13 },
];

export const ads: any[] = [
  {
    id: 1, title: 'iPhone 15 Pro 256GB Titanium', price: 42500, price_type: 'FIXED',
    condition: 'LIKE_NEW', status: 'ACTIVE', category_id: 8,
    city_name: 'İstanbul', district_name: 'Kadıköy', city_id: 1, district_id: 1,
    view_count: 214, favorite_count: 18, is_featured: true, is_negotiable: true,
    seller_id: 2, published_at: daysFromNow(-2), created_at: daysFromNow(-2),
    description: '2 aylık, kutulu, faturalı. Garantisi devam ediyor. Batarya sağlığı %100.',
    attributes: [
      { attribute_key: 'marka', attribute_value: 'Apple' },
      { attribute_key: 'bellek', attribute_value: '256 GB' },
      { attribute_key: 'garanti', attribute_value: 'Var' },
    ],
    images: [
      { id: 1, url: 'https://picsum.photos/seed/iphone1/800/600', is_cover: true },
      { id: 2, url: 'https://picsum.photos/seed/iphone2/800/600' },
    ],
  },
  {
    id: 2, title: 'BMW 320i Executive — 2019', price: 1250000, price_type: 'NEGOTIABLE',
    condition: 'USED', status: 'ACTIVE', category_id: 2,
    city_name: 'İstanbul', district_name: 'Åişli', city_id: 1, district_id: 4,
    view_count: 1893, favorite_count: 74, is_featured: true, is_negotiable: true,
    seller_id: 5, published_at: daysFromNow(-6), created_at: daysFromNow(-6),
    description: 'Tek elden, hatasız, servis bakımları yetkili servicede. Takas olmaz.',
    attributes: [
      { attribute_key: 'marka', attribute_value: 'BMW' },
      { attribute_key: 'model_yili', attribute_value: '2019' },
      { attribute_key: 'km', attribute_value: '87000' },
      { attribute_key: 'yakit', attribute_value: 'Benzin' },
    ],
    images: [
      { id: 3, url: 'https://picsum.photos/seed/bmw1/800/600', is_cover: true },
      { id: 4, url: 'https://picsum.photos/seed/bmw2/800/600' },
      { id: 5, url: 'https://picsum.photos/seed/bmw3/800/600' },
    ],
  },
  {
    id: 3, title: 'MacBook Air M2 8/256', price: 27500, price_type: 'FIXED',
    condition: 'GOOD', status: 'ACTIVE', category_id: 9,
    city_name: 'İzmir', district_name: 'Bornova', city_id: 3, district_id: 7,
    view_count: 342, favorite_count: 29, is_featured: false, is_negotiable: false,
    seller_id: 7, published_at: daysFromNow(-4), created_at: daysFromNow(-4),
    description: 'Öğrenciden, çok temiz kullanılmış. Åarj döngüsü 87.',
    attributes: [
      { attribute_key: 'islemci', attribute_value: 'Apple M2' },
      { attribute_key: 'ram', attribute_value: '8 GB' },
    ],
    images: [{ id: 6, url: 'https://picsum.photos/seed/mac1/800/600', is_cover: true }],
  },
  {
    id: 4, title: '3+1 Kiralık Daire — Kadıköy', price: 22000, price_type: 'FIXED',
    condition: undefined, status: 'ACTIVE', category_id: 5,
    city_name: 'İstanbul', district_name: 'Kadıköy', city_id: 1, district_id: 1,
    view_count: 967, favorite_count: 51, is_featured: false, is_negotiable: false,
    seller_id: 6, published_at: daysFromNow(-1), created_at: daysFromNow(-1),
    description: 'Metroya 5 dk, eşyasız, yeni bina. Aidat 800 TL.',
    attributes: [
      { attribute_key: 'oda_salon', attribute_value: '3+1' },
      { attribute_key: 'brut_m2', attribute_value: '130' },
      { attribute_key: 'kat', attribute_value: '4' },
    ],
    images: [
      { id: 7, url: 'https://picsum.photos/seed/daire1/800/600', is_cover: true },
      { id: 8, url: 'https://picsum.photos/seed/daire2/800/600' },
    ],
  },
  {
    id: 5, title: ' köpek yatağı + oyuncak seti', price: 450, price_type: 'FIXED',
    condition: 'NEW', status: 'ACTIVE', category_id: 11,
    city_name: 'İstanbul', district_name: 'Beşiktaş', city_id: 1, district_id: 2,
    view_count: 45, favorite_count: 3, is_featured: false, is_negotiable: false,
    seller_id: 4, published_at: daysFromNow(-3), created_at: daysFromNow(-3),
    description: 'Hiç kullanılmadı, hediye geldi. Orta boy köpekler için.',
    attributes: [{ attribute_key: 'boyut', attribute_value: 'Orta' }],
    images: [{ id: 9, url: 'https://picsum.photos/seed/yatak1/800/600', is_cover: true }],
  },
  {
    id: 6, title: 'Vespa Sprint 150 — 2022', price: 96500, price_type: 'NEGOTIABLE',
    condition: 'LIKE_NEW', status: 'ACTIVE', category_id: 3,
    city_name: 'İzmir', district_name: 'Karşıyaka', city_id: 3, district_id: 8,
    view_count: 611, favorite_count: 38, is_featured: false, is_negotiable: true,
    seller_id: 11, published_at: daysFromNow(-8), created_at: daysFromNow(-8),
    description: '4500 kmde, garajda saklandı, ilk sahibinden.',
    attributes: [
      { attribute_key: 'model_yili', attribute_value: '2022' },
      { attribute_key: 'km', attribute_value: '4500' },
    ],
    images: [{ id: 10, url: 'https://picsum.photos/seed/vespa1/800/600', is_cover: true }],
  },
  {
    id: 7, title: 'Çalışma masası + sandalye takımı', price: 1800, price_type: 'FIXED',
    condition: 'GOOD', status: 'SOLD', category_id: 11,
    city_name: 'Ankara', district_name: 'Çankaya', city_id: 2, district_id: 5,
    view_count: 230, favorite_count: 12, is_featured: false, is_negotiable: false,
    seller_id: 12, published_at: daysFromNow(-15), created_at: daysFromNow(-15),
    description: 'Satıldı, ilan referans için duruyor.',
    attributes: [],
    images: [{ id: 11, url: 'https://picsum.photos/seed/masa1/800/600', is_cover: true }],
  },
  // Demo kullanıcısının (id=2) ilanları
  {
    id: 8, title: 'Elektronik davul seti (Medeli)', price: 6500, price_type: 'NEGOTIABLE',
    condition: 'GOOD', status: 'ACTIVE', category_id: 9,
    city_name: 'İstanbul', district_name: 'Kadıköy', city_id: 1, district_id: 1,
    view_count: 88, favorite_count: 7, is_featured: false, is_negotiable: true,
    seller_id: 2, published_at: daysFromNow(-5), created_at: daysFromNow(-5),
    description: 'Tabure + kulaklık dahil, kusursuz çalışan davul seti.',
    attributes: [{ attribute_key: 'marka', attribute_value: 'Medeli' }],
    images: [{ id: 12, url: 'https://picsum.photos/seed/davul1/800/600', is_cover: true }],
  },
  {
    id: 9, title: 'Bisiklet — Trek Marlin 7', price: 11200, price_type: 'FIXED',
    condition: 'LIKE_NEW', status: 'PAUSED', category_id: 2,
    city_name: 'İstanbul', district_name: 'Kadıköy', city_id: 1, district_id: 1,
    view_count: 156, favorite_count: 21, is_featured: false, is_negotiable: false,
    seller_id: 2, published_at: daysFromNow(-10), created_at: daysFromNow(-10),
    description: 'M boy, 300 km yapıldı, kaza kaydı yok.',
    attributes: [
      { attribute_key: 'marka', attribute_value: 'Trek' },
      { attribute_key: 'kadro', attribute_value: 'M' },
    ],
    images: [{ id: 13, url: 'https://picsum.photos/seed/bisiklet1/800/600', is_cover: true }],
  },
  {
    id: 10, title: 'Vintage kitaplık (meşe)', price: 2400, price_type: 'NEGOTIABLE',
    condition: 'GOOD', status: 'DRAFT', category_id: 11,
    city_name: 'İstanbul', district_name: 'Kadıköy', city_id: 1, district_id: 1,
    view_count: 0, favorite_count: 0, is_featured: false, is_negotiable: true,
    seller_id: 2, published_at: undefined, created_at: daysFromNow(-1),
    description: 'Taşınmadan önce satılık, 5 raflı meşe kitaplık.',
    attributes: [{ attribute_key: 'malzeme', attribute_value: 'Meşe' }],
    images: [{ id: 14, url: 'https://picsum.photos/seed/kitaplik1/800/600', is_cover: true }],
  },
];

export const adReports: Array<Record<string, unknown>> = [];

// â”€â”€ Favoriler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const favoriteProviderIds = [2, 5];

// â”€â”€ Analitik (uzman) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const providerAnalytics = {
  period_days: 30,
  quotes_received: 31, quotes_sent: 24, jobs_won: 9, quotes_pending: 3,
  conversion_rate: 37.5, avg_rating: 4.8, total_review_count: 127,
  recent_avg_rating: 4.9, recent_review_count: 6, total_earnings_30d: 15200,
  daily_breakdown: [
    { date: daysFromNow(-6).slice(0, 10), day_name: 'Pzt', quotes: 3, reviews: 1 },
    { date: daysFromNow(-5).slice(0, 10), day_name: 'Sal', quotes: 5, reviews: 0 },
    { date: daysFromNow(-4).slice(0, 10), day_name: 'Çar', quotes: 2, reviews: 2 },
    { date: daysFromNow(-3).slice(0, 10), day_name: 'Per', quotes: 6, reviews: 1 },
    { date: daysFromNow(-2).slice(0, 10), day_name: 'Cum', quotes: 4, reviews: 0 },
    { date: daysFromNow(-1).slice(0, 10), day_name: 'Cmt', quotes: 3, reviews: 1 },
    { date: daysFromNow(0).slice(0, 10), day_name: 'Paz', quotes: 1, reviews: 1 },
  ],
  ai_insights: [
    { type: 'success', icon: 'ğŸ†', text: 'Son 30 günde tekliflerin %37.5\'i işe dönüştü — platform ortalamasının üzerinde.' },
    { type: 'warning', icon: 'â±ï¸', text: 'Taleplere ortalama yanıt süren 4 saat. 1 saatin altına indirirsen kazanma oranın artabilir.' },
    { type: 'info', icon: 'â­', text: 'Son 6 yorumunun ortalaması 4.9. Güven skorun yükseldi, daha fazla teklif hakkı kazandın.' },
  ],
};

// ============================================================================
// MUTATION YARDIMCILARI
// ============================================================================

export const dbGetters = {
  userById: (id: number) => users.find(u => u.id === id),
  providerById: (id: number) => providers.find(p => p.id === id),
  providerByUserId: (userId: number) => providers.find(p => p.user_id === userId),
  cityById: (id?: number) => cities.find(c => c.id === id),
  districtById: (id?: number) => districts.find(d => d.id === id),
  categoryById: (id?: number) => categories.find(c => c.id === id),
  subcategoryById: (id?: number) => categories.flatMap(c => c.subcategories || []).find(s => s.id === id),
  serviceById: (id?: number) => categories.flatMap(c => c.subcategories || []).flatMap(s => s.services || []).find(s => s.id === id),
};

export const buildPaginated = <T>(items: T[], page = 1, limit = 10) => ({
  items: items.slice((page - 1) * limit, page * limit),
  total: items.length,
  page,
  limit,
  has_next: items.length > page * limit,
});

// Sahte JWT — sadece demo kimlik taşıyıcı
export const createFakeToken = (userId: number, type: 'access' | 'refresh'): string =>
  `mock.${btoa(JSON.stringify({ sub: userId, type, exp: Date.now() + 86400000 }))}.demo`;

export const parseFakeToken = (token: string): { sub: number } | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { sub: payload.sub };
  } catch {
    return null;
  }
};


