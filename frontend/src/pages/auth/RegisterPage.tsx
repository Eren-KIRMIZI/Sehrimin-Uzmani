import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kayıt başarısız');
    }
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">ŞU</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-primary">Hesap Oluştur</h1>
          <p className="text-text-muted mt-2">Platforma katılın</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-border-light shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-error text-sm rounded-xl">{error}</div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-primary block mb-1.5">Ad</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="Adınız"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-primary block mb-1.5">Soyad</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="Soyadınız"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-primary block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-primary block mb-1.5">Telefon (isteğe bağlı)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-primary block mb-1.5">Hesap Türü</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update('role', 'USER')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                    formData.role === 'USER' ? 'border-accent bg-accent/5 text-accent' : 'border-border-light bg-bg'
                  }`}
                >
                  Müşteri
                </button>
                <button
                  type="button"
                  onClick={() => update('role', 'PROVIDER')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                    formData.role === 'PROVIDER' ? 'border-accent bg-accent/5 text-accent' : 'border-border-light bg-bg'
                  }`}
                >
                  Uzman
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-primary block mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4 text-text-muted" /> : <Eye className="w-4 h-4 text-text-muted" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-primary block mb-1.5">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
