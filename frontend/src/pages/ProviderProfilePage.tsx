import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, Shield, MapPin, Clock, TrendingUp, Phone, MessageSquare,
  Heart, ChevronLeft, Calendar, Award, Briefcase, Image, Check, Info, AlertTriangle, Zap
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import { useProvider, useProviderReviews, useFavorites, useToggleFavorite, useReputation, useBadges, useAvailableSlots } from '../hooks/useQueries';
import { useAuthStore } from '../stores/authStore';
import { messagingApi } from '../services';
import { useNavigate } from 'react-router-dom';
import { useI18nStore } from '../stores/i18nStore';

const VerificationBadge: React.FC<{ level: string; t: (key: string) => string }> = ({ level, t }) => {
  const map: Record<string, { color: string; label: string; icon: string }> = {
    NONE: { color: '#64748b', label: t('common.unverified'), icon: '○' },
    BASIC: { color: '#3b82f6', label: t('common.basic'), icon: '✓' },
    ID: { color: '#8b5cf6', label: t('common.id'), icon: '✓✓' },
    PROFESSIONAL: { color: '#f59e0b', label: t('common.professional'), icon: '★' },
    BUSINESS: { color: '#10b981', label: t('common.business'), icon: '🏢' },
  };
  const info = map[level] || map.NONE;
  return (
    <span style={{ color: info.color, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
      <Shield size={13} /> {info.label} {t('common.verification')}
    </span>
  );
};

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size} fill={i <= Math.round(rating) ? '#f59e0b' : 'transparent'} color={i <= Math.round(rating) ? '#f59e0b' : '#374151'} />
    ))}
  </div>
);

const ProviderProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useI18nStore();
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews' | 'portfolio' | 'availability'>('about');
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const providerId = id ? Number(id) : undefined;
  const { data: provider, isLoading } = useProvider(providerId);
  const { data: reviewsData } = useProviderReviews(providerId);
  const { data: favorites } = useFavorites();
  const { data: reputationData } = useReputation(providerId);
  const { data: badgesData } = useBadges(providerId);
  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots(providerId, selectedDate);
  const toggleFavorite = useToggleFavorite();

  const isFavorited = favorites?.some((f: any) => f.provider_id === providerId);
  const reputation = reputationData;
  const badges = badgesData?.badges || [];

  const handleContact = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setContactLoading(true);
    try {
      const conv = await messagingApi.createConversation(providerId!);
      navigate('/chat', { state: { conversationId: conv.id } });
    } catch {
      navigate('/chat');
    } finally {
      setContactLoading(false);
    }
  };

  const handleRequest = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate(`/request/create?provider=${id}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '40px 24px' }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 20, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[200, 150, 180].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 16 }} />)}
            </div>
            <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          </div>
        </div>
      </Layout>
    );
  }

  if (!provider) return (
    <Layout>
      <SEO 
        title={t('common.not_found')}
        description={t('common.not_found')}
      />
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>👤</div>
        <h2>{t('common.not_found')}</h2>
        <Link to="/search" className="btn btn-primary" style={{ marginTop: 16 }}>{t('common.back')}</Link>
      </div>
    </Layout>
  );

  const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.items || []);
  const portfolio = provider?.portfolio_items || provider?.portfolio || [];

  const tabs = [
    { key: 'about', label: t('provider.about'), icon: <Briefcase size={15} /> },
    { key: 'services', label: t('provider.services'), icon: <Check size={15} /> },
    { key: 'reviews', label: `${t('provider.reviews')} (${provider.review_count})`, icon: <Star size={15} /> },
    { key: 'portfolio', label: t('provider.portfolio'), icon: <Image size={15} /> },
    { key: 'availability', label: t('provider.calendar'), icon: <Calendar size={15} /> },
  ] as const;

  return (
    <Layout>
      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Back */}
        <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24, fontSize: '0.875rem' }}>
          <ChevronLeft size={16} /> {t('common.back')}
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr min(320px, 100%)', gap: 28, alignItems: 'start' }}>
          {/* Left column */}
          <div>
            {/* Profile header */}
            <div className="card relative overflow-hidden" style={{ marginBottom: 20 }}>
              
              {/* Premium indicator backgrounds */}
              {reputation && reputation.score >= 75 && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full pointer-events-none -z-10"></div>
              )}

              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 100, height: 100, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.4rem', fontWeight: 700, color: 'white',
                  boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)',
                  border: '4px solid white'
                }}>
                  {provider.avatar_url
                    ? <img src={provider.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    : provider.business_name?.[0]}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <h1 style={{ fontWeight: 900, fontSize: '1.75rem', margin: 0, color: 'var(--color-text)' }}>{provider.business_name}</h1>
                    {provider.badge_type && (
                      <span className="badge badge-primary" style={{ padding: '4px 10px' }}>
                        {provider.badge_type === 'diamond' ? '💎 Elmas Üye' :
                         provider.badge_type === 'gold' ? '🥇 Altın Üye' :
                         provider.badge_type === 'silver' ? '🥈 Gümüş Üye' : '🥉 Bronz Üye'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <VerificationBadge level={provider.verification_level} t={t} />
                    
                    {reputation && (
                      <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                        <TrendingUp size={12} className="text-indigo-600" />
                        {t('common.rating')}: <span className={reputation.score >= 75 ? 'text-green-600' : 'text-indigo-600'}>{reputation.score}/100</span>
                        <span className="ml-1 text-gray-400 font-normal">({reputation.label})</span>
                      </div>
                    )}
                  </div>

                  {/* Badges display */}
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {badges.slice(0, 4).map(badge => (
                        <div 
                          key={badge.id}
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border shadow-sm transition-all hover:-translate-y-0.5"
                          style={{ borderColor: `${badge.color}30`, backgroundColor: `${badge.color}10`, color: badge.color }}
                          title={badge.description}
                        >
                          <span>{badge.icon}</span> {badge.label}
                        </div>
                      ))}
                      {badges.length > 4 && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-xs font-bold text-gray-500 cursor-help" title={t('common.show_more')}>
                          +{badges.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StarRating rating={provider.rating} />
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{provider.rating?.toFixed(1)}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({provider.review_count} yorum)</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Briefcase size={13} /> {provider.completed_jobs || 0} {t('provider.jobs_done')}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} /> {provider.experience_years ?? provider.years_experience ?? 0} {t('provider.years_exp')}
                      </span>
                    </div>
                  </div>

                  {provider.locations?.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {provider.locations.slice(0, 4).map(loc => (
                        <span key={loc.id} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-surface-2)', padding: '4px 10px', borderRadius: 20 }}>
                          <MapPin size={12} /> {loc.city?.name}{loc.district ? `, ${loc.district.name}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 20px', background: 'transparent', border: 'none',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                    color: activeTab === tab.key ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                    borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
                    transition: 'all 0.2s', marginBottom: -1,
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="animate-fade-in" key={activeTab}>
              {activeTab === 'about' && (
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: 12 }}>{t('provider.about')}</h3>
                  <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                    {provider.bio || t('provider.no_bio')}
                  </p>
                  
                  {provider.languages && provider.languages.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <h4 style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.95rem' }}>{t('provider.languages')}</h4>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {provider.languages.map((lang: string) => (
                          <span key={lang} className="badge badge-primary">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider.education && provider.education.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <Award size={16} className="text-indigo-600" /> {t('provider.education')}
                      </h4>
                      <div className="space-y-4">
                        {provider.education.map((edu: any, i: number) => (
                          <div key={i} className="flex flex-col">
                            <span className="font-semibold">{edu.school}</span>
                            <span className="text-sm text-gray-500">{edu.degree} - {edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider.certifications && provider.certifications.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <Shield size={16} className="text-indigo-600" /> {t('provider.certifications')}
                      </h4>
                      <div className="space-y-4">
                        {provider.certifications.map((cert: any, i: number) => (
                          <div key={i} className="flex flex-col">
                            <span className="font-semibold">{cert.name}</span>
                            <span className="text-sm text-gray-500">{cert.issuer} - {cert.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Reputation breakdown if available */}
                  {reputation && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-600" /> {t('provider.profile_performance')}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-500 mb-1">{t('provider.customer_score')}</div>
                          <div className="font-bold text-gray-900">{reputation.breakdown.rating_score}/40</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-500 mb-1">{t('provider.job_completion')}</div>
                          <div className="font-bold text-gray-900">{reputation.breakdown.completion_score}/25</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-500 mb-1">{t('provider.verification')}</div>
                          <div className="font-bold text-gray-900">{reputation.breakdown.verification_score}/15</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-500 mb-1">{t('provider.repeat_customer')}</div>
                          <div className="font-bold text-gray-900">{reputation.breakdown.repeat_score}/10</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {provider.availability?.length > 0 && (
                    <>
                      <h4 style={{ fontWeight: 700, marginTop: 24, marginBottom: 12 }}>{t('provider.availability')}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day, i) => {
                          const avail = provider.availability.find((a: any) => a.day_of_week === i);
                          return (
                            <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
                              <span style={{ fontWeight: 600 }}>{day}</span>
                              <span style={{ color: avail ? 'var(--color-success)' : 'var(--color-text-dim)', fontWeight: 500 }}>
                                {avail ? `${avail.start_time.substring(0,5)} - ${avail.end_time.substring(0,5)}` : t('provider.not_available')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'services' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {provider.services?.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      {t('common.not_found')}
                    </div>
                  ) : provider.services?.map((s: any) => (
                    <div key={s.id} className="card hover:shadow-md transition-shadow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.service?.name || s.name}</div>
                        {s.description && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 6 }}>{s.description}</div>}
                      </div>
                      {s.starting_price && (
                        <div style={{ fontWeight: 800, color: 'var(--color-primary-light)', fontSize: '1.15rem', flexShrink: 0, background: 'rgba(99,102,241,0.1)', padding: '6px 12px', borderRadius: 8 }}>
                          ₺{s.starting_price} {t('provider.starting_from')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Overall rating */}
                  <div className="card" style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', minWidth: 120 }}>
                      <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{provider.rating?.toFixed(1)}</div>
                      <div className="mt-2 flex justify-center"><StarRating rating={provider.rating} size={20} /></div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 6 }}>{provider.review_count} {t('provider.reviews')}</div>
                    </div>

                    <div className="flex-1 space-y-2">
                       {/* Puan dağılımı — gerçek yorum verisinden hesaplanır */}
                       {[5, 4, 3, 2, 1].map(r => {
                          const count = reviews.filter((rev: any) => Math.round(rev.rating) === r).length;
                          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={r} className="flex items-center gap-2 text-sm">
                              <span className="w-4 font-medium text-gray-500">{r}</span>
                              <Star size={12} className="text-amber-500" />
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="w-6 text-right text-xs text-gray-400">{count}</span>
                            </div>
                          );
                       })}
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 60 }}>
                      {provider.review_count > 0 ? t('common.not_found') : t('provider.no_reviews')}
                    </div>
                  ) : reviews.map((review: any) => (
                    <div key={review.id} className="card p-5">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            background: 'var(--color-surface-3)', color: 'var(--color-text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                            fontSize: '1.1rem'
                          }}>
                            {review.customer?.first_name?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {review.customer?.first_name} {review.customer?.last_name?.[0]}.
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {new Date(review.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 h-fit">
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      {review.comment && (
                        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginTop: 12 }}>{review.comment}</p>
                      )}
                      {review.provider_reply && (
                        <div style={{
                          marginTop: 16, padding: 16,
                          background: 'rgba(99, 102, 241, 0.05)',
                          borderLeft: '3px solid var(--color-primary)',
                          borderRadius: '0 8px 8px 0',
                        }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)', fontWeight: 700, marginBottom: 6 }}>
                            {t('provider.reply')}
                          </div>
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{review.provider_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {portfolio.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-muted)', padding: 60 }}>
                      {t('common.not_found')}
                    </div>
                  ) : portfolio.map((item: any) => (
                    <div key={item.id} className="group relative" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)', aspectRatio: '1' }}>
                      <img src={item.image_url} alt={item.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} className="group-hover:scale-105" />
                      {item.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white">
                          <div className="font-medium text-sm truncate">{item.title}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'availability' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, margin: 0 }}>{t('provider.availability')}</h3>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  {slotsLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      {t('common.loading')}
                    </div>
                  ) : !slotsData?.slots?.length ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', borderRadius: 12 }}>
                      {t('common.not_found')}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                      {slotsData.slots.map((slot: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: '12px',
                            textAlign: 'center',
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            border: `1px solid ${slot.available ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                            background: slot.available ? 'var(--color-surface)' : 'var(--color-surface-2)',
                            color: slot.available ? 'var(--color-primary-light)' : 'var(--color-text-dim)',
                            opacity: slot.available ? 1 : 0.6,
                            cursor: slot.available ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                          }}
                          className={slot.available ? 'hover:bg-indigo-50 hover:shadow-sm' : ''}
                        >
                          {slot.start}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card" style={{ marginBottom: 16, padding: 24 }}>
              {/* Pricing */}
              {provider.hourly_rate && (
                <div style={{ textAlign: 'center', padding: '0 0 24px', borderBottom: '1px solid var(--color-border)', marginBottom: 24 }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary-light)', lineHeight: 1 }}>
                    ₺{provider.hourly_rate}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{t('provider.hourly_rate_desc')}</div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  id="hire-btn"
                  className="btn btn-primary shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: '1.05rem' }}
                  onClick={handleRequest}
                >
                  <Calendar size={18} /> {t('provider.create_request')}
                </button>
                <button
                  id="message-btn"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
                  onClick={handleContact}
                  disabled={contactLoading}
                >
                  <MessageSquare size={18} />
                  {contactLoading ? t('common.loading') : t('provider.ask_question')}
                </button>
                {isAuthenticated && (
                  <button
                    id="favorite-btn"
                    className={`btn btn-ghost`}
                    style={{ width: '100%', justifyContent: 'center', color: isFavorited ? '#ef4444' : 'var(--color-text-muted)', marginTop: 8 }}
                    onClick={() => toggleFavorite.mutate(Number(id))}
                  >
                    <Heart size={18} fill={isFavorited ? '#ef4444' : 'transparent'} />
                    {isFavorited ? t('provider.unfavorite') : t('provider.favorite')}
                  </button>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div className="card">
              <h4 style={{ fontWeight: 800, marginBottom: 16, fontSize: '1rem' }}>{t('provider.provider_summary')}</h4>
              {[
                { icon: <Star size={16} className="text-amber-500" />, label: t('provider.avg_rating'), value: `${provider.rating?.toFixed(1)}/5.0` },
                { icon: <Check size={16} className="text-emerald-500" />, label: t('provider.completed_jobs'), value: provider.completed_jobs || 0 },
                { icon: <Clock size={16} className="text-blue-500" />, label: t('provider.experience'), value: `${provider.experience_years ?? provider.years_experience ?? 0} yıl` },
                { icon: <Award size={16} className="text-purple-500" />, label: t('provider.verification'), value: provider.verification_level || provider.verification_status },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid var(--color-border)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-dim)', fontSize: '0.9rem', fontWeight: 500 }}>
                    {item.icon} {item.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.value}</span>
                </div>
              ))}
              
              {provider.response_time_minutes != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                    <Zap size={16} className="text-rose-500" />
                    <span style={{ fontSize: '0.85rem' }}>{t('provider.response_speed')}</span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{provider.response_time_minutes} dk</span>
                </div>
              )}
            </div>

            {/* Buyer Protection Promise */}
            <div className="mt-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
              <div className="flex gap-3">
                <Shield className="text-indigo-600 flex-shrink-0" size={24} />
                <div>
                  <h5 className="font-bold text-indigo-900 text-sm mb-1">{t('provider.guarantee_title')}</h5>
                  <p className="text-xs text-indigo-700/80 leading-relaxed">
                    {t('provider.guarantee_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProviderProfilePage;

