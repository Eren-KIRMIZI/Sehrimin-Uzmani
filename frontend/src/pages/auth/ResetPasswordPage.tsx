import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/SEO';
import { authApi } from '../../services';
import { toast, toastApiError } from '../../stores/toastStore';

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Şifre en az 6 karakter olmalı');
    if (password !== confirm) return toast.error('Şifreler eşleşmiyor');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.');
      navigate('/login');
    } catch (err) {
      toastApiError(err, 'Şifre sıfırlanamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEO title="Yeni Şifre Belirle" description="Şifre sıfırlama" />
      <div className="container" style={{ padding: '64px 24px', maxWidth: 440 }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <LockKeyhole size={22} color="var(--color-primary-light)" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Yeni Şifre</h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 20px' }}>
            Hesabınız için yeni bir şifre belirleyin.
          </p>
          {!token && (
            <p style={{ color: 'var(--color-warning)', fontSize: '0.85rem', marginTop: 0 }}>
              ⚠ Geçerli bir sıfırlama anahtarı bulunamadı. E-postadaki bağlantıyı kullanın.
            </p>
          )}
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <input
              type="password"
              required
              placeholder="Yeni şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--color-text)', fontFamily: 'inherit',
              }}
            />
            <input
              type="password"
              required
              placeholder="Yeni şifre (tekrar)"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{
                width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--color-text)', fontFamily: 'inherit',
              }}
            />
            <button className="btn btn-primary" type="submit" disabled={loading || !token} style={{ width: '100%' }}>
              {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
