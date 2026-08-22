import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ProviderProfile } from '../../types';
import { Star, MapPin } from 'lucide-react';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = (rating: number) => L.divIcon({
  className: '',
  html: `<div style="
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white; border-radius: 50%; width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 12px; border: 2px solid white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
    ">${rating.toFixed(1)}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

interface MapComponentProps {
  providers: ProviderProfile[];
  center?: [number, number];
  zoom?: number;
  onProviderClick?: (provider: ProviderProfile) => void;
}

// Component to fly to center when it changes
const FlyToCenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({
  providers,
  center = [39.9, 32.8], // Turkey center
  zoom = 6,
  onProviderClick,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '100%', minHeight: 400 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToCenter center={center} zoom={zoom} />

      {providers.map((provider) => {
        const location = provider.locations?.[0];
        if (!location?.latitude || !location?.longitude) return null;
        
        const lat = location.latitude;
        const lng = location.longitude;

        return (
          <Marker
            key={provider.id}
            position={[lat, lng]}
            icon={customIcon(provider.rating)}
            eventHandlers={{
              click: () => onProviderClick?.(provider),
            }}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: '#e2e8f0' }}>
                  {provider.business_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <span style={{ color: '#f59e0b' }}>★</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{provider.rating.toFixed(1)}</span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({provider.review_count})</span>
                </div>
                {provider.hourly_rate && (
                  <div style={{ color: '#6366f1', fontWeight: 700 }}>
                    ₺{provider.hourly_rate}/saat
                  </div>
                )}
                <a
                  href={`/provider/${provider.id}`}
                  style={{
                    display: 'block', marginTop: 8,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: 'white', padding: '6px 12px', borderRadius: 8,
                    textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600,
                  }}
                >
                  Profili Gör
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;
