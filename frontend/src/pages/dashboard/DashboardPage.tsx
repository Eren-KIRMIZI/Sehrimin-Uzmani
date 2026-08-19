import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Briefcase, MessageSquare, Star, TrendingUp, AlertTriangle, ChevronRight, Bell } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const isProvider = user?.role === 'PROVIDER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <Layout>
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 4 }}>
              Merhaba, {user?.first_name} 👋
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {isProvider ? 'İşlerinizi ve kazançlarınızı buradan yönetin.' : 
               isAdmin ? 'Sistem yönetim paneline hoş geldiniz.' : 
               'Hizmet taleplerinizi ve randevularınızı buradan takip edin.'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/profile" className="btn btn-outline">Profili Düzenle</Link>
            {isAdmin && <Link to="/admin" className="btn btn-primary">Yönetim Paneli</Link>}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {isProvider ? (
            <>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <Briefcase size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Aktif İşler</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>3</div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <TrendingUp size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Aylık Kazanç</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>₺4,250</div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <Star size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Ortalama Puan</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>4.8</div>
              </div>
            </>
          ) : (
            <>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <Briefcase size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Aktif Talepler</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>1</div>
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <MessageSquare size={20} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Yeni Teklifler</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>2</div>
              </div>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr min(340px, 100%)', gap: 24, alignItems: 'start' }}>
          
          {/* Left Column - Main Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Recent Requests / Jobs */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Son {isProvider ? 'İşler' : 'Talepler'}</h3>
                <Link to={isProvider ? "/jobs" : "/requests"} style={{ fontSize: '0.875rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>Tümünü Gör</Link>
              </div>
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Henüz gösterilecek kayıt bulunmuyor.
              </div>
            </div>
            
          </div>
          
          {/* Right Column - Side Actions & Notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Quick Actions */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Hızlı İşlemler</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isProvider ? (
                  <>
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
                <Link to="/disputes" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                  Anlaşmazlık Çözümü <ChevronRight size={16} />
                </Link>
              </div>
            </div>
            
            {/* Notifications Panel */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} /> Bildirimler
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-surface-2)', fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Hoş Geldiniz! 🎉</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Şehrimin Uzmanı'na katıldığınız için teşekkürler. Profilinizi tamamlayarak hemen başlayın.</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
