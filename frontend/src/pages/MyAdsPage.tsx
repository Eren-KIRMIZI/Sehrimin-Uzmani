import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Package, Pause, Play, Plus, Tag, Trash2, Pencil } from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import AdCard from '../components/ads/AdCard';
import {
  useDeleteAd,
  useMarkAdSold,
  useMyAds,
  useMyFavoriteAds,
  usePauseAd,
  usePublishAd,
} from '../hooks/useAds';
import { useI18nStore } from '../stores/i18nStore';
import type { AdListItem } from '../types/ads';

const STATUS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Taslak', bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
  PENDING_REVIEW: { label: 'İnceleniyor', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  ACTIVE: { label: 'Aktif', bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  PAUSED: { label: 'Duraklatıldı', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  SOLD: { label: 'Satıldı', bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
  EXPIRED: { label: 'Süresi Doldu', bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
  REJECTED: { label: 'Reddedildi', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

interface ActionRowProps {
  ad: AdListItem;
  onPublish: (id: number) => void;
  onPause: (id: number) => void;
  onMarkSold: (id: number) => void;
  onDelete: (id: number) => void;
}

const ActionRow: React.FC<ActionRowProps> = ({ ad, onPublish, onPause, onMarkSold, onDelete }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
    {(ad.status === 'DRAFT' || ad.status === 'REJECTED') && (
      <Link to={`/ads/${ad.id}/edit`} className="btn btn-outline btn-sm" title="Düzenle">
        <Pencil size={13} /> Düzenle
      </Link>
    )}
    {ad.status === 'DRAFT' || ad.status === 'PAUSED' ? (
      <button className="btn btn-outline btn-sm" onClick={() => onPublish(ad.id)} title="Yayınla">
        <Play size={13} /> Yayınla
      </button>
    ) : ad.status === 'ACTIVE' ? (
      <>
        <button className="btn btn-outline btn-sm" onClick={() => onPause(ad.id)} title="Duraklat">
          <Pause size={13} /> Duraklat
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => onMarkSold(ad.id)} title="Satıldı işaretle">
          <Tag size={13} /> Satıldı
        </button>
      </>
    ) : null}
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => onDelete(ad.id)}
      title="Sil"
      style={{ color: '#ef4444' }}
    >
      <Trash2 size={13} />
    </button>
  </div>
);

const MyAdsPage: React.FC = () => {
  const [tab, setTab] = React.useState<'listings' | 'favorites'>('listings');
  const { data: myListings, isLoading } = useMyAds();
  const { data: favorites, isLoading: favLoading } = useMyFavoriteAds();
  const { language } = useI18nStore();

  const publishAd = usePublishAd();
  const pauseAd = usePauseAd();
  const markSold = useMarkAdSold();
  const deleteAd = useDeleteAd();

  const ads = tab === 'listings' ? myListings?.items : favorites;
  const loading = tab === 'listings' ? isLoading : favLoading;

  return (
    <Layout>
      <SEO title="İlanlarım" description="Verdiğiniz ilanları ve favori ilanlarınızı yönetin." />
      <div className="container" style={{ padding: '32px 24px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontWeight: 900, fontSize: '1.7rem', margin: 0 }}>İlanlarım</h1>
          <Link to="/ads/create" className="btn btn-primary">
            <Plus size={16} /> İlan Ver
          </Link>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
          <button
            className={`btn btn-sm ${tab === 'listings' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('listings')}
          >
            <Package size={14} /> İlanlarım ({myListings?.total ?? 0})
          </button>
          <button
            className={`btn btn-sm ${tab === 'favorites' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('favorites')}
          >
            <Heart size={14} /> Favorilerim ({favorites?.length ?? 0})
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {Array(4)
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
        ) : ads && ads.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {ads.map(ad => (
              <div key={ad.id}>
                <AdCard ad={ad} showStatus={tab === 'listings'} />
                {tab === 'listings' && (
                  <div style={{ padding: '0 4px' }}>
                    <ActionRow
                      ad={ad}
                      onPublish={id => publishAd.mutate(id)}
                      onPause={id => pauseAd.mutate(id)}
                      onMarkSold={id => markSold.mutate(id)}
                      onDelete={id => {
                        const title = language === 'en' ? (ad.title_en || ad.title_tr) : ad.title_tr;
                        if (window.confirm(`"${title}" ilanını silmek istediğinize emin misiniz?`)) {
                          deleteAd.mutate(id);
                        }
                      }}
                    />
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Eye size={11} /> {ad.view_count}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Heart size={11} /> {ad.favorite_count}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>{tab === 'listings' ? '📦' : '♡'}</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
              {tab === 'listings' ? 'Henüz ilan vermediniz' : 'Favori ilanınız yok'}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
              {tab === 'listings'
                ? 'İlk ilanınızı vererek satışa başlayın.'
                : 'İlan detay sayfalarından favorilere ekleyebilirsiniz.'}
            </p>
            <Link to="/ads" className="btn btn-primary">
              {tab === 'listings' ? (
                <>
                  <Plus size={16} /> İlan Ver
                </>
              ) : (
                'İlanlara Göz At'
              )}
            </Link>
          </div>
        )}

        {/* Özet bilgisi */}
        {tab === 'listings' && myListings && myListings.items.length > 0 && (
          <div className="card" style={{ padding: 18, marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {(['ACTIVE', 'PAUSED', 'SOLD'] as const).map(status => {
              const count = myListings.items.filter(a => a.status === status).length;
              const badge = STATUS_BADGES[status];
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                  <strong>{count}</strong>
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>ilan</span>
                </div>
              );
            })}
            <div style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Toplam görüntülenme:{' '}
              <strong>{myListings.items.reduce((sum, a) => sum + a.view_count, 0)}</strong> • Toplam favori:{' '}
              <strong>{myListings.items.reduce((sum, a) => sum + a.favorite_count, 0)}</strong>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyAdsPage;
