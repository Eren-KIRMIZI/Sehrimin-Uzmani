import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Giriş başarısız');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">ŞU</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-primary">Giriş Yap</h1>
          <p className="text-text-muted mt-2">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-border-light shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-error text-sm rounded-xl">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-primary block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-primary block mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-bg rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-border-light"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4 text-text-muted" /> : <Eye className="w-4 h-4 text-text-muted" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-accent hover:underline">Şifremi Unuttum</Link>
          </div>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted">
          Hesabın yok mu?{' '}
          <Link to="/register" className="text-accent font-medium hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}
