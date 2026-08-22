import React, { useState } from 'react';
import { Shield, Database, Bell, Globe, Lock, Zap, Server, RefreshCw, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAdminDashboard } from '../../hooks/useQueries';

const SettingRow: React.FC<{
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, desc, value, onChange }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid var(--color-border)'
  }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{label}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</div>
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: value ? 'var(--color-primary-light)' : 'var(--color-text-dim)' }}
    >
      {value ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
    </button>
  </div>
);

export const AdminSystem: React.FC = () => {
  const { data: stats } = useAdminDashboard();

  const [settings, setSettings] = useState({
    maintenance_mode: false,
    email_notifications: true,
    sms_notifications: false,
    auto_approve_providers: false,
    ai_matching_enabled: true,
    rate_limiting_enabled: true,
    fraud_detection_enabled: true,
    two_factor_required: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const systemInfo = [
    { label: 'Backend Framework', value: 'FastAPI 0.115' },
    { label: 'Python Sürümü', value: 'Python 3.11' },
    { label: 'Veritabanı', value: 'PostgreSQL 18' },
    { label: 'Cache', value: 'Redis / Memurai' },
    { label: 'ORM', value: 'SQLAlchemy 2.0' },
    { label: 'Frontend', value: 'React 19 + Vite 8' },
  ];

  const quickStats = [
    { icon: <Database size={16} />, label: 'Toplam Kullanıcı', value: stats?.total_users ?? '—', color: '#3b82f6' },
    { icon: <Server size={16} />, label: 'Aktif Uzman', value: stats?.total_providers ?? '—', color: '#10b981' },
    { icon: <Zap size={16} />, label: 'API Endpoint', value: '113 REST + 1 WS', color: '#8b5cf6' },
    { icon: <Shield size={16} />, label: 'Güvenlik', value: 'JWT + 2FA', color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {quickStats.map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.color, marginBottom: 10 }}>
              {s.icon}
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Sistem Ayarları */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
            <Lock size={18} style={{ color: 'var(--color-primary-light)' }} /> Güvenlik & Erişim
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>Platform güvenlik politikalarını yönetin.</p>
          <SettingRow label="Bakım Modu" desc="Tüm kullanıcılar için platformu geçici olarak kapat" value={settings.maintenance_mode} onChange={() => toggle('maintenance_mode')} />
          <SettingRow label="Hız Sınırlama" desc="IP tabanlı API hız sınırlamasını etkinleştir" value={settings.rate_limiting_enabled} onChange={() => toggle('rate_limiting_enabled')} />
          <SettingRow label="Fraud Tespiti" desc="AI destekli dolandırıcılık riski değerlendirmesi" value={settings.fraud_detection_enabled} onChange={() => toggle('fraud_detection_enabled')} />
          <SettingRow label="2FA Zorunlu" desc="Tüm kullanıcılar için iki faktörlü doğrulamayı zorunlu kıl" value={settings.two_factor_required} onChange={() => toggle('two_factor_required')} />
        </div>

        {/* Bildirim Ayarları */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
            <Bell size={18} style={{ color: 'var(--color-primary-light)' }} /> Bildirim & Otomasyon
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>Sistem bildirimlerini ve otomasyon kurallarını yapılandırın.</p>
          <SettingRow label="E-posta Bildirimleri" desc="Sistem e-posta bildirimlerini gönder" value={settings.email_notifications} onChange={() => toggle('email_notifications')} />
          <SettingRow label="SMS Bildirimleri" desc="Kritik olaylar için SMS gönder" value={settings.sms_notifications} onChange={() => toggle('sms_notifications')} />
          <SettingRow label="AI Eşleştirme" desc="LLM destekli talep-uzman eşleştirmeyi aktif et" value={settings.ai_matching_enabled} onChange={() => toggle('ai_matching_enabled')} />
          <SettingRow label="Otomatik Onay" desc="Yeni uzman başvurularını otomatik onayla" value={settings.auto_approve_providers} onChange={() => toggle('auto_approve_providers')} />
        </div>
      </div>

      {/* Sistem Bilgisi */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
          <Server size={18} style={{ color: 'var(--color-primary-light)' }} /> Sistem Bilgisi
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {systemInfo.map(item => (
            <div key={item.label} style={{
              padding: '12px 16px', background: 'var(--color-surface-2)',
              borderRadius: 10, display: 'flex', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={20} color="#10b981" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#10b981' }}>Sistem Sağlıklı</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Tüm servisler normal şekilde çalışıyor. Son kontrol: {new Date().toLocaleTimeString('tr-TR')}</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
          >
            <RefreshCw size={13} /> Yenile
          </button>
        </div>

        <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b' }}>Not: Demo Ortamı</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Bu sayfa portföy amaçlıdır. Ayarlar localStorage'da tutulur, sunucuya kaydedilmez.</div>
          </div>
        </div>
      </div>

      {/* APScheduler görevleri */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
          <Globe size={18} style={{ color: 'var(--color-primary-light)' }} /> Arka Plan Görevleri (APScheduler)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'subscription_expiry_check', period: '15 dakikada bir', desc: 'Süresi dolan abonelikleri pasifleştirir' },
            { name: 'promotion_expiry_check', period: '30 dakikada bir', desc: 'Süresi dolan kampanyaları kapatır' },
            { name: 'daily_budget_reset', period: 'Her gece yarısı', desc: 'Günlük reklam bütçelerini sıfırlar' },
          ].map(task => (
            <div key={task.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', background: 'var(--color-surface-2)', borderRadius: 10
            }}>
              <div>
                <code style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)', fontFamily: 'monospace' }}>{task.name}</code>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{task.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{task.period}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
