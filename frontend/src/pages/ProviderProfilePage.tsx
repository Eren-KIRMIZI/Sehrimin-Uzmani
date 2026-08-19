import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, Shield, MapPin, Clock, TrendingUp, Phone, MessageSquare,
  Heart, ChevronLeft, Calendar, Award, Briefcase, Image, Check,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useProvider, useProviderReviews, useFavorites, useToggleFavorite } from '../hooks/useQueries';
import { useAuthStore } from '../stores/authStore';
import { messagingApi } from '../services';
import { useNavigate } from 'react-router-dom';

const VerificationBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, { color: string; label: string; icon: string }> = {
    NONE: { color: '#64748b', label: 'Doğrulanmamış', icon: '○' },
    BASIC: { color: '#3b82f6', label: 'Temel', icon: '✓' },
    ID: { color: '#8b5cf6', label: 'Kimlik', icon: '✓✓' },
    PROFESSIONAL: { color: '#f59e0b', label: 'Profesyonel', icon: '★' },
    BUSINESS: { color: '#10b981', label: 'İşletme', icon: '🏢' },
  };
  const info = map[level] || map.NONE;
  return (
    <span style={{ color: info.color, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
      <Shield size={13} /> {info.label} Doğrulama
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
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews' | 'portfolio'>('about');
  const [contactLoading, setContactLoading] = useState(false);

  const { data: provider, isLoading } = useProvider(id ? Number(id) : undefined);
  const { data: reviewsData } = useProviderReviews(id ? Number(id) : undefined);
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const isFavorited = favorites?.some((f: any) => f.provider_id === Number(id));

  const handleContact = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setContactLoading(true);
    try {
      const conv = await messagingApi.createConversation(Number(id));
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
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>👤</div>
        <h2>Uzman bulunamadı</h2>
        <Link to="/search" className="btn btn-primary" style={{ marginTop: 16 }}>Geri Dön</Link>
      </div>
    </Layout>
  );

  const reviews = reviewsData?.items || [];

  const tabs = [
    { key: 'about', label: 'Hakkında', icon: <Briefcase size={15} /> },
    { key: 'services', label: 'Hizmetler', icon: <Check size={15} /> },
    { key: 'reviews', label: `Yorumlar (${provider.review_count})`, icon: <Star size={15} /> },
    { key: 'portfolio', label: 'Portföy', icon: <Image size={15} /> },
  ] as const;

  return (
    <Layout>
      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Back */}
        <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24, fontSize: '0.875rem' }}>
          <ChevronLeft size={16} /> Arama sonuçlarına dön
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr min(320px, 100%)', gap: 28, alignItems: 'start' }}>
          {/* Left column */}
          <div>
            {/* Profile header */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.4rem', fontWeight: 700, color: 'white',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
                }}>
                  {provider.avatar_url
                    ? <img src={provider.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    : provider.business_name?.[0]}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <h1 style={{ fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>{provider.business_name}</h1>
                    {provider.badge_type && (
                      <span className="badge badge-primary">
                        {provider.badge_type === 'diamond' ? '💎 Elmas' :
                         provider.badge_type === 'gold' ? '🥇 Altın' :
                         provider.badge_type === 'silver' ? '🥈 Gümüş' : '🥉 Bronz'}
                      </span>
                    )}
                  </div>

                  <VerificationBadge level={provider.verification_level} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StarRating rating={provider.rating} />
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{provider.rating?.toFixed(1)}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({provider.review_count} yorum)</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TrendingUp size={13} /> {provider.completed_jobs} iş
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} /> {provider.years_experience} yıl
                      </span>
                    </div>
                  </div>

                  {provider.locations?.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {provider.locations.slice(0, 3).map(loc => (
                        <span key={loc.id} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
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
                  <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Hakkında</h3>
                  <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                    {provider.bio || 'Bu uzman henüz bir biyografi eklememiş.'}
                  </p>
                  {provider.availability?.length > 0 && (
                    <>
                      <h4 style={{ fontWeight: 700, marginTop: 20, marginBottom: 12 }}>Müsaitlik</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day, i) => {
                          const avail = provider.availability.find(a => a.day_of_week === i);
                          return (
                            <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                              <span style={{ fontWeight: 600 }}>{day}</span>
                              <span style={{ color: avail ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
                                {avail ? `${avail.start_time} - ${avail.end_time}` : 'Müsait Değil'}
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
                      Henüz hizmet eklenmemiş
                    </div>
                  ) : provider.services?.map(s => (
                    <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.service?.name}</div>
                        {s.description && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{s.description}</div>}
                      </div>
                      {s.starting_price && (
                        <div style={{ fontWeight: 700, color: 'var(--color-primary-light)', fontSize: '1.1rem', flexShrink: 0 }}>
                          ₺{s.starting_price}'den başlayan
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Overall rating */}
                  <div className="card" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text)' }}>{provider.rating?.toFixed(1)}</div>
                      <StarRating rating={provider.rating} size={18} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{provider.review_count} yorum</div>
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>
                      Henüz yorum yapılmamış
                    </div>
                  ) : reviews.map((review: any) => (
                    <div key={review.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'var(--color-surface-3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                          }}>
                            {review.customer?.first_name?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                              {review.customer?.first_name} {review.customer?.last_name?.[0]}.
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {new Date(review.created_at).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{review.comment}</p>
                      )}
                      {review.provider_reply && (
                        <div style={{
                          marginTop: 12, padding: 12,
                          background: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          borderRadius: 10,
                        }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-primary-light)', fontWeight: 700, marginBottom: 4 }}>
                            Uzman yanıtı:
                          </div>
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>{review.provider_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {provider.portfolio?.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>
                      Portföy öğesi bulunmuyor
                    </div>
                  ) : provider.portfolio?.map(item => (
                    <div key={item.id} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)', aspectRatio: '1' }}>
                      <img src={item.image_url} alt={item.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              {/* Pricing */}
              {provider.hourly_rate && (
                <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary-light)' }}>
                    ₺{provider.hourly_rate}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>saat başına</div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  id="hire-btn"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleRequest}
                >
                  <Calendar size={16} /> Hizmet Talebi Oluştur
                </button>
                <button
                  id="message-btn"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleContact}
                  disabled={contactLoading}
                >
                  <MessageSquare size={16} />
                  {contactLoading ? 'Yükleniyor...' : 'Mesaj Gönder'}
                </button>
                {isAuthenticated && (
                  <button
                    id="favorite-btn"
                    className={`btn btn-ghost`}
                    style={{ width: '100%', justifyContent: 'center', color: isFavorited ? '#ef4444' : 'var(--color-text-muted)' }}
                    onClick={() => toggleFavorite.mutate(Number(id))}
                  >
                    <Heart size={16} fill={isFavorited ? '#ef4444' : 'transparent'} />
                    {isFavorited ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                  </button>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div className="card">
              <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.9rem' }}>İstatistikler</h4>
              {[
                { icon: <Star size={14} />, label: 'Ortalama Puan', value: `${provider.rating?.toFixed(1)}/5.0` },
                { icon: <TrendingUp size={14} />, label: 'Tamamlanan İş', value: provider.completed_jobs },
                { icon: <Clock size={14} />, label: 'Deneyim', value: `${provider.years_experience} yıl` },
                { icon: <Award size={14} />, label: 'Doğrulama', value: provider.verification_level },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid var(--color-border)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    {item.icon} {item.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProviderProfilePage;
