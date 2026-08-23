import React, { useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, Filter, Grid, List, Star, Shield, MapPin,
  SlidersHorizontal, ChevronDown, X, TrendingUp, Clock,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import { useCategories, useCities, useDistricts } from '../hooks/useQueries';
import { searchApi } from '../services';
import { useQuery } from '@tanstack/react-query';
import type { SearchFilters, ProviderProfile } from '../types';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategory') || undefined,
    city_id: searchParams.get('city_id') ? Number(searchParams.get('city_id')) : undefined,
    district_id: searchParams.get('district_id') ? Number(searchParams.get('district_id')) : undefined,
    min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : undefined,
    verified: searchParams.get('verified') === 'true' || undefined,
    sort: (searchParams.get('sort') as SearchFilters['sort']) || 'recommended',
    page,
    limit: 12,
  });

  const [localQ, setLocalQ] = useState(filters.q || '');
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(filters.city_id);

  const { data: categories } = useCategories();
  const { data: cities } = useCities();
  const { data: districts } = useDistricts(selectedCityId);

  const { data, isLoading } = useQuery({
    queryKey: ['search', filters, page],
    queryFn: () => searchApi.searchProviders({ ...filters, page }),
  });

  // Filtreleri URL'e yaz — paylaşılabilir arama bağlantıları için
  const syncUrl = useCallback((updated: SearchFilters, pageNum: number) => {
    const params = new URLSearchParams();
    if (updated.q) params.set('q', updated.q);
    if (updated.category) params.set('category', updated.category);
    if (updated.subcategory) params.set('subcategory', updated.subcategory);
    if (updated.city_id) params.set('city_id', String(updated.city_id));
    if (updated.district_id) params.set('district_id', String(updated.district_id));
    if (updated.min_rating) params.set('min_rating', String(updated.min_rating));
    if (updated.verified) params.set('verified', 'true');
    if (updated.sort && updated.sort !== 'recommended') params.set('sort', updated.sort);
    if (pageNum > 1) params.set('page', String(pageNum));
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const applyFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setPage(1);
    syncUrl(updated, 1);
  }, [filters, syncUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: localQ || undefined });
  };

  const ProviderListItem: React.FC<{ provider: ProviderProfile }> = ({ provider }) => (
    <Link to={`/provider/${provider.id}`} style={{ textDecoration: 'none' }}>
      <div className="card glass-hover" style={{
        display: 'flex', gap: 20, cursor: 'pointer',
        flexDirection: viewMode === 'grid' ? 'column' : 'row',
        alignItems: viewMode === 'grid' ? 'stretch' : 'center',
      }}>
        {/* Avatar */}
        <div style={{
          width: viewMode === 'grid' ? 64 : 56, height: viewMode === 'grid' ? 64 : 56,
          borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 700, color: 'white',
        }}>
          {provider.business_name?.[0] || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{provider.business_name}</div>
              {provider.verification_status && provider.verification_status !== 'NONE' && (
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                  <Shield size={12} /> Doğrulanmış
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} fill={i <= Math.round(provider.rating) ? '#f59e0b' : 'transparent'} color={i <= Math.round(provider.rating) ? '#f59e0b' : '#374151'} />
                ))}
                <span style={{ fontWeight: 700 }}>{provider.rating?.toFixed(1)}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>({provider.review_count})</span>
              </div>
              {provider.hourly_rate && (
                <div style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                  ₺{provider.hourly_rate}/saat
                </div>
              )}
            </div>
          </div>

          {provider.bio && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 8, lineHeight: 1.5 }}>
              {provider.bio.length > 120 ? provider.bio.slice(0, 120) + '...' : provider.bio}
            </p>
          )}

          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {provider.completed_jobs} tamamlanan iş
            </span>
            {provider.locations?.[0] && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {typeof provider.locations[0].city === 'object' ? provider.locations[0].city?.name : provider.locations[0].city}{provider.locations[0].district ? `, ${typeof provider.locations[0].district === 'object' ? provider.locations[0].district?.name : provider.locations[0].district}` : ''}
              </span>
            )}
          </div>

          {provider.services?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
              {provider.services.slice(0, 4).map((s: any, idx: number) => (
                <span key={idx} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                  {s.name || s.service?.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  const SkeletonItem = () => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '40%', height: 12 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: 12 }} />
      <div className="skeleton" style={{ width: '80%', height: 12 }} />
    </div>
  );

  return (
    <Layout>
      <SEO 
        title={filters.q ? `${filters.q} Arama Sonuçları` : "Uzman Ara"}
        description="Şehrinin Uzmanı'nda ihtiyaçlarınıza en uygun profesyonelleri bulun ve hizmet alın."
      />
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '24px 0' }}>
        <div className="container">
          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
              <input
                id="search-input"
                className="input"
                value={localQ}
                onChange={e => setLocalQ(e.target.value)}
                placeholder="Hizmet veya uzman ara..."
                style={{ paddingLeft: 46, height: 48 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 48, paddingLeft: 24, paddingRight: 24 }}>
              Ara
            </button>
            <button
              type="button"
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
              style={{ height: 48 }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={16} /> Filtreler
            </button>
          </form>

          {/* Filter row */}
          {showFilters && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'fadeIn 0.2s ease' }}>
              {/* Category */}
              <select
                className="input"
                style={{ width: 180, height: 40 }}
                value={filters.category || ''}
                onChange={e => applyFilters({ category: e.target.value || undefined })}
              >
                <option value="">Tüm Kategoriler</option>
                {categories?.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>

              {/* City */}
              <select
                className="input"
                style={{ width: 160, height: 40 }}
                value={filters.city_id || ''}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedCityId(id);
                  applyFilters({ city_id: id, district_id: undefined });
                }}
              >
                <option value="">Tüm Şehirler</option>
                {cities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {/* District */}
              {selectedCityId && (
                <select
                  className="input"
                  style={{ width: 160, height: 40 }}
                  value={filters.district_id || ''}
                  onChange={e => applyFilters({ district_id: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Tüm İlçeler</option>
                  {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}

              {/* Min rating */}
              <select
                className="input"
                style={{ width: 150, height: 40 }}
                value={filters.min_rating || ''}
                onChange={e => applyFilters({ min_rating: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Min. Puan</option>
                {[3, 3.5, 4, 4.5].map(r => <option key={r} value={r}>{r}+ ⭐</option>)}
              </select>

              {/* Verified */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={!!filters.verified}
                  onChange={e => applyFilters({ verified: e.target.checked || undefined })}
                  style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                />
                Sadece Doğrulanmış
              </label>

              {/* Sort */}
              <select
                className="input"
                style={{ width: 180, height: 40 }}
                value={filters.sort || 'recommended'}
                onChange={e => applyFilters({ sort: e.target.value as SearchFilters['sort'] })}
              >
                <option value="recommended">Önerilen</option>
                <option value="rating">En Yüksek Puan</option>
                <option value="reviews">En Çok Yorum</option>
                <option value="newest">En Yeni</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isLoading ? 'Yükleniyor...' : `${data?.total || 0} uzman bulundu`}
            {filters.q && <span> — "<strong style={{ color: 'var(--color-text)' }}>{filters.q}</strong>"</span>}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              id="view-grid-btn"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: 8 }}
            >
              <Grid size={16} />
            </button>
            <button
              id="view-list-btn"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              style={{ padding: 8 }}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', gap: 16 }}>
            {Array(6).fill(0).map((_, i) => <SkeletonItem key={i} />)}
          </div>
        ) : data?.providers?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Sonuç Bulunamadı</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Farklı anahtar kelimeler veya filtreler deneyin</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', gap: 16 }}>
            {data?.providers?.map(provider => (
              <ProviderListItem key={provider.id} provider={provider} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 12 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 1}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                syncUrl(filters, p);
              }}
            >
              ← Önceki
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '0 12px' }}>
              Sayfa {page} / {Math.ceil(data.total / 12)}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={!data.has_next}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                syncUrl(filters, p);
              }}
            >
              Sonraki →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
