import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, UserCircle, Briefcase } from 'lucide-react';
import { authApi } from '../../services';
import { useAuthStore } from '../../stores/authStore';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', role: 'USER' as 'USER' | 'PROVIDER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await authApi.register(form);
      setTokens(res.access_token, res.refresh_token);
      const user = await authApi.me();
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errorMessage = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Form Side */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', display: 'inline-block', marginBottom: 30 }}>
          <span className="gradient-text">Şehrimin</span> Uzmanı
        </Link>
        
        <div style={{ maxWidth: 460, margin: 'auto', width: '100%' }}>
          <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>Hesap Oluştur</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Platforma katılmak için bilgilerinizi girin.</p>
          
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', padding: 12, borderRadius: 8, marginBottom: 24, fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Role Selection */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {[
                { val: 'USER', label: 'Müşteri Olarak', icon: <UserCircle size={18} /> },
                { val: 'PROVIDER', label: 'Uzman Olarak', icon: <Briefcase size={18} /> }
              ].map(r => (
                <button
                  key={r.val}
                  type="button"
                  className="btn"
                  onClick={() => setForm({ ...form, role: r.val as any })}
                  style={{
                    flex: 1, height: 48, 
                    border: '1px solid',
                    borderColor: form.role === r.val ? 'var(--color-primary)' : 'var(--color-border)',
                    background: form.role === r.val ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-surface-2)',
                    color: form.role === r.val ? 'var(--color-primary-light)' : 'var(--color-text)'
                  }}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem' }}>Adınız *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                  <input className="input" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} style={{ paddingLeft: 42, height: 48 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem' }}>Soyadınız *</label>
                <input className="input" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} style={{ height: 48 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem' }}>E-posta *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                <input type="email" className="input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="ornek@email.com" style={{ paddingLeft: 42, height: 48 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem' }}>Telefon Numarası (Opsiyonel)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                <input type="tel" className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="5XX XXX XX XX" style={{ paddingLeft: 42, height: 48 }} />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem' }}>Şifre *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                <input type="password" className="input" required minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="En az 8 karakter" style={{ paddingLeft: 42, height: 48 }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                Şifreniz en az 8 karakter uzunluğunda olmalı, büyük harf, küçük harf ve rakam içermelidir.
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: 48, marginTop: 8, fontSize: '1rem', justifyContent: 'center' }}>
              {loading ? <div className="spinner" /> : 'Kayıt Ol'}
            </button>
          </form>
          
          <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Zaten hesabınız var mı? <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>Giriş Yapın <ArrowRight size={14} style={{ verticalAlign: 'middle' }} /></Link>
          </div>
        </div>
      </div>

      {/* Info Side */}
      <div className="login-image-side" style={{ 
        flex: 1, display: 'none',
        background: 'var(--color-surface)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Abstract shapes */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(50px)' }} />
        
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div style={{ maxWidth: 440 }}>
            {form.role === 'PROVIDER' ? (
              <>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>İşinizi Büyütmenin Tam Zamanı</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    'Yeni müşterilere anında ulaşın',
                    'Kendi fiyatlarınızı ve çalışma bölgenizi belirleyin',
                    'Kullanıcı yorumlarıyla güvenilirliğinizi artırın',
                    'Güvenli altyapı ile ödemelerinizi sorunsuz alın'
                  ].map((text, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>✓</div>
                      <span style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>Aradığınız Uzman Burada</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    'Yüzlerce kategoride binlerce doğrulanmış uzman',
                    'Gerçek müşteri yorumları ve puanlamalar',
                    'Kolayca teklif alın ve karşılaştırın',
                    'Anlaşmazlık durumunda tam destek'
                  ].map((text, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>✓</div>
                      <span style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
