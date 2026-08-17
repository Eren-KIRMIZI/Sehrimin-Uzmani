import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
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

const BADGE_COLORS: Record<string, string> = {
  free: 'border-gray-200 bg-gray-50 text-gray-800',
  bronze: 'border-orange-300 bg-orange-50 text-orange-800',
  silver: 'border-gray-300 bg-gray-50 text-gray-800',
  gold: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  diamond: 'border-purple-300 bg-purple-50 text-purple-800',
};

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data);
    } catch {
      toast.error('Planlar yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    setSubscribing(planId);
    try {
      await api.post('/subscriptions/subscribe', null, { params: { plan_id: planId, interval } });
      toast.success('Abonelik baslatildi!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Hata olustu');
    } finally {
      setSubscribing(null);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    switch (interval) {
      case 'monthly': return plan.price_monthly;
      case 'quarterly': return plan.price_quarterly || plan.price_monthly * 3;
      case 'yearly': return plan.price_yearly || plan.price_monthly * 12;
    }
  };

  const getMonthlyEquiv = (plan: SubscriptionPlan) => {
    const total = getPrice(plan);
    switch (interval) {
      case 'monthly': return total;
      case 'quarterly': return total / 3;
      case 'yearly': return total / 12;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Uzmanlar Icin Planlar</h1>
          <p className="text-xl text-gray-600 mb-8">Musteri kitlenizi genisletmek icin size en uygun plani secin</p>

          <div className="inline-flex items-center bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            {(['monthly', 'quarterly', 'yearly'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  interval === opt
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt === 'monthly' ? 'Aylik' : opt === 'quarterly' ? '3 Aylik' : 'Yillik'}
                {opt === 'yearly' && <span className="ml-1 text-xs text-green-600">%20 Tasarruf</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const monthly = getMonthlyEquiv(plan);
            const badgeColor = BADGE_COLORS[plan.badge_type || 'free'] || BADGE_COLORS.free;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 ${
                  plan.slug === 'gold' ? 'border-yellow-400 shadow-lg scale-105' : badgeColor.split(' ')[0]
                }`}
              >
                {plan.slug === 'gold' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    EN POPULER
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${badgeColor}`}>
                    {plan.badge_type?.toUpperCase() || 'FREE'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900">
                    {monthly.toFixed(0)} <span className="text-lg font-normal text-gray-500">TL/ay</span>
                  </div>
                  {interval !== 'monthly' && (
                    <p className="text-sm text-gray-500 mt-1">Toplam {price.toFixed(0)} TL</p>
                  )}
                  {plan.commission_discount > 0 && (
                    <p className="text-sm text-green-600 font-medium mt-2">
                      %{(plan.commission_discount * 100).toFixed(0)} Komisyon Indirimi
                    </p>
                  )}
                </div>

                <div className="flex-1 space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          f.included ? 'text-green-500' : 'text-gray-300'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {f.included ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                      </svg>
                      <span className={`text-sm ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {f.name}
                        {f.value && <span className="text-gray-500"> ({f.value})</span>}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.slug === 'gold'
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  } disabled:opacity-50`}
                >
                  {subscribing === plan.id ? 'Isleniyor...' : 'Hemen Basla'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
