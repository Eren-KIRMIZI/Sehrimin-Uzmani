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
  AIAnalysis, AIMatchExplanation, ReputationScore, Badge, ProviderAnalytics
} from '../types';

// ===== AUTH =====
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthTokens>('/auth/register', data).then(r => r.data),

  login: (data: LoginRequest) =>
    api.post<AuthTokens | { requires_2fa: true; temp_token: string }>('/auth/login', data).then(r => r.data),

  login2fa: (temp_token: string, code: string) =>
    api.post<AuthTokens>('/auth/login/2fa', { temp_token, code }).then(r => r.data),

  refresh: (refresh_token: string) =>
    api.post<AuthTokens>('/auth/refresh', { refresh_token }).then(r => r.data),

  me: () => api.get<User>('/auth/me').then(r => r.data),

  logout: () => api.post('/auth/logout').then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }).then(r => r.data),

  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }).then(r => r.data),

  enable2fa: () => api.post<{ qr_uri: string }>('/auth/2fa/enable').then(r => r.data),
  verify2fa: (code: string) => api.post('/auth/2fa/verify', { code }).then(r => r.data),
  disable2fa: (password: string) => api.post('/auth/2fa/disable', { password }).then(r => r.data),
};

// ===== USERS =====
export const usersApi = {
  getMe: () => api.get<User>('/users/me').then(r => r.data),
  updateMe: (data: Partial<User>) => api.patch<User>('/users/me', data).then(r => r.data),
  deleteMe: () => api.delete('/users/me').then(r => r.data),
};

// ===== PROVIDERS =====
export const providersApi = {
  createProfile: (data: Partial<ProviderProfile>) =>
    api.post<ProviderProfile>('/providers/profile', data).then(r => r.data),

  getMe: () => api.get<ProviderProfile>('/providers/me').then(r => r.data),

  updateMe: (data: Partial<ProviderProfile>) =>
    api.patch<ProviderProfile>('/providers/me', data).then(r => r.data),

  getById: (id: number) =>
    api.get<ProviderProfile>(`/providers/${id}`).then(r => r.data),

  addService: (data: { service_id: number; starting_price?: number; description?: string }) =>
    api.post('/providers/services', data).then(r => r.data),

  addPortfolio: (data: { image_url: string; title?: string; description?: string }) =>
    api.post('/providers/portfolio', data).then(r => r.data),

  addLocation: (data: { city_id: number; district_id?: number }) =>
    api.post('/providers/locations', data).then(r => r.data),

  addAvailability: (data: { day_of_week: number; start_time: string; end_time: string }) =>
    api.post('/providers/availability', data).then(r => r.data),
};

// ===== CATEGORIES =====
export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories').then(r => r.data),
  getBySlug: (slug: string) => api.get<Category>(`/categories/${slug}`).then(r => r.data),
  getServices: (slug: string) => api.get(`/categories/${slug}/services`).then(r => r.data),
};

// ===== LOCATIONS =====
export const locationsApi = {
  getCities: () => api.get<City[]>('/locations/cities').then(r => r.data),
  getDistricts: (cityId: number) =>
    api.get<District[]>(`/locations/cities/${cityId}/districts`).then(r => r.data),
};

// ===== SEARCH =====
export const searchApi = {
  searchProviders: (filters: SearchFilters) =>
    api.get<SearchResult>('/search/providers', { params: filters }).then(r => r.data),

  autocomplete: (q: string) =>
    api.get('/search/autocomplete', { params: { q } }).then(r => r.data),

  detect: (text: string) =>
    api.post<DetectResult>('/search/detect', { text }).then(r => r.data),
};

// ===== MATCHING =====
export const matchingApi = {
  find: (data: object) => api.post('/matching/find', data).then(r => r.data),
  ai: (data: object) => api.post('/matching/ai', data).then(r => r.data),
  recommendations: () => api.get('/matching/recommendations').then(r => r.data),
};

// ===== REQUESTS =====
export const requestsApi = {
  create: (data: Partial<ServiceRequest>) =>
    api.post<ServiceRequest>('/requests', data).then(r => r.data),

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<ServiceRequest>>('/requests', { params }).then(r => r.data),

  getById: (id: number) =>
    api.get<ServiceRequest>(`/requests/${id}`).then(r => r.data),

  update: (id: number, data: Partial<ServiceRequest>) =>
    api.patch<ServiceRequest>(`/requests/${id}`, data).then(r => r.data),

  delete: (id: number) => api.delete(`/requests/${id}`).then(r => r.data),
};

// ===== QUOTES =====
export const quotesApi = {
  sendQuote: (requestId: number, data: Partial<Quote>) =>
    api.post<Quote>(`/quotes/requests/${requestId}`, data).then(r => r.data),

  getForRequest: (requestId: number) =>
    api.get<Quote[]>(`/quotes/requests/${requestId}`).then(r => r.data),

  accept: (id: number) => api.post(`/quotes/${id}/accept`).then(r => r.data),
  reject: (id: number) => api.post(`/quotes/${id}/reject`).then(r => r.data),

  getMy: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Quote>>('/quotes/my', { params }).then(r => r.data),
};

// ===== APPOINTMENTS =====
export const appointmentsApi = {
  create: (data: Partial<Appointment>) =>
    api.post<Appointment>('/appointments', data).then(r => r.data),

  getAll: (params?: object) =>
    api.get<PaginatedResponse<Appointment>>('/appointments', { params }).then(r => r.data),

  getById: (id: number) =>
    api.get<Appointment>(`/appointments/${id}`).then(r => r.data),

  update: (id: number, data: Partial<Appointment>) =>
    api.patch<Appointment>(`/appointments/${id}`, data).then(r => r.data),

  complete: (id: number) => api.post(`/appointments/${id}/complete`).then(r => r.data),
  cancel: (id: number) => api.post(`/appointments/${id}/cancel`).then(r => r.data),

  getAvailableSlots: (provider_id: number, date: string) =>
    api.get<{ date: string; provider_id: number; total_slots: number; slots: { start: string; end: string; available: boolean; }[] }>('/appointments/available-slots', { params: { provider_id, date } }).then(r => r.data),
};

// ===== REVIEWS =====
export const reviewsApi = {
  create: (data: Partial<Review>) =>
    api.post<Review>('/reviews', data).then(r => r.data),

  getForProvider: (providerId: number, params?: { page?: number }) =>
    api.get<PaginatedResponse<Review>>(`/reviews/provider/${providerId}`, { params }).then(r => r.data),

  reply: (reviewId: number, reply: string) =>
    api.post(`/reviews/${reviewId}/reply`, { reply }).then(r => r.data),
};

// ===== FAVORITES =====
export const favoritesApi = {
  toggle: (providerId: number) =>
    api.post(`/favorites/${providerId}`).then(r => r.data),

  getAll: () => api.get('/favorites').then(r => r.data),
  remove: (providerId: number) => api.delete(`/favorites/${providerId}`).then(r => r.data),
};

// ===== NOTIFICATIONS =====
export const notificationsApi = {
  getAll: () => api.get<Notification[]>('/notifications').then(r => r.data),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then(r => r.data),
  markRead: (id: number) => api.post(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.post('/notifications/read-all').then(r => r.data),
};

// ===== MESSAGING =====
export const messagingApi = {
  createConversation: (provider_id: number) =>
    api.post<Conversation>('/messaging/conversations', { provider_id }).then(r => r.data),

  getConversations: (params?: { page?: number }) =>
    api.get<PaginatedResponse<Conversation>>('/messaging/conversations', { params }).then(r => r.data),

  getMessages: (conversationId: number, params?: { page?: number }) =>
    api.get<PaginatedResponse<Message>>(`/messaging/conversations/${conversationId}/messages`, { params }).then(r => r.data),

  sendMessage: (conversationId: number, content: string, message_type = 'TEXT') =>
    api.post<Message>(`/messaging/conversations/${conversationId}/messages`, { content, message_type }).then(r => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/messaging/unread-count').then(r => r.data),
};

// ===== COMMISSIONS =====
export const commissionsApi = {
  getEarnings: () => api.get<EarningsSummary>('/commissions/earnings').then(r => r.data),
  getTransactions: (params?: { page?: number }) =>
    api.get<PaginatedResponse<Transaction>>('/commissions/transactions', { params }).then(r => r.data),
  getEarningsHistory: (params?: { page?: number }) =>
    api.get('/commissions/earnings/history', { params }).then(r => r.data),
  requestPayout: (data: { amount: number; iban: string; bank_name: string }) =>
    api.post<PayoutRequest>('/commissions/payout/request', data).then(r => r.data),
  getMyPayouts: () =>
    api.get<PayoutRequest[]>('/commissions/payout/my').then(r => r.data),
};

// ===== SUBSCRIPTIONS =====
export const subscriptionsApi = {
  getPlans: () => api.get<SubscriptionPlan[]>('/subscriptions/plans').then(r => r.data),
  subscribe: (plan_id: number, interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY') =>
    api.post('/subscriptions/subscribe', { plan_id, interval }).then(r => r.data),
  getMy: () => api.get<ProviderSubscription>('/subscriptions/my').then(r => r.data),
  cancel: () => api.post('/subscriptions/cancel').then(r => r.data),
  getPayments: () => api.get('/subscriptions/payments').then(r => r.data),
};

// ===== PROMOTIONS =====
export const promotionsApi = {
  create: (data: Partial<Promotion>) =>
    api.post<Promotion>('/promotions', data).then(r => r.data),
  getMy: () => api.get<Promotion[]>('/promotions/my').then(r => r.data),
  getFeatured: (params?: { category?: string; city_id?: number }) =>
    api.get('/promotions/featured', { params }).then(r => r.data),
  pause: (id: number) => api.post(`/promotions/${id}/pause`).then(r => r.data),
  resume: (id: number) => api.post(`/promotions/${id}/resume`).then(r => r.data),
  cancel: (id: number) => api.post(`/promotions/${id}/cancel`).then(r => r.data),
  updateBid: (id: number, bid_amount: number) =>
    api.post(`/promotions/${id}/bid`, { bid_amount }).then(r => r.data),
};

// ===== DISPUTES =====
export const disputesApi = {
  create: (data: { reported_id: number; reason: string; description: string }) =>
    api.post<Dispute>('/disputes', data).then(r => r.data),
  getMy: (params?: { page?: number }) =>
    api.get<PaginatedResponse<Dispute>>('/disputes', { params }).then(r => r.data),
  getById: (id: number) => api.get<Dispute>(`/disputes/${id}`).then(r => r.data),
  addMessage: (id: number, message: string) =>
    api.post<DisputeMessage>(`/disputes/${id}/messages`, { message }).then(r => r.data),
  close: (id: number) => api.post(`/disputes/${id}/close`).then(r => r.data),
};

// ===== ADMIN =====
export const adminApi = {
  getDashboard: () => api.get<AdminDashboard>('/admin/dashboard').then(r => r.data),
  getUsers: (params?: object) => api.get('/admin/users', { params }).then(r => r.data),
  updateUser: (id: number, data: object) => api.patch(`/admin/users/${id}`, data).then(r => r.data),
  getProviders: (params?: object) => api.get('/admin/providers', { params }).then(r => r.data),
  verifyProvider: (id: number) => api.patch(`/admin/providers/${id}/verify`).then(r => r.data),
  getRequests: (params?: object) => api.get('/admin/requests', { params }).then(r => r.data),
  getReviews: (params?: object) => api.get('/admin/reviews', { params }).then(r => r.data),
  getAuditLogs: (params?: object) => api.get('/admin/audit-logs', { params }).then(r => r.data),
  getPayouts: (params?: object) => api.get('/admin/payouts', { params }).then(r => r.data),
  getDisputes: (params?: object) => api.get('/admin/disputes', { params }).then(r => r.data),
  getFraudRisk: (userId: number) => api.get(`/admin/users/${userId}/fraud-risk`).then(r => r.data),
};

// ===== AI =====
export const aiApi = {
  analyzeRequest: (text: string) => api.post<AIAnalysis>('/ai/analyze-request', { text }).then(r => r.data),
  explainMatch: (data: any) => api.post<AIMatchExplanation>('/ai/match-explanation', data).then(r => r.data),
};

// ===== REPUTATION =====
export const reputationApi = {
  getProviderReputation: (id: number) => api.get<ReputationScore>(`/providers/${id}/reputation`).then(r => r.data),
  getMyReputation: () => api.get<ReputationScore>('/providers/me/reputation').then(r => r.data),
};

// ===== BADGES =====
export const badgesApi = {
  getProviderBadges: (id: number) => api.get<{ badges: Badge[] }>(`/providers/${id}/badges`).then(r => r.data),
  getMyBadges: () => api.get<{ badges: Badge[] }>('/providers/me/badges').then(r => r.data),
};

// ===== ANALYTICS =====
export const analyticsApi = {
  getMyAnalytics: () => api.get<ProviderAnalytics>('/providers/me/analytics').then(r => r.data),
};

