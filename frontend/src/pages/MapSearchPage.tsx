import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Shield, MapPin, Filter } from 'lucide-react';
import Layout from '../components/layout/Layout';
import MapComponent from '../components/map/MapComponent';
import { useCategories, useCities } from '../hooks/useQueries';
import { searchApi } from '../services';
import { useQuery } from '@tanstack/react-query';
import { toastApiError } from '../stores/toastStore';
import type { ProviderProfile } from '../types';

const MapSearchPage: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [cityId, setCityId] = useState<number>();
  const [category, setCategory] = useState<string>();
  const [available, setAvailable] = useState<boolean>(false);
  const [lat, setLat] = useState<number>();
  const [lng, setLng] = useState<number>();
  const [locating, setLocating] = useState<boolean>(false);

  const { data: categories } = useCategories();
  const { data: cities } = useCities();

  const locateUser = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error(err);
        setLocating(false);
        toastApiError(err, 'Konum alınamadı. Lütfen tarayıcı izinlerini kontrol edin.');
      }
    );
  };

  const { data, isLoading } = useQuery({
    queryKey: ['map-search', cityId, category, available, lat, lng],
    queryFn: () => searchApi.searchProviders({ city_id: cityId, category, available: available ? true : undefined, lat, lng, limit: 50 }),
  });

  const providers = data?.providers || [];

  return (
    <Layout noFooter>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Left panel */}
        <div style={{
          width: 380, flexShrink: 0,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Filters */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>
              <MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Haritada Uzman Ara
            </h2>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <select className="input" style={{ height: 38 }} value={cityId || ''} onChange={e => setCityId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Tüm Şehirler</option>
                {cities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input" style={{ height: 38 }} value={category || ''} onChange={e => setCategory(e.target.value || undefined)}>
                <option value="">Tüm Kategoriler</option>
                {categories?.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer', marginTop: 4 }}>
                <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} />
                Şu an müsait
              </label>
              <button 
                className="btn btn-outline btn-sm" 
                style={{ width: '100%', marginTop: 4 }}
                onClick={locateUser}
                disabled={locating}
              >
                <MapPin size={14} /> {locating ? 'Konum Bulunuyor...' : lat ? 'Konumuma Yakın' : 'Konumumu Bul'}
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {isLoading ? 'Aranıyor...' : `${providers.length} uzman bulundu`}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 10 }} />
              ))
            ) : providers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📍</div>
                <div>Bu bölgede uzman bulunamadı</div>
              </div>
            ) : (
              providers.map(provider => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  style={{
                    padding: 12, borderRadius: 12, cursor: 'pointer', marginBottom: 8,
                    background: selectedProvider?.id === provider.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-surface-2)',
                    border: `1px solid ${selectedProvider?.id === provider.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    transition: 'all 0.2s',
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'white', fontSize: '1.1rem',
                  }}>
                    {provider.business_name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 2 }}>
                      {provider.business_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{provider.rating?.toFixed(1)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({provider.review_count})</span>
                      {provider.verification_status && provider.verification_status !== 'NONE' && (
                        <Shield size={11} style={{ color: '#10b981' }} />
                      )}
                    </div>
                    {provider.distance_km != null && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {provider.distance_km.toFixed(1)} km uzakta
                      </div>
                    )}
                  </div>
                  {provider.hourly_rate && (
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-light)', flexShrink: 0 }}>
                      ₺{provider.hourly_rate}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Selected provider detail */}
          {selectedProvider && (
            <div style={{
              padding: 16,
              background: 'var(--color-surface-2)',
              borderTop: '1px solid var(--color-border)',
              animation: 'slideIn 0.2s ease',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{selectedProvider.business_name}</div>
              {selectedProvider.bio && (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                  {selectedProvider.bio.slice(0, 100)}...
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  to={`/provider/${selectedProvider.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Profili Gör
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedProvider(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1 }}>
          <MapComponent
            providers={providers}
            onProviderClick={setSelectedProvider}
          />
        </div>
      </div>
    </Layout>
  );
};

export default MapSearchPage;
