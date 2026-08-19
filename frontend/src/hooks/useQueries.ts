import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi, providersApi, categoriesApi, locationsApi,
  searchApi, requestsApi, reviewsApi, favoritesApi,
  notificationsApi, messagingApi, commissionsApi,
  subscriptionsApi, promotionsApi, disputesApi, adminApi,
} from '../services';
import type { SearchFilters } from '../types';

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
