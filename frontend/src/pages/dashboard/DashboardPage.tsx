import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LayoutDashboard, FileText, MessageCircle, Star, Heart, Calendar, Settings, ChevronRight, Bell, TrendingUp, Clock, CheckCircle, CreditCard, AlertTriangle, DollarSign, Megaphone } from 'lucide-react';
import api from '../../services/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ requests: 0, appointments: 0, favorites: 0, notifications: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    api.get('/requests?limit=5').then(res => setRecentRequests(res.data.items || [])).catch(() => {});
    api.get('/notifications/unread-count').then(res => setStats(s => ({ ...s, notifications: res.data.count }))).catch(() => {});
  }, []);

  const menuItems = [
    { icon: FileText, label: 'Taleplerim', link: '/dashboard/requests', count: stats.requests },
    { icon: Calendar, label: 'Randevularim', link: '/dashboard/appointments' },
    { icon: MessageCircle, label: 'Mesajlarim', link: '/chat' },
    { icon: Heart, label: 'Favorilerim', link: '/dashboard/favorites' },
    { icon: Star, label: 'Degerlendirmelerim', link: '/dashboard/reviews' },
    { icon: Bell, label: 'Bildirimler', link: '/dashboard/notifications', count: stats.notifications },
    { icon: CreditCard, label: 'Abonelikler', link: '/pricing' },
    { icon: DollarSign, label: 'Kazanc Takibi', link: '/earnings' },
    { icon: Megaphone, label: 'Tanitim Kampanyalari', link: '/promotions' },
    { icon: AlertTriangle, label: 'Anlasmazliklar', link: '/disputes' },
    { icon: Settings, label: 'Profil Ayarlari', link: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Hoş geldin, {user?.first_name}!</h1>
          <p className="text-text-muted mt-1">Hesabını buradan yönetebilirsin.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-3">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border-light hover:border-accent hover:shadow-sm transition-all group"
              >
                <item.icon className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.count ? (
                  <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">{item.count}</span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                )}
              </Link>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Aktif Talep', value: stats.requests, icon: FileText, color: 'text-accent' },
                { label: 'Randevu', value: stats.appointments, icon: Calendar, color: 'text-success' },
                { label: 'Favori', value: stats.favorites, icon: Heart, color: 'text-error' },
                { label: 'Bildirim', value: stats.notifications, icon: Bell, color: 'text-warning' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl p-4 border border-border-light">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-text-muted">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-2xl p-6 border border-border-light">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary">Son Taleplerim</h3>
                <Link to="/dashboard/requests" className="text-accent text-sm font-medium flex items-center gap-1">
                  Tümünü Gör <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {recentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-text-muted">Henüz talebiniz yok</p>
                  <Link to="/request/create" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-colors">
                    Talep Oluştur
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center gap-4 p-3 bg-bg rounded-xl">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{req.title}</h4>
                        <p className="text-xs text-text-muted">{new Date(req.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-2xl p-6">
              <h3 className="font-semibold text-primary mb-3">Hızlı İşlemler</h3>
              <div className="flex flex-wrap gap-3">
                <Link to="/request/create" className="px-4 py-2 bg-white rounded-xl text-sm font-medium hover:shadow-md transition-shadow flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" /> Yeni Talep Oluştur
                </Link>
                <Link to="/search" className="px-4 py-2 bg-white rounded-xl text-sm font-medium hover:shadow-md transition-shadow flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" /> Uzman Keşfet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
