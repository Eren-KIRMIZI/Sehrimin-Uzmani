import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Menu, X, Search, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ŞU</span>
            </div>
            <span className="text-xl font-bold text-primary hidden sm:block">Şehrinin Uzmani</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/search" className="text-sm font-medium text-text-muted hover:text-accent transition-colors">Uzmanlar</Link>
            <Link to="/categories" className="text-sm font-medium text-text-muted hover:text-accent transition-colors">Kategoriler</Link>
            <Link to="/how-it-works" className="text-sm font-medium text-text-muted hover:text-accent transition-colors">Nasıl Çalışır?</Link>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-bg transition-colors"
                >
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user?.first_name}</span>
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-border-light py-2 fade-in">
                    <div className="px-4 py-2 border-b border-border-light">
                      <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-bg transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Panel
                    </Link>
                    {user?.role === 'PROVIDER' && (
                      <Link to="/provider/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-bg transition-colors">
                        <Settings className="w-4 h-4" /> Uzman Paneli
                      </Link>
                    )}
                    {user?.role === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-bg transition-colors">
                        <Settings className="w-4 h-4" /> Admin
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors w-full">
                      <LogOut className="w-4 h-4" /> Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-text-muted hover:text-accent transition-colors">Giriş Yap</Link>
                <Link to="/register" className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-colors">Uzman Ol</Link>
              </>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border-light fade-in">
            <Link to="/search" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Uzmanlar</Link>
            <Link to="/categories" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Kategoriler</Link>
            <Link to="/how-it-works" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">Nasıl Çalışır?</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
