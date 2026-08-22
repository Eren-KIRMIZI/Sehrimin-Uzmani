import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, MessageSquare, User, Menu, X,
  MapPin, ChevronDown, LogOut, LayoutDashboard,
  TrendingUp, Megaphone, AlertTriangle, Settings,
  Shield, Star, Globe, Package, Plus, Moon, Sun
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useThemeStore } from '../../stores/themeStore';
import { useUnreadNotifications, useUnreadMessages, useCategories } from '../../hooks/useQueries';
import { authApi } from '../../services';
import { searchApi } from '../../services';
import { NotificationCenter } from '../notifications/NotificationCenter';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { language, t, toggleLanguage } = useI18nStore();
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: unreadNotifs } = useUnreadNotifications();
  const { data: unreadMsgs } = useUnreadMessages();
  const { data: categories } = useCategories();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setDetecting(true);
    try {
      const result = await searchApi.detect(searchQuery);
      const params = new URLSearchParams({ q: searchQuery });
      if (result.detected) {
        if (result.category_slug) params.set('category', result.category_slug);
        if (result.subcategory_slug) params.set('subcategory', result.subcategory_slug);
      }
      navigate(`/search?${params.toString()}`);
    } catch {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } finally {
      setDetecting(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(10, 10, 15, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
          }}>
            <MapPin size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
            <span className="gradient-text">Şehrimin</span> Uzmanı
          </span>
        </Link>

        {/* Search bar (desktop) */}
        <form onSubmit={handleSearch} style={{
          flex: 1, display: 'flex', maxWidth: 480,
        }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }}
            />
            <input
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home.search_placeholder')}
              style={{ paddingLeft: 40, paddingRight: detecting ? 44 : 12, height: 40 }}
            />
            {detecting && (
              <div className="spinner" style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16,
              }} />
            )}
          </div>
        </form>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link
            to="/search"
            className="btn btn-ghost btn-sm"
            style={{ color: isActive('/search') ? 'var(--color-primary-light)' : undefined }}
          >
            {t('nav.search')}
          </Link>
          <Link
            to="/ads"
            className="btn btn-ghost btn-sm"
            style={{
              color:
                location.pathname.startsWith('/ads') && !isActive('/ads/create')
                  ? 'var(--color-primary-light)'
                  : undefined,
            }}
          >
            {t('nav.ads')}
          </Link>
          <Link
            to="/map-search"
            className="btn btn-ghost btn-sm"
            style={{ color: isActive('/map-search') ? 'var(--color-primary-light)' : undefined }}
          >
            {t('nav.map')}
          </Link>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', minWidth: 40, display: 'flex', alignItems: 'center', gap: 4 }}
            title={language === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
          >
            <Globe size={16} />
            {language === 'tr' ? 'EN' : 'TR'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              width: 36,
              height: 36,
              transition: 'all 0.3s ease',
            }}
            title={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
          >
            {theme === 'dark'
              ? <Sun size={18} style={{ color: '#fbbf24' }} />
              : <Moon size={18} style={{ color: '#6366f1' }} />
            }
          </button>
          
          {isAuthenticated ? (
            <>
              {/* İlan Ver */}
              <Link to="/ads/create" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Plus size={15} /> {t('nav.post_ad')}
              </Link>

              {/* Messages */}
              <Link to="/chat" style={{ position: 'relative', display: 'flex', padding: 8, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                <MessageSquare size={20} />
                {unreadMsgs && unreadMsgs.count > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'var(--color-primary)', color: 'white',
                    borderRadius: '50%', width: 16, height: 16,
                    fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>
                    {unreadMsgs.count > 9 ? '9+' : unreadMsgs.count}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationCenter />


              {/* User menu */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 40, padding: '6px 12px 6px 6px',
                    cursor: 'pointer', color: 'var(--color-text)',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {user?.avatar_url
                      ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                      : <User size={14} color="white" />
                    }
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {user?.first_name || 'Profil'}
                  </span>
                  <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    minWidth: 220, zIndex: 50,
                    boxShadow: 'var(--shadow-elevated)',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s ease',
                  }}>
                    {/* User info */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.first_name} {user?.last_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{user?.email}</div>
                      <div style={{ marginTop: 6 }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {user?.role === 'ADMIN' ? '⚡ Admin' : user?.role === 'PROVIDER' ? '🔧 Uzman' : '👤 Müşteri'}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    {[
                      { to: '/dashboard', icon: <LayoutDashboard size={15} />, label: t('nav.dashboard') },
                      { to: '/ads/my', icon: <Package size={15} />, label: t('nav.my_ads') },
                      ...(user?.role === 'PROVIDER' ? [
                        { to: '/earnings', icon: <TrendingUp size={15} />, label: t('nav.earnings') },
                        { to: '/promotions', icon: <Megaphone size={15} />, label: t('nav.promotions') },
                        { to: '/pricing', icon: <Star size={15} />, label: t('nav.pricing') },
                      ] : []),
                      { to: '/disputes', icon: <AlertTriangle size={15} />, label: t('nav.disputes') },
                      ...(user?.role === 'ADMIN' ? [
                        { to: '/admin', icon: <Shield size={15} />, label: t('nav.admin') },
                      ] : []),
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 16px', color: 'var(--color-text-muted)',
                          textDecoration: 'none', fontSize: '0.875rem',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                        }}
                      >
                        {item.icon} {item.label}
                      </Link>
                    ))}

                    <div style={{ borderTop: '1px solid var(--color-border)', padding: 8 }}>
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', color: 'var(--color-error)',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          fontSize: '0.875rem', borderRadius: 8, textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={15} /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
