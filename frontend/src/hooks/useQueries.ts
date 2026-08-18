import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Category, City, District, ProviderProfile } from '../types';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCities() {
  return useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/locations/cities');
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useDistricts(cityId: number | null) {
  return useQuery<District[]>({
    queryKey: ['districts', cityId],
    queryFn: async () => {
      const res = await api.get(`/locations/cities/${cityId}/districts`);
      return res.data;
    },
    enabled: !!cityId,
    staleTime: 10 * 60 * 1000,
  });
}

interface SearchParams {
  q?: string;
  city_id?: number;
  category?: string;
  min_rating?: string;
  verified?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

interface SearchResult {
  items: ProviderProfile[];
  total: number;
}

export function useProviderSearch(params: SearchParams) {
  return useQuery<SearchResult>({
    queryKey: ['providerSearch', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set('q', params.q);
      if (params.city_id) searchParams.set('city_id', String(params.city_id));
      if (params.category) searchParams.set('category', params.category);
      if (params.min_rating) searchParams.set('min_rating', params.min_rating);
      if (params.verified) searchParams.set('verified', 'true');
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.page) searchParams.set('page', String(params.page));
      searchParams.set('limit', String(params.limit || 12));

      const res = await api.get(`/search/providers?${searchParams.toString()}`);
      return { items: res.data.items || [], total: res.data.total || 0 };
    },
  });
}

export interface PromotionData {
  id: number;
  category_id: number;
  category_name: string;
  budget: number;
  spent: number;
  daily_budget: number;
  bid_amount: number;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  priority_boost: number;
  is_featured: boolean;
  badge_text: string | null;
  start_date: string;
  end_date: string;
  ctr: number;
}

export interface SubscriptionPlanData {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_quarterly: number | null;
  price_yearly: number | null;
  commission_discount: number;
  featured_listings: number;
  priority_support: boolean;
  advanced_analytics: boolean;
  highlighted_profile: boolean;
  badge_type: string | null;
  max_portfolio_images: number;
  max_services: number;
  features: Array<{ name: string; value: string | null; included: boolean }>;
}

export interface EarningsData {
  total_earned: number;
  total_commission_paid: number;
  pending_amount: number;
  paid_amount: number;
  transaction_count: number;
}

export interface TransactionData {
  id: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  provider_earning: number;
  status: string;
  description: string;
  created_at: string;
}

export interface PayoutData {
  id: number;
  amount: number;
  bank_name: string;
  status: string;
  created_at: string;
}

export interface DisputeData {
  id: number;
  reason: string;
  description: string;
  status: string;
  priority: string;
  reporter_name: string;
  reported_name: string;
  amount_involved: number | null;
  created_at: string;
}

export function useMyPromotions() {
  return useQuery<PromotionData[]>({
    queryKey: ['myPromotions'],
    queryFn: async () => {
      const res = await api.get('/promotions/my');
      return res.data;
    },
  });
}

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlanData[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/plans');
      return res.data;
    },
  });
}

export function useEarnings() {
  return useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      const [earnRes, txRes, payoutRes] = await Promise.all([
        api.get('/commissions/earnings'),
        api.get('/commissions/transactions'),
        api.get('/commissions/payout/my'),
      ]);
      return {
        earnings: earnRes.data as EarningsData,
        transactions: (txRes.data.items || []) as TransactionData[],
        payouts: (payoutRes.data || []) as PayoutData[],
      };
    },
  });
}

export function useDisputes() {
  return useQuery<DisputeData[]>({
    queryKey: ['disputes'],
    queryFn: async () => {
      const res = await api.get('/disputes');
      return res.data.items || [];
    },
  });
}

export function useDisputeDetail(id: number | null) {
  return useQuery({
    queryKey: ['dispute', id],
    queryFn: async () => {
      const res = await api.get(`/disputes/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useProviderProfile(id: string | undefined) {
  return useQuery({
    queryKey: ['providerProfile', id],
    queryFn: async () => {
      const [profileRes, reviewsRes] = await Promise.all([
        api.get(`/providers/${id}`),
        api.get(`/reviews/provider/${id}`),
      ]);
      return { provider: profileRes.data, reviews: reviewsRes.data };
    },
    enabled: !!id,
  });
}

export function useRecentRequests() {
  return useQuery({
    queryKey: ['recentRequests'],
    queryFn: async () => {
      const res = await api.get('/requests?limit=5');
      return res.data.items || [];
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data.count as number;
    },
    refetchInterval: 30000,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
  });
}

export function useAdminUsers() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery<any[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/admin/users?limit=50');
      return res.data.items || [];
    },
  });
}

export function useAdminProviders() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery<any[]>({
    queryKey: ['adminProviders'],
    queryFn: async () => {
      const res = await api.get('/admin/providers?limit=50');
      return res.data.items || [];
    },
  });
}

export function useAdminRequests() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery<any[]>({
    queryKey: ['adminRequests'],
    queryFn: async () => {
      const res = await api.get('/admin/requests?limit=50');
      return res.data.items || [];
    },
  });
}

export function usePayoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { amount: number; bank_name?: string; iban?: string; account_holder?: string }) => {
      return api.post('/commissions/payout/request', null, { params });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['earnings'] }),
  });
}

export function usePromotionCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      return api.post('/promotions', null, { params });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPromotions'] }),
  });
}

export function usePromotionActionMutation(action: 'pause' | 'resume' | 'cancel') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/promotions/${id}/${action}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPromotions'] }),
  });
}

export function useDisputeCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { reported_id: number; reason: string; description: string; amount_involved?: number }) => {
      return api.post('/disputes', null, { params });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });
}

export function useDisputeMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, message }: { id: number; message: string }) => {
      return api.post(`/disputes/${id}/messages`, null, { params: { message } });
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['dispute', vars.id] }),
  });
}

export function useDisputeCloseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/disputes/${id}/close`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });
}

export function useSubscribeMutation() {
  return useMutation({
    mutationFn: async ({ planId, interval }: { planId: number; interval: string }) => {
      return api.post('/subscriptions/subscribe', null, { params: { plan_id: planId, interval } });
    },
  });
}
