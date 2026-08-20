import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Eye, Heart, MapPin, Star } from 'lucide-react';
import type { AdListItem } from '../../types/ads';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Taslak', color: '#9ca3af' },
  PENDING_REVIEW: { label: 'İnceleniyor', color: '#f59e0b' },
  ACTIVE: { label: 'Aktif', color: '#10b981' },
  PAUSED: { label: 'Duraklatıldı', color: '#f59e0b' },
  SOLD: { label: 'Satıldı', color: '#6366f1' },
  EXPIRED: { label: 'Süresi Doldu', color: '#9ca3af' },
  REJECTED: { label: 'Reddedildi', color: '#ef4444' },
};

export const formatAdPrice = (ad: Pick<AdListItem, 'price' | 'price_type' | 'currency'>) => {
  if (ad.price_type === 'FREE') return 'Ücretsiz';
  if (ad.price == null) return 'Fiyat sorunuz';
  const formatted = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0,
  }).format(ad.price);
  return `${formatted} ₺`;
};

interface AdCardProps {
  ad: AdListItem;
  showStatus?: boolean;
}

const AdCard: React.FC<AdCardProps> = ({ ad, showStatus = false }) => {
  const status = STATUS_LABELS[ad.status];

  return (
    <Link to={`/ads/${ad.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        className="card glass-hover"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          border: ad.is_featured ? '1px solid rgba(245, 158, 11, 0.5)' : undefined,
        }}
      >
        {/* Foto */}
        <div
          style={{
            width: '100%',
            aspectRatio: '4 / 3',
            background: 'var(--color-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {ad.cover_image ? (
            <img
              src={ad.cover_image}
              alt={ad.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <Camera size={32} color="var(--color-text-dim)" />
          )}
          {ad.image_count > 1 && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,0.65)',
                color: 'white',
                borderRadius: 6,
                fontSize: '0.7rem',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Camera size={11} /> {ad.image_count}
            </span>
          )}
          {ad.is_featured && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                borderRadius: 6,
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Star size={10} fill="white" /> Öne Çıkan
            </span>
          )}
        </div>

        {/* İçerik */}
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-light)' }}>
              {formatAdPrice(ad)}
            </div>
            {showStatus && status && (
              <span className="badge" style={{ background: `${status.color}22`, color: status.color, fontSize: '0.68rem' }}>
                {status.label}
              </span>
            )}
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: '0.92rem',
              lineHeight: 1.35,
              color: 'var(--color-text)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.5em',
            }}
          >
            {ad.title}
          </div>

          <div
            style={{
              marginTop: 'auto',
              paddingTop: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.78rem',
              color: 'var(--color-text-dim)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} />
              {ad.district_name ? `${ad.city_name} / ${ad.district_name}` : ad.city_name || '—'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Eye size={12} /> {ad.view_count}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Heart size={12} /> {ad.favorite_count}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AdCard;
