import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck, Camera, ChevronRight, Eye, Flag, Heart, MapPin,
  MessageSquare, Phone, Shield, Star,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import AdCard from '../components/ads/AdCard';
import { useAd, useContactAdSeller, useReportAd, useSimilarAds, useToggleAdFavorite } from '../hooks/useAds';
import { useAuthStore } from '../stores/authStore';

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Sıfır',
  LIKE_NEW: 'Sıfır Ayarında',
  GOOD: 'İyi',
  USED: 'Kullanılmış',
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  FIXED: 'Sabit Fiyat',
  NEGOTIABLE: 'Fiyat Pazarlıklı',
  FREE: 'Ücretsiz',
};

const AdDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: ad, isLoading } = useAd(id ? Number(id) : undefined);
  const { data: similar } = useSimilarAds(id ? Number(id) : undefined);
  const toggleFavorite = useToggleAdFavorite();
  const contactSeller = useContactAdSeller();
  const reportAd = useReportAd();

  const [selectedImage, setSelectedImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    action();
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!ad) {
    return (
      <Layout>
        <div className="container" style={{ textAlign: 'center', padding: '100px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontWeight: 700 }}>İlan bulunamadı</h2>
          <Link to="/ads" className="btn btn-primary" style={{ marginTop: 20 }}>
            Tüm İlanlara Dön
          </Link>
        </div>
      </Layout>
    );
  }

  const handleContact = () =>
    requireAuth(() => {
      contactSeller.mutate(ad.id, {
        onSuccess: res => {
          if (res.conversation_id) {
            navigate('/chat');
          } else {
            showToast(res.message || 'Satıcı ile iletişime geçilemedi');
          }
        },
        onError: (err: any) => showToast(err?.response?.data?.detail || 'Bir hata oluştu'),
      });
    });

  const handleFavorite = () =>
    requireAuth(() => {
      toggleFavorite.mutate(ad.id, {
        onSuccess: res => showToast(res.message),
      });
    });

  const handleShowPhone = () =>
    requireAuth(() => {
      setShowPhone(true);
    });

  const handleReport = () =>
    requireAuth(() => {
      reportAd.mutate(
        { id: ad.id, reason: reportReason || 'other', description: reportReason },
        {
          onSuccess: () => {
            setShowReportModal(false);
            setReportReason('');
            showToast('Raporunuz alındı. Teşekkürler!');
          },
        }
      );
    });

  const priceDisplay =
    ad.price_type === 'FREE'
      ? 'Ücretsiz'
      : ad.price != null
        ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(ad.price)} ₺`
        : 'Fiyat sorunuz';

  return (
    <Layout>
      <SEO title={ad.title} description={ad.description?.slice(0, 150)} />

      {/* Breadcrumb */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'inherit' }}>Ana Sayfa</Link>
            <ChevronRight size={12} />
            <Link to="/ads" style={{ color: 'inherit' }}>İlanlar</Link>
            {ad.category && (
              <>
                <ChevronRight size={12} />
                <Link to={`/ads?category=${ad.category.slug}`} style={{ color: 'inherit' }}>
                  {ad.category.name}
                </Link>
              </>
            )}
            <ChevronRight size={12} />
            <span style={{ color: 'var(--color-text)' }}>{ad.title.slice(0, 40)}{ad.title.length > 40 ? '...' : ''}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: 28, alignItems: 'start' }} className="ad-detail-grid">
          {/* Sol — Galeri + Açıklama */}
          <div>
            <div
              className="card"
              style={{
                overflow: 'hidden',
                aspectRatio: '4 / 3',
                background: 'var(--color-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {ad.images?.length > 0 ? (
                <img
                  src={ad.images[selectedImage]?.url}
                  alt={ad.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Camera size={48} color="var(--color-text-dim)" />
              )}
              {ad.is_featured && (
                <span style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px' }}>
                  ⭐ Öne Çıkan İlan
                </span>
              )}
            </div>

            {/* Thumbnail'ler */}
            {ad.images?.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {ad.images.map((img, i) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: selectedImage === i ? '2px solid var(--color-primary)' : '2px solid transparent',
                      background: 'var(--color-surface-2)',
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Açıklama */}
            <div className="card" style={{ padding: 24, marginTop: 20 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>Açıklama</h2>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {ad.description || 'İlan açıklaması girilmemiş.'}
              </p>
            </div>

            {/* İlan Bilgileri */}
            <div className="card" style={{ padding: 24, marginTop: 16 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>İlan Bilgileri</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                {[
                  ['İlan No', `#${ad.id}`],
                  ['Kategori', ad.category?.name],
                  ['Durumu', ad.condition ? CONDITION_LABELS[ad.condition] : null],
                  ['Fiyat Tipi', PRICE_TYPE_LABELS[ad.price_type]],
                  ['Konum', [ad.city_name, ad.district_name].filter(Boolean).join(' / ')],
                  [
                    'İlan Tarihi',
                    ad.published_at
                      ? new Date(ad.published_at).toLocaleDateString('tr-TR')
                      : new Date(ad.created_at || '').toLocaleDateString('tr-TR'),
                  ],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
              </div>

              {/* Özellikler */}
              {ad.attributes?.length > 0 && (
                <>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '20px 0 12px' }}>Özellikler</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    {ad.attributes.map(attr => (
                      <div key={attr.attribute_key} style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textTransform: 'capitalize' }}>
                          {attr.attribute_key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{attr.attribute_value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sağ — Fiyat + Satıcı */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card" style={{ padding: 24 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.35, margin: 0 }}>{ad.title}</h1>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--color-primary-light)', margin: '14px 0' }}>
                {priceDisplay}
                {ad.is_negotiable && ad.price != null && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                    (Pazarlığa açık)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: 6 }}>
                <MapPin size={15} />
                {[ad.district_name, ad.city_name].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--color-text-dim)', fontSize: '0.8rem', marginBottom: 18 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={13} /> {ad.view_count} görüntülenme
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={13} /> {ad.favorite_count} favori
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleContact} disabled={contactSeller.isPending}>
                  <MessageSquare size={16} /> Mesaj Gönder
                </button>
                {ad.seller_phone &&
                  (showPhone ? (
                    <a href={`tel:${ad.seller_phone}`} className="btn btn-outline" style={{ justifyContent: 'center' }}>
                      <Phone size={16} /> {ad.seller_phone}
                    </a>
                  ) : (
                    <button className="btn btn-outline" onClick={handleShowPhone}>
                      <Phone size={16} /> Telefonu Göster
                    </button>
                  ))}
                <button className="btn btn-ghost" onClick={handleFavorite} style={{ justifyContent: 'center' }}>
                  <Heart size={16} fill={ad.is_favorite ? '#ef4444' : 'none'} color={ad.is_favorite ? '#ef4444' : undefined} />
                  {ad.is_favorite ? 'Favorilerden Çıkar' : 'Favoriye Ekle'}
                </button>
              </div>
            </div>

            {/* Satıcı kartı */}
            {ad.seller && (
              <div className="card" style={{ padding: 20, marginTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  İlan Sahibi
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {ad.seller.avatar ? (
                      <img src={ad.seller.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (ad.seller.first_name?.[0] || '?').toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {ad.seller.business_name ||
                        `${ad.seller.first_name || ''} ${ad.seller.last_name || ''}`.trim() ||
                        'Kullanıcı'}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: '0.78rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                      {(ad.seller.rating ?? 0) > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Star size={11} fill="#f59e0b" color="#f59e0b" /> {ad.seller.rating?.toFixed(1)}
                          {ad.seller.review_count ? ` (${ad.seller.review_count})` : ''}
                        </span>
                      )}
                      {(ad.seller.phone_verified || ad.seller.email_verified) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#10b981' }}>
                          <BadgeCheck size={11} /> Doğrulanmış
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: 10 }}>
                  {ad.seller.active_ad_count} aktif ilan
                </div>
                {ad.seller.provider_id && (
                  <Link to={`/provider/${ad.seller.provider_id}`} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                    Profili Gör
                  </Link>
                )}
              </div>
            )}

            {/* Raporla */}
            <button
              onClick={() => requireAuth(() => setShowReportModal(true))}
              style={{
                marginTop: 12,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: 8,
              }}
            >
              <Flag size={13} /> Bu ilanı raporla
            </button>
          </div>
        </div>

        {/* Benzer ilanlar */}
        {similar && similar.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16 }}>Benzer İlanlar</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {similar.slice(0, 5).map(a => (
                <AdCard key={a.id} ad={a} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rapor modalı */}
      {showReportModal && (
        <div
          onClick={() => setShowReportModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ maxWidth: 420, width: '100%', padding: 24 }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>İlanı Raporla</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Bu ilanla ilgili sorunu kısaca açıklayın.
            </p>
            <textarea
              className="input"
              rows={4}
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Örn: Sahte ilan, yanlış kategori, yasaklı ürün..."
              style={{ marginBottom: 14, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowReportModal(false)}>
                Vazgeç
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReport} disabled={!reportReason.trim() || reportAd.isPending}>
                Raporla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '12px 20px',
            zIndex: 110,
            boxShadow: 'var(--shadow-elevated)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Shield size={15} color="#10b981" /> {toast}
        </div>
      )}
    </Layout>
  );
};

export default AdDetailPage;
