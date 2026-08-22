// ===== AUTH =====
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'USER' | 'PROVIDER' | 'ADMIN' | 'MODERATOR';
  subscription_plan: 'starter' | 'bronze' | 'silver' | 'gold' | 'diamond';
  two_factor_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'USER' | 'PROVIDER';
}

// ===== PROVIDER =====
export interface ProviderProfile {
  id: number;
  user_id: number;
  business_name: string;
  bio?: string;
  avatar_url?: string;
  rating: number;
  review_count: number;
  completed_jobs: number;
  years_experience: number;
  verification_level: 'NONE' | 'BASIC' | 'ID' | 'PROFESSIONAL' | 'BUSINESS';
  verification_status?: string;
  is_available: boolean;
  hourly_rate?: number;
  subscription_plan: string;
  badge_type?: string;
  distance_km?: number;
  user: User;
  services: any[]; // relaxed to any[] to support both ProviderService[] and the simplified {name, starting_price} from backend
  locations: any[]; // relaxed to any[] to support both ProviderLocation[] and the simplified {city, district} from backend
  portfolio: PortfolioItem[];
  languages?: string[];
  education?: string[];
  certifications?: string[];
  availability: ProviderAvailability[];
}

export interface ProviderService {
  id: number;
  service: Service;
  starting_price?: number;
  description?: string;
}

export interface PortfolioItem {
  id: number;
  image_url: string;
  title?: string;
  description?: string;
}

export interface ProviderLocation {
  id: number;
  city: City;
  district?: District;
}

export interface ProviderAvailability {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

// ===== CATEGORIES =====
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  services?: Service[];
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  subcategory_id: number;
}

// ===== LOCATIONS =====
export interface City {
  id: number;
  name: string;
  plate_code: number;
}

export interface District {
  id: number;
  name: string;
  city_id: number;
}

// ===== SEARCH =====
export interface SearchFilters {
  q?: string;
  category?: string;
  subcategory?: string;
  service?: string;
  city_id?: number;
  district_id?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  verified?: boolean;
  available?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: 'recommended' | 'rating' | 'reviews' | 'newest';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  providers: ProviderProfile[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

// ===== SERVICE REQUESTS =====
export interface ServiceRequest {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  category_id?: number;
  subcategory_id?: number;
  service_id?: number;
  city_id: number;
  district_id?: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  budget_min?: number;
  budget_max?: number;
  preferred_date?: string;
  notes?: string;
  created_at: string;
  customer: User;
  city: City;
  quotes?: Quote[];
}

// ===== QUOTES =====
export interface Quote {
  id: number;
  request_id: number;
  provider_id: number;
  price: number;
  estimated_duration?: string;
  description?: string;
  materials?: string;
  available_date?: string;
   warranty?: string;
   status: 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVISED';
   created_at: string;
   provider: ProviderProfile;
}

// ===== APPOINTMENTS =====
export interface Appointment {
  id: number;
  request_id?: number;
  provider_id: number;
  customer_id: number;
  start_at: string;
  end_at?: string;
   location?: string;
   notes?: string;
   status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
   created_at: string;
  provider: ProviderProfile;
  customer: User;
}

// ===== REVIEWS =====
export interface Review {
  id: number;
  provider_id: number;
  customer_id: number;
  rating: number;
  comment?: string;
  communication_rating?: number;
  quality_rating?: number;
  price_rating?: number;
  punctuality_rating?: number;
  provider_reply?: string;
  created_at: string;
  customer: User;
}

// ===== NOTIFICATIONS =====
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ===== MESSAGING =====
export interface Conversation {
  id: number;
  customer_id: number;
  provider_id: number;
  created_at: string;
  last_message?: Message;
  unread_count?: number;
  customer: User;
  provider: ProviderProfile;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'QUOTE' | 'APPOINTMENT' | 'LOCATION' | 'SYSTEM';
  created_at: string;
  is_read: boolean;
}

// ===== COMMISSIONS & EARNINGS =====
export interface EarningsSummary {
  total_earned: number;
  pending_amount: number;
  paid_amount: number;
  available_for_payout: number;
}

export interface Transaction {
  id: number;
  provider_id: number;
  amount: number;
  commission_amount: number;
  provider_earning: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  created_at: string;
}

export interface PayoutRequest {
  id: number;
  provider_id: number;
  amount: number;
  bank_name: string;
  iban?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  created_at: string;
}

// ===== SUBSCRIPTIONS =====
export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  commission_discount: number;
  badge_type?: string;
  featured_limit: number;
  features?: PlanFeature[];
}

export interface PlanFeature {
  id: number;
  feature_name: string;
  is_included: boolean;
}

export interface ProviderSubscription {
  id: number;
  plan: SubscriptionPlan;
  interval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

// ===== PROMOTIONS =====
export interface Promotion {
  id: number;
  provider_id: number;
  category_id?: number;
  budget: number;
  daily_budget?: number;
  bid_amount: number;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  impressions: number;
  clicks: number;
  budget_spent: number;
  created_at: string;
  expires_at?: string;
}

// ===== DISPUTES =====
export interface Dispute {
  id: number;
  reporter_id: number;
  reported_id: number;
  reason: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  resolution?: string;
  created_at: string;
  reporter: User;
  reported: User;
  messages?: DisputeMessage[];
}

export interface DisputeMessage {
  id: number;
  dispute_id: number;
  sender_id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender: User;
}

// ===== ADMIN =====
export interface AdminDashboard {
  total_users: number;
  total_providers: number;
  total_requests: number;
  total_appointments: number;
  total_revenue: number;
  active_subscriptions: number;
  open_disputes: number;
  pending_verifications: number;
}

// ===== PAGINATION =====
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

// ===== AI DETECT =====
export interface DetectResult {
  detected: boolean;
  category?: string;
  subcategory?: string;
  service?: string;
  category_slug?: string;
  subcategory_slug?: string;
  service_slug?: string;
}

// ===== REPUTATION & BADGES =====
export interface ReputationScore {
  score: number;
  label: string;
  breakdown: {
    rating_score: number;
    completion_score: number;
    verification_score: number;
    response_score: number;
    repeat_score: number;
  };
  metrics: {
    avg_rating: number;
    review_count: number;
    completed_jobs: number;
    response_time_minutes: number;
    verification_status: string;
    recent_review_count: number;
    recent_avg_rating?: number;
  };
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  earned: boolean;
}

// ===== ANALYTICS =====
export interface ProviderAnalytics {
  period_days: number;
  quotes_received: number;
  quotes_sent: number;
  jobs_won: number;
  quotes_pending: number;
  conversion_rate: number;
  avg_rating: number;
  total_review_count: number;
  recent_avg_rating: number;
  recent_review_count: number;
  total_earnings_30d: number;
  daily_breakdown: Array<{
    date: string;
    day_name: string;
    quotes: number;
    reviews: number;
  }>;
  ai_insights: Array<{
    type: 'warning' | 'info' | 'success';
    icon: string;
    text: string;
  }>;
}

export interface AIAnalysis {
  category_slug: string | null;
  category_name: string | null;
  subcategory: string | null;
  service: string | null;
  urgency: 'low' | 'medium' | 'high' | 'emergency' | null;
  location: { city: string | null; district: string | null } | null;
  preferred_time: string | null;
  budget: { min: number | null; max: number | null } | null;
  keywords: string[];
  problem_description: string | null;
  confidence: number;
  is_emergency: boolean;
  detected: boolean;
  original_text?: string;
}

export interface AIMatchExplanation {
  match_percent: number;
  summary: string;
  reasons: string[];
  highlight: string;
}


export interface ProviderVerification {
  id: number;
  provider_id: number;
  provider_name: string;
  verification_type: 'IDENTITY' | 'PROFESSIONAL' | 'BUSINESS';
  document_url?: string;
  note?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_note?: string;
  created_at: string;
  reviewed_at?: string;
}
