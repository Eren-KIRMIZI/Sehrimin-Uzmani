import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Shield, Clock, ChevronRight, Zap, MapPin, TrendingUp, Tag, Home, Wrench, Heart, BookOpen, Users, Dog, Car, Truck, Briefcase, Building, Calendar, Monitor, Sparkles, Box, Activity } from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import { useCategories, useRecommendations, useCities } from '../hooks/useQueries';
import { useAds } from '../hooks/useAds';
import { searchApi } from '../services';
import { Link } from 'react-router-dom';
import AdCard from '../components/ads/AdCard';

// Category icon map
const getCategoryIcon = (slug: string) => {
  const props = { size: 32, strokeWidth: 1.5 };
  switch (slug) {
    case 'ev-ve-yasam': return <Home {...props} />;
    case 'teknik-hizmetler': return <Wrench {...props} />;
    case 'saglik-ve-wellness': return <Heart {...props} />;
    case 'egitim': return <BookOpen {...props} />;
    case 'cocuk-ve-yasli-bakimi': return <Users {...props} />;
    case 'evcil-hayvan': return <Dog {...props} />;
    case 'arac': return <Car {...props} />;
    case 'tasimacilik': return <Truck {...props} />;
    case 'profesyonel-hizmetler': return <Briefcase {...props} />;
    case 'gayrimenkul': return <Building {...props} />;
    case 'etkinlik-ve-organizasyon': return <Calendar {...props} />;
    case 'dijital-hizmetler': return <Monitor {...props} />;
    case 'guzellik': return <Sparkles {...props} />;
    case 'spor-ve-fitness': return <Activity {...props} />;
    default: return <Box {...props} />;
  }
};

// ── İlanlar Vitrin Bileşeni ──────────────────────────────────────────────────
const AD_CATEGORY_TABS = [
  { label: 'Tümü', slug: undefined },
  { label: '🚗 Vasıta', slug: 'vasita' },
  { label: '🏠 Emlak', slug: 'emlak' },
  { label: '💻 Elektronik', slug: 'elektronik' },
  { label: '🪑 Ev & Yaşam', slug: 'ev-yasam' },
  { label: '🔧 Hizmet', slug: 'hizmet-ilan' },
];

const AdsShowcase: React.FC = () => {
  const [activeSlug, setActiveSlug] = useState<string | undefined>(undefined);
  const { data, isLoading } = useAds({ sort: 'newest', limit: 8, category: activeSlug });

  return (
    <section style={{ padding: '72px 0', background: 'var(--color-bg)' }}>
      <div className="container">
        {/* Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={18} color="white" />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: '1.7rem', margin: 0 }}>İlanlar</h2>
            </div>
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.95rem' }}>
              Şehrindeki yeni ilanları keşfet
            </p>
          </div>
          <Link to="/ads" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Tüm İlanlara Bak <ChevronRight size={14} />
          </Link>
        </div>

        {/* Kategori Tab'ları */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {AD_CATEGORY_TABS.map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveSlug(tab.slug)}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: activeSlug === tab.slug ? 700 : 500,
                background: activeSlug === tab.slug
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'var(--color-surface-2)',
                color: activeSlug === tab.slug ? 'white' : 'var(--color-text-muted)',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="card" style={{ overflow: 'hidden' }}>
                <div className="skeleton" style={{ aspectRatio: '4/3' }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '85%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ) : data?.items?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
            <p>Bu kategoride henüz ilan yok.</p>
            <Link to="/ads/create" className="btn btn-primary" style={{ marginTop: 12 }}>
              İlk ilanı sen ver
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
            {data?.items?.map(ad => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}

        {/* Alt CTA */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/ads/create" className="btn btn-outline" style={{ marginRight: 12 }}>
            ✏️ İlan Ver
          </Link>
          <Link to="/ads" className="btn btn-primary">
            Tüm İlanları Gör
          </Link>
        </div>
      </div>
    </section>
  );
};
// ────────────────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12 }} />
    <div className="skeleton" style={{ width: '70%', height: 16 }} />
    <div className="skeleton" style={{ width: '50%', height: 14 }} />
  </div>
);

const ProviderCard: React.FC<{ provider: any }> = ({ provider }) => (
  <Link to={`/provider/${provider.id}`} style={{ textDecoration: 'none' }}>
    <div className="card provider-card glass-hover" style={{ cursor: 'pointer' }}>
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 700, color: 'white',
        }}>
          {provider.avatar_url
            ? <img src={provider.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            : provider.business_name?.[0] || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>
            {provider.business_name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {provider.verification_level !== 'NONE' && (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={12} /> Doğrulanmış
              </span>
            )}
          </div>
        </div>
        {provider.badge_type && (
          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
            {provider.badge_type === 'diamond' ? '💎' :
             provider.badge_type === 'gold' ? '🥇' :
             provider.badge_type === 'silver' ? '🥈' : '🥉'}
            {provider.badge_type}
          </span>
        )}
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 1 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={14}
              fill={i <= Math.round(provider.rating) ? '#f59e0b' : 'transparent'}
              color={i <= Math.round(provider.rating) ? '#f59e0b' : '#374151'} />
          ))}
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{provider.rating?.toFixed(1)}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>({provider.review_count})</span>
      </div>

      {/* Services preview */}
      {provider.services?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {provider.services.slice(0, 3).map((s: any) => (
            <span key={s.id} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              {s.service?.name || s.name}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} /> {provider.completed_jobs} iş
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {provider.years_experience} yıl
          </span>
        </div>
        {provider.hourly_rate && (
          <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
            ₺{provider.hourly_rate}<span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/saat</span>
          </span>
        )}
      </div>
    </div>
  </Link>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);

  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: recommended, isLoading: recLoading } = useRecommendations();
  const { data: cities } = useCities();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setDetecting(true);
    try {
      const result = await searchApi.detect(query);
      const params = new URLSearchParams({ q: query });
      if (result.detected) {
        if (result.category_slug) params.set('category', result.category_slug);
        if (result.subcategory_slug) params.set('subcategory', result.subcategory_slug);
      }
      navigate(`/search?${params.toString()}`);
    } catch {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } finally {
      setDetecting(false);
    }
  };

  const popularCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Nevşehir', 'Kayseri', 'Aksaray', 'Konya'];

  return (
    <Layout>
      <SEO 
        title="Ana Sayfa" 
        description="Şehrinin Uzmanı ile ihtiyacınız olan tüm hizmetler için güvenilir uzmanları bulun. Temizlik, tamirat, nakliyat ve daha fazlası."
      />
      {/* HERO */}
      <section className="hero-gradient" style={{ padding: '100px 0 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: -100, left: '20%', width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: '10%', width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(245, 158, 11, 0.05)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          {/* Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 999, padding: '6px 16px',
              fontSize: '0.82rem', color: 'var(--color-primary-light)',
              fontWeight: 600,
            }}>
              <Zap size={13} fill="currentColor" />
              AI destekli uzman eşleştirme
            </div>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900,
            lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em',
          }}>
            Şehrindeki En İyi <br />
            <span className="gradient-text">Uzmanları</span> Keşfet
          </h1>

          <p style={{
            fontSize: '1.15rem', color: 'var(--color-text-muted)',
            maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7,
          }}>
            Elektrik, tesisat, temizlik, eğitim ve daha fazlası — ihtiyacın olan uzmanı dakikalar içinde bul, teklif al, işini tamamla.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-text-dim)', pointerEvents: 'none',
              }} />
              <input
                id="hero-search"
                className="input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ne arıyorsunuz? (Örn: Kombi bakımı, Elektrikçi...)"
                style={{ paddingLeft: 50, height: 56, fontSize: '1rem', borderRadius: 16 }}
              />
            </div>
            <button
              id="hero-search-btn"
              type="submit"
              className="btn btn-primary"
              style={{ height: 56, paddingLeft: 28, paddingRight: 28, borderRadius: 16, fontSize: '1rem', flexShrink: 0 }}
              disabled={detecting}
            >
              {detecting ? <div className="spinner" style={{ width: 20, height: 20 }} /> : 'Ara'}
            </button>
          </form>

          {/* Popular searches */}
          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>Popüler:</span>
            {['Elektrikçi', 'Tesisatçı', 'Temizlik', 'Kombi Bakımı', 'Nakliyat', 'Psikolog'].map(term => (
              <button
                key={term}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: 999 }}
                onClick={() => {
                  setQuery(term);
                  navigate(`/search?q=${encodeURIComponent(term)}`);
                }}
              >
                {term}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 40, justifyContent: 'center', marginTop: 56,
            flexWrap: 'wrap',
          }}>
            {[
              { value: '10,000+', label: 'Uzman' },
              { value: '81', label: 'Şehir' },
              { value: '150+', label: 'Hizmet' },
              { value: '4.8★', label: 'Ortalama Puan' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(135deg, #6366f1, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '2rem', marginBottom: 48 }}>
            Nasıl Çalışır?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {[
              { num: '01', icon: '🔍', title: 'Hizmet Seç', desc: 'İhtiyacın olan hizmet kategorisini belirle ya da doğal dilde yaz' },
              { num: '02', icon: '👥', title: 'Uzman Bul', desc: 'Puanlı ve doğrulanmış uzmanları karşılaştır, yorumları oku' },
              { num: '03', icon: '💬', title: 'Teklif Al', desc: 'Uzmanlardan teklif al, fiyat ve süreyi karşılaştır' },
              { num: '04', icon: '✅', title: 'Tamamla', desc: 'Randevu oluştur, hizmeti tamamla, değerlendirme yap' },
            ].map(step => (
              <div key={step.num} style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 72, height: 72, borderRadius: 20, fontSize: '1.8rem',
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                  marginBottom: 16, position: 'relative',
                }}>
                  {step.icon}
                  <div style={{
                    position: 'absolute', top: -8, right: -8,
                    background: 'var(--color-primary)', color: 'white',
                    borderRadius: 6, padding: '2px 6px', fontSize: '0.7rem', fontWeight: 800,
                  }}>
                    {step.num}
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.8rem' }}>Hizmet Kategorileri</h2>
            <Link to="/search" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          {catLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {categories?.slice(0, 14).map(cat => (
                <Link
                  key={cat.id}
                  to={`/search?category=${cat.slug}`}
                  style={{ textDecoration: 'none', display: 'flex' }}
                >
                  <div className="card glass-hover" style={{
                    flex: 1,
                    textAlign: 'center', cursor: 'pointer',
                    padding: 24, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 16,
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05))',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-primary-light)',
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)'
                    }}>
                      {getCategoryIcon(cat.slug)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      {cat.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PROVIDERS */}
      <section className="section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 4 }}>Öne Çıkan Uzmanlar</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                En yüksek puanlı ve doğrulanmış uzmanlar
              </p>
            </div>
            <Link to="/search?sort=recommended" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          {recLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {recommended?.providers?.slice(0, 8).map((provider: any) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CITIES */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 12, textAlign: 'center' }}>
            Türkiye'nin Her Şehrinde
          </h2>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 40 }}>
            81 ilde binlerce doğrulanmış uzman sizi bekliyor
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {popularCities.map(city => (
              <Link
                key={city}
                to={`/search?q=${encodeURIComponent(city)}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 999, padding: '10px 20px',
                  color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.9rem',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-primary-light)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99, 102, 241, 0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
                }}>
                  <MapPin size={14} /> {city}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── İLANLAR VİTRİN ─────────────────────────────────────────────── */}
      <AdsShowcase />

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05))',
        borderTop: '1px solid rgba(99, 102, 241, 0.15)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
        padding: '80px 0',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 16 }}>
            Uzman mısın? Platforma Katıl!
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: '1rem' }}>
            Şehrindeki müşterilere ulaş, işini büyüt, kazancını artır.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Uzman Olarak Kayıt Ol
            </Link>
            <Link to="/pricing" className="btn btn-outline btn-lg">
              Planları İncele
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
