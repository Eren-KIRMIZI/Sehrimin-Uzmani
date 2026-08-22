import React, { useState } from 'react';
import { Eye, Flag, Trash2, Ban, CheckCircle, Search, Package, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

// Tip genişletmesi (admin endpoint'lerden gelen veri)
type AdminAdItem = {
  id: number;
  title: string;
  price?: number | null;
  price_type: string;
  status: string;
  city_name?: string | null;
  category_name?: string | null;
  cover_image?: string | null;
  view_count: number;
  favorite_count: number;
  published_at?: string | null;
  created_at?: string | null;
};

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:          { label: 'Taslak',       bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
  PENDING_REVIEW: { label: 'İnceleniyor',  bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  ACTIVE:         { label: 'Aktif',        bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  PAUSED:         { label: 'Duraklatıldı', bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  SOLD:           { label: 'Satıldı',      bg: 'rgba(99,102,241,0.15)',  color: '#6366f1' },
  EXPIRED:        { label: 'Süresi Doldu', bg: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
  REJECTED:       { label: 'Reddedildi',   bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
};

const REPORT_STATUS_STYLE: Record<string, { label: string; color: string }> = {
  OPEN:      { label: 'Açık',    color: '#ef4444' },
  RESOLVED:  { label: 'Çözüldü', color: '#10b981' },
  DISMISSED: { label: 'Reddedildi', color: '#9ca3af' },
};

const adminAdsApi = {
  list: (params: { q?: string; status?: string; page?: number; limit?: number }) =>
    api.get<{ items: AdminAdItem[]; total: number; page: number; limit: number; has_next: boolean }>(
      '/admin/ads', { params }
    ).then(r => r.data),

  reject: (id: number, reason?: string) =>
    api.post(`/admin/ads/${id}/reject`, null, { params: { reason: reason || '' } }).then(r => r.data),

  listReports: (status: string = 'OPEN') =>
    api.get<any[]>('/admin/ads/reports', { params: { status } }).then(r => r.data),

  resolveReport: (reportId: number, action: 'RESOLVED' | 'DISMISSED', rejectAd?: boolean) =>
    api.patch(`/admin/ads/reports/${reportId}`, null, {
      params: { action, reject_ad: rejectAd ?? false },
    }).then(r => r.data),
};

export const AdminAds: React.FC = () => {
  const [tab, setTab] = useState<'listings' | 'reports'>('listings');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState('OPEN');

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminAds', q, statusFilter, page],
    queryFn: () => adminAdsApi.list({ q: q || undefined, status: statusFilter || undefined, page, limit: 20 }),
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['adminAdReports', reportStatusFilter],
    queryFn: () => adminAdsApi.listReports(reportStatusFilter),
    enabled: tab === 'reports',
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => adminAdsApi.reject(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminAds'] }),
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, action, rejectAd }: { id: number; action: 'RESOLVED' | 'DISMISSED'; rejectAd?: boolean }) =>
      adminAdsApi.resolveReport(id, action, rejectAd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminAdReports'] });
      qc.invalidateQueries({ queryKey: ['adminAds'] });
    },
  });

  const formatPrice = (ad: AdminAdItem) => {
    if (ad.price_type === 'FREE') return 'Ücretsiz';
    if (ad.price == null) return '—';
    return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(ad.price)} ₺`;
  };

  return (
    <div>
      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
        <button
          className={`btn btn-sm ${tab === 'listings' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('listings')}
        >
          <Package size={14} /> Tüm İlanlar {data ? `(${data.total})` : ''}
        </button>
        <button
          className={`btn btn-sm ${tab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('reports')}
        >
          <Flag size={14} /> Raporlar {reports ? `(${reports.length})` : ''}
        </button>
      </div>

      {/* ── İlanlar Sekmesi ── */}
      {tab === 'listings' && (
        <div>
          {/* Filtreler */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
              <input
                className="input"
                style={{ paddingLeft: 36, height: 40 }}
                placeholder="İlan başlığı ara..."
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="input"
              style={{ width: 180, height: 40 }}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Tüm Durumlar</option>
              {Object.entries(STATUS_STYLE).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Özet istatistikler */}
          {data && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Toplam İlan', value: data.total, color: '#6366f1' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tablo */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    {['Görsel', 'Başlık', 'Fiyat', 'Durum', 'Kategori', 'Konum', 'Görüntülenme', 'İşlem'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.items?.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                        <Package size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
                        İlan bulunamadı
                      </td>
                    </tr>
                  ) : data?.items?.map(ad => {
                    const statusInfo = STATUS_STYLE[ad.status] || { label: ad.status, bg: 'gray', color: 'gray' };
                    return (
                      <tr key={ad.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ width: 52, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {ad.cover_image
                              ? <img src={ad.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <Package size={16} color="var(--color-text-dim)" />}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <a href={`/ads/${ad.id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)', textDecoration: 'none' }}>
                            {ad.title.length > 45 ? ad.title.slice(0, 45) + '...' : ad.title}
                          </a>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginTop: 2 }}>#{ad.id}</div>
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary-light)' }}>
                          {formatPrice(ad)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className="badge" style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: '0.72rem' }}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
                          {ad.category_name || '—'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
                          {ad.city_name || '—'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '0.83rem', color: 'var(--color-text-dim)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={12} /> {ad.view_count}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <a
                              href={`/ads/${ad.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                              title="Görüntüle"
                            >
                              <Eye size={13} />
                            </a>
                            {ad.status !== 'REJECTED' && ad.status !== 'DELETED' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                title="Reddet"
                                style={{ color: '#ef4444' }}
                                onClick={() => {
                                  if (confirm(`"${ad.title}" ilanını reddetmek istediğinizden emin misiniz?`)) {
                                    rejectMutation.mutate({ id: ad.id, reason: 'Admin moderasyon' });
                                  }
                                }}
                              >
                                <Ban size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sayfalama */}
          {data && data.total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ← Önceki
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '0 12px' }}>
                Sayfa {page} / {Math.ceil(data.total / 20)}
              </span>
              <button className="btn btn-outline btn-sm" disabled={!data.has_next} onClick={() => setPage(p => p + 1)}>
                Sonraki →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Raporlar Sekmesi ── */}
      {tab === 'reports' && (
        <div>
          {/* Durum filtresi */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['OPEN', 'RESOLVED', 'DISMISSED'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${reportStatusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setReportStatusFilter(s)}
              >
                {REPORT_STATUS_STYLE[s]?.label || s}
              </button>
            ))}
          </div>

          {reportsLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : (reports?.length ?? 0) === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
              <CheckCircle size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#10b981' }} />
              <p>Bu durumda rapor yok.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports?.map((report: any) => (
                <div key={report.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Flag size={15} color="#ef4444" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Rapor #{report.id}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                            İlan #{report.ad_id} • {new Date(report.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <span className="badge" style={{
                          background: report.status === 'OPEN' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: report.status === 'OPEN' ? '#ef4444' : '#10b981',
                          fontSize: '0.72rem',
                        }}>
                          {REPORT_STATUS_STYLE[report.status]?.label || report.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                        <strong>Sebep:</strong> {report.reason}
                      </div>
                      {report.description && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', background: 'var(--color-surface-2)', borderRadius: 8, padding: '8px 12px' }}>
                          {report.description}
                        </div>
                      )}
                    </div>

                    {report.status === 'OPEN' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <a href={`/ads/${report.ad_id}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                          <Eye size={13} /> İlanı Gör
                        </a>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => resolveReportMutation.mutate({ id: report.id, action: 'RESOLVED' })}
                          disabled={resolveReportMutation.isPending}
                        >
                          <CheckCircle size={13} /> Çözüldü
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => {
                            if (confirm('İlanı reddet ve raporu çözdü olarak işaretle?')) {
                              resolveReportMutation.mutate({ id: report.id, action: 'RESOLVED', rejectAd: true });
                            }
                          }}
                          disabled={resolveReportMutation.isPending}
                        >
                          <Ban size={13} /> İlanı Reddet
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => resolveReportMutation.mutate({ id: report.id, action: 'DISMISSED' })}
                          disabled={resolveReportMutation.isPending}
                        >
                          Yoksay
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
