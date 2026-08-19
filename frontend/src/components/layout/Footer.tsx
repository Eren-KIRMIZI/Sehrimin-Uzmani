import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  const links = {
    platform: [
      { to: '/search', label: 'Uzman Ara' },
      { to: '/map', label: 'Haritada Ara' },
      { to: '/pricing', label: 'Abonelik Planları' },
      { to: '/request/create', label: 'Hizmet Talebi Oluştur' },
    ],
    company: [
      { to: '/', label: 'Hakkımızda' },
      { to: '/', label: 'Blog' },
      { to: '/', label: 'Kariyer' },
      { to: '/', label: 'İletişim' },
    ],
    legal: [
      { to: '/', label: 'Gizlilik Politikası' },
      { to: '/', label: 'Kullanım Koşulları' },
      { to: '/', label: 'KVKK Aydınlatma' },
      { to: '/', label: 'Çerez Politikası' },
    ],
  };

  return (
    <footer style={{
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      marginTop: 'auto',
    }}>
      <div className="container" style={{ padding: '60px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin size={18} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
                <span className="gradient-text">Şehrimin</span> Uzmanı
              </span>
            </Link>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: 260 }}>
              Yaşadığınız şehirde ihtiyacınız olan uzmanı dakikalar içinde bulun.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Bizi takip edin!</span>
            </div>
          </div>

          {/* Links */}
          {([
            { title: 'Platform', items: links.platform },
            { title: 'Şirket', items: links.company },
            { title: 'Yasal', items: links.legal },
          ] as const).map((section) => (
            <div key={section.title}>
              <h4 style={{ color: 'var(--color-text)', fontWeight: 700, marginBottom: 16, fontSize: '0.9rem' }}>
                {section.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} style={{
                      color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary-light)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 48, paddingTop: 24,
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>
            © {year} Şehrimin Uzmanı. Tüm hakları saklıdır.
          </p>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            Türkiye'de sevgi ile yapıldı
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
