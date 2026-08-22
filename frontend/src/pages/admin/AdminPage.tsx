import React from 'react';
import { Shield, Users, AlertTriangle, FileText, Settings, CreditCard, Activity, CheckCircle, Clock, Package, Flag, Eye, Trash2, Ban } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { useAuthStore } from '../../stores/authStore';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAdminDashboard, useAdminUsers, useAdminDisputes, useAdminPayouts } from '../../hooks/useQueries';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminUsers } from './AdminUsers';
import { AdminDisputes } from './AdminDisputes';
import { AdminPayouts } from './AdminPayouts';
import { AdminAds } from './AdminAds';
import { AdminVerifications } from './AdminVerifications';
import { AdminSystem } from './AdminSystem';

const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  // Sekme durumu URL ile senkron — /admin?tab=users gibi bağlantılar çalışır
  const activeTab = searchParams.get('tab') ?? 'overview';

  const setActiveTab = (tab: string) => {
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true });
  };

  const { data: adminStats, isLoading } = useAdminDashboard();

  // Basic admin guard (double check, already guarded by route)
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Demo haftalık aktivite verisi — backend'te zaman serisi endpoint'i henüz yok
  const weeklyChartData = [
    { name: 'Pzt', requests: 40, users: 24, revenue: 2400 },
    { name: 'Sal', requests: 30, users: 13, revenue: 2210 },
    { name: 'Çar', requests: 20, users: 58, revenue: 2290 },
    { name: 'Per', requests: 27, users: 39, revenue: 2000 },
    { name: 'Cum', requests: 18, users: 48, revenue: 2181 },
    { name: 'Cmt', requests: 23, users: 38, revenue: 2500 },
    { name: 'Paz', requests: 34, users: 43, revenue: 2100 },
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <div style={{ width: 280, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={22} className="text-indigo-600" /> Yönetim Paneli
            </h2>
          </div>
          
          <nav style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'overview', icon: <Activity size={18} />, label: 'Genel Bakış' },
              { id: 'users', icon: <Users size={18} />, label: 'Kullanıcı & Uzmanlar' },
              { id: 'verifications', icon: <CheckCircle size={18} />, label: 'Doğrulama Onayları' },
              { id: 'disputes', icon: <AlertTriangle size={18} />, label: 'Anlaşmazlık Yönetimi' },
              { id: 'ads', icon: <Package size={18} />, label: 'İlanlar' },
              { id: 'payouts', icon: <CreditCard size={18} />, label: 'Ödemeler & Finans' },
              { id: 'system', icon: <Settings size={18} />, label: 'Sistem Ayarları' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
                  border: 'none', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  fontWeight: activeTab === tab.id ? 700 : 500, transition: 'all 0.2s',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
                }}
                className={activeTab !== tab.id ? 'hover:bg-gray-100 hover:text-gray-900' : ''}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '32px 40px', background: 'var(--color-bg)', overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <div className="animate-fade-in max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--color-text)' }}>Sistem Özeti</h1>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock size={16} /> Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
                    {[
                      { label: 'Toplam Kullanıcı', value: adminStats?.total_users || 0, trend: '+12%', color: '#3b82f6', bg: '#eff6ff' },
                      { label: 'Kayıtlı Uzman', value: adminStats?.total_providers || 0, trend: '+5%', color: '#10b981', bg: '#ecfdf5' },
                      { label: 'Aktif Talepler', value: adminStats?.total_requests || 0, trend: '+18%', color: '#8b5cf6', bg: '#f5f3ff' },
                      { label: 'Tamamlanan İşler', value: adminStats?.total_appointments || 0, trend: '+22%', color: '#f59e0b', bg: '#fffbeb' },
                    ].map(stat => (
                      <div key={stat.label} className="card rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: 12, fontWeight: 500 }}>{stat.label}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{stat.value}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: stat.color, background: stat.bg, padding: '4px 8px', borderRadius: 20 }}>
                            {stat.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Activity Chart */}
                    <div className="card rounded-2xl p-6">
                      <h3 className="font-bold text-lg mb-6" style={{ color: 'var(--color-text)' }}>Platform Aktivitesi</h3>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            <Tooltip 
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            />
                            <Area type="monotone" dataKey="requests" name="Hizmet Talebi" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Operational Alerts */}
                    <div className="card rounded-2xl p-6 flex flex-col">
                      <h3 className="font-bold text-lg mb-6" style={{ color: 'var(--color-text)' }}>Operasyonel Durum</h3>
                      <div className="flex-1 flex flex-col gap-4">
                        
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <Shield size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-amber-900 text-sm">Bekleyen Uzman Doğrulamaları</h4>
                            <p className="text-amber-800/80 text-xs mt-1">
                              Sistemde onay bekleyen {adminStats?.pending_verifications ?? 0} doğrulama başvurusu bulunuyor.
                            </p>
                            <button className="btn btn-outline btn-sm mt-3" onClick={() => setActiveTab('verifications')}>İncele &rarr;</button>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-red-900 text-sm">Aktif Anlaşmazlıklar (Disputes)</h4>
                            <p className="text-red-800/80 text-xs mt-1">
                              Platformda çözülmeyi bekleyen {adminStats?.open_disputes ?? 0} açık anlaşmazlık (dispute) var.
                            </p>
                            <button className="btn btn-outline btn-sm mt-3" onClick={() => setActiveTab('disputes')}>Çözümle &rarr;</button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {activeTab !== 'overview' && (
            <div className="animate-fade-in max-w-7xl mx-auto">
              <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 24, textTransform: 'capitalize', color: 'var(--color-text)' }}>
                {activeTab === 'users' ? 'Kullanıcı & Uzmanlar' : activeTab === 'verifications' ? 'Doğrulama Onayları' : activeTab === 'disputes' ? 'Anlaşmazlık Yönetimi' : activeTab === 'payouts' ? 'Ödemeler & Finans' : activeTab === 'ads' ? 'İlanlar' : activeTab === 'system' ? 'Sistem Ayarları' : activeTab}
              </h1>
              {activeTab === 'users' && <AdminUsers />}
              {activeTab === 'verifications' && <AdminVerifications />}
              {activeTab === 'disputes' && <AdminDisputes />}
              {activeTab === 'payouts' && <AdminPayouts />}
              {activeTab === 'ads' && <AdminAds />}
              {activeTab === 'system' && <AdminSystem />}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
