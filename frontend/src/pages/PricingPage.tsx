import React, { useState } from 'react';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import { useSubscriptionPlans, useMySubscription, useSubscribe, useCancelSubscription } from '../hooks/useQueries';
import { toast, toastApiError } from '../stores/toastStore';
import { formatTRY, formatDate } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ICONS: Record<string, React.ReactNode> = {
  starter: <Star size={24} />,
  bronze: <Shield size={24} color="#cd7c32" />,
  silver: <Shield size={24} color="#cbd5e1" />,
  gold: <Crown size={24} color="#fbbf24" />,
  diamond: <Zap size={24} color="#67e8f9" />
};

type Interval = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

const INTERVAL_LABELS: Record<Interval, string> = {
  MONTHLY: 'Aylık',
  QUARTERLY: '3 Aylık',
  YEARLY: 'Yıllık',
};

// Çeyreklik/yıllık toplam fiyat (yıllıkta ~%20 indirim)
const planPrice = (monthly: number, interval: Interval): number => {
  if (interval === 'MONTHLY') return monthly;
  if (interval === 'QUARTERLY') return Math.floor(monthly * 3 * 0.9);
  return Math.floor(monthly * 12 * 0.8);
};

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [interval, setInterval] = useState<Interval>('MONTHLY');

  const { data: plans, isLoading } = useSubscriptionPlans();
  const { data: mySub } = useMySubscription();
  const subscribe = useSubscribe();
  const cancelSub = useCancelSubscription();

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await subscribe.mutateAsync({ plan_id: planId, interval });
      toast.success('Aboneliğiniz başlatıldı!');
    } catch (err) {
      toastApiError(err, 'Abonelik başlatılamadı');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz? Dönem sonunda erişiminiz sonlanır.')) return;
    try {
      await cancelSub.mutateAsync(undefined);
      toast.info('Aboneliğiniz iptal edildi.');
    } catch (err) {
      toastApiError(err, 'Abonelik iptal edilemedi');
    }
  };

  const unitLabel = interval === 'MONTHLY' ? '/ay' : interval === 'QUARTERLY' ? '/3 ay' : '/yıl';

  return (
    <Layout>
      <SEO title="Abonelik Planları" description="İşinizi büyütecek abonelik planlarını inceleyin" />
      <div style={{ padding: '80px 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ fontWeight: 900, fontSize: '2.5rem', marginBottom: 16 }}>
              İşinizi <span className="gradient-text">Büyütmenin</span> Tam Zamanı
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 32px' }}>
              Size en uygun planı seçin, daha fazla müşteriye ulaşın, komisyon oranlarınızı düşürün.
            </p>

            {/* Interval Toggle */}
            <div role="group" aria-label="Ödeme periyodu seçimi" style={{
              display: 'inline-flex', background: 'var(--color-surface)',
              padding: 6, borderRadius: 999, border: '1px solid var(--color-border)'
            }}>
              {(Object.keys(INTERVAL_LABELS) as Interval[]).map(iv => (
                <button
                  key={iv}
                  className={`btn ${interval === iv ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 999 }}
                  aria-pressed={interval === iv}
                  onClick={() => setInterval(iv)}
                >
                  {INTERVAL_LABELS[iv]}
                  {iv === 'QUARTERLY' && (
                    <span style={{ color: interval === iv ? '#fff' : '#10b981', fontSize: '0.75rem', marginLeft: 4 }}>%10</span>
                  )}
                  {iv === 'YEARLY' && (
                    <span style={{ color: interval === iv ? '#fff' : '#10b981', fontSize: '0.75rem', marginLeft: 4 }}>%20</span>
                  )}
                </button>
              ))}
            </div>

            {/* Mevcut abonelik bilgisi */}
            {mySub && mySub.status === 'ACTIVE' && (
              <div className="card animate-fade-in" style={{ maxWidth: 520, margin: '32px auto 0', padding: 20, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      Mevcut Aboneliğiniz: {mySub.plan.name} ({INTERVAL_LABELS[mySub.interval] ?? mySub.interval})
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      Yenilenme: {formatDate(mySub.expires_at)}
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleCancel}
                    disabled={cancelSub.isPending}
                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                  >
                    {cancelSub.isPending ? 'İptal Ediliyor...' : 'Aboneliği İptal Et'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ width: 340, height: 500, borderRadius: 24 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
              {plans?.map(plan => {
                const isPopular = plan.slug === 'gold';
                const isCurrent = mySub?.plan.id === plan.id && mySub.status === 'ACTIVE';
                const price = planPrice(plan.price_monthly, interval);

                return (
                  <div key={plan.id} className={`card ${isPopular ? 'plan-popular' : ''}`} style={{
                    width: '100%', maxWidth: 340, padding: 32,
                    display: 'flex', flexDirection: 'column',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    {isPopular && (
                      <div style={{
                        position: 'absolute', top: 20, right: -30, background: 'var(--color-primary)',
                        color: 'white', padding: '4px 40px', transform: 'rotate(45deg)',
                        fontSize: '0.75rem', fontWeight: 700
                      }}>
                        POPÜLER
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      {ICONS[plan.slug] || <Star />}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{plan.name}</h3>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{formatTRY(price)}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{unitLabel}</span>
                    </div>

                    <div style={{
                      background: 'var(--color-surface-2)', padding: '12px 16px',
                      borderRadius: 12, marginBottom: 24, fontSize: '0.875rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Komisyon İndirimi</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>%{plan.commission_discount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Öne Çıkarılma Limiti</span>
                        <span style={{ fontWeight: 700 }}>{plan.featured_limit}</span>
                      </div>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                      {plan.features?.map(feature => (
                        <li key={feature.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.875rem' }}>
                          <Check size={16} color={feature.is_included ? 'var(--color-primary)' : 'var(--color-border)'} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ color: feature.is_included ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                            {feature.feature_name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`btn ${isCurrent ? 'btn-outline' : isPopular ? 'btn-primary' : 'btn-outline'}`}
                      style={{ width: '100%', padding: '14px 0', fontSize: '1rem' }}
                      disabled={isCurrent || subscribe.isPending}
                      aria-label={`${plan.name} planını ${INTERVAL_LABELS[interval]} seç`}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {subscribe.isPending ? 'İşleniyor...' : isCurrent ? 'Mevcut Planınız' : 'Planı Seç'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PricingPage;
