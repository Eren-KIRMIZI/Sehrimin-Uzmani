import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight } from 'lucide-react';
import { authApi } from '../../services';
import { useAuthStore } from '../../stores/authStore';
import SEO from '../../components/SEO';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUser } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const fetchAndSetUser = async () => {
    try {
      const user = await authApi.me();
      setUser(user);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Kullanıcı bilgileri alınamadı.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (requires2FA) {
        // 2FA Verification
        const res = await authApi.login2fa(tempToken, twoFaCode) as any;
        setTokens(res.access_token, res.refresh_token);
        await fetchAndSetUser();
      } else {
        // Normal Login
        const res = await authApi.login({ email, password }) as any;
        if (res.requires_2fa) {
          setRequires2FA(true);
          setTempToken(res.temp_token);
        } else {
          setTokens(res.access_token, res.refresh_token);
          await fetchAndSetUser();
        }
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errorMessage = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--color-bg)',
    }}>
      <SEO 
        title="Giriş Yap" 
        description="Şehrinin Uzmanı hesabınıza giriş yapın ve hizmet almaya veya vermeye başlayın."
      />
      {/* Sol taraf - Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', display: 'inline-block', marginBottom: 40 }}>
          <span className="gradient-text">Şehrimin</span> Uzmanı
        </Link>
        
        <div style={{ maxWidth: 400, margin: 'auto', width: '100%' }}>
          <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>Tekrar Hoş Geldiniz</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Hesabınıza giriş yaparak devam edin.</p>
          
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', padding: 12, borderRadius: 8, marginBottom: 24, fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!requires2FA ? (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem' }}>E-posta</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                    <input 
                      type="email" 
                      className="input" 
                      required 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ornek@email.com" 
                      style={{ paddingLeft: 42, height: 48 }}
                    />
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontWeight: 600, fontSize: '0.875rem' }}>Şifre</label>
                    <Link to="/forgot-password" style={{ color: 'var(--color-primary-light)', fontSize: '0.8rem', textDecoration: 'none' }}>
                      Şifremi Unuttum
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                    <input 
                      type="password" 
                      className="input" 
                      required 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      style={{ paddingLeft: 42, height: 48 }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <div style={{ background: 'var(--color-surface-2)', padding: 16, borderRadius: 12, marginBottom: 16, display: 'flex', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: 4 }}>İki Adımlı Doğrulama</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Lütfen Authenticator uygulamanızdaki 6 haneli kodu girin.</p>
                  </div>
                </div>
                
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.875rem' }}>Doğrulama Kodu</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  value={twoFaCode}
                  onChange={e => setTwoFaCode(e.target.value)}
                  placeholder="000000" 
                  maxLength={6}
                  style={{ height: 48, letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}
                />
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ height: 48, marginTop: 8, fontSize: '1rem', justifyContent: 'center' }}
            >
              {loading ? <div className="spinner" /> : requires2FA ? 'Doğrula ve Giriş Yap' : 'Giriş Yap'}
            </button>
            
            {!requires2FA && import.meta.env.DEV && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEmail('admin@sehriminuzmani.com');
                  setPassword('REDACTED_DEMO_PASS');
                }}
                style={{ height: 36, fontSize: '0.875rem', justifyContent: 'center', color: 'var(--color-primary-light)' }}
              >
                Admin Bilgilerini Doldur (Dev)
              </button>
            )}
          </form>
          
          <div style={{ marginTop: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Hesabınız yok mu? <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>Hemen Kayıt Olun <ArrowRight size={14} style={{ verticalAlign: 'middle' }} /></Link>
          </div>
        </div>
      </div>

      {/* Image Side */}
      <div className="login-image-side" style={{ 
        flex: 1, display: 'none',
        background: 'linear-gradient(135deg, #13131f, #1a1a2e)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Abstract decorative elements */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.05)', filter: 'blur(60px)' }} />
        
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div style={{ maxWidth: 440 }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: 24, padding: 40, backdropFilter: 'blur(10px)'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>Şehrindeki Uzmanlara Katıl</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 32 }}>
                Binlerce hizmet veren arasına katılın, işinizi büyütün ve yeni müşterilere ulaşın. 
                Platformumuz güvenli ve hızlı ödeme altyapısıyla hizmetinizde.
              </p>
              
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { value: '10K+', label: 'Aktif Uzman' },
                  { value: '81', label: 'Şehir' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary-light)' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
