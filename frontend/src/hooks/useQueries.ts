import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi, providersApi, categoriesApi, locationsApi,
  searchApi, requestsApi, reviewsApi, favoritesApi,
  notificationsApi, messagingApi, commissionsApi,
  subscriptionsApi, promotionsApi, disputesApi, adminApi,
  reputationApi, badgesApi, appointmentsApi, quotesApi,
  verificationApi, usersApi, analyticsApi
} from '../services';
import type { SearchFilters, Review, Quote, Appointment, User } from '../types';

// AUTH
export const useCurrentUser = () =>
  useQuery({ queryKey: ['me'], queryFn: authApi.me, retry: false });

// CATEGORIES
export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll, staleTime: 1000 * 60 * 10 });

export const useCategoryBySlug = (slug: string) =>
  useQuery({ queryKey: ['category', slug], queryFn: () => categoriesApi.getBySlug(slug), enabled: !!slug });

// LOCATIONS
export const useCities = () =>
  useQuery({ queryKey: ['cities'], queryFn: locationsApi.getCities, staleTime: 1000 * 60 * 30 });

export const useDistricts = (cityId?: number) =>
  useQuery({
    queryKey: ['districts', cityId],
    queryFn: () => locationsApi.getDistricts(cityId!),
    enabled: !!cityId,
  });

// SEARCH
export const useSearchProviders = (filters: SearchFilters) =>
  useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchApi.searchProviders(filters),
    enabled: true,
  });

// PROVIDER
export const useProvider = (id?: number) =>
  useQuery({
    queryKey: ['provider', id],
    queryFn: () => providersApi.getById(id!),
    enabled: !!id,
  });

export const useMyProviderProfile = () =>
  useQuery({ queryKey: ['myProvider'], queryFn: providersApi.getMe, retry: false });

// REVIEWS
export const useProviderReviews = (providerId?: number, page = 1) =>
  useQuery({
    queryKey: ['reviews', providerId, page],
    queryFn: () => reviewsApi.getForProvider(providerId!, { page }),
    enabled: !!providerId,
  });

// REQUESTS
export const useMyRequests = (page = 1) =>
  useQuery({ queryKey: ['requests', page], queryFn: () => requestsApi.getAll({ page, limit: 10 }) });

// APPOINTMENTS
export const useAvailableSlots = (providerId?: number, date?: string) =>
  useQuery({
    queryKey: ['availableSlots', providerId, date],
    queryFn: () => appointmentsApi.getAvailableSlots(providerId!, date!),
    enabled: !!providerId && !!date,
  });

// NOTIFICATIONS
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.getAll });

export const useUnreadNotifications = () =>
  useQuery({
    queryKey: ['notificationsUnread'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  });

// CONVERSATIONS
export const useConversations = (page = 1) =>
  useQuery({
    queryKey: ['conversations', page],
    queryFn: () => messagingApi.getConversations({ page }),
  });

export const useMessages = (conversationId?: number, page = 1) =>
  useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: () => messagingApi.getMessages(conversationId!, { page }),
    enabled: !!conversationId,
  });

export const useUnreadMessages = () =>
  useQuery({
    queryKey: ['messagesUnread'],
    queryFn: messagingApi.getUnreadCount,
    refetchInterval: 30000,
  });

// EARNINGS
export const useEarnings = () =>
  useQuery({ queryKey: ['earnings'], queryFn: commissionsApi.getEarnings });

export const useTransactions = (page = 1) =>
  useQuery({
    queryKey: ['transactions', page],
    queryFn: () => commissionsApi.getTransactions({ page }),
  });

// SUBSCRIPTIONS
export const useSubscriptionPlans = () =>
  useQuery({ queryKey: ['plans'], queryFn: subscriptionsApi.getPlans, staleTime: 1000 * 60 * 5 });

export const useMySubscription = () =>
  useQuery({ queryKey: ['mySubscription'], queryFn: subscriptionsApi.getMy, retry: false });

// PROMOTIONS
export const useMyPromotions = () =>
  useQuery({ queryKey: ['myPromotions'], queryFn: promotionsApi.getMy });

// DISPUTES
export const useMyDisputes = (page = 1) =>
  useQuery({
    queryKey: ['disputes', page],
    queryFn: () => disputesApi.getMy({ page }),
  });

export const useDispute = (id?: number) =>
  useQuery({
    queryKey: ['dispute', id],
    queryFn: () => disputesApi.getById(id!),
    enabled: !!id,
  });

// ADMIN
export const useAdminDashboard = () =>
  useQuery({ queryKey: ['adminDashboard'], queryFn: adminApi.getDashboard });

export const useAdminUsers = (page = 1) =>
  useQuery({ queryKey: ['adminUsers', page], queryFn: () => adminApi.getUsers({ page, limit: 20 }) });

export const useAdminDisputes = (page = 1) =>
  useQuery({ queryKey: ['adminDisputes', page], queryFn: () => adminApi.getDisputes({ page, limit: 20 }) });

export const useAdminPayouts = (page = 1) =>
  useQuery({ queryKey: ['adminPayouts', page], queryFn: () => adminApi.getPayouts({ page, limit: 20 }) });

// REPUTATION & BADGES
export const useReputation = (providerId?: number) =>
  useQuery({
    queryKey: ['reputation', providerId],
    queryFn: () => providerId ? reputationApi.getProviderReputation(providerId) : reputationApi.getMyReputation(),
    enabled: true,
  });

export const useBadges = (providerId?: number) =>
  useQuery({
    queryKey: ['badges', providerId],
    queryFn: () => providerId ? badgesApi.getProviderBadges(providerId) : badgesApi.getMyBadges(),
    enabled: true,
  });


// FAVORITES
export const useFavorites = () =>
  useQuery({ queryKey: ['favorites'], queryFn: favoritesApi.getAll });

// RECOMMENDATIONS
export const useRecommendations = () =>
  useQuery({ queryKey: ['recommendations'], queryFn: () => searchApi.searchProviders({ sort: 'recommended', limit: 8 }) });

// MUTATIONS
export const useToggleFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.toggle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notificationsUnread'] });
    },
  });
};

// ===== REQUEST DETAIL & QUOTES =====
export const useRequestDetail = (id?: number) =>
  useQuery({
    queryKey: ['request', id],
    queryFn: () => requestsApi.getById(id!),
    enabled: !!id,
  });

export const useQuotesForRequest = (requestId?: number) =>
  useQuery({
    queryKey: ['quotes', requestId],
    queryFn: () => quotesApi.getForRequest(requestId!),
    enabled: !!requestId,
  });

export const useCreateRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['adminRequests'] });
    },
  });
};

const invalidateQuoteCascades = (qc: ReturnType<typeof useQueryClient>, requestId?: number) => {
  qc.invalidateQueries({ queryKey: ['quotes'] });
  qc.invalidateQueries({ queryKey: ['myQuotes'] });
  if (requestId) {
    qc.invalidateQueries({ queryKey: ['request', requestId] });
    qc.invalidateQueries({ queryKey: ['requests'] });
  }
};

export const useAcceptQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotesApi.accept,
    onSuccess: (_res, quoteId) => {
      // requestId bilinmiyorsa genişçe geçersiz kıl
      void quoteId;
      invalidateQuoteCascades(qc);
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useRejectQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotesApi.reject,
    onSuccess: () => invalidateQuoteCascades(qc),
  });
};

export const useReviseQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Quote> }) => quotesApi.revise(id, data),
    onSuccess: () => invalidateQuoteCascades(qc),
  });
};

export const useSendQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, providerId, data }: { requestId: number; providerId: number; data: Partial<Quote> }) =>
      quotesApi.sendQuote(requestId, providerId, data),
    onSuccess: (_res, vars) => invalidateQuoteCascades(qc, vars.requestId),
  });
};

// ===== APPOINTMENTS =====
export const useAppointments = () =>
  useQuery({ queryKey: ['appointments'], queryFn: () => appointmentsApi.getAll() });

export const useAppointmentAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'confirm' | 'start' | 'complete' | 'cancel' | 'noShow' }) =>
      appointmentsApi[action](id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['earnings'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// ===== REVIEWS =====
export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['reviews', vars.provider_id] });
      qc.invalidateQueries({ queryKey: ['provider', vars.provider_id] });
    },
  });
};

export const useReplyReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: number; reply: string }) => reviewsApi.reply(reviewId, reply),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
};

// ===== VERIFICATION =====
export const useMyVerifications = () =>
  useQuery({ queryKey: ['myVerifications'], queryFn: verificationApi.getMy, retry: false });

export const usePendingVerifications = () =>
  useQuery({ queryKey: ['pendingVerifications'], queryFn: verificationApi.getPending });

export const useApplyVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verificationApi.apply,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myVerifications'] });
      qc.invalidateQueries({ queryKey: ['pendingVerifications'] });
    },
  });
};

export const useVerificationDecision = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: number; approve: boolean; note?: string }) =>
      approve ? verificationApi.approve(id) : verificationApi.reject(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingVerifications'] });
      qc.invalidateQueries({ queryKey: ['providers'] });
    },
  });
};

// ===== PROFILE / ACCOUNT =====
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.updateMe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
};

export const useChangePassword = () =>
  useMutation({ mutationFn: ({ current, next }: { current: string; next: string }) => authApi.changePassword(current, next) });

export const useEnable2fa = () => useMutation({ mutationFn: authApi.enable2fa });
export const useVerify2fa = () => useMutation({ mutationFn: authApi.verify2fa });
export const useDisable2fa = () => useMutation({ mutationFn: authApi.disable2fa });

// ===== EARNINGS EXTRA =====
export const useEarningsHistory = () =>
  useQuery({ queryKey: ['earningsHistory'], queryFn: () => commissionsApi.getEarningsHistory() });

export const useMyPayouts = () =>
  useQuery({ queryKey: ['myPayouts'], queryFn: commissionsApi.getMyPayouts });

export const useRequestPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commissionsApi.requestPayout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['earnings'] });
      qc.invalidateQueries({ queryKey: ['myPayouts'] });
    },
  });
};

// ===== SUBSCRIPTION ACTIONS =====
export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plan_id, interval }: { plan_id: number; interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' }) =>
      subscriptionsApi.subscribe(plan_id, interval),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mySubscription'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mySubscription'] }),
  });
};

// ===== PROMOTIONS =====
export const useCreatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPromotions'] }),
  });
};

// ===== PROMOTION BID =====
export const useUpdatePromotionBid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bid_amount }: { id: number; bid_amount: number }) => promotionsApi.updateBid(id, bid_amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPromotions'] }),
  });
};

// ===== ADMIN EXTRAS =====
export const useAdminUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => adminApi.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
};

export const useAdminVerifyProvider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.verifyProvider,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminProviders'] }),
  });
};

// ===== ANALYTICS =====
export const useMyAnalytics = () =>
  useQuery({ queryKey: ['myAnalytics'], queryFn: analyticsApi.getMyAnalytics });
