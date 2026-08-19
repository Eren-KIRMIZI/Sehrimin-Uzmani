import React, { useState } from 'react';
import { Shield, Users, AlertTriangle, FileText, Settings, CreditCard, ChevronRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { useAuthStore } from '../../stores/authStore';
import { Navigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Basic admin guard (double check, already guarded by route)
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <div style={{ width: 280, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} color="var(--color-primary)" /> Admin Paneli
            </h2>
          </div>
          
          <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'overview', icon: <Settings size={18} />, label: 'Genel Bakış' },
              { id: 'users', icon: <Users size={18} />, label: 'Kullanıcı Yönetimi' },
              { id: 'verifications', icon: <Shield size={18} />, label: 'Doğrulama Talepleri' },
              { id: 'disputes', icon: <AlertTriangle size={18} />, label: 'Anlaşmazlıklar' },
              { id: 'payouts', icon: <CreditCard size={18} />, label: 'Ödeme Talepleri' },
              { id: 'categories', icon: <FileText size={18} />, label: 'Kategoriler' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text)',
                  border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  fontWeight: activeTab === tab.id ? 700 : 500, transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 32, background: 'var(--color-bg)', overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 24 }}>Sistem Özeti</h1>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
                {[
                  { label: 'Toplam Kullanıcı', value: '1,245', trend: '+12%', color: '#3b82f6' },
                  { label: 'Aktif Uzman', value: '320', trend: '+5%', color: '#10b981' },
                  { label: 'Bekleyen Doğrulama', value: '12', trend: 'Acil', color: '#f59e0b' },
                  { label: 'Açık Anlaşmazlık', value: '3', trend: 'Acil', color: '#ef4444' },
                ].map(stat => (
                  <div key={stat.label} className="card">
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{stat.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: stat.color }}>{stat.trend}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Yönetici modüllerinin detaylı görünümleri burada listelenecektir. API entegrasyonları için `services/index.ts` dosyasına bakabilirsiniz.
              </div>
            </div>
          )}
          
          {activeTab !== 'overview' && (
            <div className="animate-fade-in">
              <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 24, textTransform: 'capitalize' }}>
                {activeTab.replace('_', ' ')}
              </h1>
              <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Bu modül henüz arayüze bağlanmadı. 
                <br /><br />
                Backend hazır: İlgili işlemleri `services` altındaki api fonksiyonları üzerinden yapabilirsiniz.
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
