// ===== ADS (İlanlar) =====
export interface AdCategory {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

export interface AdImage {
  id: number;
  url: string;
  thumbnail_url?: string | null;
  sort_order: number;
  is_cover: boolean;
}

export interface AdAttribute {
  id?: number;
  attribute_key: string;
  attribute_value: string;
}

export interface SellerInfo {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  provider_id?: number | null;
  business_name?: string | null;
  rating?: number | null;
  review_count?: number | null;
  active_ad_count: number;
}

export type AdStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'SOLD' | 'EXPIRED' | 'REJECTED' | 'DELETED';
export type AdPriceType = 'FIXED' | 'NEGOTIABLE' | 'FREE';
export type AdCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'USED';

export interface AdListItem {
  id: number;
  title: string;
  price?: number | null;
  currency: string;
  price_type: AdPriceType;
  status: AdStatus;
  condition?: AdCondition | null;
  is_featured: boolean;
  view_count: number;
  favorite_count: number;
  cover_image?: string | null;
  image_count: number;
  city_name?: string | null;
  district_name?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  published_at?: string | null;
  created_at?: string | null;
}

export interface AdListResponse {
  items: AdListItem[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

export interface AdDetail extends AdListItem {
  description?: string | null;
  contact_count: number;
  expires_at?: string | null;
  images: AdImage[];
  attributes: AdAttribute[];
  category?: AdCategory | null;
  seller?: SellerInfo | null;
  city_id?: number | null;
  district_id?: number | null;
  city_name?: string | null;
  district_name?: string | null;
  is_favorite: boolean;
  is_negotiable?: boolean;
  seller_phone?: string | null;
}

export interface AdCreatePayload {
  category_id: number;
  title: string;
  description?: string;
  price?: number;
  price_type: AdPriceType;
  condition?: AdCondition;
  city_id: number;
  district_id?: number;
  is_negotiable: boolean;
  show_phone: boolean;
  phone?: string;
  images: { url: string; is_cover?: boolean; sort_order?: number }[];
  attributes: { attribute_key: string; attribute_value: string }[];
}

export interface AdUpdatePayload {
  title?: string;
  description?: string;
  price?: number;
  price_type?: AdPriceType;
  condition?: AdCondition;
  city_id?: number;
  district_id?: number;
  is_negotiable?: boolean;
  show_phone?: boolean;
  phone?: string;
  attributes?: { attribute_key: string; attribute_value: string }[];
}

export interface AdFilters {
  q?: string;
  category?: string;
  city_id?: number;
  district_id?: number;
  min_price?: number;
  max_price?: number;
  condition?: AdCondition;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}
