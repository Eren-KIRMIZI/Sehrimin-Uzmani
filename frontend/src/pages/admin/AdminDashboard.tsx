import { useState } from 'react';
import { Users, Briefcase, FileText, CheckCircle, Settings, Shield, Star, TrendingUp, Activity, ChevronRight, Search, Eye, Edit } from 'lucide-react';
import { useAdminDashboard, useAdminUsers, useAdminProviders, useAdminRequests } from '../../hooks/useQueries';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats } = useAdminDashboard();
  const { data: users = [] } = useAdminUsers();
  const { data: providers = [] } = useAdminProviders();
  const { data: requests = [] } = useAdminRequests();

  const tabs = [
    { id: 'overview', label: 'Genel Bakis', icon: Activity },
    { id: 'users', label: 'Kullanicilar', icon: Users },
    { id: 'providers', label: 'Uzmanlar', icon: Briefcase },
    { id: 'requests', label: 'Talepler', icon: FileText },
    { id: 'verification', label: 'Dogrulama', icon: Shield },
    { id: 'reviews', label: 'Yorumlar', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Admin Paneli</h1>
          <p className="text-text-muted mt-1">Platform yonetimi ve istatistikler</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'bg-white border border-border-light text-text-muted hover:border-accent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Toplam Kullanici', value: stats?.total_users || 0, icon: Users, color: 'text-accent' },
                { label: 'Toplam Uzman', value: stats?.total_providers || 0, icon: Briefcase, color: 'text-success' },
                { label: 'Aktif Talep', value: stats?.active_requests || 0, icon: FileText, color: 'text-warning' },
                { label: 'Tamamlanan Is', value: stats?.completed_jobs || 0, icon: CheckCircle, color: 'text-success' },
                { label: 'Kategori', value: stats?.total_categories || 0, icon: Settings, color: 'text-accent' },
                { label: 'Sehir', value: stats?.total_cities || 0, icon: TrendingUp, color: 'text-error' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-border-light">
                  <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                  <div className="text-3xl font-bold text-primary">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-border-light">
                <h3 className="font-semibold text-primary mb-4">Hizli Islemler</h3>
                <div className="space-y-3">
                  <button onClick={() => setActiveTab('users')} className="w-full flex items-center justify-between p-3 bg-bg rounded-xl hover:bg-accent/5 transition-colors">
                    <span className="text-sm font-medium">Kullanici Yonetimi</span>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </button>
                  <button onClick={() => setActiveTab('providers')} className="w-full flex items-center justify-between p-3 bg-bg rounded-xl hover:bg-accent/5 transition-colors">
                    <span className="text-sm font-medium">Uzman Yonetimi</span>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </button>
                  <button onClick={() => setActiveTab('verification')} className="w-full flex items-center justify-between p-3 bg-bg rounded-xl hover:bg-accent/5 transition-colors">
                    <span className="text-sm font-medium">Dogrulama Talepleri</span>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </button>
                  <button onClick={() => setActiveTab('requests')} className="w-full flex items-center justify-between p-3 bg-bg rounded-xl hover:bg-accent/5 transition-colors">
                    <span className="text-sm font-medium">Talep Yonetimi</span>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border-light">
                <h3 className="font-semibold text-primary mb-4">Platform Durumu</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-muted">Kullanici / Uzman Orani</span>
                      <span className="font-medium">{stats?.total_providers ? Math.round((stats.total_users / stats.total_providers)) : 0}:1</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, ((stats?.total_providers || 0) / Math.max(1, stats?.total_users || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-muted">Tamamlanan Is Orani</span>
                      <span className="font-medium">{stats?.active_requests ? Math.round((stats.completed_jobs / (stats.completed_jobs + stats.active_requests)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${stats?.active_requests ? Math.round((stats.completed_jobs / (stats.completed_jobs + stats.active_requests)) * 100) : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-muted">Kategori Kapsamı</span>
                      <span className="font-medium">{stats?.total_categories || 0} / 13</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, ((stats?.total_categories || 0) / 13) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="p-4 border-b border-border-light flex items-center justify-between">
              <h3 className="font-semibold text-primary">Kullanicilar ({users.length})</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-text-muted" />
                  <input type="text" placeholder="Ara..." className="bg-transparent text-sm outline-none w-40" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg">
                    <th className="text-left p-3 font-medium text-text-muted">Kullanici</th>
                    <th className="text-left p-3 font-medium text-text-muted">E-posta</th>
                    <th className="text-left p-3 font-medium text-text-muted">Rol</th>
                    <th className="text-left p-3 font-medium text-text-muted">Durum</th>
                    <th className="text-left p-3 font-medium text-text-muted">Kayit</th>
                    <th className="text-left p-3 font-medium text-text-muted">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-border-light hover:bg-bg/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                            <span className="text-accent text-xs font-bold">{u.first_name?.[0]}{u.last_name?.[0]}</span>
                          </div>
                          <span className="font-medium">{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-text-muted">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                          u.role === 'PROVIDER' ? 'bg-accent/10 text-accent' :
                          'bg-gray-100 text-gray-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{u.is_active ? 'Aktif' : 'Pasif'}</span>
                      </td>
                      <td className="p-3 text-text-muted text-xs">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-bg rounded-lg"><Eye className="w-4 h-4 text-text-muted" /></button>
                          <button className="p-1.5 hover:bg-bg rounded-lg"><Edit className="w-4 h-4 text-text-muted" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-text-muted">Henuz kullanici yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="p-4 border-b border-border-light">
              <h3 className="font-semibold text-primary">Uzmanlar ({providers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg">
                    <th className="text-left p-3 font-medium text-text-muted">Uzman</th>
                    <th className="text-left p-3 font-medium text-text-muted">Puan</th>
                    <th className="text-left p-3 font-medium text-text-muted">Yorum</th>
                    <th className="text-left p-3 font-medium text-text-muted">Dogrulama</th>
                    <th className="text-left p-3 font-medium text-text-muted">Durum</th>
                    <th className="text-left p-3 font-medium text-text-muted">Islem</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id} className="border-t border-border-light hover:bg-bg/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                            <span className="text-accent text-xs font-bold">{p.user?.first_name?.[0]}{p.user?.last_name?.[0]}</span>
                          </div>
                          <div>
                            <div className="font-medium">{p.business_name || `${p.user?.first_name} ${p.user?.last_name}`}</div>
                            <div className="text-xs text-text-muted">{p.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          <span className="font-medium">{p.rating}</span>
                        </div>
                      </td>
                      <td className="p-3 text-text-muted">{p.review_count}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.verification_status === 'BUSINESS' ? 'bg-green-100 text-green-700' :
                          p.verification_status === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-700' :
                          p.verification_status === 'IDENTITY' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{p.verification_status}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{p.is_available ? 'Müsait' : 'Meşgul'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-bg rounded-lg"><Eye className="w-4 h-4 text-text-muted" /></button>
                          <button className="p-1.5 hover:bg-bg rounded-lg"><Shield className="w-4 h-4 text-text-muted" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {providers.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-text-muted">Henuz uzman yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <div className="p-4 border-b border-border-light">
              <h3 className="font-semibold text-primary">Talepler ({requests.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg">
                    <th className="text-left p-3 font-medium text-text-muted">ID</th>
                    <th className="text-left p-3 font-medium text-text-muted">Baslik</th>
                    <th className="text-left p-3 font-medium text-text-muted">Kullanici</th>
                    <th className="text-left p-3 font-medium text-text-muted">Oncelik</th>
                    <th className="text-left p-3 font-medium text-text-muted">Durum</th>
                    <th className="text-left p-3 font-medium text-text-muted">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-t border-border-light hover:bg-bg/50">
                      <td className="p-3 text-text-muted">#{r.id}</td>
                      <td className="p-3 font-medium">{r.title}</td>
                      <td className="p-3 text-text-muted">#{r.customer_id}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.urgency === 'URGENT' ? 'bg-red-100 text-red-700' :
                          r.urgency === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          r.urgency === 'NORMAL' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{r.urgency}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          r.status === 'PUBLISHED' ? 'bg-accent/10 text-accent' :
                          'bg-gray-100 text-gray-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="p-3 text-text-muted text-xs">{new Date(r.created_at).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-text-muted">Henuz talep yok</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-2xl p-6 border border-border-light">
            <h3 className="font-semibold text-primary mb-4">Dogrulama Talepleri</h3>
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted">Henuz dogrulama talebi yok</p>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl p-6 border border-border-light">
            <h3 className="font-semibold text-primary mb-4">Yorum Yonetimi</h3>
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted">Yorum yonetimi buradan yapilacak</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
