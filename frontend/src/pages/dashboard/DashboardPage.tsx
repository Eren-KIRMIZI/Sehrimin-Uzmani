import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Briefcase, MessageSquare, Star, TrendingUp, AlertTriangle, ChevronRight, CheckCircle, Clock, User, FileText, Calendar, Sparkles, TrendingDown, MessageCircle, Target, Trophy, Zap, Shield, CreditCard, X, Search } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsApi, adminApi } from '../../services';
import type { ProviderAnalytics, AdminDashboard } from '../../types';
import { useMyRequests, useAppointments } from '../../hooks/useQueries';
import { REQUEST_STATUS_LABELS, formatDate, formatDateTime } from '../../utils/format';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isProvider = user?.role === 'PROVIDER';
  const isAdmin = user?.role === 'ADMIN';

  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [adminStats, setAdminStats] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSmartMatch, setShowSmartMatch] = useState(false);
  const [matchQuery, setMatchQuery] = useState('');

  // Müşteri istatistikleri için gerçek veri
  const isCustomer = !isProvider && !isAdmin;
  const { data: myRequests } = useMyRequests();
  const { data: appointments } = useAppointments();
  const activeRequests = myRequests?.items.filter(r => ['OPEN', 'IN_PROGRESS'].includes(r.status)) ?? [];
  const openQuotes = myRequests?.items.reduce((acc, r) => acc + (r.quotes?.length ?? 0), 0) ?? 0;
  const upcomingAppointments = (appointments?.items ?? []).filter(a => ['PENDING', 'CONFIRMED'].includes(a.status));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (isProvider) {
          const data = await analyticsApi.getMyAnalytics();
          setAnalytics(data);
        } else if (isAdmin) {
          const data = await adminApi.getDashboard();
          setAdminStats(data);
        }
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [user, isProvider, isAdmin]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 4 }}>
              Merhaba, {user?.first_name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {isProvider ? 'İşlerinizi ve kazançlarınızı buradan yönetin.' : 
               isAdmin ? 'Sistem yönetim paneline hoş geldiniz.' : 
               'Hizmet taleplerinizi ve randevularınızı buradan takip edin.'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            {!isProvider && !isAdmin && (
              <button
                onClick={() => setShowSmartMatch(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Zap size={16} fill="currentColor" /> Akıllı Eşleştirme
              </button>
            )}
            <Link to="/profile" className="btn btn-outline">Profili Düzenle</Link>
            {isAdmin && <Link to="/admin" className="btn btn-primary">Yönetim Paneli</Link>}
          </div>
        </div>

        {/* Smart Match Modal */}
        {showSmartMatch && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }} onClick={() => setShowSmartMatch(false)}>
            <div
              style={{
                background: 'var(--color-surface)', borderRadius: 20,
                padding: 32, maxWidth: 520, width: '100%',
                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                border: '1px solid var(--color-border)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={18} color="white" fill="white" />
                    </div>
                    <h2 style={{ fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>Akıllı Eşleştirme</h2>
                  </div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    İhtiyacını yaz, sana en uygun uzmanı bulalım
                  </p>
                </div>
                <button onClick={() => setShowSmartMatch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                  <input
                    className="input"
                    value={matchQuery}
                    onChange={e => setMatchQuery(e.target.value)}
                    placeholder="Örn: Evim için elektrikçi arıyorum, acil..."
                    style={{ paddingLeft: 42, height: 48 }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && matchQuery.trim()) {
                        setShowSmartMatch(false);
                        navigate(`/search?q=${encodeURIComponent(matchQuery.trim())}`);
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ height: 48, paddingLeft: 20, paddingRight: 20 }}
                  disabled={!matchQuery.trim()}
                  onClick={() => {
                    if (matchQuery.trim()) {
                      setShowSmartMatch(false);
                      navigate(`/search?q=${encodeURIComponent(matchQuery.trim())}`);
                    }
                  }}
                >
                  Eşleştir
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>Örnek aramalar:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Kombi arızası acil', 'Ev temizliği haftalık', 'LGS matematik özel ders', 'Nakliyat İstanbul içi', 'Saç boyama randevu'].map(s => (
                  <button
                    key={s}
                    onClick={() => setMatchQuery(s)}
                    style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: '0.8rem',
                      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                      cursor: 'pointer', color: 'var(--color-text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Insights for Providers */}
        {isProvider && analytics?.ai_insights && analytics.ai_insights.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={24} /> AI Performans Asistanı
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.ai_insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border flex items-start gap-3
                    ${insight.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : ''}
                    ${insight.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : ''}
                    ${insight.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : ''}
                  `}
                >
                  <div className="text-indigo-500 mt-0.5">
                    {insight.icon === 'TrendingDown' && <TrendingDown size={24} />}
                    {insight.icon === 'MessageCircle' && <MessageCircle size={24} />}
                    {insight.icon === 'Star' && <Star size={24} />}
                    {insight.icon === 'Target' && <Target size={24} />}
                    {insight.icon === 'Trophy' && <Trophy size={24} />}
                    {(!['TrendingDown', 'MessageCircle', 'Star', 'Target', 'Trophy'].includes(insight.icon)) && <Sparkles size={24} />}
                  </div>
                  <div className="text-sm font-medium">{insight.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {isProvider ? (
            <>
              <div className="card hover:shadow-lg transition-shadow">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <Briefcase size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Kazanılan İşler</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{analytics?.jobs_won || 0}</div>
                <p className="text-xs text-gray-500 mt-2">Son 30 günde</p>
              </div>
              <div className="card hover:shadow-lg transition-shadow">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <TrendingUp size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Dönüşüm Oranı</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                  %{analytics?.conversion_rate || 0}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {analytics?.quotes_sent || 0} teklifte
                </p>
              </div>
              <div className="card hover:shadow-lg transition-shadow">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <Star size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Ortalama Puan</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{analytics?.avg_rating || 0}</div>
                <p className="text-xs text-gray-500 mt-2">
                  Toplam {analytics?.total_review_count || 0} yorum
                </p>
              </div>
              <div className="card hover:shadow-lg transition-shadow">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <CheckCircle size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Bekleyen Teklifler</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{analytics?.quotes_pending || 0}</div>
                <p className="text-xs text-gray-500 mt-2">Yanıt bekliyor</p>
              </div>
            </>
          ) : isAdmin ? (
            <>
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <span className="font-semibold text-gray-500">Toplam Kullanıcı</span>
                </div>
                <div className="text-3xl font-bold">{adminStats?.total_users || 0}</div>
                <p className="text-xs text-gray-400 mt-1">+{adminStats?.new_users_today || 0} bugün</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Briefcase size={20} />
                  </div>
                  <span className="font-semibold text-gray-500">Kayıtlı Uzman</span>
                </div>
                <div className="text-3xl font-bold">{adminStats?.total_providers || 0}</div>
                <p className="text-xs text-gray-400 mt-1">+{adminStats?.new_providers_today || 0} bugün</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <span className="font-semibold text-gray-500">Bekleyen Doğrulama</span>
                </div>
                <div className="text-3xl font-bold text-amber-600">{adminStats?.pending_verifications || 0}</div>
                <p className="text-xs text-gray-400 mt-1">İnceleme bekliyor</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="font-semibold text-gray-500">Açık Anlaşmazlık</span>
                </div>
                <div className="text-3xl font-bold text-red-500">{adminStats?.open_disputes || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Çözüm bekliyor</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <span className="font-semibold text-gray-500">Ödeme Talebi</span>
                </div>
                <div className="text-3xl font-bold">{adminStats?.pending_payouts || 0}</div>
                <p className="text-xs text-gray-400 mt-1">Onay bekliyor</p>
              </div>
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <span className="font-semibold text-gray-500">Toplam Gelir</span>
                </div>
                <div className="text-3xl font-bold text-green-600">₺{(adminStats?.total_revenue || 0).toLocaleString('tr-TR')}</div>
                <p className="text-xs text-gray-400 mt-1">+₺{(adminStats?.revenue_today || 0).toLocaleString('tr-TR')} bugün</p>
              </div>
            </>
          ) : (
            <>
              {/* Müşteri istatistikleri — gerçek veriler */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <Briefcase size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Aktif Talepler</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{activeRequests.length}</div>
                <p className="text-xs text-gray-500 mt-2">Toplam {myRequests?.items.length ?? 0} talep</p>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <MessageSquare size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Gelen Teklifler</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{openQuotes}</div>
                <p className="text-xs text-gray-500 mt-2">Tüm taleplerinizde</p>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <Calendar size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Yaklaşan Randevular</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{upcomingAppointments.length}</div>
                <p className="text-xs text-gray-500 mt-2">
                  {upcomingAppointments[0] ? `Sıradaki: ${formatDate(upcomingAppointments[0].start_at)}` : 'Planlanmış randevu yok'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Charts & Main Content Area */}
        {isProvider && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-6 text-gray-800">Teklif Performansı (Son 7 Gün)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.daily_breakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day_name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="quotes" 
                      name="Verilen Teklif"
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{r: 4, strokeWidth: 2}} 
                      activeDot={{r: 6, strokeWidth: 0}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-6 text-gray-800">Yorum Trendi (Son 7 Gün)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.daily_breakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day_name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar 
                      dataKey="reviews" 
                      name="Yeni Yorum"
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr min(340px, 100%)', gap: 24, alignItems: 'start' }}>
          
          {/* Left Column - Main Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Recent Requests / Jobs */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Son {isProvider ? 'Randevular' : isAdmin ? 'Aktiviteler' : 'Talepler'}</h3>
                <Link to={isProvider ? "/appointments" : isAdmin ? "/admin?tab=overview" : "/requests"} style={{ fontSize: '0.875rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>Tümünü Gör</Link>
              </div>
              {isCustomer && activeRequests.length > 0 ? (
                <div style={{ display: 'grid' }}>
                  {activeRequests.slice(0, 4).map(r => (
                    <Link
                      key={r.id}
                      to="/requests"
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        padding: '14px 24px', textDecoration: 'none', color: 'inherit',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <FileText size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{formatDate(r.created_at)}</div>
                        </div>
                      </div>
                      <span className="badge badge-outline" style={{ flexShrink: 0 }}>
                        {REQUEST_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : isCustomer && upcomingAppointments.length > 0 ? (
                <div style={{ display: 'grid' }}>
                  {upcomingAppointments.slice(0, 4).map(a => (
                    <Link
                      key={a.id}
                      to="/appointments"
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        padding: '14px 24px', textDecoration: 'none', color: 'inherit',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <Calendar size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.provider?.business_name ?? 'Randevu'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{formatDateTime(a.start_at)}</div>
                        </div>
                      </div>
                      <span className="badge badge-outline" style={{ flexShrink: 0 }}>
                        {a.status === 'CONFIRMED' ? 'Onaylandı' : 'Bekliyor'}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Henüz gösterilecek kayıt bulunmuyor.
                </div>
              )}
            </div>
            
          </div>
          
          {/* Right Column - Side Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Quick Actions */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Hızlı İşlemler</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isProvider ? (
                  <>
                    <Link to="/appointments" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Randevularım <ChevronRight size={16} />
                    </Link>
                    <Link to="/earnings" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Kazançlar & Ödemeler <ChevronRight size={16} />
                    </Link>
                    <Link to="/promotions" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Reklam & Öne Çıkarma <ChevronRight size={16} />
                    </Link>
                    <Link to="/pricing" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Abonelik Planım <ChevronRight size={16} />
                    </Link>
                  </>
                ) : isAdmin ? (
                  <>
                    <Link to="/admin?tab=users" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Kullanıcı Yönetimi <ChevronRight size={16} />
                    </Link>
                    <Link to="/admin?tab=verifications" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Uzman Onayları <ChevronRight size={16} />
                    </Link>
                    <Link to="/admin?tab=disputes" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Anlaşmazlık Çözümü <ChevronRight size={16} />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/request/create" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
                      Yeni Talep Oluştur <ChevronRight size={16} />
                    </Link>
                    <Link to="/search" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                      Uzman Ara <ChevronRight size={16} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
