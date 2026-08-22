import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adsApi } from '../services';
import type { AdFilters } from '../types/ads';

// Konum hook'ları CreateAdPage tarafından buradan import ediliyor
export { useCities, useDistricts } from './useQueries';

// QUERIES
export const useAdCategories = () =>
  useQuery({
    queryKey: ['adCategories'],
    queryFn: adsApi.getCategories,
    staleTime: 1000 * 60 * 10,
  });

export const useAds = (filters: AdFilters) =>
  useQuery({
    queryKey: ['ads', filters],
    queryFn: () => adsApi.list(filters),
  });

export const useAd = (id?: number) =>
  useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsApi.getById(id!),
    enabled: !!id,
  });

export const useSimilarAds = (id?: number) =>
  useQuery({
    queryKey: ['similarAds', id],
    queryFn: () => adsApi.getSimilar(id!),
    enabled: !!id,
  });

export const useMyAds = () =>
  useQuery({ queryKey: ['myAds'], queryFn: () => adsApi.getMyListings() });

export const useMyFavoriteAds = () =>
  useQuery({ queryKey: ['myFavoriteAds'], queryFn: adsApi.getMyFavorites });

// MUTATIONS
const invalidateAdQueries = (qc: ReturnType<typeof useQueryClient>, adId?: number) => {
  qc.invalidateQueries({ queryKey: ['myAds'] });
  qc.invalidateQueries({ queryKey: ['ads'] });
  qc.invalidateQueries({ queryKey: ['myFavoriteAds'] });
  if (adId) qc.invalidateQueries({ queryKey: ['ad', adId] });
};

export const useCreateAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.create,
    onSuccess: () => invalidateAdQueries(qc),
  });
};

export const useUpdateAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adsApi.update>[1] }) =>
      adsApi.update(id, data),
    onSuccess: (_res, vars) => invalidateAdQueries(qc, vars.id),
  });
};

export const useDeleteAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.delete,
    onSuccess: () => invalidateAdQueries(qc),
  });
};

export const usePublishAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.publish,
    onSuccess: (_res, id) => invalidateAdQueries(qc, id),
  });
};

export const usePauseAd = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.pause,
    onSuccess: (_res, id) => invalidateAdQueries(qc, id),
  });
};

export const useMarkAdSold = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.markSold,
    onSuccess: (_res, id) => invalidateAdQueries(qc, id),
  });
};

export const useToggleAdFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adsApi.toggleFavorite,
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['ad', id] });
      qc.invalidateQueries({ queryKey: ['myFavoriteAds'] });
      qc.invalidateQueries({ queryKey: ['ads'] });
    },
  });
};

export const useContactAdSeller = () =>
  useMutation({ mutationFn: adsApi.contactSeller });

export const useReportAd = () =>
  useMutation({
    mutationFn: ({ id, reason, description }: { id: number; reason: string; description?: string }) =>
      adsApi.report(id, reason, description),
  });
