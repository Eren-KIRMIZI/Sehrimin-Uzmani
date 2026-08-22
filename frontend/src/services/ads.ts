import api from './api';
import { withMock, mockAds } from '../mocks/handlers';
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
    withMock(
      () => api.get<AdListResponse>('/ads', { params: filters }).then(r => r.data),
      () => mockAds.list(filters)
    ),

  getById: (id: number) =>
    withMock(
      () => api.get<AdDetail>(`/ads/${id}`).then(r => r.data),
      () => mockAds.getById(id)
    ),

  getCategories: () =>
    withMock(
      () => api.get<AdCategory[]>('/ads/categories').then(r => r.data),
      () => mockAds.getCategories()
    ),

  getSimilar: (id: number) =>
    withMock(
      () => api.get<AdListItem[]>(`/ads/${id}/similar`).then(r => r.data),
      () => mockAds.getSimilar(id)
    ),

  // Kullanıcı
  create: (data: AdCreatePayload) =>
    withMock(
      () => api.post<AdDetail>('/ads', data).then(r => r.data),
      () => mockAds.create(data)
    ),

  update: (id: number, data: AdUpdatePayload) =>
    withMock(
      () => api.patch<AdDetail>(`/ads/${id}`, data).then(r => r.data),
      () => mockAds.update(id, data as Record<string, unknown>)
    ),

  delete: (id: number) =>
    withMock(
      () => api.delete(`/ads/${id}`).then(r => r.data),
      () => mockAds.delete(id)
    ),

  publish: (id: number) =>
    withMock(
      () => api.post<{ message: string; status: string }>(`/ads/${id}/publish`).then(r => r.data),
      () => mockAds.publish(id)
    ),

  pause: (id: number) =>
    withMock(
      () => api.post<{ message: string; status: string }>(`/ads/${id}/pause`).then(r => r.data),
      () => mockAds.pause(id)
    ),

  markSold: (id: number) =>
    withMock(
      () => api.post<{ message: string; status: string }>(`/ads/${id}/sold`).then(r => r.data),
      () => mockAds.markSold(id)
    ),

  getMyListings: (status?: string) =>
    withMock(
      () => api.get<AdListResponse>('/ads/my/listings', { params: { status } }).then(r => r.data),
      () => mockAds.getMyListings(status)
    ),

  getMyFavorites: () =>
    withMock(
      () => api.get<AdListItem[]>('/ads/my/favorites').then(r => r.data),
      () => mockAds.getMyFavorites()
    ),

  addImages: (id: number, images: { url: string; is_cover?: boolean; sort_order?: number }[]) =>
    withMock(
      () => api.post(`/ads/${id}/images`, images).then(r => r.data),
      () => ({ message: 'Görseller eklendi' })
    ),

  deleteImage: (adId: number, imageId: number) =>
    withMock(
      () => api.delete(`/ads/${adId}/images/${imageId}`).then(r => r.data),
      () => ({ message: 'Görsel silindi' })
    ),

  toggleFavorite: (id: number) =>
    withMock(
      () => api.post<{ is_favorite: boolean; message: string }>(`/ads/${id}/favorite`).then(r => r.data),
      () => mockAds.toggleFavorite(id)
    ),

  contactSeller: (id: number) =>
    withMock(
      () => api
        .post<{ conversation_id: number | null; message?: string; contact_count?: number }>(
          `/ads/${id}/contact`
        )
        .then(r => r.data),
      () => mockAds.contactSeller(id)
    ),

  report: (id: number, reason: string, description?: string) =>
    withMock(
      () => api.post(`/ads/${id}/report`, { reason, description }).then(r => r.data),
      () => mockAds.report(id, reason, description)
    ),
};
