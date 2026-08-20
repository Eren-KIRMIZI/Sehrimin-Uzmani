import api from './api';
import type {
  AdCategory,
  AdCreatePayload,
  AdDetail,
  AdFilters,
  AdListItem,
  AdListResponse,
  AdUpdatePayload,
} from '../types/ads';

export const adsApi = {
  // Public
  list: (filters: AdFilters) =>
    api.get<AdListResponse>('/ads', { params: filters }).then(r => r.data),

  getById: (id: number) =>
    api.get<AdDetail>(`/ads/${id}`).then(r => r.data),

  getCategories: () =>
    api.get<AdCategory[]>('/ads/categories').then(r => r.data),

  getSimilar: (id: number) =>
    api.get<AdListItem[]>(`/ads/${id}/similar`).then(r => r.data),

  // Kullanıcı
  create: (data: AdCreatePayload) =>
    api.post<AdDetail>('/ads', data).then(r => r.data),

  update: (id: number, data: AdUpdatePayload) =>
    api.patch<AdDetail>(`/ads/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/ads/${id}`).then(r => r.data),

  publish: (id: number) =>
    api.post<{ message: string; status: string }>(`/ads/${id}/publish`).then(r => r.data),

  pause: (id: number) =>
    api.post<{ message: string; status: string }>(`/ads/${id}/pause`).then(r => r.data),

  markSold: (id: number) =>
    api.post<{ message: string; status: string }>(`/ads/${id}/sold`).then(r => r.data),

  getMyListings: (status?: string) =>
    api.get<AdListResponse>('/ads/my/listings', { params: { status } }).then(r => r.data),

  getMyFavorites: () =>
    api.get<AdListItem[]>('/ads/my/favorites').then(r => r.data),

  addImages: (id: number, images: { url: string; is_cover?: boolean; sort_order?: number }[]) =>
    api.post(`/ads/${id}/images`, images).then(r => r.data),

  deleteImage: (adId: number, imageId: number) =>
    api.delete(`/ads/${adId}/images/${imageId}`).then(r => r.data),

  toggleFavorite: (id: number) =>
    api.post<{ is_favorite: boolean; message: string }>(`/ads/${id}/favorite`).then(r => r.data),

  contactSeller: (id: number) =>
    api
      .post<{ conversation_id: number | null; message?: string; contact_count?: number }>(
        `/ads/${id}/contact`
      )
      .then(r => r.data),

  report: (id: number, reason: string, description?: string) =>
    api.post(`/ads/${id}/report`, { reason, description }).then(r => r.data),
};
