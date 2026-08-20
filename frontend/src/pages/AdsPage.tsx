import React, { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import AdCard from '../components/ads/AdCard';
import { useCities, useDistricts } from '../hooks/useQueries';
import { useAdCategories, useAds } from '../hooks/useAds';
import type { AdFilters } from '../types/ads';

const AdsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<AdFilters>({
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    city_id: searchParams.get('city_id') ? Number(searchParams.get('city_id')) : undefined,
    sort: 'newest',
    page: 1,
    limit: 12,
  });

  const [localQ, setLocalQ] = useState(filters.q || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(filters.city_id);

  const { data: categories } = useAdCategories();
  const { data: cities } = useCities();
  const { data: districts } = useDistricts(selectedCityId);
  const { data, isLoading } = useAds({ ...filters, page });

  const rootCategories = (categories || []).filter(c => !c.parent_id);
  const childrenOf = (parentId: number) => (categories || []).filter(c => c.parent_id === parentId);
  const activeRoot = filters.category
    ? rootCategories.find(r => childrenOf(r.id).some(ch => ch.slug === filters.category)) ||
      rootCategories.find(r => r.slug === filters.category)
    : undefined;

  const applyFilters = useCallback(
    (patch: Partial<AdFilters>) => {
      setFilters(prev => ({ ...prev, ...patch, page: 1 }));
      setPage(1);
    },
    []
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: localQ.trim() || undefined });
  };

  const handleCategoryClick = (slug?: string) => {
    applyFilters({ category: slug });
    setShowFiltersMobile(false);
  };

  const handlePriceApply = () => {
    applyFilters({
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  const SidebarContent = (
    <>
      {/* Kategoriler */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Kategoriler
        </div>
        <div
          onClick={() => handleCategoryClick(undefined)}
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: !filters.category ? 700 : 400,
            color: !filters.category ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
            background: !filters.category ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
          }}
        >
          Tüm İlanlar
        </div>
        {rootCategories.map(cat => (
          <div key={cat.id}>
            <div
              onClick={() =>
                handleCategoryClick(childrenOf(cat.id).length ? undefined : cat.slug)
              }
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeRoot?.id === cat.id ? 700 : 400,
                color: activeRoot?.id === cat.id ? 'var(--color-primary-light)' : 'var(--color-text)',
                background:
                  activeRoot?.id === cat.id && !filters.category
                    ? 'rgba(99, 102, 241, 0.1)'
                    : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{cat.icon}</span> {cat.name}
            </div>
            {activeRoot?.id === cat.id &&
              childrenOf(cat.id).map(sub => (
                <div
                  key={sub.id}
                  onClick={() => handleCategoryClick(sub.slug)}
                  style={{
                    padding: '6px 10px 6px 34px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color:
                      filters.category === sub.slug
                        ? 'var(--color-primary-light)'
                        : 'var(--color-text-muted)',
                    fontWeight: filters.category === sub.slug ? 700 : 400,
                    background:
                      filters.category === sub.slug ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  }}
                >
                  <ChevronRight size={12} /> {sub.name}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Konum */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          İl / İlçe
        </div>
        <select
          className="input"
          style={{ width: '100%', marginBottom: 8 }}
          value={selectedCityId || ''}
          onChange={e => {
            const id = e.target.value ? Number(e.target.value) : undefined;
            setSelectedCityId(id);
            applyFilters({ city_id: id, district_id: undefined });
          }}
        >
          <option value="">Tüm İller</option>
          {cities?.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {selectedCityId && (
          <select
            className="input"
            style={{ width: '100%' }}
            value={filters.district_id || ''}
            onChange={e =>
              applyFilters({ district_id: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">Tüm İlçeler</option>
            {districts?.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Fiyat */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Fiyat
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
          <span style={{ color: 'var(--color-text-dim)' }}>—</span>
          <input
            className="input"
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={handlePriceApply}>
          Uygula
        </button>
      </div>

      {/* Durum */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Durumu
        </div>
        {(['NEW', 'LIKE_NEW', 'GOOD', 'USED'] as const).map(cond => (
          <label
            key={cond}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '4px 0',
              fontSize: '0.88rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <input
              type="radio"
              name="condition"
              checked={filters.condition === cond}
              onChange={() =>
                applyFilters({ condition: filters.condition === cond ? undefined : cond })
              }
              style={{ accentColor: 'var(--color-primary)' }}
            />
            {{ NEW: 'Sıfır', LIKE_NEW: 'Sıfır Ayarında', GOOD: 'İyi', USED: 'Kullanılmış' }[cond]}
          </label>
        ))}
      </div>
    </>
  );

  return (
    <Layout>
      <SEO title="İlanlar" description="Şehrindeki ürün ve hizmet ilanlarını keşfet." />

      {/* Hero + Arama */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontWeight: 900, fontSize: '2rem', margin: 0 }}>İlanlar</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 20 }}>
            Aradığın ürünü, hizmeti veya fırsatı bul
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 720 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-dim)',
                }}
              />
              <input
                className="input"
                value={localQ}
                onChange={e => setLocalQ(e.target.value)}
                placeholder="Ne arıyorsun? (Örn: iPhone 15, koltuk, bisiklet)"
                style={{ paddingLeft: 46, height: 48 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 48, paddingLeft: 28, paddingRight: 28 }}>
              Ara
            </button>
          </form>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Sidebar (desktop) */}
          <aside
            className="ads-sidebar"
            style={{
              width: 240,
              flexShrink: 0,
              position: 'sticky',
              top: 80,
            }}
          >
            {SidebarContent}
          </aside>

          {/* Sonuçlar */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {isLoading ? 'Yükleniyor...' : `${data?.total ?? 0} ilan bulundu`}
                {filters.q && (
                  <span>
                    {' '}
                    — "<strong style={{ color: 'var(--color-text)' }}>{filters.q}</strong>"
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn-outline btn-sm ads-filter-toggle"
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                >
                  <SlidersHorizontal size={14} /> Filtreler
                </button>
                <select
                  className="input"
                  style={{ width: 170, height: 36 }}
                  value={filters.sort || 'newest'}
                  onChange={e => applyFilters({ sort: e.target.value as AdFilters['sort'] })}
                >
                  <option value="newest">Yeni İlanlar</option>
                  <option value="oldest">Eski İlanlar</option>
                  <option value="price_asc">Artan Fiyat</option>
                  <option value="price_desc">Azalan Fiyat</option>
                </select>
              </div>
            </div>

            {/* Mobil filtre paneli */}
            {showFiltersMobile && (
              <div
                className="card ads-mobile-filters"
                style={{ padding: 20, marginBottom: 20, animation: 'fadeIn 0.2s ease', position: 'relative' }}
              >
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
                {SidebarContent}
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="card" style={{ overflow: 'hidden' }}>
                      <div className="skeleton" style={{ aspectRatio: '4 / 3' }} />
                      <div style={{ padding: 14 }}>
                        <div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: '90%', height: 12 }} />
                      </div>
                    </div>
                  ))}
              </div>
            ) : data?.items?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📦</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>İlan bulunamadı</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
                  Filtreleri değiştirerek tekrar deneyin ya da ilk ilanı siz verin.
                </p>
                <Link to="/ads/create" className="btn btn-primary">
                  <Plus size={16} /> İlan Ver
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {data?.items?.map(ad => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            )}

            {/* Sayfalama */}
            {data && data.total > (data.limit || 12) && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Önceki
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '0 12px' }}>
                  Sayfa {page} / {Math.ceil(data.total / (data.limit || 12))}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={!data.has_next}
                  onClick={() => setPage(p => p + 1)}
                >
                  Sonraki →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdsPage;
