import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/SEO';
import { authApi } from '../../services';
import { toast, toastApiError } from '../../stores/toastStore';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toastApiError(err, 'İşlem başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEO title="Şifremi Unuttum" description="Şifre sıfırlama" />
      <div className="container" style={{ padding: '64px 24px', maxWidth: 440 }}>
        <div className="card" style={{ padding: 32 }}>
          {!sent ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <KeyRound size={22} color="var(--color-primary-light)" />
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Şifremi Unuttum</h1>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 20px' }}>
                Kayıtlı e-posta adresinizi girin; şifre sıfırlama bağlantısı gönderelim.
              </p>
              <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
                <input
                  type="email"
                  required
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--color-text)', fontFamily: 'inherit',
                  }}
                />
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', display: 'grid', gap: 12, justifyItems: 'center' }}>
              <MailCheck size={40} color="var(--color-success)" />
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>E-postanı kontrol et</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                <strong>{email}</strong> adresine sıfırlama bağlantısı gönderildi. Gelen kutunuzda göremezseniz spam klasörünü kontrol edin.
              </p>
            </div>
          )}
          <p style={{ textAlign: 'center', marginTop: 20, marginBottom: 0, fontSize: '0.88rem' }}>
            <Link to="/login" style={{ color: 'var(--color-primary-light)' }}>← Girişe dön</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
