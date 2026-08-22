import api from './api';
import type {
  User, AuthTokens, LoginRequest, RegisterRequest,
  ProviderProfile, ProviderSubscription,
  Category, City, District,
  SearchFilters, SearchResult,
  ServiceRequest, Quote, Appointment, Review,
  Notification, Conversation, Message,
  EarningsSummary, Transaction, PayoutRequest,
  SubscriptionPlan, Promotion, Dispute, DisputeMessage,
  AdminDashboard, PaginatedResponse, DetectResult,
  AIAnalysis, AIMatchExplanation, ReputationScore, Badge, ProviderAnalytics,
  ProviderVerification
} from '../types';
import {
  withMock, mockAuth, mockUsers, mockProviders, mockCategories, mockLocations,
  mockSearch, mockMatching, mockRequests, mockQuotes, mockAppointments,
  mockReviews, mockFavorites, mockNotifications, mockMessaging,
  mockCommissions, mockSubscriptions, mockPromotions, mockDisputes,
  mockAdmin, mockVerification, mockAi, mockReputation, mockBadges, mockAnalytics,
} from '../mocks/handlers';

export { adsApi } from './ads';

// ===== AUTH =====
export const authApi = {
  register: (data: RegisterRequest) =>
    withMock(
      () => api.post<AuthTokens>('/auth/register', data).then(r => r.data),
      () => mockAuth.register(data)
    ),

  login: (data: LoginRequest) =>
    withMock(
      () => api.post<AuthTokens | { requires_2fa: true; temp_token: string }>('/auth/login', data).then(r => r.data),
      () => mockAuth.login(data)
    ),

  login2fa: (temp_token: string, code: string) =>
    withMock(
      () => api.post<AuthTokens>('/auth/login/2fa', { temp_token, code }).then(r => r.data),
      async () => { throw new Error('2FA yalnızca gerçek backend ile çalışır'); }
    ),

  refresh: (refresh_token: string) =>
    withMock(
      () => api.post<AuthTokens>('/auth/refresh', { refresh_token }).then(r => r.data),
      () => mockAuth.refresh(refresh_token)
    ),

  me: () =>
    withMock(
      () => api.get<User>('/auth/me').then(r => r.data),
      () => mockAuth.me()
    ),

  logout: () =>
    withMock(
      () => api.post('/auth/logout').then(r => r.data),
      () => mockAuth.logout()
    ),

  forgotPassword: (email: string) =>
    withMock(
      () => api.post('/auth/forgot-password', { email }).then(r => r.data),
      () => mockAuth.forgotPassword(email)
    ),

  resetPassword: (token: string, new_password: string) =>
    withMock(
      () => api.post('/auth/reset-password', { token, new_password }).then(r => r.data),
      () => mockAuth.resetPassword()
    ),

  changePassword: (current_password: string, new_password: string) =>
    withMock(
      () => api.post('/auth/change-password', { current_password, new_password }).then(r => r.data),
      () => mockAuth.changePassword()
    ),

  enable2fa: () =>
    withMock(
      () => api.post<{ qr_uri: string }>('/auth/2fa/enable').then(r => r.data),
      () => mockAuth.enable2fa()
    ),
  verify2fa: (code: string) =>
    withMock(
      () => api.post('/auth/2fa/verify', { code }).then(r => r.data),
      () => mockAuth.verify2fa(code)
    ),
  disable2fa: (password: string) =>
    withMock(
      () => api.post('/auth/2fa/disable', { password }).then(r => r.data),
      () => mockAuth.disable2fa()
    ),
};

// ===== USERS =====
export const usersApi = {
  getMe: () =>
    withMock(() => api.get<User>('/users/me').then(r => r.data), () => mockUsers.getMe()),
  updateMe: (data: Partial<User>) =>
    withMock(() => api.patch<User>('/users/me', data).then(r => r.data), () => mockUsers.updateMe(data)),
  deleteMe: () =>
    withMock(() => api.delete('/users/me').then(r => r.data), () => mockUsers.deleteMe()),
};

// ===== PROVIDERS =====
export const providersApi = {
  createProfile: (data: Partial<ProviderProfile>) =>
    withMock(
      () => api.post<ProviderProfile>('/providers/profile', data).then(r => r.data),
      () => mockProviders.createProfile(data)
    ),

  getMe: () =>
    withMock(() => api.get<ProviderProfile>('/providers/me').then(r => r.data), () => mockProviders.getMe()),

  updateMe: (data: Partial<ProviderProfile>) =>
    withMock(
      () => api.patch<ProviderProfile>('/providers/me', data).then(r => r.data),
      () => mockProviders.updateMe(data)
    ),

  getById: (id: number) =>
    withMock(
      () => api.get<ProviderProfile>(`/providers/${id}`).then(r => r.data),
      () => mockProviders.getById(id)
    ),

  addService: (data: { service_id: number; starting_price?: number; description?: string }) =>
    withMock(() => api.post('/providers/services', data).then(r => r.data), () => mockProviders.addService(data)),

  addPortfolio: (data: { image_url: string; title?: string; description?: string }) =>
    withMock(() => api.post('/providers/portfolio', data).then(r => r.data), () => mockProviders.addPortfolio(data)),

  addLocation: (data: { city_id: number; district_id?: number }) =>
    withMock(() => api.post('/providers/locations', data).then(r => r.data), () => mockProviders.addLocation(data)),

  addAvailability: (data: { day_of_week: number; start_time: string; end_time: string }) =>
    withMock(() => api.post('/providers/availability', data).then(r => r.data), () => mockProviders.addAvailability(data)),
};

// ===== CATEGORIES =====
export const categoriesApi = {
  getAll: () =>
    withMock(() => api.get<Category[]>('/categories').then(r => r.data), () => mockCategories.getAll()),
  getBySlug: (slug: string) =>
    withMock(() => api.get<Category>(`/categories/${slug}`).then(r => r.data), () => mockCategories.getBySlug(slug)),
  getServices: (slug: string) =>
    withMock(() => api.get(`/categories/${slug}/services`).then(r => r.data), () => mockCategories.getServices(slug)),
};

// ===== LOCATIONS =====
export const locationsApi = {
  getCities: () =>
    withMock(() => api.get<City[]>('/locations/cities').then(r => r.data), () => mockLocations.getCities()),
  getDistricts: (cityId: number) =>
    withMock(
      () => api.get<District[]>(`/locations/cities/${cityId}/districts`).then(r => r.data),
      () => mockLocations.getDistricts(cityId)
    ),
};

// ===== SEARCH =====
export const searchApi = {
  searchProviders: (filters: SearchFilters) =>
    withMock(
      () => api.get<SearchResult>('/search/providers', { params: filters }).then(r => r.data),
      () => mockSearch.searchProviders(filters)
    ),

  autocomplete: (q: string) =>
    withMock(
      () => api.get('/search/autocomplete', { params: { q } }).then(r => r.data),
      () => mockSearch.autocomplete(q)
    ),

  detect: (text: string) =>
    withMock(
      () => api.post<DetectResult>('/search/detect', { text }).then(r => r.data),
      () => mockSearch.detect(text)
    ),
};

// ===== MATCHING =====
export const matchingApi = {
  find: (data: object) =>
    withMock(() => api.post('/matching/find', data).then(r => r.data), () => mockMatching.find(data)),
  ai: (data: object) =>
    withMock(() => api.post('/matching/ai', data).then(r => r.data), () => mockMatching.ai(data)),
  recommendations: () =>
    withMock(() => api.get('/matching/recommendations').then(r => r.data), () => mockMatching.recommendations()),
};

// ===== REQUESTS =====
// Not: Backend'te liste endpoint'i /requests/my'dir; oluşturma POST /requests/'tir.
export const requestsApi = {
  create: (data: Partial<ServiceRequest>) =>
    withMock(
      () => api.post<ServiceRequest>('/requests/', data).then(r => r.data),
      () => mockRequests.create(data)
    ),

  getAll: (params?: { page?: number; limit?: number }) =>
    withMock(
      () => api.get<PaginatedResponse<ServiceRequest>>('/requests/my', { params }).then(r => r.data),
      () => mockRequests.getAll(params)
    ),

  getById: (id: number) =>
    withMock(
      () => api.get<ServiceRequest>(`/requests/${id}`).then(r => r.data),
      () => mockRequests.getById(id)
    ),

  update: (id: number, data: Partial<ServiceRequest>) =>
    withMock(
      () => api.patch<ServiceRequest>(`/requests/${id}`, data).then(r => r.data),
      () => mockRequests.update(id, data)
    ),

  delete: (id: number) =>
    withMock(() => api.delete(`/requests/${id}`).then(r => r.data), () => mockRequests.delete(id)),
};

// ===== QUOTES =====
// Backend akışı: taslak oluştur → kalem ekle → gönder. GET endpoint'leri yoktur (mock'a düşer).
export const quotesApi = {
  sendQuote: (requestId: number, providerId: number, data: Partial<Quote>) =>
    withMock(
      () => api.post<Quote>(`/quotes/request/${requestId}/provider/${providerId}`, data).then(r => r.data),
      () => mockQuotes.sendQuote(requestId, data)
    ),

  addItem: (quoteId: number, item: { name: string; price: number; type?: string; quantity?: number }) =>
    withMock(
      () => api.post(`/quotes/${quoteId}/items`, item).then(r => r.data),
      () => ({ message: 'Kalem eklendi' })
    ),

  submit: (quoteId: number) =>
    withMock(
      () => api.post(`/quotes/${quoteId}/submit`).then(r => r.data),
      () => ({ message: 'Teklif gönderildi' })
    ),

  revise: (quoteId: number, data: Partial<Quote>) =>
    withMock(
      () => api.post(`/quotes/${quoteId}/revise`, data).then(r => r.data),
      () => mockQuotes.revise(quoteId, data)
    ),

  accept: (id: number) =>
    withMock(
      () => api.post(`/quotes/${id}/accept`).then(r => r.data),
      () => mockQuotes.accept(id)
    ),

  reject: (id: number) =>
    withMock(
      () => api.post(`/quotes/${id}/reject`).then(r => r.data),
      () => mockQuotes.reject(id)
    ),

  getForRequest: (requestId: number) =>
    withMock(
      () => api.get<Quote[]>(`/quotes/requests/${requestId}`).then(r => r.data),
      () => mockQuotes.getForRequest(requestId)
    ),

  getMy: (params?: { page?: number; limit?: number }) =>
    withMock(
      () => api.get<PaginatedResponse<Quote>>('/quotes/my', { params }).then(r => r.data),
      () => mockQuotes.getMy(params)
    ),
};

// ===== APPOINTMENTS =====
// Backend'te liste/oluşturma endpoint'i yoktur; detay + yaşam döngüsü aksiyonları vardır.
export const appointmentsApi = {
  create: (data: Partial<Appointment>) =>
    withMock(
      () => api.post<Appointment>('/appointments', data).then(r => r.data),
      () => mockAppointments.create(data)
    ),

  getAll: (params?: object) =>
    withMock(
      () => api.get<PaginatedResponse<Appointment>>('/appointments', { params }).then(r => r.data),
      () => mockAppointments.getAll(params)
    ),

  getById: (id: number) =>
    withMock(
      () => api.get<Appointment>(`/appointments/${id}`).then(r => r.data),
      () => mockAppointments.getById(id)
    ),

  update: (id: number, data: Partial<Appointment>) =>
    withMock(
      () => api.patch<Appointment>(`/appointments/${id}`, data).then(r => r.data),
      () => mockAppointments.update(id, data)
    ),

  confirm: (id: number) =>
    withMock(
      () => api.post(`/appointments/${id}/confirm`).then(r => r.data),
      () => mockAppointments.confirm(id)
    ),

  start: (id: number) =>
    withMock(
      () => api.post(`/appointments/${id}/start`).then(r => r.data),
      () => mockAppointments.start(id)
    ),

  complete: (id: number) =>
    withMock(
      () => api.post(`/appointments/${id}/complete`).then(r => r.data),
      () => mockAppointments.complete(id)
    ),

  cancel: (id: number) =>
    withMock(
      () => api.post(`/appointments/${id}/cancel`).then(r => r.data),
      () => mockAppointments.cancel(id)
    ),

  noShow: (id: number) =>
    withMock(
      () => api.post(`/appointments/${id}/no-show`).then(r => r.data),
      () => mockAppointments.noShow(id)
    ),

  getAvailableSlots: (provider_id: number, date: string) =>
    withMock(
      () => api.get<{ date: string; provider_id: number; total_slots: number; slots: { start: string; end: string; available: boolean; }[] }>('/appointments/available-slots', { params: { provider_id, date } }).then(r => r.data),
      () => mockAppointments.getAvailableSlots(provider_id, date)
    ),
};

// ===== REVIEWS =====
export const reviewsApi = {
  create: (data: Partial<Review>) =>
    withMock(() => api.post<Review>('/reviews/', data).then(r => r.data), () => mockReviews.create(data)),

  getForProvider: (providerId: number, params?: { page?: number }) =>
    withMock(
      () => api.get<PaginatedResponse<Review>>(`/reviews/provider/${providerId}`, { params }).then(r => r.data),
      () => mockReviews.getForProvider(providerId, params)
    ),

  reply: (reviewId: number, reply: string) =>
    withMock(
      () => api.post(`/reviews/${reviewId}/reply`, { reply }).then(r => r.data),
      () => mockReviews.reply(reviewId, reply)
    ),
};

// ===== FAVORITES =====
export const favoritesApi = {
  toggle: (providerId: number) =>
    withMock(() => api.post(`/favorites/${providerId}`).then(r => r.data), () => mockFavorites.toggle(providerId)),

  getAll: () =>
    withMock(() => api.get('/favorites').then(r => r.data), () => mockFavorites.getAll()),

  remove: (providerId: number) =>
    withMock(() => api.delete(`/favorites/${providerId}`).then(r => r.data), () => mockFavorites.remove(providerId)),
};

// ===== NOTIFICATIONS =====
export const notificationsApi = {
  getAll: () =>
    withMock(() => api.get<Notification[]>('/notifications').then(r => r.data), () => mockNotifications.getAll()),
  getUnreadCount: () =>
    withMock(
      () => api.get<{ count: number }>('/notifications/unread-count').then(r => r.data),
      () => mockNotifications.getUnreadCount()
    ),
  markRead: (id: number) =>
    withMock(() => api.post(`/notifications/${id}/read`).then(r => r.data), () => mockNotifications.markRead(id)),
  markAllRead: () =>
    withMock(() => api.post('/notifications/read-all').then(r => r.data), () => mockNotifications.markAllRead()),
};

// ===== MESSAGING =====
export const messagingApi = {
  createConversation: (provider_id: number) =>
    withMock(
      () => api.post<Conversation>('/messaging/conversations', { provider_id }).then(r => r.data),
      () => mockMessaging.createConversation(provider_id)
    ),

  getConversations: (params?: { page?: number }) =>
    withMock(
      () => api.get<PaginatedResponse<Conversation>>('/messaging/conversations', { params }).then(r => r.data),
      () => mockMessaging.getConversations(params)
    ),

  getMessages: (conversationId: number, params?: { page?: number }) =>
    withMock(
      () => api.get<PaginatedResponse<Message>>(`/messaging/conversations/${conversationId}/messages`, { params }).then(r => r.data),
      () => mockMessaging.getMessages(conversationId, params)
    ),

  sendMessage: (conversationId: number, content: string, message_type = 'TEXT') =>
    withMock(
      () => api.post<Message>(`/messaging/conversations/${conversationId}/messages`, { content, message_type }).then(r => r.data),
      () => mockMessaging.sendMessage(conversationId, content, message_type)
    ),

  getUnreadCount: () =>
    withMock(
      () => api.get<{ count: number }>('/messaging/unread-count').then(r => r.data),
      () => mockMessaging.getUnreadCount()
    ),
};

// ===== COMMISSIONS =====
export const commissionsApi = {
  getEarnings: () =>
    withMock(() => api.get<EarningsSummary>('/commissions/earnings').then(r => r.data), () => mockCommissions.getEarnings()),
  getTransactions: (params?: { page?: number }) =>
    withMock(
      () => api.get<PaginatedResponse<Transaction>>('/commissions/transactions', { params }).then(r => r.data),
      () => mockCommissions.getTransactions(params)
    ),
  getEarningsHistory: (params?: { page?: number }) =>
    withMock(
      () => api.get('/commissions/earnings/history', { params }).then(r => r.data),
      () => mockCommissions.getEarningsHistory()
    ),
  requestPayout: (data: { amount: number; iban: string; bank_name: string }) =>
    withMock(
      () => api.post<PayoutRequest>('/commissions/payout/request', data).then(r => r.data),
      () => mockCommissions.requestPayout(data)
    ),
  getMyPayouts: () =>
    withMock(() => api.get<PayoutRequest[]>('/commissions/payout/my').then(r => r.data), () => mockCommissions.getMyPayouts()),
};

// ===== SUBSCRIPTIONS =====
export const subscriptionsApi = {
  getPlans: () =>
    withMock(() => api.get<SubscriptionPlan[]>('/subscriptions/plans').then(r => r.data), () => mockSubscriptions.getPlans()),
  subscribe: (plan_id: number, interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY') =>
    withMock(
      () => api.post('/subscriptions/subscribe', { plan_id, interval }).then(r => r.data),
      () => mockSubscriptions.subscribe(plan_id, interval)
    ),
  getMy: () =>
    withMock(() => api.get<ProviderSubscription>('/subscriptions/my').then(r => r.data), () => mockSubscriptions.getMy()),
  cancel: () =>
    withMock(() => api.post('/subscriptions/cancel').then(r => r.data), () => mockSubscriptions.cancel()),
  getPayments: () =>
    withMock(() => api.get('/subscriptions/payments').then(r => r.data), () => mockSubscriptions.getPayments()),
};

// ===== PROMOTIONS =====
export const promotionsApi = {
  create: (data: Partial<Promotion>) =>
    withMock(() => api.post<Promotion>('/promotions', data).then(r => r.data), () => mockPromotions.create(data)),
  getMy: () =>
    withMock(() => api.get<Promotion[]>('/promotions/my').then(r => r.data), () => mockPromotions.getMy()),
  getFeatured: (params?: { category?: string; city_id?: number }) =>
    withMock(
      () => api.get('/promotions/featured', { params }).then(r => r.data),
      () => mockPromotions.getFeatured()
    ),
  pause: (id: number) =>
    withMock(() => api.post(`/promotions/${id}/pause`).then(r => r.data), () => mockPromotions.pause(id)),
  resume: (id: number) =>
    withMock(() => api.post(`/promotions/${id}/resume`).then(r => r.data), () => mockPromotions.resume(id)),
  cancel: (id: number) =>
    withMock(() => api.post(`/promotions/${id}/cancel`).then(r => r.data), () => mockPromotions.cancel(id)),
  updateBid: (id: number, bid_amount: number) =>
    withMock(
      () => api.post(`/promotions/${id}/bid`, { bid_amount }).then(r => r.data),
      () => mockPromotions.updateBid(id, bid_amount)
    ),
};

// ===== DISPUTES =====
export const disputesApi = {
  create: (data: { reported_id: number; reason: string; description: string }) =>
    withMock(() => api.post<Dispute>('/disputes', data).then(r => r.data), () => mockDisputes.create(data)),
  getMy: (params?: { page?: number }) =>
    withMock(
      () => api.get<PaginatedResponse<Dispute>>('/disputes', { params }).then(r => r.data),
      () => mockDisputes.getMy(params)
    ),
  getById: (id: number) =>
    withMock(() => api.get<Dispute>(`/disputes/${id}`).then(r => r.data), () => mockDisputes.getById(id)),
  addMessage: (id: number, message: string) =>
    withMock(
      () => api.post<DisputeMessage>(`/disputes/${id}/messages`, { message }).then(r => r.data),
      () => mockDisputes.addMessage(id, message)
    ),
  close: (id: number) =>
    withMock(() => api.post(`/disputes/${id}/close`).then(r => r.data), () => mockDisputes.close(id)),
};

// ===== VERIFICATION (Doğrulama) =====
export const verificationApi = {
  apply: (data: { verification_type: 'IDENTITY' | 'PROFESSIONAL' | 'BUSINESS'; document_url?: string; note?: string }) =>
    withMock(
      () => api.post<ProviderVerification>('/verification/apply', data).then(r => r.data),
      () => mockVerification.apply(data) as Promise<ProviderVerification>
    ),
  getMy: () =>
    withMock(
      () => api.get<ProviderVerification[]>('/verification/my').then(r => r.data),
      () => mockVerification.getMy()
    ),
  getPending: () =>
    withMock(
      () => api.get<ProviderVerification[]>('/verification/pending').then(r => r.data),
      () => mockVerification.getPending()
    ),
  approve: (verificationId: number) =>
    withMock(
      () => api.post(`/verification/${verificationId}/approve`).then(r => r.data),
      () => mockVerification.approve(verificationId)
    ),
  reject: (verificationId: number, note?: string) =>
    withMock(
      () => api.post(`/verification/${verificationId}/reject`, { note }).then(r => r.data),
      () => mockVerification.reject(verificationId, note)
    ),
};

// ===== ADMIN =====
export const adminApi = {
  getDashboard: () =>
    withMock(() => api.get<AdminDashboard>('/admin/dashboard').then(r => r.data), () => mockAdmin.getDashboard()),
  getUsers: (params?: object) =>
    withMock(() => api.get('/admin/users', { params }).then(r => r.data), () => mockAdmin.getUsers(params)),
  updateUser: (id: number, data: object) =>
    withMock(() => api.patch(`/admin/users/${id}`, data).then(r => r.data), () => mockAdmin.updateUser(id, data)),
  getProviders: (params?: object) =>
    withMock(() => api.get('/admin/providers', { params }).then(r => r.data), () => mockAdmin.getProviders(params)),
  verifyProvider: (id: number) =>
    withMock(() => api.patch(`/admin/providers/${id}/verify`).then(r => r.data), () => mockAdmin.verifyProvider(id)),
  getRequests: (params?: object) =>
    withMock(() => api.get('/admin/requests', { params }).then(r => r.data), () => mockAdmin.getRequests(params)),
  getReviews: (params?: object) =>
    withMock(() => api.get('/admin/reviews', { params }).then(r => r.data), () => mockAdmin.getReviews(params)),
  getAuditLogs: (params?: object) =>
    withMock(() => api.get('/admin/audit-logs', { params }).then(r => r.data), () => mockAdmin.getAuditLogs(params)),
  getPayouts: (params?: object) =>
    withMock(() => api.get('/admin/payouts', { params }).then(r => r.data), () => mockAdmin.getPayouts(params)),
  getDisputes: (params?: object) =>
    withMock(() => api.get('/admin/disputes', { params }).then(r => r.data), () => mockAdmin.getDisputes(params)),
  getFraudRisk: (userId: number) =>
    withMock(
      () => api.get(`/admin/users/${userId}/fraud-risk`).then(r => r.data),
      () => mockAdmin.getFraudRisk(userId)
    ),
};

// ===== AI =====
export const aiApi = {
  analyzeRequest: (text: string) =>
    withMock(
      () => api.post<AIAnalysis>('/ai/analyze-request', { text }).then(r => r.data),
      () => mockAi.analyzeRequest(text)
    ),
  explainMatch: (data: unknown) =>
    withMock(
      () => api.post<AIMatchExplanation>('/ai/match-explanation', data).then(r => r.data),
      () => mockAi.explainMatch()
    ),
};

// ===== REPUTATION =====
export const reputationApi = {
  getProviderReputation: (id: number) =>
    withMock(
      () => api.get<ReputationScore>(`/providers/${id}/reputation`).then(r => r.data),
      () => mockReputation.getProviderReputation(id)
    ),
  getMyReputation: () =>
    withMock(
      () => api.get<ReputationScore>('/providers/me/reputation').then(r => r.data),
      () => mockReputation.getMyReputation()
    ),
};

// ===== BADGES =====
export const badgesApi = {
  getProviderBadges: (id: number) =>
    withMock(
      () => api.get<{ badges: Badge[] }>(`/providers/${id}/badges`).then(r => r.data),
      () => mockBadges.getProviderBadges(id)
    ),
  getMyBadges: () =>
    withMock(
      () => api.get<{ badges: Badge[] }>('/providers/me/badges').then(r => r.data),
      () => mockBadges.getMyBadges()
    ),
};

// ===== ANALYTICS =====
export const analyticsApi = {
  getMyAnalytics: () =>
    withMock(
      () => api.get<ProviderAnalytics>('/providers/me/analytics').then(r => r.data),
      () => mockAnalytics.getMyAnalytics()
    ),
};
