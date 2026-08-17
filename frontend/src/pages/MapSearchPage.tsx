import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Star, Shield, Filter, X } from 'lucide-react';
import api from '../services/api';
import MapView from '../components/map/MapView';
import type { ProviderProfile, Category, City } from '../types';
import { useLocationStore } from '../stores/locationStore';

export default function MapSearchPage() {
  const [searchParams] = useSearchParams();
  const { selectedCity, setSelectedCity } = useLocationStore();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/locations/cities').then(res => setCities(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [selectedCity]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (selectedCity) params.set('city_id', String(selectedCity.id));
      params.set('limit', '50');
      const res = await api.get(`/search/providers?${params.toString()}`);
      setProviders(res.data.items || []);
    } catch {
      setProviders([]);
      setSearchError('Arama sirasinda bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProviders();
  };

  const mapMarkers = providers
    .filter(p => p.latitude && p.longitude)
    .map(p => ({
      id: p.id,
      lat: p.latitude!,
      lng: p.longitude!,
      name: p.business_name || `${p.user?.first_name} ${p.user?.last_name}`,
      rating: p.rating,
    }));

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
              <option value="">Tum Sehirler</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={handleSearch} className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">
              Ara
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-primary">{providers.length} uzman bulundu</h1>
          <Link to="/search" className="text-accent text-sm font-medium">Liste Gorunumu</Link>
        </div>

        {/* Map + List Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Provider List */}
          <div className="lg:col-span-2 overflow-y-auto space-y-3 pr-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-border-light">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 skeleton" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 skeleton" />
                </div>
              ))
            ) : providers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-text-muted">Sonuc bulunamadi</p>
              </div>
            ) : (
              providers.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className={`bg-white rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md ${
                    selectedProvider?.id === provider.id ? 'border-accent shadow-md' : 'border-border-light'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-accent font-bold">
                        {provider.user?.first_name?.[0]}{provider.user?.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {provider.business_name || `${provider.user?.first_name} ${provider.user?.last_name}`}
                        </h3>
                        {provider.verification_status !== 'NONE' && (
                          <Shield className="w-3 h-3 text-accent flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        <span className="text-xs font-medium">{provider.rating}</span>
                        <span className="text-xs text-text-muted">{provider.review_count} yorum</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                        <MapPin className="w-3 h-3" />
                        {provider.locations?.[0]?.city || 'Konum yok'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <MapView
              markers={mapMarkers}
              center={selectedCity ? [38.9637, 35.2433] : [39.9334, 32.8597]}
              zoom={selectedCity ? 10 : 6}
              onMarkerClick={(id) => {
                const p = providers.find(pr => pr.id === id);
                if (p) setSelectedProvider(p);
              }}
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
