import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Marker {
  id: number;
  lat: number;
  lng: number;
  name: string;
  rating?: number;
  category?: string;
}

interface MapViewProps {
  markers: Marker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: number) => void;
  height?: string;
}

export default function MapView({ markers, center = [38.9637, 35.2433], zoom = 6, onMarkerClick, height = '400px' }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    markersLayer.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();

    markers.forEach((marker) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${marker.category === 'urgent' ? '#E17055' : '#6C5CE7'};
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          text-align: center;
        ">
          ${marker.name}
          ${marker.rating ? `<br><span style="font-size:10px">★ ${marker.rating}</span>` : ''}
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [60, 30],
      });

      const m = L.marker([marker.lat, marker.lng], { icon });

      if (onMarkerClick) {
        m.on('click', () => onMarkerClick(marker.id));
      }

      m.bindPopup(`
        <div style="min-width:150px">
          <strong>${marker.name}</strong>
          ${marker.rating ? `<br>★ ${marker.rating}` : ''}
          ${marker.category ? `<br><small>${marker.category}</small>` : ''}
        </div>
      `);

      markersLayer.current!.addLayer(m);
    });

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden' }}
      className="border border-border-light"
    />
  );
}
