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
  avatar_url: `https://i.pravatar.cc/150?u=${email}`,
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
  baseUser(5, 'Zeynep', 'Şahin', 'zeynep.sahin@ornek.com', 'PROVIDER', { subscription_plan: 'silver' }),
  baseUser(6, 'Emre', 'Çelik', 'emre.celik@ornek.com', 'PROVIDER'),
  baseUser(7, 'Fatma', 'Aydın', 'fatma.aydin@ornek.com', 'PROVIDER', { subscription_plan: 'silver' }),
  baseUser(8, 'Can', 'Öztürk', 'can.ozturk@ornek.com', 'PROVIDER'),
  baseUser(9, 'Elif', 'Arslan', 'elif.arslan@ornek.com', 'PROVIDER', { subscription_plan: 'bronze' }),
  baseUser(10, 'Burak', 'Koç', 'burak.koc@ornek.com', 'PROVIDER'),
  baseUser(11, 'Ali', 'Vural', 'ali.vural@ornek.com', 'USER'),
  baseUser(12, 'Merve', 'Doğan', 'merve.dogan@ornek.com', 'USER'),
  baseUser(13, 'Hasan', 'Çetin', 'hasan.cetin@ornek.com', 'PROVIDER', { subscription_plan: 'gold' }),
  baseUser(14, 'Selin', 'Yıldız', 'selin.yildiz@ornek.com', 'PROVIDER', { subscription_plan: 'silver' }),
];

// ── Uzman Profilleri ────────────────────────────────────────────────────────
const mkAvailability = (offset = 0) => [1, 2, 3, 4, 5, 6].map((day, i) => ({
  id: i + 1 + offset, day_of_week: day === 6 ? 6 : day - 1,
  start_time: '09:00', end_time: day === 6 ? '16:00' : '18:00',
}));

export const providers: any[] = [
  {
    id: 1, user_id: 3,
    business_name: 'Demir Elektrik & Tesisat',
    bio: '15 yıllık deneyimimle elektrik tesisatı, kombi bakımı ve acil arıza giderme konularında profesyonel hizmet sunuyorum. Kadıköy ve çevresinde aynı gün çözüm garantisi veriyorum. TÜRKAK belgeli usta, tüm işlerimde malzeme garantisi sunuyorum. Müşteri memnuniyeti benim için her şeyin önünde.',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    rating: 4.8, review_count: 127, completed_jobs: 342, years_experience: 15,
    verification_level: 'PROFESSIONAL', is_available: true, hourly_rate: 350,
    subscription_plan: 'gold', badge_type: 'gold',
    response_time: '< 1 saat',
    member_since: daysFromNow(-1825),
    languages: ['Türkçe', 'İngilizce'],
    tags: ['Elektrik', 'Kombi', 'Tesisat', 'Acil Servis', 'Aydınlatma'],
    education: [
      { school: 'İstanbul Teknik Üniversitesi', degree: 'Elektrik-Elektronik Müh.', year: '2009' },
    ],
    certifications: [
      { name: 'TÜRKAK Sertifikalı Elektrik Ustası', issuer: 'TÜRKAK', year: '2012' },
      { name: 'Doğalgaz Tesisatçı Belgesi', issuer: 'BOTAŞ', year: '2014' },
      { name: 'Kombi Servis Yetkisi — Vaillant', issuer: 'Vaillant Türkiye', year: '2018' },
    ],
    social_links: { website: 'https://demireelektrik.com', instagram: 'demireelektrik' },
    services: [
      { id: 1, service: { id: 1, name: 'Elektrikçi', slug: 'elektrikci', subcategory_id: 1 }, starting_price: 300, description: 'Priz, anahtar, sigorta ve aydınlatma işleri — malzeme dahil' },
      { id: 2, service: { id: 4, name: 'Kombi Bakımı', slug: 'kombi-bakimi', subcategory_id: 2 }, starting_price: 550, description: 'Yıllık bakım, arıza tespiti ve onarım — tüm markalar' },
      { id: 3, service: { id: 3, name: 'Tesisatçı', slug: 'tesisatci', subcategory_id: 2 }, starting_price: 250, description: 'Su tesisatı, gider açma, batarya montajı' },
    ],
    locations: [{ id: 1, city: cities[0], district: districts[0], latitude: 40.9901, longitude: 29.0292 }],
    portfolio: [
      { id: 1, image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=450&fit=crop', title: 'Apartman elektrik panosu yenileme' },
      { id: 2, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop', title: 'Endüstriyel aydınlatma kurulumu' },
      { id: 3, image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=450&fit=crop', title: 'Kombi bakım & servis' },
      { id: 4, image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=450&fit=crop', title: 'Tesisat güzergah yenileme' },
    ],
    availability: mkAvailability(0),
  },
  {
    id: 2, user_id: 4,
    business_name: 'Kaya Temizlik & Bakım Hizmetleri',
    bio: 'Profesyonel ekipman ve organik temizlik ürünleriyle ev, ofis ve tadilat sonrası temizlik hizmeti sunuyoruz. 8 yıllık sektör deneyimi, 5 kişilik uzman ekibimizle İstanbul genelinde hizmetinizdeyiz. Memnun kalmazsanız para iadesi yapıyoruz.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    rating: 4.9, review_count: 89, completed_jobs: 512, years_experience: 8,
    verification_level: 'BUSINESS', is_available: true, hourly_rate: 280,
    subscription_plan: 'diamond', badge_type: 'diamond',
    response_time: '< 2 saat',
    member_since: daysFromNow(-1460),
    languages: ['Türkçe'],
    tags: ['Ev Temizliği', 'Derin Temizlik', 'Tadilat Sonrası', 'Ofis Temizliği', 'Eco-Friendly'],
    education: [],
    certifications: [
      { name: 'Endüstriyel Temizlik Sertifikası', issuer: 'TSE', year: '2017' },
      { name: 'Hijyen ve Sanitasyon Belgesi', issuer: 'Sağlık Bakanlığı', year: '2020' },
    ],
    social_links: { instagram: 'kayatemizlik', facebook: 'kayatemizlik' },
    services: [
      { id: 4, service: { id: 6, name: 'Ev Temizliği', slug: 'ev-temizligi', subcategory_id: 4 }, starting_price: 750, description: '3+1 daire standart temizlik (5 saat, ekip dahil)' },
      { id: 5, service: { id: 7, name: 'Derin Temizlik', slug: 'derin-temizlik', subcategory_id: 4 }, starting_price: 1400, description: 'Detaylı, ekipmanlı derin temizlik — mutfak, banyo, tüm yüzeyler' },
      { id: 12, service: { id: 8, name: 'Boya Badana', slug: 'boya-badana', subcategory_id: 5 }, starting_price: 900, description: 'Tadilat sonrası duman ve toz temizliği paketi' },
    ],
    locations: [{ id: 2, city: cities[0], district: districts[1], latitude: 41.0422, longitude: 29.0067 }],
    portfolio: [
      { id: 4, image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=450&fit=crop', title: 'Mutfak derin temizlik — sonrası' },
      { id: 5, image_url: 'https://images.unsplash.com/photo-1527515637462-cff94ebb84be?w=600&h=450&fit=crop', title: 'Ofis periyodik temizlik' },
      { id: 13, image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&h=450&fit=crop', title: 'Banyo hijyen paketi' },
    ],
    availability: mkAvailability(10),
  },
  {
    id: 3, user_id: 5,
    business_name: 'Uzm. Psk. Zeynep Şahin',
    bio: 'Bilişsel davranışçı terapi (BDT) eğitimli klinik psikolog olarak kaygı bozukluğu, depresyon, stres yönetimi ve ilişki sorunlarında bireysel ve çift terapisi uyguluyorum. Online ve yüz yüze seans seçenekleri mevcut. İlk görüşme değerlendirme amaçlıdır.',
    avatar_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&h=150&fit=crop&crop=face',
    rating: 4.7, review_count: 54, completed_jobs: 480, years_experience: 10,
    verification_level: 'ID', is_available: true, hourly_rate: 900,
    subscription_plan: 'silver', badge_type: 'silver',
    response_time: '< 3 saat',
    member_since: daysFromNow(-1095),
    languages: ['Türkçe', 'İngilizce', 'Almanca'],
    tags: ['Kaygı Bozukluğu', 'Depresyon', 'BDT', 'Çift Terapisi', 'Online Terapi'],
    education: [
      { school: 'Hacettepe Üniversitesi', degree: 'Klinik Psikoloji Yüksek Lisans', year: '2015' },
      { school: 'Ankara Üniversitesi', degree: 'Psikoloji Lisans', year: '2013' },
    ],
    certifications: [
      { name: 'Bilişsel Davranışçı Terapi Sertifikası', issuer: 'Türk Psikologlar Derneği', year: '2016' },
      { name: 'EMDR Terapisti', issuer: 'EMDR Türkiye', year: '2019' },
      { name: 'Psikolog Siciline Kayıt', issuer: 'Sağlık Bakanlığı', year: '2013' },
    ],
    social_links: { website: 'https://psikologzeynep.com', instagram: 'psk.zeynepsahin' },
    services: [
      { id: 6, service: { id: 10, name: 'Psikolog', slug: 'psikolog', subcategory_id: 7 }, starting_price: 900, description: '50 dk bireysel seans (online veya yüz yüze)' },
      { id: 14, service: { id: 10, name: 'Çift Terapisi', slug: 'psikolog', subcategory_id: 7 }, starting_price: 1200, description: '75 dk çift seans — ilişki ve iletişim sorunları' },
    ],
    locations: [{ id: 3, city: cities[1], district: districts[4] }],
    portfolio: [
      { id: 15, image_url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&h=450&fit=crop', title: 'Danışma odası' },
      { id: 16, image_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=450&fit=crop', title: 'Online seans kurulumu' },
    ],
    availability: mkAvailability(20).slice(0, 5),
  },
  {
    id: 4, user_id: 6,
    business_name: 'Çelik Tesisat & Doğalgaz',
    bio: 'Su tesisatı, doğalgaz tesisatı ve kalorifer sistemlerinde 12 yılı aşkın deneyim. Gider açma, batarya, klozet montajı ve kaçak tespitinde günün her saati hizmet veriyorum. Üsküdar ve Kadıköy başta olmak üzere İstanbul Anadolu Yakası\'nda aktifim.',
    avatar_url: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face',
    rating: 4.5, review_count: 41, completed_jobs: 198, years_experience: 12,
    verification_level: 'BASIC', is_available: true, hourly_rate: 300,
    subscription_plan: '', badge_type: '',
    response_time: '< 2 saat',
    member_since: daysFromNow(-730),
    languages: ['Türkçe'],
    tags: ['Tesisat', 'Doğalgaz', 'Kaçak Tespiti', 'Kalorifer', 'Acil Servis'],
    education: [],
    certifications: [
      { name: 'Doğalgaz İç Tesisat Montaj Belgesi', issuer: 'EPDK', year: '2013' },
    ],
    social_links: {},
    services: [
      { id: 7, service: { id: 3, name: 'Tesisatçı', slug: 'tesisatci', subcategory_id: 2 }, starting_price: 220, description: 'Gider açma, batarya, klozet montajı' },
      { id: 15, service: { id: 4, name: 'Kombi Bakımı', slug: 'kombi-bakimi', subcategory_id: 2 }, starting_price: 400, description: 'Kalorifer ve kombi sistemi revizyonu' },
    ],
    locations: [{ id: 4, city: cities[0], district: districts[2], latitude: 41.0256, longitude: 29.0175 }],
    portfolio: [
      { id: 17, image_url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&h=450&fit=crop', title: 'Kalorifer tesisatı yenileme' },
      { id: 18, image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=450&fit=crop', title: 'Banyo renovasyonu tesisat işleri' },
    ],
    availability: mkAvailability(30),
  },
  {
    id: 5, user_id: 7,
    business_name: 'Fatma Aydın — Matematik & Fen Öğretmeni',
    bio: 'LGS ve TYT/AYT matematik, fizik ve kimyada uzmanlaşmış 9 yıllık özel ders deneyimim var. Öğrencilerimin %85\'i hedef puana ulaştı. Bireysel öğrenme planı oluşturuyorum. Online ve yüz yüze seçenekler mevcut. İlk ders değerlendirme amaçlıdır.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    rating: 5.0, review_count: 32, completed_jobs: 156, years_experience: 9,
    verification_level: 'ID', is_available: true, hourly_rate: 400,
    subscription_plan: 'silver', badge_type: 'silver',
    response_time: '< 1 saat',
    member_since: daysFromNow(-912),
    languages: ['Türkçe', 'İngilizce'],
    tags: ['Matematik', 'Fizik', 'Kimya', 'LGS', 'TYT-AYT', 'Online Ders'],
    education: [
      { school: 'Boğaziçi Üniversitesi', degree: 'Matematik Eğitimi', year: '2015' },
      { school: 'Sakarya Üniversitesi', degree: 'Eğitim Bilimleri Yüksek Lisans', year: '2018' },
    ],
    certifications: [
      { name: 'MEB Öğretmenlik Belgesi', issuer: 'Milli Eğitim Bakanlığı', year: '2015' },
      { name: 'Online Eğitim Tasarımı Sertifikası', issuer: 'Coursera', year: '2020' },
    ],
    social_links: { instagram: 'matematik.fatma' },
    services: [
      { id: 8, service: { id: 11, name: 'Matematik', slug: 'matematik', subcategory_id: 8 }, starting_price: 400, description: 'Birebir online veya yüz yüze ders (60 dk)' },
      { id: 16, service: { id: 12, name: 'İngilizce', slug: 'ingilizce', subcategory_id: 8 }, starting_price: 350, description: 'Fizik özel ders — TYT/AYT hazırlık' },
    ],
    locations: [{ id: 5, city: cities[2], district: districts[6] }],
    portfolio: [
      { id: 19, image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=450&fit=crop', title: 'Online ders ortamı' },
      { id: 20, image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=450&fit=crop', title: 'Sınav hazırlık materyalleri' },
    ],
    availability: mkAvailability(40).slice(1, 6),
  },
  {
    id: 6, user_id: 8,
    business_name: 'Öztürk Nakliyat & Depolama',
    bio: 'Şehir içi ve şehirler arası profesyonel evden eve nakliyat. Sigortalı taşıma, asansörlü araç, ücretsiz ekspertiz. 14 yılda 1.200+ ev taşıdık. Kırılabilir eşyalara özel ambalaj, tekstil askı sistemi, iç ve dış ambalaj dahil.',
    avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&crop=face',
    rating: 4.4, review_count: 67, completed_jobs: 289, years_experience: 14,
    verification_level: 'NONE', is_available: true, hourly_rate: 0,
    subscription_plan: '', badge_type: '',
    response_time: '< 4 saat',
    member_since: daysFromNow(-547),
    languages: ['Türkçe'],
    tags: ['Nakliyat', 'Evden Eve', 'Şehirlerarası', 'Sigortalı', 'Asansörlü Araç', 'Depolama'],
    education: [],
    certifications: [
      { name: 'Taşıma Sektörü Kalite Belgesi', issuer: 'TSE', year: '2015' },
      { name: 'Nakliyat Sigortası Acenteliği', issuer: 'Anadolu Sigorta', year: '2017' },
    ],
    social_links: { facebook: 'ozturknakliyat' },
    services: [
      { id: 9, service: { id: 16, name: 'Evden Eve Nakliyat', slug: 'evden-eve-nakliyat', subcategory_id: 13 }, starting_price: 3500, description: '3+1 daire şehir içi komple taşıma (ambalaj dahil)' },
      { id: 17, service: { id: 16, name: 'Ofis Taşıma', slug: 'evden-eve-nakliyat', subcategory_id: 13 }, starting_price: 5000, description: 'Ofis ve işyeri taşıma paketi' },
    ],
    locations: [{ id: 6, city: cities[0], district: districts[3], latitude: 41.0613, longitude: 28.9877 }],
    portfolio: [
      { id: 21, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop', title: 'Asansörlü araç ile taşıma' },
      { id: 22, image_url: 'https://images.unsplash.com/photo-1600518464441-9306a3e2b59c?w=600&h=450&fit=crop', title: 'Profesyonel ambalajlama' },
      { id: 23, image_url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=450&fit=crop', title: 'Depolama tesisi' },
    ],
    availability: mkAvailability(50),
  },
  {
    id: 7, user_id: 9,
    business_name: 'Elif Arslan Hair & Beauty Studio',
    bio: 'Profesyonel saç tasarımı, renklendirme, bakım ve gelin paketi. Kadın saç kesimi ve şekillendirme, ombre ve röfle uygulamalarında uzman 7 yıllık deneyim. Randevulu çalışıyorum, erken rezervasyon önerilir.',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    rating: 4.6, review_count: 78, completed_jobs: 640, years_experience: 7,
    verification_level: 'PROFESSIONAL', is_available: true, hourly_rate: 250,
    subscription_plan: 'bronze', badge_type: 'gold',
    response_time: '< 2 saat',
    member_since: daysFromNow(-820),
    languages: ['Türkçe'],
    tags: ['Saç Kesimi', 'Ombre', 'Gelin Saçı', 'Keratin', 'Röfle', 'Saç Bakımı'],
    education: [
      { school: 'L\'Oréal Professionnel Akademi', degree: 'Saç Renklendirme Uzmanlığı', year: '2018' },
    ],
    certifications: [
      { name: 'Kuaförlük Ustalık Belgesi', issuer: 'Milli Eğitim Bakanlığı', year: '2017' },
      { name: 'Wella Color Specialist', issuer: 'Wella Professionals', year: '2020' },
      { name: 'Gelin Saçı & Makyaj Sertifikası', issuer: 'ÖSYM Akrediteli Kurum', year: '2019' },
    ],
    social_links: { instagram: 'elifarslanstudio', tiktok: 'elifarslan.hair' },
    services: [
      { id: 10, service: { id: 21, name: 'Saç Kesimi', slug: 'sac-kesimi', subcategory_id: 18 }, starting_price: 250, description: 'Kadın saç kesimi + fön şekillendirme' },
      { id: 18, service: { id: 21, name: 'Röfle & Ombre', slug: 'sac-kesimi', subcategory_id: 18 }, starting_price: 650, description: 'Balayage, ombre, röfle uygulamaları' },
      { id: 19, service: { id: 21, name: 'Gelin Paketi', slug: 'sac-kesimi', subcategory_id: 18 }, starting_price: 2500, description: 'Gelin saçı + makyaj tam paket' },
    ],
    locations: [{ id: 7, city: cities[0], district: districts[0], latitude: 40.9880, longitude: 29.0255 }],
    portfolio: [
      { id: 24, image_url: 'https://images.unsplash.com/photo-1562322140-8baeacacf3df?w=600&h=450&fit=crop', title: 'Gelin saçı tasarımı' },
      { id: 25, image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop', title: 'Balayage & ombre uygulaması' },
      { id: 26, image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=450&fit=crop', title: 'Keratin bakım sonrası' },
      { id: 27, image_url: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&h=450&fit=crop', title: 'Saç boyama detayları' },
    ],
    availability: mkAvailability(60),
  },
  {
    id: 8, user_id: 10,
    business_name: 'Koç Oto Servis & Bakım',
    bio: 'Tüm markalara periyodik bakım, motor revizyonu, fren sistemi ve lastik servisi. 11 yıllık tecrübe ve 4 teknisyen ile TSE belgeli atölyemizde kaliteli hizmet. Araç teslim ve getirme seçeneği mevcuttur.',
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&h=150&fit=crop&crop=face',
    rating: 4.3, review_count: 45, completed_jobs: 233, years_experience: 11,
    verification_level: 'BASIC', is_available: true, hourly_rate: 500,
    subscription_plan: '', badge_type: '',
    response_time: '< 3 saat',
    member_since: daysFromNow(-660),
    languages: ['Türkçe'],
    tags: ['Periyodik Bakım', 'Motor', 'Fren Sistemi', 'Lastik', 'Tüm Markalar', 'Elektrik'],
    education: [],
    certifications: [
      { name: 'Otomotiv Servis Yetki Belgesi', issuer: 'Sanayi Bakanlığı', year: '2014' },
      { name: 'Akü & Elektrik Sistemleri Sertifikası', issuer: 'TOFAŞ Akademi', year: '2016' },
    ],
    social_links: {},
    services: [
      { id: 11, service: { id: 15, name: 'Mekanik', slug: 'mekanik', subcategory_id: 11 }, starting_price: 800, description: 'Periyodik bakım paketi (yağ, filtre, kontroller dahil)' },
      { id: 20, service: { id: 15, name: 'Fren Bakımı', slug: 'mekanik', subcategory_id: 11 }, starting_price: 600, description: 'Balata + disk kontrolü ve değişimi' },
    ],
    locations: [{ id: 8, city: cities[0], district: districts[2], latitude: 41.0234, longitude: 29.0140 }],
    portfolio: [
      { id: 28, image_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=450&fit=crop', title: 'Motor revizyonu' },
      { id: 29, image_url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&h=450&fit=crop', title: 'Lastik ve jant servisi' },
      { id: 30, image_url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&h=450&fit=crop', title: 'Servis atölyesi' },
    ],
    availability: mkAvailability(70),
  },
  {
    id: 9, user_id: 13,
    business_name: 'Hasan Çetin — Kişisel Antrenör',
    bio: 'NASM sertifikalı kişisel antrenör. Kilo verme, kas kazanımı ve fonksiyonel fitness programları tasarlıyorum. Gym ve evde antrenman seçenekleriyle yüz yüze ve online koçluk hizmeti veriyorum. İlk seans ücretsiz değerlendirmedir.',
    avatar_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&h=150&fit=crop&crop=face',
    rating: 4.9, review_count: 63, completed_jobs: 310, years_experience: 6,
    verification_level: 'ID', is_available: true, hourly_rate: 600,
    subscription_plan: 'gold', badge_type: 'gold',
    response_time: '< 1 saat',
    member_since: daysFromNow(-548),
    languages: ['Türkçe', 'İngilizce'],
    tags: ['Kişisel Antrenman', 'Kilo Verme', 'Kas Geliştirme', 'Online Koçluk', 'HIIT', 'Beslenme'],
    education: [
      { school: 'Marmara Üniversitesi', degree: 'Spor Bilimleri', year: '2019' },
    ],
    certifications: [
      { name: 'NASM Certified Personal Trainer', issuer: 'NASM USA', year: '2020' },
      { name: 'Beslenme Koçluğu Sertifikası', issuer: 'Türk Spor Hekimleri Derneği', year: '2021' },
    ],
    social_links: { instagram: 'coach.hasancetin', youtube: 'hasancetin_fitness' },
    services: [
      { id: 21, service: { id: 22, name: 'Özel Ders', slug: 'ozel-ders-spor', subcategory_id: 19 }, starting_price: 600, description: 'Kişisel antrenman seansı (60 dk)' },
      { id: 22, service: { id: 22, name: 'Online Koçluk', slug: 'ozel-ders-spor', subcategory_id: 19 }, starting_price: 1500, description: 'Aylık online koçluk + beslenme programı' },
    ],
    locations: [{ id: 9, city: cities[0], district: districts[0], latitude: 40.9920, longitude: 29.0310 }],
    portfolio: [
      { id: 31, image_url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&h=450&fit=crop', title: 'Fonksiyonel antrenman seansı' },
      { id: 32, image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=450&fit=crop', title: 'Kuvvet antrenmanı' },
      { id: 33, image_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=450&fit=crop', title: 'Outdoor HIIT seansı' },
    ],
    availability: mkAvailability(80),
  },
  {
    id: 10, user_id: 14,
    business_name: 'Selin Yıldız Fotoğrafçılık',
    bio: 'Düğün, nişan, doğum günü, kurumsal etkinlik ve ürün fotoğrafçılığı. 5 yıllık stüdyo deneyimi, profesyonel ekipman. Tüm fotoğraflar düzenleme ve retouching dahil teslim edilir. İstanbul ve yakın çevre her etkinliğe hizmet veriyorum.',
    avatar_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
    availability: mkAvailability(90),
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
    comment: 'Kombi bakımını aynı gün tamamladı, fiyat da teklifte kaldı. Kesinlikle tavsiye ederim. Yıllardır aradığım güvenilir elektrikçiyi buldum!',
    communication_rating: 5, quality_rating: 5, price_rating: 4, punctuality_rating: 5,
    provider_reply: 'Teşekkürler Ayşe Hanım, güveniniz için biz teşekkür ederiz. 🙂 Gelecekte de hizmetinizdeyiz.',
    created_at: daysFromNow(-17),
  },
  {
    id: 2, provider_id: 1, customer_id: 11, rating: 4,
    comment: 'Elektrik tesisatını kusursuz yaptı, sadece biraz geç geldi ama iş kalitesi mükemmeldi.',
    communication_rating: 4, quality_rating: 5, price_rating: 4, punctuality_rating: 3,
    provider_reply: 'Ali Bey, gecikme için özür dilerim. Bir önceki işimiz uzadı. Bir dahaki randevunuzda dakik olacağım!',
    created_at: daysFromNow(-10),
  },
  {
    id: 3, provider_id: 1, customer_id: 12, rating: 5,
    comment: 'Sigorta kutusunu aynı gün değiştirdi, çok memnun kaldım. Fiyat makul, iş kalitesi yüksek.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 4,
    provider_reply: '',
    created_at: daysFromNow(-40),
  },
  {
    id: 4, provider_id: 1, customer_id: 12, rating: 5,
    comment: 'Aydınlatma sistemini tamamen yeniledi. Hem hızlı hem de titiz çalıştı. Tekrar çalışacağım.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: 'Teşekkürler Merve Hanım! Her zaman hizmetinizdeyim. 🔌',
    created_at: daysFromNow(-55),
  },
  {
    id: 5, provider_id: 2, customer_id: 2, rating: 5,
    comment: 'Ekip çok titizdi, ev mis gibi oldu. Derin temizlik paketini aldım, her köşe pırıl pırıl. Fiyat da çok uygundu.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: 'Biz teşekkür ederiz, tekrar bekleriz! Sizi ağırlamak her zaman mutluluk.',
    created_at: daysFromNow(-30),
  },
  {
    id: 6, provider_id: 2, customer_id: 11, rating: 5,
    comment: 'Tadilat sonrası temizlik için çağırdım. İnanılmaz titiz çalıştılar, boyacıların bıraktığı tüm kalıntıları temizlediler.',
    communication_rating: 5, quality_rating: 5, price_rating: 4, punctuality_rating: 5,
    provider_reply: 'Güveniniz için teşekkürler! Tadilat sonrası temizlik uzmanlık alanımız. 🏠',
    created_at: daysFromNow(-45),
  },
  {
    id: 7, provider_id: 2, customer_id: 12, rating: 4,
    comment: 'Ofis temizliğini haftalık yapıyorlar. Genel olarak memnunum, ancak bazen bazı köşeleri atlıyorlar.',
    communication_rating: 4, quality_rating: 4, price_rating: 5, punctuality_rating: 4,
    provider_reply: 'Geri bildiriminiz için teşekkürler. Dikkatli olacağız!',
    created_at: daysFromNow(-8),
  },
  {
    id: 8, provider_id: 3, customer_id: 2, rating: 5,
    comment: 'Zeynep Hanım çok profesyonel ve anlayışlı. Kaygı bozukluğum için online terapi aldım, çok faydalı oldu.',
    communication_rating: 5, quality_rating: 5, price_rating: 4, punctuality_rating: 5,
    provider_reply: 'İyileşme sürecinizde yanınızda olmak onur verici. Çalışmaya devam edelim! 💙',
    created_at: daysFromNow(-20),
  },
  {
    id: 9, provider_id: 3, customer_id: 11, rating: 5,
    comment: 'Çift terapisine eşimle birlikte gittik. İletişim sorunlarımızı çözmemize çok yardımcı oldu.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: '',
    created_at: daysFromNow(-35),
  },
  {
    id: 10, provider_id: 5, customer_id: 11, rating: 5,
    comment: 'Kızım matematikte büyük ilerleme kaydetti. Fatma Hanım harika bir öğretmen, çok sabırlı ve açıklayıcı.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: 'Çok teşekkürler! Başarıları devam edecek. 🎓',
    created_at: daysFromNow(-3),
  },
  {
    id: 11, provider_id: 5, customer_id: 12, rating: 5,
    comment: 'Oğlum TYT sınavında matematik bölümünde çok başarılı oldu. Fatma Hanım sayesinde konuları sistematik öğrendi.',
    communication_rating: 5, quality_rating: 5, price_rating: 4, punctuality_rating: 5,
    provider_reply: 'Harika! Emeklerinizin karşılığını aldınız. Başarılar diliyorum! 🌟',
    created_at: daysFromNow(-12),
  },
  {
    id: 12, provider_id: 7, customer_id: 2, rating: 5,
    comment: 'Gelin saçım için Elif Hanım\'a gittim. Hayallerimden güzel oldu! Tüm ekip çok ilgili ve profesyoneldi.',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: 'Çok mutlu olduğuma sevindim! Düğününüz kutlu olsun! 👰',
    created_at: daysFromNow(-7),
  },
  {
    id: 13, provider_id: 7, customer_id: 11, rating: 4,
    comment: 'Balayage uygulaması çok başarılıydı. Renk tam istediğim gibi çıktı. Randevu biraz geç başladı.',
    communication_rating: 4, quality_rating: 5, price_rating: 4, punctuality_rating: 3,
    provider_reply: 'Teşekkürler! Zamanlamada daha iyi olacağız. 💇',
    created_at: daysFromNow(-22),
  },
  {
    id: 14, provider_id: 9, customer_id: 2, rating: 5,
    comment: 'Hasan Bey harika bir antrenör! İlk seans ücretsiz değerlendirmede hedeflerimi doğru belirledi. 3 ayda 12 kilo verdim!',
    communication_rating: 5, quality_rating: 5, price_rating: 5, punctuality_rating: 5,
    provider_reply: 'Bu sonuç sizin azminizin ürünü! Harika iş çıkardınız. Devam edelim! 💪',
    created_at: daysFromNow(-5),
  },
  {
    id: 15, provider_id: 9, customer_id: 12, rating: 5,
    comment: 'Online koçluk programı mükemmeldi. Beslenme planı ve egzersiz programı kişiye özel hazırlandı.',
    communication_rating: 5, quality_rating: 5, price_rating: 4, punctuality_rating: 5,
    provider_reply: 'Teşekkürler! Hedefinize ulaşana kadar yanınızdayım. 🏋️',
    created_at: daysFromNow(-18),
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
  {
    id: 3, customer_id: 2, provider_id: 9, created_at: daysFromNow(-6),
    unread_count: 0,
    customer: users[1], provider: providers[8],
    last_message: { id: 12, conversation_id: 3, sender_id: 2, content: 'Peki, haftalık programı kabul ediyorum. Ne zaman başlayabiliriz?', message_type: 'TEXT', created_at: daysFromNow(-5, 16), is_read: true },
  },
  {
    id: 4, customer_id: 11, provider_id: 5, created_at: daysFromNow(-10),
    unread_count: 2,
    customer: users[10], provider: providers[4],
    last_message: { id: 15, conversation_id: 4, sender_id: 5, content: 'Bu haftaki ödevleri bitirmeyi unutma! Pazartesi görüşelim.', message_type: 'TEXT', created_at: daysFromNow(-1, 20), is_read: false },
  },
];

export const messages: any[] = [
  // Konuşma 1 — Elektrik arızası
  { id: 1, conversation_id: 1, sender_id: 2, content: 'Merhaba Mehmet Bey, salondaki üç priz çalışmıyor. Acil bakabilir misiniz?', message_type: 'TEXT', created_at: daysFromNow(-2, 14), is_read: true },
  { id: 2, conversation_id: 1, sender_id: 3, content: 'Merhaba Ayşe Hanım! Evet bakabilirim. Yarın öğleden önce müsaitim. Size teklif gönderdim, incelemenizi öneririm.', message_type: 'TEXT', created_at: daysFromNow(-2, 15), is_read: true },
  { id: 3, conversation_id: 1, sender_id: 2, content: 'Teklifi gördüm, uygun görünüyor. Sigorta panosu da kontrol edilecek mi?', message_type: 'TEXT', created_at: daysFromNow(-1, 9), is_read: true },
  { id: 4, conversation_id: 1, sender_id: 3, content: 'Evet tabii, sigorta panosu da dahil. Herhangi bir sorun varsa anında ilgilenirim.', message_type: 'TEXT', created_at: daysFromNow(-1, 10), is_read: true },
  { id: 5, conversation_id: 1, sender_id: 3, content: 'Yarın 11:00 uygun mu? Yaklaşık 2 saat sürer.', message_type: 'TEXT', created_at: daysFromNow(0, 9, 30), is_read: false },
  // Konuşma 2 — Temizlik randevusu
  { id: 6, conversation_id: 2, sender_id: 2, content: 'Merhaba! 3+1 ev için taşınma sonrası derin temizlik istiyorum. Müsaitlik durumunuz nedir?', message_type: 'TEXT', created_at: daysFromNow(-5, 10), is_read: true },
  { id: 7, conversation_id: 2, sender_id: 4, content: 'Merhaba Ayşe Hanım! Tabii ki yapabiliriz. Cumartesi 14:00\'a müsaitiz. Teklif gönderdim.', message_type: 'TEXT', created_at: daysFromNow(-5, 11), is_read: true },
  { id: 8, conversation_id: 2, sender_id: 2, content: 'Harika! Beyaz eşyaları da temizleyecek misiniz?', message_type: 'TEXT', created_at: daysFromNow(-4, 14), is_read: true },
  { id: 9, conversation_id: 2, sender_id: 4, content: 'Evet, buzdolabı dışı ve çamaşır makinesi dışı dahil. Fırın içi ekstra ücrete tabidir.', message_type: 'TEXT', created_at: daysFromNow(-4, 15), is_read: true },
  { id: 10, conversation_id: 2, sender_id: 2, content: 'Fırın içini de temizleyin lütfen, toplam fiyat kaç olur?', message_type: 'TEXT', created_at: daysFromNow(-3, 10), is_read: true },
  { id: 11, conversation_id: 2, sender_id: 4, content: 'Fırın dahil toplam ₺1.250 olur. Cumartesi 14:00 için randevunuzu onayladım!', message_type: 'TEXT', created_at: daysFromNow(-3, 12), is_read: true },
  { id: 12, conversation_id: 2, sender_id: 2, content: 'Teşekkürler, cumartesi görüşürüz!', message_type: 'TEXT', created_at: daysFromNow(-3, 18), is_read: true },
  // Konuşma 3 — Antrenman
  { id: 13, conversation_id: 3, sender_id: 2, content: 'Merhaba Hasan Bey! Kilo vermek istiyorum, ilk ücretsiz seansı ne zaman yapabiliriz?', message_type: 'TEXT', created_at: daysFromNow(-7, 12), is_read: true },
  { id: 14, conversation_id: 3, sender_id: 13, content: 'Merhaba! Çarşamba akşamı 19:00 uygun mu? Önce hedeflerinizi konuşalım, sonra program oluşturalım.', message_type: 'TEXT', created_at: daysFromNow(-7, 14), is_read: true },
  { id: 15, conversation_id: 3, sender_id: 2, content: 'Peki, haftalık programı kabul ediyorum. Ne zaman başlayabiliriz?', message_type: 'TEXT', created_at: daysFromNow(-5, 16), is_read: true },
  // Konuşma 4 — Matematik dersi
  { id: 16, conversation_id: 4, sender_id: 11, content: 'Fatma Hanım merhaba! Oğlum için LGS matematik dersi istiyoruz. Online verebilir misiniz?', message_type: 'TEXT', created_at: daysFromNow(-11, 10), is_read: true },
  { id: 17, conversation_id: 4, sender_id: 5, content: 'Merhaba Ali Bey! Evet, online ders veriyorum. Önce oğlunuzun seviyesini değerlendirmek için ücretsiz 30 dk. yapalım.', message_type: 'TEXT', created_at: daysFromNow(-11, 11), is_read: true },
  { id: 18, conversation_id: 4, sender_id: 11, content: 'Çok iyi! Hangi gün uygun?', message_type: 'TEXT', created_at: daysFromNow(-10, 9), is_read: true },
  { id: 19, conversation_id: 4, sender_id: 5, content: 'Salı ve Perşembe 18:00-19:30 öneririm. Müsait misiniz?', message_type: 'TEXT', created_at: daysFromNow(-10, 10), is_read: true },
  { id: 20, conversation_id: 4, sender_id: 5, content: 'Bu haftaki ödevleri bitirmeyi unutma! Pazartesi görüşelim.', message_type: 'TEXT', created_at: daysFromNow(-1, 20), is_read: false },
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

export const ads: any[] = [
  {
    id: 1, title: 'Electrikçi Hizmetleri — Acil & Randevulu', title_en: 'Electrician Services — Urgent & by Appointment', price: 300, price_type: 'FIXED',
    condition: undefined, status: 'ACTIVE', category_id: 1,
    city_name: 'İstanbul', district_name: 'Beşiktaş', city_id: 1, district_id: 2,
    view_count: 245, favorite_count: 12, is_featured: false, is_negotiable: true,
    seller_id: 3, published_at: daysFromNow(-3), created_at: daysFromNow(-3),
    description: '15 yıllık deneyimle priz, anahtar, sigorta değişimi, aydınlatma ve elektrik tesisatı. Aynı gün hizmet, malzeme dahil, işçilik garantisi.',
    description_en: 'With 15 years of experience: outlet, switch, fuse replacement, lighting, and electrical wiring. Same-day service, materials included, workmanship guaranteed.',
    attributes: [
      { attribute_key: 'Hizmet Türü', attribute_value: 'Elektrik Tesisatı' },
      { attribute_key: 'Bölge', attribute_value: 'İstanbul Avrupa Yakası' },
      { attribute_key: 'Yanıt Süresi', attribute_value: '< 1 saat' },
    ],
    images: [
      { id: 9, url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop', is_cover: true },
      { id: 102, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 2, title: 'Kişisel Antrenör — Online & Gym Koçluğu', title_en: 'Personal Trainer — Online & Gym Coaching', price: 600, price_type: 'FIXED',
    condition: undefined, status: 'ACTIVE', category_id: 14,
    city_name: 'İstanbul', district_name: 'Beşiktaş', city_id: 1, district_id: 2,
    view_count: 521, favorite_count: 44, is_featured: true, is_negotiable: false,
    seller_id: 13, published_at: daysFromNow(-3), created_at: daysFromNow(-3),
    description: 'NASM sertifikalı kişisel antrenör. Kilo verme, kas geliştirme ve fonksiyonel fitness programı. İlk seans ücretsiz değerlendirme. Online ve spor salonu seçenekleri. Aylık beslenme + egzersiz paketi mevcut.',
    description_en: 'NASM certified personal trainer. Weight loss, muscle building, and functional fitness programs. Free initial assessment session. Online and gym options. Monthly nutrition + exercise package available.',
    attributes: [
      { attribute_key: 'Uzmanlık', attribute_value: 'Kilo Verme & Kas Geliştirme' },
      { attribute_key: 'Format', attribute_value: 'Online & Spor Salonu' },
      { attribute_key: 'Süre', attribute_value: '60 dakika/seans' },
      { attribute_key: 'Sertifika', attribute_value: 'NASM USA' },
    ],
    images: [
      { id: 9, url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=600&fit=crop', is_cover: true },
      { id: 10, url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 3, title: 'Evden Eve Nakliyat — Sigortalı & Asansörlü', title_en: 'Moving Services — Insured & Elevator Vehicle', price: 3500, price_type: 'STARTING',
    condition: undefined, status: 'ACTIVE', category_id: 8,
    city_name: 'İstanbul', district_name: 'Şişli', city_id: 1, district_id: 4,
    view_count: 712, favorite_count: 38, is_featured: false, is_negotiable: true,
    seller_id: 8, published_at: daysFromNow(-4), created_at: daysFromNow(-4),
    description: 'Profesyonel evden eve nakliyat. Asansörlü araç, iç ve dış ambalaj dahil, nakliyat sigortası. Şehir içi ve şehirlerarası hizmet. Kırılabilir eşyalara özel balonlu ambalaj, tekstil askı sistemi.',
    description_en: 'Professional moving services. Elevator vehicle, interior and exterior packaging included, transport insurance. Inter-city and intra-city services. Special bubble wrap for fragile items, textile hanging system.',
    attributes: [
      { attribute_key: 'Hizmet', attribute_value: 'Evden Eve Nakliyat' },
      { attribute_key: 'Araç', attribute_value: 'Asansörlü Kamyon' },
      { attribute_key: 'Sigorta', attribute_value: 'Nakliyat Sigortası Dahil' },
      { attribute_key: 'Ambalaj', attribute_value: 'Tüm Ambalaj Dahil' },
    ],
    images: [
      { id: 11, url: 'https://images.unsplash.com/photo-1600518464441-9306a3e2b59c?w=800&h=600&fit=crop', is_cover: true },
      { id: 12, url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 4, title: 'Psikoloji & Terapi Hizmeti — Online', title_en: 'Psychology & Therapy Services — Online', price: 900, price_type: 'FIXED',
    condition: undefined, status: 'ACTIVE', category_id: 3,
    city_name: 'Ankara', district_name: 'Çankaya', city_id: 2, district_id: 5,
    view_count: 267, favorite_count: 19, is_featured: false, is_negotiable: false,
    seller_id: 5, published_at: daysFromNow(-6), created_at: daysFromNow(-6),
    description: 'BDT eğitimli klinik psikolog. Kaygı bozukluğu, depresyon, stres yönetimi ve ilişki sorunlarında online ve yüz yüze seans. İlk görüşme değerlendirme amaçlıdır. Gizlilik garantisi, Sağlık Bakanlığı kayıtlı psikolog.',
    description_en: 'CBT-trained clinical psychologist. Online and face-to-face sessions for anxiety disorder, depression, stress management, and relationship issues. Initial consultation is for assessment. Privacy guaranteed, registered psychologist.',
    attributes: [
      { attribute_key: 'Uzmanlık', attribute_value: 'Kaygı, Depresyon, BDT' },
      { attribute_key: 'Format', attribute_value: 'Online & Yüz Yüze' },
      { attribute_key: 'Süre', attribute_value: '50 dk/seans' },
      { attribute_key: 'Belge', attribute_value: 'Sağlık Bak. Kayıtlı' },
    ],
    images: [
      { id: 13, url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=600&fit=crop', is_cover: true },
      { id: 14, url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 5, title: 'Boya Badana — İç & Dış Cephe', title_en: 'Painting — Interior & Exterior', price: 1200, price_type: 'STARTING',
    condition: undefined, status: 'ACTIVE', category_id: 2,
    city_name: 'İzmir', district_name: 'Bornova', city_id: 3, district_id: 7,
    view_count: 445, favorite_count: 28, is_featured: false, is_negotiable: true,
    seller_id: 11, published_at: daysFromNow(-7), created_at: daysFromNow(-7),
    description: 'Profesyonel boya badana ekibi. İç cephe, dış cephe, tavan boyaması. Alçı tamir, saten boya, ipek saten seçenekleri. Malzeme dahil paket fiyatlandırma. 10 yıllık sektör deneyimi.',
    description_en: 'Professional painting team. Interior, exterior, and ceiling painting. Plaster repair, satin paint, and silk satin options. Package pricing includes materials. 10 years of industry experience.',
    attributes: [
      { attribute_key: 'Hizmet', attribute_value: 'Boya Badana' },
      { attribute_key: 'Kapsam', attribute_value: 'İç Cephe, Dış Cephe, Tavan' },
      { attribute_key: 'Malzeme', attribute_value: 'Dahil' },
      { attribute_key: 'Bölge', attribute_value: 'İzmir geneli' },
    ],
    images: [
      { id: 15, url: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&h=600&fit=crop', is_cover: true },
      { id: 16, url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 6, title: 'Periyodik Araç Bakımı & Mekanik', title_en: 'Periodic Vehicle Maintenance & Mechanics', price: 800, price_type: 'STARTING',
    condition: undefined, status: 'ACTIVE', category_id: 7,
    city_name: 'İstanbul', district_name: 'Üsküdar', city_id: 1, district_id: 3,
    view_count: 389, favorite_count: 22, is_featured: false, is_negotiable: true,
    seller_id: 10, published_at: daysFromNow(-5), created_at: daysFromNow(-5),
    description: 'Tüm marka araçlara periyodik bakım, motor revizyonu, fren sistemi, lastik servisi. TSE belgeli atölyemizde 4 teknisyen. Araç teslim ve getirme seçeneği mevcut. Balata, disk, yağ değişimi dahil.',
    description_en: 'Periodic maintenance, engine overhaul, brake system, and tire service for all vehicle brands. TSE-certified workshop with 4 technicians. Vehicle pickup and drop-off options available. Includes pads, discs, and oil change.',
    attributes: [
      { attribute_key: 'Hizmet', attribute_value: 'Periyodik Bakım' },
      { attribute_key: 'Tüm Markalar', attribute_value: 'Tüm markalar kabul' },
      { attribute_key: 'Belge', attribute_value: 'TSE Belgeli Atölye' },
      { attribute_key: 'Ek Hizmet', attribute_value: 'Araç teslim/getirme' },
    ],
    images: [
      { id: 17, url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop', is_cover: true },
      { id: 18, url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 7, title: 'Saç Tasarımı & Kuaförlük Hizmetleri', title_en: 'Hair Design & Salon Services', price: 250, price_type: 'STARTING',
    condition: undefined, status: 'ACTIVE', category_id: 13,
    city_name: 'İstanbul', district_name: 'Kadıköy', city_id: 1, district_id: 1,
    view_count: 534, favorite_count: 47, is_featured: true, is_negotiable: false,
    seller_id: 9, published_at: daysFromNow(-2), created_at: daysFromNow(-2),
    description: 'Profesyonel saç tasarımı, renklendirme, balayage, ombre ve röfle. Gelin saçı ve makyaj paketi. L\'Oréal Akademi mezunu, Wella Color Specialist sertifikalı. Randevu zorunludur.',
    description_en: 'Professional hair design, coloring, balayage, ombre, and highlights. Bridal hair and makeup packages. L\'Oréal Academy graduate, Wella Color Specialist certified. Appointment required.',
    attributes: [
      { attribute_key: 'Uzmanlık', attribute_value: 'Balayage, Ombre, Röfle' },
      { attribute_key: 'Gelin Paketi', attribute_value: 'Saç + Makyaj' },
      { attribute_key: 'Sertifika', attribute_value: 'L\'Oréal & Wella' },
      { attribute_key: 'Randevu', attribute_value: 'Zorunlu' },
    ],
    images: [
      { id: 19, url: 'https://images.unsplash.com/photo-1562322140-8baeacacf3df?w=800&h=600&fit=crop', is_cover: true },
      { id: 20, url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 8, title: 'Su Tesisatı & Gider Açma — 7/24', title_en: 'Plumbing & Drain Cleaning — 24/7', price: 220, price_type: 'STARTING',
    condition: undefined, status: 'ACTIVE', category_id: 1,
    city_name: 'İstanbul', district_name: 'Üsküdar', city_id: 1, district_id: 3,
    view_count: 291, favorite_count: 15, is_featured: false, is_negotiable: true,
    seller_id: 6, published_at: daysFromNow(-8), created_at: daysFromNow(-8),
    description: '7/24 acil su tesisatı hizmetleri. Gider açma, batarya montajı, klozet takımı, su kaçak tespiti ve onarımı. İstanbul Anadolu Yakası\'nda ekspres servis. Malzeme fiyatları ayrıca belirtilir.',
    description_en: '24/7 emergency plumbing services. Drain cleaning, faucet installation, toilet installation, water leak detection, and repair. Express service in Istanbul Asian side. Material costs are charged separately.',
    attributes: [
      { attribute_key: 'Hizmet', attribute_value: 'Su Tesisatı' },
      { attribute_key: 'Acil Servis', attribute_value: '7/24' },
      { attribute_key: 'Bölge', attribute_value: 'İst. Anadolu Yakası' },
      { attribute_key: 'Yanıt', attribute_value: '< 2 saat' },
    ],
    images: [
      { id: 21, url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop', is_cover: true },
      { id: 22, url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop' },
    ],
  },
  {
    id: 9, title: 'Düğün Fotoğrafçılığı — Tüm Paketler', title_en: 'Wedding Photography — All Packages', price: 5000, price_type: 'STARTING',
    condition: undefined, status: 'ACTIVE', category_id: 11,
    city_name: 'İstanbul', district_name: 'Şişli', city_id: 1, district_id: 4,
    view_count: 467, favorite_count: 53, is_featured: false, is_negotiable: true,
    seller_id: 14, published_at: daysFromNow(-9), created_at: daysFromNow(-9),
    description: 'Düğün, nişan, doğum günü ve kurumsal etkinlik fotoğrafçılığı. Tüm fotoğraflar düzenleme ve retouching dahil teslim edilir. Drone çekimi opsiyonel. 5 yıllık stüdyo deneyimi.',
    description_en: 'Photography for weddings, engagements, birthdays, and corporate events. All photos delivered with editing and retouching. Optional drone shoots. 5 years of studio experience.',
    attributes: [
      { attribute_key: 'Hizmet', attribute_value: 'Düğün & Etkinlik' },
      { attribute_key: 'Paket', attribute_value: 'Tam Gün veya Yarım Gün' },
      { attribute_key: 'Drone', attribute_value: 'Opsiyonel' },
      { attribute_key: 'Teslim', attribute_value: 'Düzenleme + Retouching' },
    ],
    images: [
      { id: 23, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop', is_cover: true },
      { id: 24, url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=600&fit=crop' },
    ],
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



export const disputes: any[] = [
  {
    id: 1, reporter_id: 2, reported_id: 4,
    reason: 'QUALITY',
    description: 'Tesisat tamiri sözleşmeye uygun yapılmadı. Bir hafta sonra tekrar su kaçağı başladı. Ücret iadesi talep ediyorum.',
    status: 'OPEN', priority: 'HIGH',
    resolution: '',
    created_at: daysFromNow(-3),
    reporter: users[1],
    reported: users[3],
    messages: [
      { id: 1, dispute_id: 1, sender_id: 2, message: 'Tamirat düzgün yapılmamış, tekrar aynı sorun çıktı.', is_admin: false, created_at: daysFromNow(-3), sender: users[1] },
      { id: 2, dispute_id: 1, sender_id: 4, message: 'Farklı bir nedenle kaçak oluşmuş olabilir. Bakabilmek için tekrar gelebilirim.', is_admin: false, created_at: daysFromNow(-2), sender: users[3] },
      { id: 3, dispute_id: 1, sender_id: 1, message: 'İki taraf da dinlendi. Uzmanın tekrar ziyaret etmesini onaylıyoruz.', is_admin: true, created_at: daysFromNow(-1), sender: users[0] },
    ],
  },
  {
    id: 2, reporter_id: 11, reported_id: 8,
    reason: 'NO_SHOW',
    description: 'Nakliyat için saat 09:00 randevu aldık, saat 12:00 oldu, uzman gelmedi. Ciddi mağduriyet yaşadık.',
    status: 'UNDER_REVIEW', priority: 'MEDIUM',
    resolution: '',
    created_at: daysFromNow(-5),
    reporter: users[10],
    reported: users[7],
    messages: [
      { id: 4, dispute_id: 2, sender_id: 11, message: 'Nakliyat günü gelmedi, eşyalarım hâlâ yerinde bekliyor!', is_admin: false, created_at: daysFromNow(-5), sender: users[10] },
      { id: 5, dispute_id: 2, sender_id: 1, message: 'Durum inceleniyor. Uzmanla iletişime geçildi.', is_admin: true, created_at: daysFromNow(-4), sender: users[0] },
    ],
  },
];

export const verifications: any[] = [
  {
    id: 1, provider_id: 4, provider_name: 'Çelik Tesisat & Doğalgaz',
    verification_type: 'PROFESSIONAL',
    document_url: 'https://example.com/docs/epdk-belgesi.pdf',
    note: 'EPDK lisans belgesi',
    status: 'PENDING',
    created_at: daysFromNow(-2),
  },
  {
    id: 2, provider_id: 6, provider_name: 'Öztürk Nakliyat & Depolama',
    verification_type: 'BUSINESS',
    document_url: 'https://example.com/docs/vergi-levhasi.pdf',
    note: 'Vergi levhası ve ticaret sicil belgesi',
    status: 'PENDING',
    created_at: daysFromNow(-1),
  },
  {
    id: 3, provider_id: 8, provider_name: 'Koç Oto Servis & Bakım',
    verification_type: 'IDENTITY',
    document_url: 'https://example.com/docs/kimlik.pdf',
    note: 'Kimlik ön ve arka yüz',
    status: 'PENDING',
    created_at: daysFromNow(0),
  },
];

export const adminDashboard: any = {
  total_users: 14,
  total_providers: 10,
  total_requests: 4,
  total_revenue: 87420,
  pending_verifications: 3,
  open_disputes: 2,
  pending_payouts: 1,
  active_ads: 8,
  new_users_today: 2,
  new_providers_today: 1,
  requests_today: 3,
  revenue_today: 3240,
  platform_stats: {
    avg_rating: 4.7,
    completion_rate: 94.2,
    response_time_avg: '1.8 saat',
  },
};

export const auditLogs: any[] = [
  { id: 1, admin_id: 1, action: 'USER_BAN', target: 'user#15', created_at: daysFromNow(-10) },
  { id: 2, admin_id: 1, action: 'VERIFY_APPROVE', target: 'verification#0', created_at: daysFromNow(-8) },
  { id: 3, admin_id: 1, action: 'DISPUTE_CLOSE', target: 'dispute#0', created_at: daysFromNow(-6) },
  { id: 4, admin_id: 1, action: 'PAYOUT_APPROVE', target: 'payout#1', created_at: daysFromNow(-25) },
];

export const adCategories: any[] = [];
