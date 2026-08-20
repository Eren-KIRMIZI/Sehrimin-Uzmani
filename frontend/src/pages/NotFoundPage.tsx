import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, AlertCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.15) 0%, transparent 60%), var(--color-bg)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      {/* Glowing 404 */}
      <div
        style={{
          position: 'relative',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(6rem, 20vw, 12rem)',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.4))',
            animation: 'float 3s ease-in-out infinite',
            userSelect: 'none',
          }}
        >
          404
        </div>
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px',
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.1)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <AlertCircle size={28} style={{ color: 'var(--color-primary-light)' }} />
      </div>

      {/* Text */}
      <h1
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: '12px',
          margin: '0 0 12px',
        }}
      >
        Sayfa Bulunamadı
      </h1>
      <p
        style={{
          color: 'var(--color-text-muted)',
          fontSize: '1rem',
          maxWidth: '420px',
          lineHeight: 1.7,
          margin: '0 0 40px',
        }}
      >
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        Ana sayfaya dönerek devam edebilirsiniz.
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          id="not-found-home-btn"
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/')}
        >
          <Home size={18} />
          Ana Sayfaya Dön
        </button>
        <button
          id="not-found-search-btn"
          className="btn btn-outline btn-lg"
          onClick={() => navigate('/search')}
        >
          <Search size={18} />
          Uzman Ara
        </button>
      </div>

      {/* Decorative bottom hint */}
      <p
        style={{
          marginTop: '48px',
          fontSize: '0.8rem',
          color: 'var(--color-text-dim)',
        }}
      >
        Hata kodu: 404 · Şehrinin Uzmanı
      </p>
    </div>
  );
};

export default NotFoundPage;
