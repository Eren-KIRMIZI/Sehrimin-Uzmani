export interface User {
  id: number;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role: 'USER' | 'PROVIDER' | 'ADMIN' | 'MODERATOR';
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ProviderProfile {
  id: number;
  user_id: number;
  business_name?: string;
  bio?: string;
  experience_years: number;
  rating: number;
  review_count: number;
  completed_jobs: number;
  response_time_minutes: number;
  verification_status: string;
  is_available: boolean;
  latitude?: number;
  longitude?: number;
  user: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  services: ProviderService[];
  locations: ProviderLocation[];
}

export interface ProviderService {
  id: number;
  service_name?: string;
  description?: string;
  starting_price?: number;
  pricing_type: string;
}

export interface ProviderLocation {
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  services?: Service[];
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface City {
  id: number;
  name: string;
  plate_code: string;
}

export interface District {
  id: number;
  name: string;
}

export interface ServiceRequest {
  id: number;
  customer_id: number;
  title: string;
  description?: string;
  budget_min?: number;
  budget_max?: number;
  city_id: number;
  district_id?: number;
  preferred_date?: string;
  preferred_time?: string;
  urgency: string;
  status: string;
  created_at: string;
}

export interface Quote {
  id: number;
  request_id: number;
  provider_id: number;
  price: number;
  estimated_duration?: string;
  description?: string;
  materials?: string;
  available_date?: string;
  warranty_info?: string;
  status: string;
  created_at: string;
  provider?: ProviderProfile;
}

export interface Appointment {
  id: number;
  request_id: number;
  provider_id: number;
  customer_id: number;
  start_at: string;
  end_at?: string;
  status: string;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface Review {
  id: number;
  request_id: number;
  customer_id: number;
  provider_id: number;
  rating: number;
  communication_rating?: number;
  quality_rating?: number;
  price_rating?: number;
  punctuality_rating?: number;
  comment?: string;
  status: string;
  created_at: string;
  customer?: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message?: string;
  data?: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface SubscriptionPlan {
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
  features: PlanFeature[];
}

export interface PlanFeature {
  name: string;
  value: string | null;
  included: boolean;
}

export interface ProviderSubscription {
  id: number;
  plan_name: string;
  interval: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  commission_discount: number;
}

export interface Transaction {
  id: number;
  provider_id: number;
  provider_name: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  provider_earning: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export interface ProviderEarning {
  total_earned: number;
  total_commission_paid: number;
  pending_amount: number;
  paid_amount: number;
  transaction_count: number;
}

export interface Dispute {
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

export interface DisputeMessage {
  id: number;
  sender_name: string;
  message: string;
  is_admin: boolean;
  attachment_url: string | null;
  created_at: string;
}

export interface PromotedProvider {
  id: number;
  provider_id: number;
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
  end_date: string | null;
  ctr: number;
}

export interface MatchingResult {
  provider_id: number;
  full_name: string;
  slug: string;
  avatar_url: string | null;
  match_score: number;
  rating: number;
  review_count: number;
  hourly_rate: number | null;
  years_experience: number | null;
  verification_level: string;
  is_promoted: boolean;
  promoted_badge: string | null;
  city_name: string | null;
  district_name: string | null;
}

export interface CommissionRate {
  id: number;
  category_id: number | null;
  category_name: string;
  rate: number;
  min_amount: number | null;
  description: string | null;
}
