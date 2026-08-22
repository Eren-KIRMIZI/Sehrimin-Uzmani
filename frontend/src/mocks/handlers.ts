// ============================================================================
// MOCK HANDLERS â€” GerÃ§ek API yanÄ±t vermezse devreye giren sahte servisler.
// withMock(real, mock): Ã¶nce gerÃ§ek isteÄŸi dener; aÄŸ hatasÄ± / 404 / 5xx
// durumunda mock'a dÃ¼ÅŸer. 400/401/403 gibi gerÃ§ek doÄŸrulama hatalarÄ± yutulmaz.
// ============================================================================
import type {
  User, AuthTokens, RegisterRequest, ProviderProfile, Category, City, District,
  SearchFilters, SearchResult, ServiceRequest, Quote, Appointment, Review,
  Notification, Conversation, Message, EarningsSummary, Transaction, PayoutRequest,
  SubscriptionPlan, ProviderSubscription, Promotion, Dispute, DisputeMessage,
  AdminDashboard, PaginatedResponse, DetectResult, AIAnalysis, AIMatchExplanation,
  ReputationScore, Badge, ProviderAnalytics,
} from '../types';
import type { AdCategory, AdCreatePayload, AdDetail, AdFilters, AdListItem, AdListResponse } from '../types/ads';
import {
  users, providers, requests, quotes, appointments, reviews, notifications,
  conversations, messages, earningsSummary, transactions, earningsHistory, payouts,
  plans, mySubscription, promotions, disputes, verifications, adminDashboard,
  auditLogs, adCategories, ads, adReports, favoriteProviderIds, providerAnalytics,
  categories, cities, districts, nextId, buildPaginated,
  createFakeToken, parseFakeToken, dbGetters,
} from './db';

// â”€â”€ YardÄ±mcÄ±lar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const withMock = async <T>(real: () => Promise<T>, mock: () => T | Promise<T>): Promise<T> => {
  try {
    return await real();
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    const status = e?.response?.status;
    const networkError = !e?.response;
    const missingEndpoint = status === 404 || status === 405 || status === 501;
    const serverError = typeof status === 'number' && status >= 500;
    if (networkError || missingEndpoint || serverError) return await mock();
    throw err;
  }
};

export const getCurrentUserId = (): number => {
  const token = localStorage.getItem('access_token');
  if (token?.startsWith('mock.')) {
    const parsed = parseFakeToken(token);
    if (parsed && dbGetters.userById(parsed.sub)) return parsed.sub;
  }
  return 2; // demo mÃ¼ÅŸteri
};

export const currentUser = (): User => dbGetters.userById(getCurrentUserId())!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const myProvider = (): any => {
  const p = dbGetters.providerByUserId(getCurrentUserId());
  return p ? enrichProvider(p) : undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichProvider(p: any) {
  return { ...p, user: dbGetters.userById(p.user_id) };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichRequest(r: any) {
  return { ...r, customer: dbGetters.userById(r.customer_id), city: dbGetters.cityById(r.city_id) };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichQuote(q: any) {
  return { ...q, provider: enrichProvider(dbGetters.providerById(q.provider_id)) };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichAppointment(a: any) {
  return { ...a, provider: enrichProvider(dbGetters.providerById(a.provider_id)), customer: dbGetters.userById(a.customer_id) };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichReview(rv: any) {
  return { ...rv, customer: dbGetters.userById(rv.customer_id) };
}

const delay = () => new Promise(res => setTimeout(res, 120));

const fail = (msg: string): never => { throw new Error(msg); };

// â”€â”€ AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockAuth = {
  login: async (data: { email: string; password: string }): Promise<AuthTokens> => {
    await delay();
    const user = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (!user || !user.is_active || data.password.length < 4) fail('E-posta veya ÅŸifre hatalÄ±');
    return {
      access_token: createFakeToken(user.id, 'access'),
      refresh_token: createFakeToken(user.id, 'refresh'),
      token_type: 'bearer',
    };
  },

  register: async (data: RegisterRequest): Promise<AuthTokens> => {
    await delay();
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      fail('Bu e-posta adresi zaten kayÄ±tlÄ±');
    }
    const newUser = {
      id: nextId('users'),
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || '',
      avatar_url: '',
      role: data.role,
      subscription_plan: data.role === 'PROVIDER' ? 'silver' : '',
      two_factor_enabled: false,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    if (data.role === 'PROVIDER') {
      providers.push({
        id: nextId('providers'), user_id: newUser.id,
        business_name: `${data.first_name} ${data.last_name}`,
        bio: '', avatar_url: '', rating: 0, review_count: 0, completed_jobs: 0,
        years_experience: 0, verification_level: 'NONE', is_available: true,
        hourly_rate: 0, subscription_plan: 'silver', badge_type: '',
        services: [], locations: [], portfolio: [], availability: [],
      });
    }
    return {
      access_token: createFakeToken(newUser.id, 'access'),
      refresh_token: createFakeToken(newUser.id, 'refresh'),
      token_type: 'bearer',
    };
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    if (!refreshToken.startsWith('mock.')) fail('GeÃ§ersiz oturum');
    const parsed = parseFakeToken(refreshToken);
    if (!parsed) {
      throw new Error('Oturum sÃ¼resi doldu');
    }
    return {
      access_token: createFakeToken(parsed.sub, 'access'),
      refresh_token: createFakeToken(parsed.sub, 'refresh'),
      token_type: 'bearer',
    };
  },

  me: async (): Promise<User> => {
    await delay();
    return currentUser();
  },

  logout: async () => ({ message: 'Ã‡Ä±kÄ±ÅŸ yapÄ±ldÄ±' }),

  forgotPassword: async (email: string) => {
    await delay();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (!exists) fail('Bu e-posta ile kayÄ±tlÄ± kullanÄ±cÄ± bulunamadÄ±');
    return { message: 'Åifre sÄ±fÄ±rlama baÄŸlantÄ±sÄ± e-posta adresinize gÃ¶nderildi (demo).' };
  },

  resetPassword: async () => ({ message: 'Åifreniz gÃ¼ncellendi (demo).' }),
  changePassword: async () => ({ message: 'Åifreniz gÃ¼ncellendi (demo).' }),

  enable2fa: async () => ({
    qr_uri: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' +
      encodeURIComponent(`otpauth://totp/SehriminUzmani:${currentUser().email}?secret=DEMOSECRET1234`),
    secret: 'DEMO SECRET 1234',
  }),

  verify2fa: async (code: string) => {
    await delay();
    if (code !== '123456') fail('DoÄŸrulama kodu hatalÄ± (demo kodu: 123456)');
    const u = currentUser();
    u.two_factor_enabled = true;
    return { message: 'Ä°ki faktÃ¶rlÃ¼ doÄŸrulama etkinleÅŸtirildi' };
  },

  disable2fa: async () => {
    currentUser().two_factor_enabled = false;
    return { message: 'Ä°ki faktÃ¶rlÃ¼ doÄŸrulama kapatÄ±ldÄ±' };
  },
};

// â”€â”€ USERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockUsers = {
  getMe: async () => currentUser(),
  updateMe: async (data: Partial<User>) => {
    await delay();
    Object.assign(currentUser(), data);
    return currentUser();
  },
  deleteMe: async () => ({ message: 'HesabÄ±nÄ±z silindi (demo)' }),
};

// â”€â”€ PROVIDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockProviders = {
  createProfile: async (data: Partial<ProviderProfile>): Promise<ProviderProfile> => {
    await delay();
    const existing = dbGetters.providerByUserId(getCurrentUserId());
    if (existing) return enrichProvider(existing);
    const created = {
      id: nextId('providers'), user_id: getCurrentUserId(),
      business_name: data.business_name || `${currentUser().first_name} ${currentUser().last_name}`,
      bio: data.bio || '', avatar_url: '', rating: 0, review_count: 0,
      completed_jobs: 0, years_experience: data.years_experience || 0,
      verification_level: 'NONE', is_available: true, hourly_rate: data.hourly_rate || 0,
      subscription_plan: '', badge_type: '', services: [], locations: [],
      portfolio: [], availability: [],
    };
    providers.push(created);
    return enrichProvider(created);
  },

  getMe: async (): Promise<ProviderProfile> => {
    await delay();
    const p = dbGetters.providerByUserId(getCurrentUserId());
    if (!p) fail('Uzman profili bulunamadÄ±');
    return enrichProvider(p);
  },

  updateMe: async (data: Partial<ProviderProfile>): Promise<ProviderProfile> => {
    await delay();
    const p = dbGetters.providerByUserId(getCurrentUserId());
    if (!p) fail('Uzman profili bulunamadÄ±');
    Object.assign(p, data);
    return enrichProvider(p);
  },

  getById: async (id: number): Promise<ProviderProfile> => {
    await delay();
    const p = dbGetters.providerById(id);
    if (!p) fail('Uzman bulunamadı');
    return enrichProvider(p);
  },

  addService: async (data: { service_id: number; starting_price?: number; description?: string }) => {
    const p = dbGetters.providerByUserId(getCurrentUserId());
    if (!p) fail('Uzman profili bulunamadÄ±');
    const svc = dbGetters.serviceById(data.service_id);
    if (!svc) fail('Hizmet bulunamadÄ±');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (p.services.some((s: any) => s.service.id === data.service_id)) fail('Bu hizmet zaten ekli');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p.services as any[]).push({
      id: nextId('providerServices'), service: svc,
      starting_price: data.starting_price, description: data.description,
    });
    return { message: 'Hizmet eklendi' };
  },

  addPortfolio: async (data: { image_url: string; title?: string; description?: string }) => {
    const p = dbGetters.providerByUserId(getCurrentUserId());
    if (!p) fail('Uzman profili bulunamadÄ±');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p.portfolio as any[]).push({ id: nextId('portfolio'), ...data });
    return { message: 'PortfÃ¶y Ã§alÄ±ÅŸmasÄ± eklendi' };
  },

  addLocation: async (data: { city_id: number; district_id?: number }) => {
    const p = dbGetters.providerByUserId(getCurrentUserId());
    if (!p) fail('Uzman profili bulunamadÄ±');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p.locations as any[]).push({
      id: nextId('locations'),
      city: dbGetters.cityById(data.city_id),
      district: dbGetters.districtById(data.district_id),
    });
    return { message: 'Hizmet bÃ¶lgesi eklendi' };
  },

  addAvailability: async (data: { day_of_week: number; start_time: string; end_time: string }) => {
    const p = dbGetters.providerByUserId(getCurrentUserId());
    if (!p) fail('Uzman profili bulunamadÄ±');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p.availability as any[]).push({ id: nextId('availability'), ...data });
    return { message: 'Ã‡alÄ±ÅŸma saati eklendi' };
  },
};

// â”€â”€ CATEGORIES & LOCATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockCategories = {
  getAll: async (): Promise<Category[]> => categories,
  getBySlug: async (slug: string) => {
    const c = categories.find(x => x.slug === slug);
    if (!c) fail('Kategori bulunamadÄ±');
    return c;
  },
  getServices: async (slug: string) => {
    const c = categories.find(x => x.slug === slug);
    if (!c) {
      throw new Error('Kategori bulunamadÄ±');
    }
    return c.subcategories.flatMap(s => s.services);
  },
};

export const mockLocations = {
  getCities: async (): Promise<City[]> => cities,
  getDistricts: async (cityId: number): Promise<District[]> =>
    districts.filter(d => d.city_id === cityId),
};

// â”€â”€ SEARCH & MATCHING & AI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const applySearchFilters = (filters: SearchFilters) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let list: any[] = providers.map(enrichProvider);

  if (filters.q) {
    const q = filters.q.toLocaleLowerCase('tr');
    list = list.filter(p =>
      p.business_name?.toLocaleLowerCase('tr').includes(q) ||
      p.bio?.toLocaleLowerCase('tr').includes(q) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p.services.some((s: any) => s.service.name.toLocaleLowerCase('tr').includes(q))
    );
  }
  const slugsToServiceIds = (slug: string, level: 'category' | 'subcategory' | 'service') => {
    if (level === 'service') {
      const svc = categories.flatMap(c => c.subcategories).flatMap(s => s.services).find(s => s.slug === slug);
      return svc ? [svc.id] : [];
    }
    if (level === 'subcategory') {
      const sub = categories.flatMap(c => c.subcategories).find(s => s.slug === slug);
      return sub ? sub.services.map(s => s.id) : [];
    }
    const cat = categories.find(c => c.slug === slug);
    return cat ? cat.subcategories.flatMap(s => s.services.map(sv => sv.id)) : [];
  };
  if (filters.category) {
    const ids = new Set(slugsToServiceIds(filters.category, 'category'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list = list.filter(p => p.services.some((s: any) => ids.has(s.service.id)));
  }
  if (filters.subcategory) {
    const ids = new Set(slugsToServiceIds(filters.subcategory, 'subcategory'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list = list.filter(p => p.services.some((s: any) => ids.has(s.service.id)));
  }
  if (filters.service) {
    const ids = new Set(slugsToServiceIds(filters.service, 'service'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list = list.filter(p => p.services.some((s: any) => ids.has(s.service.id)));
  }
  if (filters.city_id) list = list.filter(p => p.locations.some((l: { city: { id: number } }) => l.city.id === filters.city_id));
  if (filters.district_id) list = list.filter(p => p.locations.some((l: { district?: { id: number } }) => l.district?.id === filters.district_id));
  if (filters.min_rating) list = list.filter(p => p.rating >= filters.min_rating!);
  if (filters.min_price) list = list.filter(p => (p.hourly_rate || 0) >= filters.min_price!);
  if (filters.max_price) list = list.filter(p => p.hourly_rate === 0 || (p.hourly_rate || 0) <= filters.max_price!);
  if (filters.verified) list = list.filter(p => p.verification_level !== 'NONE');
  if (filters.available) list = list.filter(p => p.is_available);

  switch (filters.sort) {
    case 'rating':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'reviews':
      list.sort((a, b) => b.review_count - a.review_count);
      break;
    case 'newest':
      list.sort((a, b) => b.id - a.id);
      break;
    default: // recommended â€” puan + yorum + doÄŸrulama karmasÄ±
      list.sort((a, b) => {
        const score = (p: { rating: number; review_count: number; verification_level: string }) =>
          p.rating * 20 + p.review_count / 5 +
          (p.verification_level === 'BUSINESS' ? 3 : p.verification_level === 'PROFESSIONAL' ? 2 : p.verification_level === 'ID' ? 1 : 0);
        return score(b) - score(a);
      });
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  return {
    providers: list.slice((page - 1) * limit, page * limit),
    total: list.length,
    page,
    limit,
    has_next: list.length > page * limit,
  } satisfies SearchResult;
};

const detectFromText = (text: string): DetectResult => {
  const t = text.toLocaleLowerCase('tr');
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      for (const svc of sub.services) {
        const words = svc.name.toLocaleLowerCase('tr').split(/\s+/);
        if (t.includes(svc.slug.replace(/-/g, ' ')) || words.some(w => w.length > 3 && t.includes(w))) {
          return {
            detected: true,
            category: cat.name, category_slug: cat.slug,
            subcategory: sub.name, subcategory_slug: sub.slug,
            service: svc.name, service_slug: svc.slug,
          };
        }
      }
    }
  }
  for (const cat of categories) {
    const name = cat.name.toLocaleLowerCase('tr').split(/\s+/)[0];
    if (name.length > 3 && t.includes(name)) {
      return { detected: true, category: cat.name, category_slug: cat.slug };
    }
  }
  return { detected: false };
};

export const mockSearch = {
  searchProviders: async (filters: SearchFilters): Promise<SearchResult> => {
    await delay();
    return applySearchFilters(filters);
  },
  autocomplete: async (q: string) => {
    const query = q.toLocaleLowerCase('tr');
    if (!query) return [];
    const results: { label: string; type: string; slug: string }[] = [];
    for (const cat of categories) {
      if (cat.name.toLocaleLowerCase('tr').includes(query)) results.push({ label: cat.name, type: 'category', slug: cat.slug });
      for (const sub of cat.subcategories) {
        for (const svc of sub.services) {
          if (svc.name.toLocaleLowerCase('tr').includes(query)) results.push({ label: svc.name, type: 'service', slug: svc.slug });
        }
      }
    }
    return results.slice(0, 8);
  },
  detect: async (text: string): Promise<DetectResult> => detectFromText(text),
};

export const mockMatching = {
  find: async (data: object) => applySearchFilters(data as SearchFilters),
  ai: async (data: object) => applySearchFilters(data as SearchFilters),
  recommendations: async () => applySearchFilters({ sort: 'recommended', limit: 8 }).providers,
};

export const mockAi = {
  analyzeRequest: async (text: string): Promise<AIAnalysis> => {
    await delay();
    const detected = detectFromText(text);
    const t = text.toLocaleLowerCase('tr');
    const budgetMatch = text.match(/(\d[\d.]*)\s*(?:-|ile)\s*(\d[\d.]*)/);
    const city = cities.find(c => t.includes(c.name.toLocaleLowerCase('tr')));
    return {
      category_slug: detected.category_slug ?? null,
      category_name: detected.category ?? null,
      subcategory: detected.subcategory ?? null,
      service: detected.service ?? null,
      urgency: t.includes('acil') ? 'emergency' : t.includes('hemen') ? 'high' : 'medium',
      location: city ? { city: city.name, district: null } : null,
      preferred_time: t.includes('akÅŸam') ? 'akÅŸam' : null,
      budget: budgetMatch ? { min: Number(budgetMatch[1].replace(/\./g, '')), max: Number(budgetMatch[2].replace(/\./g, '')) } : null,
      keywords: text.split(/\s+/).filter(w => w.length > 4).slice(0, 5),
      problem_description: text.slice(0, 200),
      confidence: detected.detected ? 0.85 : 0.3,
      is_emergency: t.includes('acil'),
      detected: detected.detected,
      original_text: text,
    };
  },
  explainMatch: async (): Promise<AIMatchExplanation> => ({
    match_percent: 92,
    summary: 'Bu uzman, aradÄ±ÄŸÄ±nÄ±z hizmet bÃ¶lgesinde ve yÃ¼ksek mÃ¼ÅŸteri memnuniyetine sahip.',
    reasons: ['Hizmet bÃ¶lgenizde', 'YÃ¼ksek puan ve yorum sayÄ±sÄ±', 'Benzer iÅŸleri baÅŸarÄ±yla tamamladÄ±'],
    highlight: '%92 uyum',
  }),
};

// â”€â”€ REQUESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockRequests = {
  create: async (data: Partial<ServiceRequest>): Promise<ServiceRequest> => {
    await delay();
    const created = {
      id: nextId('requests'),
      customer_id: getCurrentUserId(),
      title: data.title || 'Ä°simsiz talep',
      description: data.description || '',
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      service_id: data.service_id,
      city_id: data.city_id || 1,
      district_id: data.district_id,
      status: 'OPEN',
      urgency: data.urgency || 'MEDIUM',
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      preferred_date: data.preferred_date,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };
    requests.unshift(created);
    return enrichRequest(created);
  },

  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<ServiceRequest>> => {
    await delay();
    const mine = requests
      .filter(r => r.customer_id === getCurrentUserId())
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    return buildPaginated(mine.map(enrichRequest), page, limit);
  },

  getById: async (id: number): Promise<ServiceRequest> => {
    await delay();
    const r = requests.find(x => x.id === id);
    if (!r) fail('Talep bulunamadÄ±');
    return {
      ...enrichRequest(r),
      quotes: quotes.filter(q => q.request_id === id).map(enrichQuote),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },

  update: async (id: number, data: Partial<ServiceRequest>) => {
    const r = requests.find(x => x.id === id);
    if (!r) fail('Talep bulunamadÄ±');
    Object.assign(r, data);
    return enrichRequest(r);
  },

  delete: async (id: number) => {
    const idx = requests.findIndex(x => x.id === id);
    if (idx >= 0) requests.splice(idx, 1);
    return { message: 'Talep silindi' };
  },
};

// â”€â”€ QUOTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockQuotes = {
  sendQuote: async (requestId: number, data: Partial<Quote>): Promise<Quote> => {
    await delay();
    const provider = myProvider();
    if (!provider) fail('Teklif verebilmek iÃ§in uzman profili gerekli');
    const request = requests.find(r => r.id === requestId);
    if (!request) fail('Talep bulunamadÄ±');
    const price = Number(data.price) || 0;
    const created = {
      id: nextId('quotes'),
      request_id: requestId,
      provider_id: provider.id as number,
      price,
      estimated_duration: data.estimated_duration,
      warranty: data.warranty,
      description: data.description,
      materials: data.materials,
      available_date: data.available_date,
      status: 'SUBMITTED',
      created_at: new Date().toISOString(),
      items: [{ id: nextId('quoteItems'), name: data.description || 'Hizmet bedeli', price, type: 'LABOR', quantity: 1 }],
    };
    quotes.push(created);
    notifications.unshift({
      id: nextId('notifications'), user_id: request.customer_id, type: 'QUOTE',
      title: 'Yeni Teklif',
      message: `${provider.business_name} talebinize â‚º${price.toLocaleString('tr-TR')} teklif verdi.`,
      is_read: false, created_at: new Date().toISOString(),
    });
    return enrichQuote(created);
  },

  getForRequest: async (requestId: number): Promise<Quote[]> => {
    await delay();
    return quotes.filter(q => q.request_id === requestId).map(enrichQuote);
  },

  accept: async (id: number) => {
    await delay();
    const quote = quotes.find(q => q.id === id);
    if (!quote) fail('Teklif bulunamadÄ±');
    quotes.forEach(q => { if (q.request_id === quote.request_id) q.status = q.id === id ? 'ACCEPTED' : 'REJECTED'; });
    const request = requests.find(r => r.id === quote.request_id);
    if (request) request.status = 'IN_PROGRESS';
    const prov = dbGetters.providerById(quote.provider_id);
    if (prov) {
      notifications.unshift({
        id: nextId('notifications'), user_id: prov.user_id, type: 'QUOTE',
        title: 'Teklifiniz Kabul Edildi',
        message: 'Teklifiniz kabul edildi! Randevu planlamasÄ± iÃ§in mesaj gÃ¶nderebilirsiniz.',
        is_read: false, created_at: new Date().toISOString(),
      });
    }
    return enrichQuote(quote);
  },

  reject: async (id: number) => {
    const quote = quotes.find(q => q.id === id);
    if (!quote) fail('Teklif bulunamadÄ±');
    quote.status = 'REJECTED';
    return enrichQuote(quote);
  },

  revise: async (id: number, data: Partial<Quote>) => {
    const quote = quotes.find(q => q.id === id);
    if (!quote) fail('Teklif bulunamadÄ±');
    Object.assign(quote, data, { status: 'SUBMITTED' });
    return enrichQuote(quote);
  },

  getMy: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Quote>> => {
    await delay();
    const provider = myProvider();
    if (!provider) return buildPaginated([], 1, 10);
    const mine = quotes
      .filter(q => q.provider_id === provider.id)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return buildPaginated(mine.map(enrichQuote), params?.page ?? 1, params?.limit ?? 10);
  },
};

// â”€â”€ APPOINTMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockAppointments = {
  create: async (data: Partial<Appointment>): Promise<Appointment> => {
    await delay();
    const created = {
      id: nextId('appointments'),
      request_id: data.request_id,
      provider_id: data.provider_id!,
      customer_id: getCurrentUserId(),
      start_at: data.start_at!,
      end_at: data.end_at,
      location: data.location || 'MÃ¼ÅŸteri adresi',
      notes: data.notes || '',
      status: 'SCHEDULED',
      created_at: new Date().toISOString(),
    };
    appointments.push(created);
    const prov = dbGetters.providerById(created.provider_id);
    if (prov) {
      notifications.unshift({
        id: nextId('notifications'), user_id: prov.user_id, type: 'APPOINTMENT',
        title: 'Yeni Randevu Talebi', message: 'Yeni bir randevu talebiniz var.',
        is_read: false, created_at: new Date().toISOString(),
      });
    }
    return enrichAppointment(created);
  },

  getAll: async (_params?: object): Promise<PaginatedResponse<Appointment>> => {
    await delay();
    const me = currentUser();
    const myProv = dbGetters.providerByUserId(me.id);
    const mine = appointments
      .filter(a =>
        a.customer_id === me.id ||
        (myProv && a.provider_id === myProv.id)
      )
      .sort((a, b) => +new Date(b.start_at) - +new Date(a.start_at));
    return buildPaginated(mine.map(enrichAppointment), 1, 50);
  },

  getById: async (id: number): Promise<Appointment> => {
    const a = appointments.find(x => x.id === id);
    if (!a) fail('Randevu bulunamadÄ±');
    return enrichAppointment(a);
  },

  update: async (id: number, data: Partial<Appointment>) => {
    const a = appointments.find(x => x.id === id);
    if (!a) fail('Randevu bulunamadÄ±');
    Object.assign(a, data);
    return enrichAppointment(a);
  },

  setStatus: async (id: number, status: string, message: string) => {
    await delay();
    const a = appointments.find(x => x.id === id);
    if (!a) fail('Randevu bulunamadÄ±');
    a.status = status;
    if (status === 'COMPLETED') {
      const prov = dbGetters.providerById(a.provider_id);
      if (prov) {
        prov.completed_jobs += 1;
        const amount = quotes.find(q => q.request_id === a.request_id)?.price || 500;
        transactions.unshift({
          id: nextId('transactions'), provider_id: prov.id, amount,
          commission_amount: Math.round(amount * 0.05),
          provider_earning: Math.round(amount * 0.95),
          status: 'PENDING', created_at: new Date().toISOString(),
        });
        earningsSummary.total_earned += Math.round(amount * 0.95);
        earningsSummary.pending_amount += Math.round(amount * 0.95);
      }
    }
    return { message, status };
  },

  confirm: (id: number) => mockAppointments.setStatus(id, 'CONFIRMED', 'Randevu onaylandÄ±'),
  start: (id: number) => mockAppointments.setStatus(id, 'IN_PROGRESS', 'Ä°ÅŸ baÅŸlatÄ±ldÄ±'),
  complete: (id: number) => mockAppointments.setStatus(id, 'COMPLETED', 'Ä°ÅŸ tamamlandÄ±'),
  cancel: (id: number) => mockAppointments.setStatus(id, 'CANCELLED', 'Randevu iptal edildi'),
  noShow: (id: number) => mockAppointments.setStatus(id, 'NO_SHOW', 'KarÅŸÄ± taraf gelmedi olarak iÅŸaretlendi'),

  getAvailableSlots: async (provider_id: number, date: string) => {
    await delay();
    const prov = dbGetters.providerById(provider_id);
    const d = new Date(date);
    const dow = d.getDay();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avail = (prov?.availability as any[] | undefined)?.find(a => a.day_of_week === dow);
    const startH = avail ? parseInt(avail.start_time, 10) : 9;
    const endH = avail ? parseInt(avail.end_time, 10) : 18;
    const slots: { start: string; end: string; available: boolean }[] = [];
    for (let h = startH; h < endH; h++) {
      const available = (provider_id * 7 + h * 3 + d.getDate()) % 4 !== 0;
      slots.push({
        start: `${String(h).padStart(2, '0')}:00`,
        end: `${String(h + 1).padStart(2, '0')}:00`,
        available,
      });
    }
    return { date, provider_id, total_slots: slots.length, slots };
  },
};

// â”€â”€ REVIEWS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockReviews = {
  create: async (data: Partial<Review>): Promise<Review> => {
    await delay();
    const created = {
      id: nextId('reviews'),
      provider_id: data.provider_id!,
      customer_id: getCurrentUserId(),
      rating: data.rating || 5,
      comment: data.comment || '',
      communication_rating: data.communication_rating,
      quality_rating: data.quality_rating,
      price_rating: data.price_rating,
      punctuality_rating: data.punctuality_rating,
      provider_reply: '',
      created_at: new Date().toISOString(),
    };
    reviews.unshift(created);
    const prov = dbGetters.providerById(created.provider_id);
    if (prov) {
      const total = prov.rating * prov.review_count + created.rating;
      prov.review_count += 1;
      prov.rating = Math.round((total / prov.review_count) * 10) / 10;
    }
    return enrichReview(created);
  },

  getForProvider: async (providerId: number, params?: { page?: number }): Promise<PaginatedResponse<Review>> => {
    await delay();
    const list = reviews
      .filter(rv => rv.provider_id === providerId)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return buildPaginated(list.map(enrichReview), params?.page ?? 1, 10);
  },

  reply: async (reviewId: number, reply: string) => {
    await delay();
    const rv = reviews.find(x => x.id === reviewId);
    if (!rv) fail('Yorum bulunamadÄ±');
    rv.provider_reply = reply;
    return enrichReview(rv);
  },
};

// â”€â”€ FAVORITES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockFavorites = {
  toggle: async (providerId: number) => {
    await delay();
    const idx = favoriteProviderIds.indexOf(providerId);
    if (idx >= 0) favoriteProviderIds.splice(idx, 1);
    else favoriteProviderIds.push(providerId);
    return { message: idx >= 0 ? 'Favorilerden Ã§Ä±karÄ±ldÄ±' : 'Favorilere eklendi', is_favorite: idx < 0 };
  },
  getAll: async () => {
    await delay();
    return favoriteProviderIds.map(pid => {
      const p = dbGetters.providerById(pid);
      return p ? { id: pid, provider_id: pid, provider: enrichProvider(p) } : null;
    }).filter(Boolean);
  },
  remove: async (providerId: number) => {
    const idx = favoriteProviderIds.indexOf(providerId);
    if (idx >= 0) favoriteProviderIds.splice(idx, 1);
    return { message: 'Favorilerden Ã§Ä±karÄ±ldÄ±' };
  },
};

// â”€â”€ NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockNotifications = {
  getAll: async (): Promise<Notification[]> => {
    await delay();
    return notifications
      .filter(n => n.user_id === getCurrentUserId())
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  },
  getUnreadCount: async () => ({
    count: notifications.filter(n => n.user_id === getCurrentUserId() && !n.is_read).length,
  }),
  markRead: async (id: number) => {
    const n = notifications.find(x => x.id === id);
    if (n) n.is_read = true;
    return { message: 'Okundu' };
  },
  markAllRead: async () => {
    notifications.forEach(n => { if (n.user_id === getCurrentUserId()) n.is_read = true; });
    return { message: 'TÃ¼mÃ¼ okundu' };
  },
};

// â”€â”€ MESSAGING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockMessaging = {
  createConversation: async (provider_id: number): Promise<Conversation> => {
    await delay();
    const me = getCurrentUserId();
    const existing = conversations.find(c => c.customer_id === me && c.provider_id === provider_id);
    if (existing) return existing as unknown as Conversation;
    const prov = dbGetters.providerById(provider_id);
    if (!prov) fail('Uzman bulunamadÄ±');
    const created = {
      id: nextId('conversations'), customer_id: me, provider_id,
      created_at: new Date().toISOString(), unread_count: 0,
      customer: currentUser(), provider: enrichProvider(prov),
      last_message: undefined,
    };
    conversations.unshift(created);
    return created as unknown as Conversation;
  },

  getConversations: async (params?: { page?: number }): Promise<PaginatedResponse<Conversation>> => {
    await delay();
    const me = getCurrentUserId();
    const myProv = dbGetters.providerByUserId(me);
    const mine = conversations
      .filter(c => c.customer_id === me || (myProv && c.provider_id === myProv.id))
      .sort((a, b) =>
        +new Date(b.last_message?.created_at || b.created_at) -
        +new Date(a.last_message?.created_at || a.created_at))
      .map(c => ({ ...c, provider: enrichProvider(dbGetters.providerById(c.provider_id)) }));
    return buildPaginated(mine as unknown as Conversation[], params?.page ?? 1, 20);
  },

  getMessages: async (conversationId: number, params?: { page?: number }): Promise<PaginatedResponse<Message>> => {
    await delay();
    const list = messages
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)); // en yeni Ã¶nce (ChatPage ters Ã§evirir)
    return buildPaginated(list as Message[], params?.page ?? 1, 50);
  },

  sendMessage: async (conversationId: number, content: string, message_type = 'TEXT'): Promise<Message> => {
    await delay();
    const created = {
      id: nextId('messages'), conversation_id: conversationId,
      sender_id: getCurrentUserId(), content,
      message_type: message_type as Message['message_type'],
      created_at: new Date().toISOString(), is_read: false,
    };
    messages.push(created);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) conv.last_message = created;
    return created;
  },

  getUnreadCount: async () => {
    const me = getCurrentUserId();
    const myConvIds = conversations
      .filter(c => c.customer_id === me || dbGetters.providerByUserId(me)?.id === c.provider_id)
      .map(c => c.id);
    return { count: messages.filter(m => myConvIds.includes(m.conversation_id) && m.sender_id !== me && !m.is_read).length };
  },
};

// â”€â”€ COMMISSIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockCommissions = {
  getEarnings: async (): Promise<EarningsSummary> => {
    await delay();
    return earningsSummary;
  },
  getTransactions: async (params?: { page?: number }): Promise<PaginatedResponse<Transaction>> => {
    await delay();
    return buildPaginated(transactions as Transaction[], params?.page ?? 1, 10);
  },
  getEarningsHistory: async () => earningsHistory,
  requestPayout: async (data: { amount: number; iban: string; bank_name: string }): Promise<PayoutRequest> => {
    await delay();
    if (data.amount > earningsSummary.available_for_payout) {
      fail('Ã‡ekilebilir bakiyenizden fazla tutar giremezsiniz');
    }
    const created = {
      id: nextId('payouts'), provider_id: myProvider()?.id as number || 1,
      amount: data.amount, bank_name: data.bank_name, iban: data.iban,
      status: 'PENDING' as PayoutRequest['status'],
      created_at: new Date().toISOString(),
    };
    payouts.unshift(created);
    earningsSummary.available_for_payout -= data.amount;
    return created;
  },
  getMyPayouts: async (): Promise<PayoutRequest[]> => payouts,
};

// â”€â”€ SUBSCRIPTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockSubscriptions = {
  getPlans: async (): Promise<SubscriptionPlan[]> => plans,
  subscribe: async (plan_id: number, interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY') => {
    await delay();
    const plan = plans.find(p => p.id === plan_id);
    if (!plan) {
      throw new Error('Plan bulunamadÄ±');
    }
    const days = interval === 'MONTHLY' ? 30 : interval === 'QUARTERLY' ? 90 : 365;
    mySubscription.plan = plan;
    mySubscription.interval = interval;
    mySubscription.status = 'ACTIVE';
    mySubscription.expires_at = new Date(Date.now() + days * 86400000).toISOString();
    currentUser().subscription_plan = plan.slug as User['subscription_plan'];
    return { message: `${plan.name} planÄ±na abone olundu`, status: 'ACTIVE' };
  },
  getMy: async (): Promise<ProviderSubscription> => {
    await delay();
    return mySubscription as ProviderSubscription;
  },
  cancel: async () => {
    mySubscription.status = 'CANCELLED';
    return { message: 'Abonelik dÃ¶nem sonunda sonlandÄ±rÄ±lacak' };
  },
  getPayments: async () => [],
};

// â”€â”€ PROMOTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockPromotions = {
  create: async (data: Partial<Promotion>): Promise<Promotion> => {
    await delay();
    const created = {
      id: nextId('promotions'), provider_id: myProvider()?.id as number || 1,
      category_id: data.category_id, budget: data.budget || 500,
      daily_budget: data.daily_budget, bid_amount: data.bid_amount || 10,
      status: 'ACTIVE' as Promotion['status'],
      impressions: 0, clicks: 0, budget_spent: 0,
      created_at: new Date().toISOString(), expires_at: data.expires_at,
    };
    promotions.unshift(created);
    return created;
  },
  getMy: async (): Promise<Promotion[]> => {
    await delay();
    return promotions;
  },
  getFeatured: async () => providers.slice(0, 4).map(enrichProvider),
  pause: async (id: number) => {
    const p = promotions.find(x => x.id === id);
    if (p) p.status = 'PAUSED';
    return { message: 'Kampanya duraklatÄ±ldÄ±' };
  },
  resume: async (id: number) => {
    const p = promotions.find(x => x.id === id);
    if (p) p.status = 'ACTIVE';
    return { message: 'Kampanya devam ettirildi' };
  },
  cancel: async (id: number) => {
    const p = promotions.find(x => x.id === id);
    if (p) p.status = 'CANCELLED';
    return { message: 'Kampanya iptal edildi' };
  },
  updateBid: async (id: number, bid_amount: number) => {
    const p = promotions.find(x => x.id === id);
    if (!p) fail('Kampanya bulunamadÄ±');
    p.bid_amount = bid_amount;
    return { message: 'Teklif gÃ¼ncellendi' };
  },
};

// â”€â”€ DISPUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockDisputes = {
  create: async (data: { reported_id: number; reason: string; description: string }): Promise<Dispute> => {
    await delay();
    const reporter = currentUser();
    const reported = dbGetters.userById(data.reported_id);
    if (!reported) fail('Åikayet edilen kullanÄ±cÄ± bulunamadÄ±');
    const created = {
      id: nextId('disputes'), reporter_id: reporter.id, reported_id: data.reported_id,
      reason: data.reason, description: data.description,
      status: 'OPEN', priority: 'MEDIUM', resolution: '',
      created_at: new Date().toISOString(),
      reporter, reported, messages: [],
    };
    disputes.unshift(created);
    return created as unknown as Dispute;
  },

  getMy: async (params?: { page?: number }): Promise<PaginatedResponse<Dispute>> => {
    await delay();
    const me = getCurrentUserId();
    const mine = disputes
      .filter(d => d.reporter_id === me || d.reported_id === me)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return buildPaginated(disputes.filter(d => mine.includes(d)) as unknown as Dispute[], params?.page ?? 1, 10);
  },

  getById: async (id: number): Promise<Dispute> => {
    await delay();
    const d = disputes.find(x => x.id === id);
    if (!d) fail('AnlaÅŸmazlÄ±k bulunamadÄ±');
    return d as unknown as Dispute;
  },

  addMessage: async (id: number, message: string): Promise<DisputeMessage> => {
    await delay();
    const d = disputes.find(x => x.id === id);
    if (!d) fail('AnlaÅŸmazlÄ±k bulunamadÄ±');
    const sender = currentUser();
    const msg = {
      id: nextId('disputeMessages'), dispute_id: id, sender_id: sender.id,
      message, is_admin: false, created_at: new Date().toISOString(), sender,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((d as any).messages ||= []).push(msg);
    return msg;
  },

  close: async (id: number) => {
    const d = disputes.find(x => x.id === id);
    if (d) d.status = 'CLOSED';
    return { message: 'AnlaÅŸmazlÄ±k kapatÄ±ldÄ±' };
  },
};

// â”€â”€ VERIFICATION (DoÄŸrulama) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockVerification = {
  apply: async (data: { verification_type: string; document_url?: string; note?: string }) => {
    await delay();
    const prov = myProvider();
    if (!prov) fail('DoÄŸrulama baÅŸvurusu iÃ§in uzman profili gerekli');
    const created = {
      id: nextId('verifications'),
      provider_id: prov.id as number,
      provider_name: prov.business_name as string,
      verification_type: data.verification_type,
      document_url: data.document_url || '',
      note: data.note || '',
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    verifications.unshift(created);
    return created;
  },

  getMy: async () => {
    await delay();
    const prov = myProvider();
    if (!prov) return [];
    return verifications.filter(v => v.provider_id === prov.id);
  },

  getPending: async () => {
    await delay();
    return verifications.filter(v => v.status === 'PENDING');
  },

  approve: async (verificationId: number) => {
    await delay();
    const v = verifications.find(x => x.id === verificationId);
    if (!v) fail('DoÄŸrulama talebi bulunamadÄ±');
    v.status = 'APPROVED';
    v.reviewed_at = new Date().toISOString();
    const levelMap: Record<string, string> = { IDENTITY: 'ID', PROFESSIONAL: 'PROFESSIONAL', BUSINESS: 'BUSINESS' };
    const prov = dbGetters.providerById(v.provider_id);
    if (prov) prov.verification_level = levelMap[v.verification_type] || 'BASIC';
    auditLogs.unshift({
      id: nextId('auditLogs'), admin_id: 1,
      action: 'VERIFY_APPROVE', target: `verification#${v.id}`,
      created_at: new Date().toISOString(),
    });
    return { message: 'DoÄŸrulama onaylandÄ±' };
  },

  reject: async (verificationId: number, note?: string) => {
    await delay();
    const v = verifications.find(x => x.id === verificationId);
    if (!v) fail('DoÄŸrulama talebi bulunamadÄ±');
    v.status = 'REJECTED';
    v.admin_note = note || '';
    v.reviewed_at = new Date().toISOString();
    auditLogs.unshift({
      id: nextId('auditLogs'), admin_id: 1,
      action: 'VERIFY_REJECT', target: `verification#${v.id}`,
      created_at: new Date().toISOString(),
    });
    return { message: 'DoÄŸrulama reddedildi' };
  },
};

// â”€â”€ ADMIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockAdmin = {
  getDashboard: async (): Promise<AdminDashboard> => {
    await delay();
    return adminDashboard;
  },
  getUsers: async (params?: object) => {
    await delay();
    const p = params as { page?: number; limit?: number } | undefined;
    return buildPaginated(users, p?.page ?? 1, p?.limit ?? 20);
  },
  updateUser: async (id: number, data: object) => {
    const u = dbGetters.userById(id);
    if (!u) fail('KullanÄ±cÄ± bulunamadÄ±');
    Object.assign(u, data);
    return u;
  },
  getProviders: async (params?: object) => {
    await delay();
    const p = params as { page?: number; limit?: number } | undefined;
    return buildPaginated(providers.map(enrichProvider), p?.page ?? 1, p?.limit ?? 20);
  },
  verifyProvider: async (id: number) => {
    const prov = dbGetters.providerById(id);
    if (!prov) fail('Uzman bulunamadÄ±');
    prov.verification_level = 'BUSINESS';
    return { message: 'Uzman doÄŸrulandÄ±' };
  },
  getRequests: async (params?: object) => {
    await delay();
    const p = params as { page?: number; limit?: number } | undefined;
    return buildPaginated(requests.map(enrichRequest), p?.page ?? 1, p?.limit ?? 20);
  },
  getReviews: async (params?: object) => {
    await delay();
    const p = params as { page?: number; limit?: number } | undefined;
    return buildPaginated(reviews.map(enrichReview), p?.page ?? 1, p?.limit ?? 20);
  },
  getAuditLogs: async (params?: object) => {
    await delay();
    const p = params as { page?: number; limit?: number } | undefined;
    return buildPaginated(auditLogs, p?.page ?? 1, p?.limit ?? 20);
  },
  getPayouts: async (params?: object) => {
    await delay();
    const p = params as { page?: number; limit?: number } | undefined;
    return buildPaginated(payouts, p?.page ?? 1, p?.limit ?? 20);
  },
  getDisputes: async (params?: object) => {
    await delay();
    const p = params as { page?: number; limit?: number } | undefined;
    return buildPaginated(disputes as unknown as Dispute[], p?.page ?? 1, p?.limit ?? 20);
  },
  getFraudRisk: async (userId: number) => {
    await delay();
    const score = (userId * 37) % 55 + 12;
    return {
      risk_score: score,
      risk_level: score < 35 ? 'LOW' : score < 60 ? 'MEDIUM' : 'HIGH',
      factors: ['Hesap yaÅŸÄ±', 'Ä°ÅŸlem geÃ§miÅŸi', 'Åikayet sayÄ±sÄ±'],
    };
  },
};

// â”€â”€ REPUTATION / BADGES / ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const mockReputation = {
  getFor: async (providerId?: number): Promise<ReputationScore> => {
    await delay();
    const p = providerId ? dbGetters.providerById(providerId) : dbGetters.providerByUserId(getCurrentUserId());
    if (!p) fail('Uzman profili bulunamadÄ±');
    const ratingScore = (p.rating / 5) * 40;
    const completionScore = Math.min(25, (p.completed_jobs / 20) * 2.5);
    const verificationWeights: Record<string, number> = { NONE: 0, BASIC: 7, ID: 13, PROFESSIONAL: 18, BUSINESS: 25 };
    const verificationScore = verificationWeights[p.verification_level] ?? 0;
    const responseScore = 15;
    const repeatScore = 10;
    const score = Math.round(ratingScore + completionScore + verificationScore + responseScore + repeatScore);
    return {
      score,
      label: score >= 85 ? 'MÃ¼kemmel' : score >= 70 ? 'Ã‡ok Ä°yi' : score >= 50 ? 'Ä°yi' : 'Yeni BaÅŸlayan',
      breakdown: {
        rating_score: Math.round(ratingScore),
        completion_score: Math.round(completionScore),
        verification_score: Math.round(verificationScore),
        response_score: responseScore,
        repeat_score: repeatScore,
      },
      metrics: {
        avg_rating: p.rating,
        review_count: p.review_count,
        completed_jobs: p.completed_jobs,
        response_time_minutes: 240,
        verification_status: p.verification_level,
        recent_review_count: 6,
        recent_avg_rating: 4.9,
      },
    };
  },
  getProviderReputation: (id: number) => mockReputation.getFor(id),
  getMyReputation: () => mockReputation.getFor(undefined),
};

export const mockBadges = {
  getFor: async (providerId?: number): Promise<{ badges: Badge[] }> => {
    await delay();
    const p = providerId ? dbGetters.providerById(providerId) : dbGetters.providerByUserId(getCurrentUserId());
    if (!p) return { badges: [] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defs: any[] = [
      { id: 'verified', label: 'DoÄŸrulanmÄ±ÅŸ Uzman', icon: 'ğŸ›¡ï¸', description: 'Kimlik/doÄŸrulama sÃ¼recini tamamladÄ±', color: 'blue', test: p.verification_level !== 'NONE' },
      { id: 'top-rated', label: 'YÃ¼ksek PuanlÄ±', icon: 'â­', description: '4.5 Ã¼zeri ortalama puan', color: 'yellow', test: p.rating >= 4.5 },
      { id: 'experienced', label: 'Deneyimli', icon: 'ğŸ…', description: '100+ tamamlanmÄ±ÅŸ iÅŸ', color: 'green', test: p.completed_jobs >= 100 },
      { id: 'veteran', label: 'KÄ±demli', icon: 'ğŸ–ï¸', description: '10+ yÄ±l deneyim', color: 'purple', test: p.years_experience >= 10 },
      { id: 'popular', label: 'PopÃ¼ler', icon: 'ğŸ”¥', description: '50+ deÄŸerlendirme', color: 'red', test: p.review_count >= 50 },
    ];
    return { badges: defs.map(({ test, ...b }) => ({ ...b, earned: test })) };
  },
  getProviderBadges: (id: number) => mockBadges.getFor(id),
  getMyBadges: () => mockBadges.getFor(undefined),
};

export const mockAnalytics = {
  getMyAnalytics: async (): Promise<ProviderAnalytics> => {
    await delay();
    return providerAnalytics as ProviderAnalytics;
  },
};

// â”€â”€ ADS (Ä°lanlar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toAdListItem = (ad: any): AdListItem => ({
  id: ad.id,
  title: ad.title,
  price: ad.price,
  currency: 'TRY',
  price_type: ad.price_type as AdListItem['price_type'],
  status: ad.status as AdListItem['status'],
  condition: ad.condition as AdListItem['condition'],
  is_featured: !!ad.is_featured,
  view_count: ad.view_count,
  favorite_count: ad.favorite_count,
  cover_image: ad.images.find((i: { is_cover?: boolean }) => i.is_cover)?.url || ad.images[0]?.url || null,
  image_count: ad.images.length,
  city_name: ad.city_name,
  district_name: ad.district_name,
  category_name: adCategories.find(c => c.id === ad.category_id)?.name ?? null,
  category_slug: adCategories.find(c => c.id === ad.category_id)?.slug ?? null,
  published_at: ad.published_at ?? null,
  created_at: ad.created_at ?? null,
});

const toAdDetail = (ad: any): AdDetail => ({
  ...toAdListItem(ad),
  description: ad.description,
  contact_count: 3,
  expires_at: null,
  city_id: ad.city_id ?? null,
  district_id: ad.district_id ?? null,
  images: ad.images.map((i: Record<string, unknown>) => ({ ...i, sort_order: 0 })),
  attributes: ad.attributes,
  category: adCategories.find(c => c.id === ad.category_id) as unknown as AdCategory ?? null,
  seller: (() => {
    const u = dbGetters.userById(ad.seller_id);
    if (!u) return null;
    return {
      id: u.id, first_name: u.first_name, last_name: u.last_name,
      business_name: '', avatar: u.avatar_url, rating: 4.5, review_count: 12,
      phone_verified: true, email_verified: true, active_ad_count: 2, provider_id: null,
    };
  })(),
  is_favorite: false,
  seller_phone: '+90 5xx xxx xx xx',
});

export const mockAds = {
  list: async (filters: AdFilters): Promise<AdListResponse> => {
    await delay();
    let list = ads.filter(a => a.status === 'ACTIVE' || a.status === 'SOLD');
    if (filters.q) {
      const q = filters.q.toLocaleLowerCase('tr');
      list = list.filter(a => a.title.toLocaleLowerCase('tr').includes(q) || a.description?.toLocaleLowerCase('tr').includes(q));
    }
    if (filters.category) {
      const cat = adCategories.find(c => c.slug === filters.category);
      if (cat) {
        const childIds = adCategories.filter(c => c.parent_id === cat.id).map(c => c.id);
        list = list.filter(a => a.category_id === cat.id || childIds.includes(a.category_id));
      }
    }
    if (filters.city_id) list = list.filter(a => a.city_id === filters.city_id);
    if (filters.district_id) list = list.filter(a => a.district_id === filters.district_id);
    if (filters.min_price) list = list.filter(a => (a.price || 0) >= filters.min_price!);
    if (filters.max_price) list = list.filter(a => (a.price || 0) <= filters.max_price!);
    if (filters.condition) list = list.filter(a => a.condition === filters.condition);

    switch (filters.sort) {
      case 'oldest': list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)); break;
      case 'price_asc': list.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_desc': list.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      default: list.sort((a, b) => (+new Date(b.published_at || b.created_at)) - (+new Date(a.published_at || a.created_at)));
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 24;
    return buildPaginated(list.map(toAdListItem), page, limit);
  },

  getById: async (id: number): Promise<AdDetail> => {
    await delay();
    const ad = ads.find(a => a.id === id);
    if (!ad) fail('Ä°lan bulunamadÄ±');
    ad.view_count += 1;
    return toAdDetail(ad);
  },

  getCategories: async (): Promise<AdCategory[]> =>
    adCategories.map((c, i) => ({ ...c, sort_order: i })),

  getSimilar: async (id: number): Promise<AdListItem[]> => {
    const ad = ads.find(a => a.id === id);
    if (!ad) return [];
    return ads
      .filter(a => a.id !== id && a.category_id === ad.category_id && a.status === 'ACTIVE')
      .slice(0, 4).map(toAdListItem);
  },

  create: async (data: AdCreatePayload): Promise<AdDetail> => {
    await delay();
    const created = {
      id: nextId('ads'),
      title: data.title,
      price: data.price,
      price_type: data.price_type,
      condition: data.condition,
      status: 'DRAFT',
      category_id: data.category_id,
      city_id: data.city_id,
      district_id: data.district_id,
      city_name: dbGetters.cityById(data.city_id)?.name || '',
      district_name: dbGetters.districtById(data.district_id)?.name || '',
      view_count: 0, favorite_count: 0,
      is_featured: false, is_negotiable: data.is_negotiable,
      seller_id: getCurrentUserId(),
      published_at: undefined,
      created_at: new Date().toISOString(),
      description: data.description || '',
      attributes: data.attributes,
      images: data.images.map((img, i) => ({ id: nextId('adImages'), url: img.url, is_cover: i === 0 })),
    };
    ads.unshift(created);
    return toAdDetail(created);
  },

  update: async (id: number, data: Record<string, unknown>): Promise<AdDetail> => {
    await delay();
    const ad = ads.find(a => a.id === id);
    if (!ad) fail('Ä°lan bulunamadÄ±');
    if (ad.seller_id !== getCurrentUserId()) fail('Sadece kendi ilanlarÄ±nÄ±zÄ± dÃ¼zenleyebilirsiniz');
    Object.assign(ad, data);
    if (Array.isArray(data.attributes)) ad.attributes = data.attributes;
    return toAdDetail(ad);
  },

  delete: async (id: number) => {
    const idx = ads.findIndex(a => a.id === id);
    if (idx < 0) fail('Ä°lan bulunamadÄ±');
    if (ads[idx].seller_id !== getCurrentUserId()) fail('Sadece kendi ilanlarÄ±nÄ±zÄ± silebilirsiniz');
    ads.splice(idx, 1);
    return { message: 'Ä°lan silindi' };
  },

  publish: async (id: number) => {
    await delay();
    const ad = ads.find(a => a.id === id);
    if (!ad) fail('Ä°lan bulunamadÄ±');
    if (ad.seller_id !== getCurrentUserId()) fail('Sadece kendi ilanlarÄ±nÄ±zÄ± yayÄ±nlayabilirsiniz');
    ad.status = 'ACTIVE';
    ad.published_at = new Date().toISOString();
    return { message: 'Ä°lan yayÄ±nlandÄ±', status: ad.status };
  },

  pause: async (id: number) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) fail('Ä°lan bulunamadÄ±');
    ad.status = 'PAUSED';
    return { message: 'Ä°lan pasife alÄ±ndÄ±', status: ad.status };
  },

  markSold: async (id: number) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) fail('Ä°lan bulunamadÄ±');
    ad.status = 'SOLD';
    return { message: 'Ä°lan satÄ±ldÄ± olarak iÅŸaretlendi', status: ad.status };
  },

  getMyListings: async (status?: string): Promise<AdListResponse> => {
    await delay();
    const mine = ads
      .filter(a => a.seller_id === getCurrentUserId())
      .filter(a => !status || a.status === status)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return buildPaginated(mine.map(toAdListItem), 1, 50);
  },

  getMyFavorites: async (): Promise<AdListItem[]> => [],

  toggleFavorite: async (id: number) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) fail('Ä°lan bulunamadÄ±');
    ad.favorite_count += 1;
    return { is_favorite: true, message: 'Favorilere eklendi' };
  },

  contactSeller: async (id: number) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) fail('Ä°lan bulunamadÄ±');
    return { conversation_id: null, message: 'SatÄ±cÄ± bilgilendirildi (demo)', contact_count: 1 };
  },

  report: async (id: number, reason: string, description?: string) => {
    adReports.push({ id: nextId('adReports'), ad_id: id, reason, description, created_at: new Date().toISOString() });
    return { message: 'Bildiriminiz alÄ±ndÄ±. TeÅŸekkÃ¼rler.' };
  },
};

