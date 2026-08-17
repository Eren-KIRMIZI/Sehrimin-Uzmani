import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Star, Shield, Filter, X, ChevronDown, Grid, List } from 'lucide-react';
import api from '../services/api';
import type { ProviderProfile, Category, City } from '../types';
import { useLocationStore } from '../stores/locationStore';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity, setSelectedCity } = useLocationStore();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minRating: searchParams.get('min_rating') || '',
    verified: searchParams.get('verified') || '',
    sort: searchParams.get('sort') || 'recommended',
  });

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/locations/cities').then(res => setCities(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [searchParams, page, filters]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedCity) params.set('city_id', String(selectedCity.id));
      if (filters.category) params.set('category', filters.category);
      if (filters.minRating) params.set('min_rating', filters.minRating);
      if (filters.verified) params.set('verified', 'true');
      params.set('sort', filters.sort);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await api.get(`/search/providers?${params.toString()}`);
      setProviders(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCity) params.set('city_id', String(selectedCity.id));
    if (filters.category) params.set('category', filters.category);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Search Bar */}
      <div className="bg-white border-b border-border-light sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-bg rounded-xl px-4">
              <Search className="w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Uzman ara..."
                className="w-full py-3 text-sm outline-none bg-transparent"
              />
            </div>
            <select
              value={selectedCity?.id || ''}
              onChange={(e) => {
                const city = cities.find(c => c.id === Number(e.target.value));
                setSelectedCity(city ? { id: city.id, name: city.name } : null);
              }}
              className="px-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light"
            >
              <option value="">Tüm Şehirler</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={handleSearch} className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">
              Ara
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-primary">
              {total} uzman bulundu
            </h1>
            {selectedCity && (
              <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {selectedCity.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border-light text-sm hover:border-accent transition-colors">
              <Filter className="w-4 h-4" /> Filtrele
            </button>
            <div className="flex bg-white rounded-xl border border-border-light overflow-hidden">
              <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-accent text-white' : ''}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-accent text-white' : ''}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-6 mb-6 border border-border-light fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Kategori</label>
                <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))} className="w-full p-2.5 bg-bg rounded-xl text-sm outline-none">
                  <option value="">Tümü</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Minimum Puan</label>
                <select value={filters.minRating} onChange={(e) => setFilters(f => ({ ...f, minRating: e.target.value }))} className="w-full p-2.5 bg-bg rounded-xl text-sm outline-none">
                  <option value="">Tümü</option>
                  <option value="4">4+ ⭐</option>
                  <option value="4.5">4.5+ ⭐</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Sıralama</label>
                <select value={filters.sort} onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))} className="w-full p-2.5 bg-bg rounded-xl text-sm outline-none">
                  <option value="recommended">Önerilen</option>
                  <option value="rating">En Yüksek Puan</option>
                  <option value="reviews">En Çok Yorum</option>
                  <option value="newest">En Yeni</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Doğrulama</label>
                <select value={filters.verified} onChange={(e) => setFilters(f => ({ ...f, verified: e.target.value }))} className="w-full p-2.5 bg-bg rounded-xl text-sm outline-none">
                  <option value="">Tümü</option>
                  <option value="true">Doğrulanmış</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-border-light">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl skeleton" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 skeleton" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-3 skeleton" />
                    <div className="h-2 bg-gray-200 rounded w-1/4 skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-primary mb-2">Sonuç bulunamadı</h3>
            <p className="text-text-muted">Filtrelerinizi değiştirmeyi deneyin</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {providers.map((provider) => (
              <Link
                key={provider.id}
                to={`/provider/${provider.id}`}
                className={`bg-white rounded-2xl border border-border-light hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  view === 'grid' ? 'p-6' : 'p-4 flex items-center gap-6'
                }`}
              >
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-lg">
                    {provider.user?.first_name?.[0]}{provider.user?.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-primary truncate">
                      {provider.business_name || `${provider.user?.first_name} ${provider.user?.last_name}`}
                    </h3>
                    {provider.verification_status !== 'NONE' && (
                      <Shield className="w-4 h-4 text-accent flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-medium">{provider.rating}</span>
                    <span className="text-text-muted text-sm">· {provider.review_count} yorum</span>
                    <span className="text-text-muted text-sm">· {provider.completed_jobs} iş</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-sm text-text-muted">
                    <MapPin className="w-3 h-3" />
                    {provider.locations?.[0]?.city || 'Konum belirtilmemiş'}
                  </div>
                  {provider.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.services.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-bg rounded text-xs text-text-muted">{s.service_name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.min(Math.ceil(total / 12), 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                  p === page ? 'bg-accent text-white' : 'bg-white border border-border-light hover:border-accent'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
